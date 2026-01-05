import { useState, useEffect, useRef, useCallback } from 'react';

const GATEWAY_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:4000';

export default function CollaborativeEditor() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  
  const wsRef = useRef(null);
  const editorRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);

  // Create a new room
  const createRoom = async () => {
    try {
      const response = await fetch(`${GATEWAY_URL}/v1/editor/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: `${username}'s Room`,
          language 
        })
      });
      
      const data = await response.json();
      setRoomId(data.roomId);
      joinRoom(data.roomId);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room. Please try again.');
    }
  };

  // Join existing room
  const joinRoom = useCallback((joinRoomId) => {
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }

    const targetRoomId = joinRoomId || roomId;
    if (!targetRoomId.trim()) {
      alert('Please enter a room ID');
      return;
    }

    setIsJoining(true);

    // Connect to WebSocket
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({
        type: 'join',
        roomId: targetRoomId,
        username: username.trim()
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'init':
          isRemoteUpdateRef.current = true;
          setCode(message.code);
          setConnectedUsers(message.users);
          setIsConnected(true);
          setIsJoining(false);
          console.log('Joined room successfully');
          break;
          
        case 'code-update':
          isRemoteUpdateRef.current = true;
          setCode(message.code);
          break;
          
        case 'user-joined':
          setConnectedUsers(prev => [...prev, message.user]);
          break;
          
        case 'user-left':
          setConnectedUsers(prev => 
            prev.filter(u => u.id !== message.userId)
          );
          break;
        
        case 'code-result':
          setIsRunning(false);
          let resultText;
          if (message.error) {
            resultText = `❌ Error (by ${message.executedBy}):\n${message.error}`;
          } else if (message.output && message.output.trim()) {
            resultText = `✅ Output (by ${message.executedBy}):\n${message.output}\n\n⏱️ Execution time: ${message.executionTime}ms`;
          } else {
            resultText = `✅ Code executed successfully (by ${message.executedBy})\n(No output produced)\n\n⏱️ Execution time: ${message.executionTime}ms`;
          }
          setOutput(resultText);
          break;
        
        case 'code-saved':
          console.log('✅ Code saved:', message.timestamp);
          break;
          
        case 'error':
          alert(message.message);
          setIsJoining(false);
          setIsRunning(false);
          ws.close();
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      alert('Connection error. Please try again.');
      setIsJoining(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setConnectedUsers([]);
    };
  }, [roomId, username]);

  // Handle code changes
  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    
    // Send update if this is a local change (not from WebSocket)
    if (!isRemoteUpdateRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'code-change',
        code: newCode
      }));
    }
    
    isRemoteUpdateRef.current = false;
  };

  // Run code
  const runCode = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('Not connected to room');
      return;
    }

    setIsRunning(true);
    setOutput('Running code...');
    
    wsRef.current.send(JSON.stringify({
      type: 'run-code',
      code: code,
      language: language
    }));
  };

  // Disconnect
  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setIsConnected(false);
    setCode('');
    setRoomId('');
    setOutput('');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <span className="text-5xl">👥</span>
              Collaborative Code Editor
            </h1>
            <p className="text-purple-200">Code together in real-time</p>
          </div>

          {!isConnected ? (
            // Join/Create Room Form
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-purple-200 mb-2 font-medium">
                    Your Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={isJoining}
                  />
                </div>

                <div>
                  <label className="block text-purple-200 mb-2 font-medium">
                    Programming Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={isJoining}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="typescript">TypeScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={createRoom}
                  disabled={isJoining || !username.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isJoining ? 'Creating...' : '🎉 Create New Room'}
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/30"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 px-4 text-purple-200 text-sm">
                    OR JOIN EXISTING ROOM
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter Room ID"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isJoining}
                />
                <button
                  onClick={() => joinRoom()}
                  disabled={isJoining || !username.trim() || !roomId.trim()}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isJoining ? 'Joining...' : '🚀 Join Room'}
                </button>
              </div>
            </div>
          ) : (
            // Editor Interface
            <div className="space-y-6">
              {/* Room Info Bar */}
              <div className="flex justify-between items-center bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-purple-200 text-sm">Room ID</p>
                    <p className="text-white font-mono font-semibold">{roomId}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                    <span className="text-2xl">👥</span>
                    <span className="text-white font-semibold">{connectedUsers.length}</span>
                    <span className="text-purple-200 text-sm">online</span>
                  </div>
                </div>
                <button
                  onClick={disconnect}
                  className="bg-red-500/80 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition-all"
                >
                  🚪 Leave Room
                </button>
              </div>

              {/* Connected Users */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/20">
                <h3 className="text-purple-200 font-semibold mb-3">Connected Users:</h3>
                <div className="flex flex-wrap gap-2">
                  {connectedUsers.map((user) => (
                    <span
                      key={user.id}
                      className="bg-purple-500/30 text-white px-4 py-2 rounded-full text-sm border border-purple-400/30"
                    >
                      👤 {user.username}
                    </span>
                  ))}
                </div>
              </div>

              {/* Code Editor */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-purple-200 font-semibold">
                    Code Editor ({language})
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={runCode}
                      disabled={isRunning || !code.trim()}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
                    >
                      {isRunning ? '⏳ Running...' : '▶️ Run Code'}
                    </button>
                    <span className="text-green-400 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Connected
                    </span>
                  </div>
                </div>
                <textarea
                  ref={editorRef}
                  value={code}
                  onChange={handleCodeChange}
                  className="w-full h-[600px] px-4 py-3 rounded-lg bg-gray-900 border border-purple-500/30 text-green-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Start typing your code here..."
                  spellCheck="false"
                />
              </div>

              {/* Output Console */}
              {output && (
                <div>
                  <label className="text-purple-200 font-semibold mb-2 block">
                    Output Console
                  </label>
                  <pre className="w-full min-h-[150px] px-4 py-3 rounded-lg bg-gray-900 border border-green-500/30 text-green-300 font-mono text-sm whitespace-pre-wrap">
                    {output}
                  </pre>
                </div>
              )}

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <p className="text-purple-200 text-sm">
                  💡 <strong>Tip:</strong> Share the Room ID with others to collaborate in real-time. 
                  All changes are synced automatically and saved to the database.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
