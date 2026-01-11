import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, optionalAuthMiddleware } from './middleware/authMiddleware.js';
import multer from 'multer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/bookclub-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// HTTP server
const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });

// Store active WebSocket clients
interface Client {
  id: string;
  userId: string;
  username: string;
  ws: WebSocket;
  bookClubId?: string;
  roomId?: string; // Current room they're viewing
  isDMConnection?: boolean; // Track if this is a DM connection
}

// Active book clubs with connected clients (memory)
interface ActiveBookClub {
  clients: Map<string, Client>;
}

const activeBookClubs = new Map<string, ActiveBookClub>();

// Active DM connections - Map userId to their WebSocket client
const activeDMClients = new Map<string, Client>();

// Health check
app.get('/health', async (req, res) => {
  const totalBookClubs = await prisma.bookClub.count();
  res.json({ 
    status: 'healthy',
    service: 'bookclub-service',
    totalBookClubs,
    activeBookClubs: activeBookClubs.size,
    totalActiveClients: Array.from(activeBookClubs.values()).reduce((sum, club) => sum + club.clients.size, 0)
  });
});

// Create new bookclub (requires authentication)
app.post('/bookclubs', authMiddleware, async (req, res) => {
  try {
    const { name, isPublic } = req.body;
    const userId = req.user!.userId;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Book club name is required' });
    }
    
    const bookClub = await prisma.bookClub.create({
      data: {
        name: name.trim(),
        isPublic: isPublic !== false,
        members: [userId],
        creatorId: userId,
        rooms: {
          create: {
            name: 'general'
          }
        }
      },
      include: { rooms: true }
    });
    
    console.log(`✨ Book club created by user ${userId}: ${bookClub.id}`);
    res.json({ bookClubId: bookClub.id, message: 'Book club created successfully', bookClub });
  } catch (error) {
    console.error('Error creating book club:', error);
    res.status(500).json({ error: 'Failed to create book club' });
  }
});

// Get bookclub info
app.get('/bookclubs/:bookClubId', async (req, res) => {
  try {
    const bookClub = await prisma.bookClub.findUnique({
      where: { id: req.params.bookClubId },
      include: { 
        rooms: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    
    if (!bookClub) {
      return res.status(404).json({ error: 'Book club not found' });
    }
    
    const activeClub = activeBookClubs.get(req.params.bookClubId);
    
    // Fetch full user details for all members from user-service
    let members = bookClub.members; // Keep original member IDs as fallback
    if (bookClub.members && bookClub.members.length > 0) {
      try {
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001/api';
        const response = await fetch(`${userServiceUrl}/users/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: bookClub.members })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.users && data.users.length > 0) {
            members = data.users;
          }
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch user details from user-service:', response.status, errorText);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    }
    
    res.json({
      ...bookClub,
      members,
      connectedUsers: activeClub 
        ? Array.from(activeClub.clients.values()).map(c => ({
            id: c.id,
            username: c.username,
            userId: c.userId
          }))
        : []
    });
  } catch (error) {
    console.error('Error fetching book club:', error);
    res.status(500).json({ error: 'Failed to fetch book club' });
  }
});

app.put('/bookclubs/:bookClubId', authMiddleware, async (req, res) => {
  try {
    const { bookClubId } = req.params;
    const { name, isPublic } = req.body;
    const userId = req.user!.userId;
    
    const bookClub = await prisma.bookClub.findUnique({
      where: { id: bookClubId }
    });
    
    if (!bookClub) {
      return res.status(404).json({ error: 'Book club not found' });
    }
    
    if (bookClub.creatorId !== userId) {
      return res.status(403).json({ error: 'Only the book club creator can update the book club' });
    }
    
    const updatedBookClub = await prisma.bookClub.update({
      where: { id: bookClubId },
      data: {
        name: name !== undefined ? name.trim() : bookClub.name,
        isPublic: isPublic !== undefined ? isPublic : bookClub.isPublic
      }
    });
    
    console.log(`✏️ Book club ${bookClubId} updated by user ${userId}`);
    res.json({ message: 'Book club updated successfully', bookClub: updatedBookClub });
  } catch (error) {
    console.error('Error updating book club:', error);
    res.status(500).json({ error: 'Failed to update book club' });
  }
});

// Get all bookclubs (with optional filtering)
app.get('/bookclubs', optionalAuthMiddleware, async (req, res) => {
  try {
    const { mine } = req.query;
    
    // If 'mine' query param is set and user is authenticated, return only user's bookclubs
    const where = mine === 'true' && req.user 
      ? { members: { has: req.user.userId } }
      : { isPublic: true };
    
    const bookClubs = await prisma.bookClub.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 50
    });

    // Collect all unique user IDs from all bookclubs
    const allUserIds = new Set<string>();
    bookClubs.forEach(club => {
      club.members.forEach(memberId => allUserIds.add(memberId));
    });

    // Fetch full user details for all members from user-service
    let userDetailsMap = new Map<string, any>();
    if (allUserIds.size > 0) {
      try {
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001/api';
        const response = await fetch(`${userServiceUrl}/users/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: Array.from(allUserIds) })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.users && data.users.length > 0) {
            data.users.forEach((user: any) => {
              userDetailsMap.set(user.id, user);
            });
          }
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch user details from user-service:', response.status, errorText);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    }
    
    // Add active user count and member details to each bookclub
    const bookClubsWithUserCount = bookClubs.map(club => {
      const activeClub = activeBookClubs.get(club.id);
      
      // Map member IDs to full user objects
      const memberDetails = club.members
        .map(memberId => userDetailsMap.get(memberId))
        .filter(user => user !== undefined);
      
      return {
        ...club,
        members: memberDetails.length > 0 ? memberDetails : club.members,
        activeUsers: activeClub ? activeClub.clients.size : 0
      };
    });

    
    
    res.json({ bookClubs: bookClubsWithUserCount });
  } catch (error) {
    console.error('Error fetching book clubs:', error);
    res.status(500).json({ error: 'Failed to fetch book clubs' });
  }
});

// Get my bookclubs (requires authentication)
app.get('/my-bookclubs', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    
    const bookClubs = await prisma.bookClub.findMany({
      where: { members: { has: userId } },
      orderBy: { updatedAt: 'desc' }
    });
    
    // Add active user count to each bookclub
    const bookClubsWithUserCount = bookClubs.map(club => {
      const activeClub = activeBookClubs.get(club.id);
      return {
        ...club,
        activeUsers: activeClub ? activeClub.clients.size : 0
      };
    });
    
    res.json({ bookClubs: bookClubsWithUserCount });
  } catch (error) {
    console.error('Error fetching user bookclubs:', error);
    res.status(500).json({ error: 'Failed to fetch your bookclubs' });
  }
});

// Upload bookclub image (requires authentication and ownership)
app.post('/bookclubs/:bookClubId/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { bookClubId } = req.params;
    const userId = req.user!.userId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const bookClub = await prisma.bookClub.findUnique({
      where: { id: bookClubId }
    });
    
    if (!bookClub) {
      // Delete uploaded file if bookclub doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Book club not found' });
    }
    
    if (bookClub.creatorId !== userId) {
      // Delete uploaded file if user is not the creator
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Only the book club creator can upload images' });
    }
    
    // Delete old image if exists
    if (bookClub.imageUrl) {
      const oldImagePath = path.join(__dirname, '..', bookClub.imageUrl);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    
    // Update bookclub with new image URL
    const imageUrl = `/uploads/bookclub-images/${req.file.filename}`;
    const updatedBookClub = await prisma.bookClub.update({
      where: { id: bookClubId },
      data: { imageUrl }
    });
    
    console.log(`📷 Image uploaded for book club ${bookClubId}`);
    res.json({ message: 'Image uploaded successfully', imageUrl: updatedBookClub.imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Delete bookclub image (requires authentication and ownership)
app.delete('/bookclubs/:bookClubId/image', authMiddleware, async (req, res) => {
  try {
    const { bookClubId } = req.params;
    const userId = req.user!.userId;
    
    const bookClub = await prisma.bookClub.findUnique({
      where: { id: bookClubId }
    });
    
    if (!bookClub) {
      return res.status(404).json({ error: 'Book club not found' });
    }
    
    if (bookClub.creatorId !== userId) {
      return res.status(403).json({ error: 'Only the book club creator can delete images' });
    }
    
    if (!bookClub.imageUrl) {
      return res.status(400).json({ error: 'Book club has no image to delete' });
    }
    
    // Delete image file
    const imagePath = path.join(__dirname, '..', bookClub.imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    // Update bookclub to remove image URL
    await prisma.bookClub.update({
      where: { id: bookClubId },
      data: { imageUrl: null }
    });
    
    console.log(`🗑️  Image deleted for book club ${bookClubId}`);
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Create a new room in a bookclub (requires authentication)
app.post('/bookclubs/:bookClubId/rooms', authMiddleware, async (req, res) => {
  try {
    const { bookClubId } = req.params;
    const { name } = req.body;
    const userId = req.user!.userId;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Room name is required' });
    }
    
    // Check if user is a member of the bookclub
    const bookClub = await prisma.bookClub.findUnique({
      where: { id: bookClubId }
    });
    
    if (!bookClub) {
      return res.status(404).json({ error: 'Book club not found' });
    }
    
    if (!bookClub.members.includes(userId)) {
      return res.status(403).json({ error: 'You must be a member to create rooms' });
    }
    
    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        bookClubId
      }
    });
    
    console.log(`📁 Room created in book club ${bookClubId}: ${room.name}`);
    res.json({ room, message: 'Room created successfully' });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get all rooms in a bookclub
app.get('/bookclubs/:bookClubId/rooms', async (req, res) => {
  try {
    const { bookClubId } = req.params;
    
    const rooms = await prisma.room.findMany({
      where: { bookClubId },
      orderBy: { createdAt: 'asc' }
    });
    
    res.json({ rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get messages in a specific room
app.get('/bookclubs/:bookClubId/rooms/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const messages = await prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      take: 100
    });
    
    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Delete a room (requires authentication and ownership)
app.delete('/bookclubs/:bookClubId/rooms/:roomId', authMiddleware, async (req, res) => {
  try {
    const { bookClubId, roomId } = req.params;
    const userId = req.user!.userId;
    
    const bookClub = await prisma.bookClub.findUnique({
      where: { id: bookClubId }
    });
    
    if (!bookClub) {
      return res.status(404).json({ error: 'Book club not found' });
    }
    
    // Only creator can delete rooms
    if (bookClub.creatorId !== userId) {
      return res.status(403).json({ error: 'Only the book club creator can delete rooms' });
    }
    
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Prevent deletion of the last room
    const roomCount = await prisma.room.count({
      where: { bookClubId }
    });
    
    if (roomCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last room in a book club' });
    }
    
    await prisma.room.delete({
      where: { id: roomId }
    });
    
    console.log(`🗑️  Room ${roomId} deleted from book club ${bookClubId}`);
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
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
        
        case 'join-dm':
          handleJoinDM(ws, message);
          break;
        
        case 'switch-room':
          handleSwitchRoom(message);
          break;
        
        case 'chat-message':
          handleChatMessage(message);
          break;
        
        case 'dm-message':
          handleDMMessage(message);
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
    const { bookClubId, userId, username, roomId } = message;
    
    // Check if bookclub exists in database
    prisma.bookClub.findUnique({ 
      where: { id: bookClubId },
      include: { rooms: { orderBy: { createdAt: 'asc' } } }
    })
      .then(async (bookClub) => {
        if (!bookClub) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Book club not found'
          }));
          ws.close();
          return;
        }

        // If no roomId provided, use first room (general)
        const targetRoomId = roomId || bookClub.rooms[0]?.id;
        
        if (!targetRoomId) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'No rooms available in this book club'
          }));
          ws.close();
          return;
        }

        // Create client
        const clientId = uuidv4();
        currentClient = {
          id: clientId,
          userId: userId,
          username: username || 'Anonymous',
          ws,
          bookClubId,
          roomId: targetRoomId
        };

        // Get or create active bookclub
        if (!activeBookClubs.has(bookClubId)) {
          activeBookClubs.set(bookClubId, { clients: new Map() });
        }
        const activeClub = activeBookClubs.get(bookClubId)!;
        activeClub.clients.set(clientId, currentClient);

        // Add user to members if not already
        let wasNewMember = false;
        if (!bookClub.members.includes(userId)) {
          await prisma.bookClub.update({
            where: { id: bookClubId },
            data: { 
              members: { push: userId },
              lastActiveAt: new Date()
            }
          });
          wasNewMember = true;
        } else {
          await prisma.bookClub.update({
            where: { id: bookClubId },
            data: { lastActiveAt: new Date() }
          });
        }

        // Get recent messages for the current room
        const recentMessages = await prisma.message.findMany({
          where: { roomId: targetRoomId },
          orderBy: { createdAt: 'asc' },
          take: 100
        });

        // Fetch all member details from user service
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001/api';
        let memberDetails = [];
        const allMembers = wasNewMember ? [...bookClub.members, userId] : bookClub.members;
        
        try {
          const response = await fetch(`${userServiceUrl}/users/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds: allMembers })
          });
          
          if (response.ok) {
            const data = await response.json();
            memberDetails = data.users || [];
          } else {
            console.error('Failed to fetch member details:', response.status);
          }
        } catch (error) {
          console.error('Error fetching member details:', error);
        }

        // Send initial data to new user
        ws.send(JSON.stringify({
          type: 'init',
          clientId,
          bookClub,
          currentRoomId: targetRoomId,
          messages: recentMessages,
          members: memberDetails,
          users: Array.from(activeClub.clients.values()).map(c => ({
            id: c.id,
            userId: c.userId,
            username: c.username,
            roomId: c.roomId
          }))
        }));

        // Notify others that someone joined (including updated members if new)
        if (wasNewMember) {
          broadcastToBookClub(activeClub, {
            type: 'user-joined',
            user: {
              id: clientId,
              userId: currentClient.userId,
              username: currentClient.username,
              roomId: currentClient.roomId
            },
            members: memberDetails
          }, clientId);
        } else {
          broadcastToBookClub(activeClub, {
            type: 'user-joined',
            user: {
              id: clientId,
              userId: currentClient.userId,
              username: currentClient.username,
              roomId: currentClient.roomId
            }
          }, clientId);
        }

        console.log(`👥 ${username} joined book club ${bookClubId} in room ${targetRoomId} (${activeClub.clients.size} users)`);
      })
      .catch((error) => {
        console.error('Error joining book club:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to join book club' }));
        ws.close();
      });
  }

  function handleSwitchRoom(message: any) {
    if (!currentClient) return;

    const { roomId } = message;
    
    // Verify room belongs to the bookclub
    prisma.room.findUnique({ where: { id: roomId } })
      .then(async (room) => {
        if (!room || room.bookClubId !== currentClient!.bookClubId) {
          currentClient!.ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid room'
          }));
          return;
        }

        // Update client's current room
        currentClient!.roomId = roomId;

        // Get messages for the new room
        const messages = await prisma.message.findMany({
          where: { roomId },
          orderBy: { createdAt: 'asc' },
          take: 100
        });

        // Send room data to user
        currentClient!.ws.send(JSON.stringify({
          type: 'room-switched',
          roomId,
          messages
        }));

        console.log(`🔄 ${currentClient!.username} switched to room ${roomId}`);
      })
      .catch((error) => {
        console.error('Error switching room:', error);
        if (currentClient && currentClient.ws.readyState === WebSocket.OPEN) {
          currentClient.ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to switch room'
          }));
        }
      });
  }

  function handleChatMessage(message: any) {
    if (!currentClient || !currentClient.roomId) return;

    const activeClub = activeBookClubs.get(currentClient.bookClubId);
    if (!activeClub) return;

    // Save message to database
    prisma.message.create({
      data: {
        roomId: currentClient.roomId,
        userId: currentClient.userId,
        username: currentClient.username,
        content: message.message
      }
    })
    .then((savedMessage) => {
      // Broadcast chat message to all users in the SAME ROOM (including sender)
      const chatData = {
        type: 'chat-message',
        message: savedMessage
      };

      activeClub.clients.forEach((client) => {
        if (client.roomId === currentClient!.roomId && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify(chatData));
        }
      });

      console.log(`💬 ${currentClient.username} in room ${currentClient.roomId}: ${message.message}`);
    })
    .catch((error) => {
      console.error('Error saving message:', error);
      if (currentClient && currentClient.ws.readyState === WebSocket.OPEN) {
        currentClient.ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to send message'
        }));
      }
    });
  }

  function handleJoinDM(ws: WebSocket, message: any) {
    const { userId, username } = message;
    
    // Create DM client
    const clientId = uuidv4();
    currentClient = {
      id: clientId,
      userId,
      username,
      ws,
      isDMConnection: true
    };
    
    // Store in active DM clients (one per user)
    activeDMClients.set(userId, currentClient);
    
    ws.send(JSON.stringify({
      type: 'dm-joined',
      userId
    }));
    
    console.log(`📨 ${username} (${userId}) joined DM connection`);
  }

  async function handleDMMessage(message: any) {
    if (!currentClient || !currentClient.isDMConnection) return;

    const { receiverId, content } = message;
    
    try {
      // Save message to user-service database via API
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001/api';
      const response = await fetch(`${userServiceUrl}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentClient.userId // Internal service-to-service header
        },
        body: JSON.stringify({ receiverId, content })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to save DM');
      }

      const data = await response.json();
      // Handle both response formats: { data: message } or { message }
      const savedMessage = data.data || data.message;

      if (!savedMessage) {
        throw new Error('No message in response');
      }

      // Send confirmation to sender
      if (currentClient.ws.readyState === WebSocket.OPEN) {
        currentClient.ws.send(JSON.stringify({
          type: 'dm-sent',
          message: savedMessage
        }));
      }

      // Send message to receiver if they're online
      const receiverClient = activeDMClients.get(receiverId);
      if (receiverClient && receiverClient.ws.readyState === WebSocket.OPEN) {
        receiverClient.ws.send(JSON.stringify({
          type: 'dm-received',
          message: savedMessage
        }));
      }

      console.log(`📨 DM from ${currentClient.username} to ${receiverId}: ${content}`);
    } catch (error) {
      console.error('Error handling DM:', error);
      if (currentClient && currentClient.ws.readyState === WebSocket.OPEN) {
        currentClient.ws.send(JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to send direct message'
        }));
      }
    }
  }

  function handleDisconnect(client: Client) {
    // Handle DM disconnection
    if (client.isDMConnection) {
      activeDMClients.delete(client.userId);
      console.log(`📪 ${client.username} (${client.userId}) left DM connection`);
      return;
    }

    // Handle bookclub disconnection
    if (!client.bookClubId) return;
    
    const activeClub = activeBookClubs.get(client.bookClubId);
    if (!activeClub) return;

    activeClub.clients.delete(client.id);

    // Notify others
    broadcastToBookClub(activeClub, {
      type: 'user-left',
      userId: client.id,
      username: client.username
    });

    console.log(`👋 ${client.username} left book club ${client.bookClubId} (${activeClub.clients.size} users remaining)`);

    // Clean up empty active bookclubs (but keep in database!)
    if (activeClub.clients.size === 0) {
      activeBookClubs.delete(client.bookClubId);
      console.log(`🧹 Active book club ${client.bookClubId} cleaned up (no connected users)`);
    }
  }

});

// Broadcast message to all clients in an active bookclub except sender
function broadcastToBookClub(activeClub: ActiveBookClub, message: any, excludeClientId?: string) {
  const data = JSON.stringify(message);
  
  activeClub.clients.forEach((client) => {
    if (client.id !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  });
}

server.listen(PORT, () => {
  console.log(`🚀 BookClub Service running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`💾 Connected to database`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
