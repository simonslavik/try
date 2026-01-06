import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { 
  FiPlay, FiCopy, FiCheck, FiShare2, FiUsers, 
  FiTerminal, FiCode, FiLogOut, FiMenu 
} from 'react-icons/fi';
import ChatSidebar from '../../components/ChatSidebar';
import FileExplorer from '../../components/FileExplorer';
import UserPresence from '../../components/UserPresence';

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
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([{ id: '1', name: 'main.js', content: '', language: 'javascript' }]);
  const [currentFile, setCurrentFile] = useState(null);
  const [showChat, setShowChat] = useState(true);
  const [showFiles, setShowFiles] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const wsRef = useRef(null);
  const monacoRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);

  // Initialize first file
  useEffect(() => {
    if (files.length > 0 && !currentFile) {
      setCurrentFile(files[0]);
      setCode(files[0].content);
    }
  }, [files, currentFile]);

  // Handle chat message
  const handleSendMessage = (message) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'chat-message',
      message
    }));
  };

  // Copy room ID to clipboard
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // File management
  const handleFileSelect = (file) => {
    // Save current file content
    if (currentFile) {
      setFiles(prev => prev.map(f => 
        f.id === currentFile.id ? { ...f, content: code } : f
      ));
    }
    setCurrentFile(file);
    setCode(file.content);
    setLanguage(file.language || 'javascript');
  };

  const handleCreateFile = (filename) => {
    const ext = filename.split('.').pop();
    const langMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      html: 'html',
      css: 'css',
      json: 'json'
    };
    
    const newFile = {
      id: Date.now().toString(),
      name: filename,
      content: '',
      language: langMap[ext] || 'javascript'
    };
    
    setFiles(prev => [...prev, newFile]);
    setCurrentFile(newFile);
    setCode('');
  };

  const handleDeleteFile = (fileId) => {
    if (files.length === 1) {
      alert('Cannot delete the last file');
      return;
    }
    
    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== fileId);
      if (currentFile?.id === fileId) {
        setCurrentFile(newFiles[0]);
        setCode(newFiles[0].content);
      }
      return newFiles;
    });
  };

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
          setMessages(prev => [...prev, {
            type: 'system',
            text: `Welcome to the room!`,
            timestamp: Date.now()
          }]);
          break;
          
        case 'code-update':
          isRemoteUpdateRef.current = true;
          setCode(message.code);
          break;
          
        case 'user-joined':
          setConnectedUsers(prev => [...prev, message.user]);
          setMessages(prev => [...prev, {
            type: 'system',
            text: `${message.user.username} joined the room`,
            timestamp: Date.now()
          }]);
          break;
          
        case 'user-left':
          setConnectedUsers(prev => {
            const leftUser = prev.find(u => u.id === message.userId);
            if (leftUser) {
              setMessages(prevMsg => [...prevMsg, {
                type: 'system',
                text: `${leftUser.username} left the room`,
                timestamp: Date.now()
              }]);
            }
            return prev.filter(u => u.id !== message.userId);
          });
          break;
        
        case 'chat-message':
          setMessages(prev => [...prev, {
            username: message.username,
            text: message.message,
            timestamp: message.timestamp || Date.now()
          }]);
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

  // Handle code changes (Monaco)
  const handleCodeChange = (value) => {
    const newCode = value || '';
    setCode(newCode);
    
    // Update current file
    if (currentFile) {
      setFiles(prev => prev.map(f => 
        f.id === currentFile.id ? { ...f, content: newCode } : f
      ));
    }
    
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
      language: currentFile?.language || language
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
    setMessages([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Monaco editor configuration
  const handleEditorDidMount = (editor, monaco) => {
    monacoRef.current = { editor, monaco };
    
    // Configure editor theme and options
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1a1a1a',
      }
    });
    monaco.editor.setTheme('custom-dark');
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {!isConnected ? (
        // Join/Create Room Form
        <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
          <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">💻</div>
              <h1 className="text-3xl font-bold text-white mb-2">CodeCollab</h1>
              <p className="text-gray-400">Real-time collaborative code editor</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-gray-300 mb-2 font-medium text-sm">
                  Your Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isJoining}
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-medium text-sm">
                  Default Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isJoining}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="typescript">TypeScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>

              <button
                onClick={createRoom}
                disabled={isJoining || !username.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isJoining ? 'Creating...' : '🎉 Create New Room'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gray-800 px-4 text-gray-400 text-sm">
                    OR
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter Room ID"
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isJoining}
                />
                <button
                  onClick={() => joinRoom()}
                  disabled={isJoining || !username.trim() || !roomId.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isJoining ? 'Joining...' : '🚀 Join Room'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Editor Interface
        <>
          {/* Header */}
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <FiCode className="text-purple-400" />
                CodeCollab
              </h1>
              <div className="flex items-center gap-2 bg-gray-700 px-3 py-1.5 rounded-lg">
                <span className="text-gray-400 text-sm">Room:</span>
                <code className="text-white text-sm font-mono">{roomId.slice(0, 8)}...</code>
                <button
                  onClick={copyRoomId}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Copy Room ID"
                >
                  {copied ? <FiCheck className="text-green-400" /> : <FiCopy />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <UserPresence users={connectedUsers} currentUsername={username} />
              
              <button
                onClick={() => setShowFiles(!showFiles)}
                className={`p-2 rounded-lg transition-colors ${
                  showFiles ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
                title="Toggle Files"
              >
                <FiMenu />
              </button>
              
              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-2 rounded-lg transition-colors ${
                  showChat ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
                title="Toggle Chat"
              >
                <FiUsers />
              </button>
              
              <button
                onClick={disconnect}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <FiLogOut />
                Leave
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* File Explorer */}
            {showFiles && (
              <div className="w-64 flex-shrink-0">
                <FileExplorer
                  files={files}
                  currentFile={currentFile}
                  onFileSelect={handleFileSelect}
                  onCreateFile={handleCreateFile}
                  onDeleteFile={handleDeleteFile}
                />
              </div>
            )}

            {/* Editor Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Editor Toolbar */}
              <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">
                    {currentFile?.name || 'Untitled'}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-purple-400 text-xs uppercase">
                    {currentFile?.language || language}
                  </span>
                </div>
                
                <button
                  onClick={runCode}
                  disabled={isRunning || !code.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                >
                  <FiPlay />
                  {isRunning ? 'Running...' : 'Run Code'}
                </button>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={currentFile?.language || language}
                  value={code}
                  onChange={handleCodeChange}
                  onMount={handleEditorDidMount}
                  theme="custom-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: true },
                    wordWrap: 'on',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    tabSize: 2,
                  }}
                />
              </div>

              {/* Output Console */}
              {output && (
                <div className="h-48 border-t border-gray-700 bg-gray-900 flex flex-col">
                  <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                    <div className="flex items-center gap-2 text-gray-300 text-sm">
                      <FiTerminal />
                      <span>Output</span>
                    </div>
                    <button
                      onClick={() => setOutput('')}
                      className="text-gray-400 hover:text-white text-xs"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                      {output}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Sidebar */}
            {showChat && (
              <div className="w-80 flex-shrink-0">
                <ChatSidebar
                  ws={wsRef.current}
                  username={username}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
