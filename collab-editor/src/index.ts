import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// HTTP server
const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });

// Store active WebSocket clients (still in memory for active connections)
interface Client {
  id: string;
  username: string;
  ws: WebSocket;
  roomId: string;
  cursor?: { line: number; column: number };
}

// Active rooms with connected clients (memory)
interface ActiveRoom {
  clients: Map<string, Client>;
}

const activeRooms = new Map<string, ActiveRoom>();

// Health check
app.get('/health', async (req, res) => {
  const totalRooms = await prisma.room.count();
  res.json({ 
    status: 'healthy',
    service: 'collab-editor',
    totalRooms,
    activeRooms: activeRooms.size,
    totalActiveClients: Array.from(activeRooms.values()).reduce((sum, room) => sum + room.clients.size, 0)
  });
});

// Create new room
app.post('/rooms', async (req, res) => {
  const { name, language } = req.body;
  
  const room = await prisma.room.create({
    data: {
      name: name || null,
      language: language || 'javascript'
    }
  });
  
  console.log(`✨ Room created in database: ${room.id}`);
  res.json({ roomId: room.id, message: 'Room created successfully' });
});

// Get room info
app.get('/rooms/:roomId', async (req, res) => {
  const room = await prisma.room.findUnique({
    where: { id: req.params.roomId },
    include: { snapshots: { orderBy: { createdAt: 'desc' }, take: 10 } }
  });
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  const activeRoom = activeRooms.get(req.params.roomId);
  
  res.json({
    roomId: room.id,
    name: room.name,
    code: room.code,
    language: room.language,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    connectedUsers: activeRoom 
      ? Array.from(activeRoom.clients.values()).map(c => ({
          id: c.id,
          username: c.username,
          cursor: c.cursor
        }))
      : []
  });
});

// WebSocket connection handler
wss.on('connection', (ws: WebSocket) => {
  let currentClient: Client | null = null;

  console.log('👤 New WebSocket connection');

  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'join':
          handleJoin(ws, message);
          break;
        
        case 'code-change':
          handleCodeChange(message);
          break;
        
        case 'cursor-move':
          handleCursorMove(message);
          break;
        
        case 'run-code':
          handleRunCode(message);
          break;
        
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    if (currentClient) {
      handleDisconnect(currentClient);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  function handleJoin(ws: WebSocket, message: any) {
    const { roomId, username } = message;
    
    // Check if room exists in database
    prisma.room.findUnique({ where: { id: roomId } })
      .then(async (room) => {
        if (!room) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Room not found'
          }));
          ws.close();
          return;
        }

        // Create client
        const clientId = uuidv4();
        currentClient = {
          id: clientId,
          username: username || 'Anonymous',
          ws,
          roomId
        };

        // Get or create active room
        if (!activeRooms.has(roomId)) {
          activeRooms.set(roomId, { clients: new Map() });
        }
        const activeRoom = activeRooms.get(roomId)!;
        activeRoom.clients.set(clientId, currentClient);

        // Update last active time
        await prisma.room.update({
          where: { id: roomId },
          data: { lastActiveAt: new Date() }
        });

        // Send current code to new user
        ws.send(JSON.stringify({
          type: 'init',
          clientId,
          code: room.code,
          users: Array.from(activeRoom.clients.values()).map(c => ({
            id: c.id,
            username: c.username,
            cursor: c.cursor
          }))
        }));

        // Notify others that someone joined
        broadcastToRoom(activeRoom, {
          type: 'user-joined',
          user: {
            id: clientId,
            username: currentClient.username
          }
        }, clientId);

        console.log(`👥 ${username} joined room ${roomId} (${activeRoom.clients.size} users)`);
      })
      .catch((error) => {
        console.error('Error joining room:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to join room' }));
        ws.close();
      });
  }

  function handleCodeChange(message: any) {
    if (!currentClient) return;

    const activeRoom = activeRooms.get(currentClient.roomId);
    if (!activeRoom) return;

    // Update code in database
    prisma.room.update({
      where: { id: currentClient.roomId },
      data: { 
        code: message.code,
        updatedAt: new Date()
      }
    })
    .then(() => {
      // Send acknowledgment to sender
      if (currentClient && currentClient.ws.readyState === WebSocket.OPEN) {
        currentClient.ws.send(JSON.stringify({
          type: 'code-saved',
          timestamp: new Date().toISOString(),
          codeLength: message.code.length
        }));
      }
    })
    .catch((error) => {
      console.error('Error updating room code:', error);
      // Send error to sender
      if (currentClient && currentClient.ws.readyState === WebSocket.OPEN) {
        currentClient.ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to save code changes'
        }));
      }
    });

    // Broadcast to all other users in the room
    broadcastToRoom(activeRoom, {
      type: 'code-update',
      code: message.code,
      userId: currentClient.id
    }, currentClient.id);
  }

  function handleCursorMove(message: any) {
    if (!currentClient) return;

    const activeRoom = activeRooms.get(currentClient.roomId);
    if (!activeRoom) return;

    // Update cursor position
    currentClient.cursor = message.cursor;

    // Broadcast cursor position
    broadcastToRoom(activeRoom, {
      type: 'cursor-update',
      userId: currentClient.id,
      username: currentClient.username,
      cursor: message.cursor
    }, currentClient.id);
  }

  function handleDisconnect(client: Client) {
    const activeRoom = activeRooms.get(client.roomId);
    if (!activeRoom) return;

    activeRoom.clients.delete(client.id);

    // Notify others
    broadcastToRoom(activeRoom, {
      type: 'user-left',
      userId: client.id,
      username: client.username
    });

    console.log(`👋 ${client.username} left room ${client.roomId} (${activeRoom.clients.size} users remaining)`);

    // Clean up empty active rooms (but keep room in database!)
    if (activeRoom.clients.size === 0) {
      activeRooms.delete(client.roomId);
      console.log(`🧹 Active room ${client.roomId} cleaned up (no connected users)`);
    }
  }

  async function handleRunCode(message: any) {
    if (!currentClient) return;

    const activeRoom = activeRooms.get(currentClient.roomId);
    if (!activeRoom) return;

    const { code, language } = message;
    
    // Validate code is not empty
    if (!code || code.trim() === '') {
      broadcastToRoom(activeRoom, {
        type: 'code-result',
        output: '',
        error: 'No code to execute. Please write some code first.',
        executionTime: 0,
        language: language,
        executedBy: currentClient.username,
        userId: currentClient.id
      });
      return;
    }
    
    console.log(`🚀 ${currentClient.username} running ${language} code in room ${currentClient.roomId}`);

    try {
      const result = await executeCode(code, language || 'javascript');
      
      // Broadcast execution result to all users in the room
      broadcastToRoom(activeRoom, {
        type: 'code-result',
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        language: language,
        executedBy: currentClient.username,
        userId: currentClient.id
      });
    } catch (error: any) {
      // Send error to all users
      broadcastToRoom(activeRoom, {
        type: 'code-result',
        output: '',
        error: error.message,
        executionTime: 0,
        language: language,
        executedBy: currentClient.username,
        userId: currentClient.id
      });
    }
  }
});

// Execute code safely with timeout
async function executeCode(code: string, language: string): Promise<{ output: string; error: string | null; executionTime: number }> {
  const startTime = Date.now();
  const timeout = 5000; // 5 second timeout

  try {
    let command: string;
    let output = '';
    let error = null;

    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        // Use Node.js to execute JavaScript
        command = `node -e ${JSON.stringify(code)}`;
        break;
      
      case 'python':
      case 'python3':
        command = `python3 -c ${JSON.stringify(code)}`;
        break;
      
      case 'typescript':
      case 'ts':
        command = `ts-node -e ${JSON.stringify(code)}`;
        break;
      
      default:
        throw new Error(`Unsupported language: ${language}`);
    }

    // Execute with timeout
    const { stdout, stderr } = await Promise.race([
      execPromise(command, {
        timeout: timeout,
        maxBuffer: 1024 * 1024, // 1MB max output
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Execution timeout (5s)')), timeout)
      )
    ]);

    output = stdout || '';
    error = stderr || null;

    const executionTime = Date.now() - startTime;

    // If there's stderr content, treat it as an error
    if (stderr && stderr.trim()) {
      return {
        output: stdout.trim() || '',
        error: stderr.trim(),
        executionTime
      };
    }

    return {
      output: output.trim(),
      error: null,
      executionTime
    };

  } catch (err: any) {
    const executionTime = Date.now() - startTime;
    
    return {
      output: '',
      error: err.message || 'Execution failed',
      executionTime
    };
  }
}

// Broadcast message to all clients in an active room except sender
function broadcastToRoom(activeRoom: ActiveRoom, message: any, excludeClientId?: string) {
  const data = JSON.stringify(message);
  
  activeRoom.clients.forEach((client) => {
    if (client.id !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  });
}

server.listen(PORT, () => {
  console.log(`🚀 Collaborative Editor running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`💾 Connected to database`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
