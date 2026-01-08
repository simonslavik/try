import { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../../../context';
import { FiHash, FiUsers, FiPlus, FiSettings, FiHome, FiImage, FiTrash2 } from 'react-icons/fi';

const BookClub = () => {
  const { id: bookClubId } = useParams();
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [bookClub, setBookClub] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch bookclub details
  useEffect(() => {
    const fetchBookClub = async () => {
      try {
        const headers = auth?.token 
          ? { Authorization: `Bearer ${auth.token}` }
          : {};
        
        const response = await fetch(`http://localhost:3000/v1/editor/bookclubs/${bookClubId}`, { headers });
        const data = await response.json();
        
        if (response.ok) {
          setBookClub(data);
          setRooms(data.rooms || []);
          setConnectedUsers(data.connectedUsers || []);
          
          // Select first room by default
          if (data.rooms && data.rooms.length > 0) {
            setCurrentRoom(data.rooms[0]);
          }
        } else {
          setError(data.error || 'Failed to load book club');
        }
      } catch (err) {
        console.error('Error fetching book club:', err);
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    if (bookClubId) {
      fetchBookClub();
    }
  }, [bookClubId, auth]);

  // WebSocket connection
  useEffect(() => {
    if (!bookClub || !auth?.token || !currentRoom) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:4000`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected to room:', currentRoom.name);
      
      // Send join message
      ws.current.send(JSON.stringify({
        type: 'join',
        bookClubId: bookClubId,
        userId: auth.user.id,
        username: auth.user.username,
        roomId: currentRoom.id
      }));
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'init':
            setMessages(data.messages.map(msg => ({
              id: msg.id,
              username: msg.username,
              text: msg.content,
              timestamp: msg.createdAt,
              userId: msg.userId
            })));
            setConnectedUsers(data.users || []);
            break;
          
          case 'chat-message':
            setMessages(prev => [...prev, {
              id: data.message.id,
              username: data.message.username,
              text: data.message.content,
              timestamp: data.message.createdAt,
              userId: data.message.userId
            }]);
            break;
          
          case 'user-joined':
            setConnectedUsers(prev => {
              if (!prev.find(u => u.id === data.user.id)) {
                return [...prev, data.user];
              }
              return prev;
            });
            setMessages(prev => [...prev, {
              type: 'system',
              text: `${data.user.username} joined the room`,
              timestamp: new Date().toISOString()
            }]);
            break;
          
          case 'user-left':
            setConnectedUsers(prev => prev.filter(u => u.id !== data.userId));
            setMessages(prev => [...prev, {
              type: 'system',
              text: `${data.username} left the room`,
              timestamp: new Date().toISOString()
            }]);
            break;
          
          case 'room-switched':
            setMessages(data.messages.map(msg => ({
              id: msg.id,
              username: msg.username,
              text: msg.content,
              timestamp: msg.createdAt,
              userId: msg.userId
            })));
            break;
          
          case 'error':
            console.error('WebSocket error:', data.message);
            alert(data.message);
            break;
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [bookClub, currentRoom, auth, bookClubId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
      return;
    }

    ws.current.send(JSON.stringify({
      type: 'chat-message',
      message: newMessage.trim()
    }));

    setNewMessage('');
  };

  const handleCreateRoom = async () => {
    const roomName = prompt('Enter room name:');
    if (!roomName || !roomName.trim()) return;

    try {
      const response = await fetch(`http://localhost:3000/v1/editor/bookclubs/${bookClubId}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ name: roomName.trim() })
      });

      const data = await response.json();
      
      if (response.ok) {
        setRooms(prev => [...prev, data.room]);
      } else {
        alert(data.error || 'Failed to create room');
      }
    } catch (err) {
      console.error('Error creating room:', err);
      alert('Failed to create room');
    }
  };

  const switchRoom = (room) => {
    if (room.id !== currentRoom?.id) {
      setMessages([]);
      setCurrentRoom(room);
      
      // Send switch-room message to server
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'switch-room',
          roomId: room.id
        }));
      }
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    try {
      const response = await fetch(`http://localhost:3000/v1/editor/bookclubs/${bookClubId}/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        setBookClub(prev => ({ ...prev, imageUrl: data.imageUrl }));
      } else {
        alert(data.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async () => {
    if (!confirm('Are you sure you want to delete the bookclub image?')) return;

    try {
      const response = await fetch(`http://localhost:3000/v1/editor/bookclubs/${bookClubId}/image`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setBookClub(prev => ({ ...prev, imageUrl: null }));
      } else {
        alert(data.error || 'Failed to delete image');
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Failed to delete image');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading book club...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900">
        <div className="text-red-400 text-xl mb-4">{error}</div>
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar - Rooms */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Bookclub Header with Image */}
        <div className="p-4 border-b border-gray-700">
          {/* Bookclub Image */}
          <div className="relative mb-3 group">
            <img 
              src={bookClub?.imageUrl ? `http://localhost:4000${bookClub.imageUrl}` : '/images/default.webp'}
              alt={bookClub?.name}
              className="w-full h-32 object-cover rounded"
              onError={(e) => { e.target.src = '/images/IMG_2650.jpg'; }}
            />
            {auth?.user && auth.user.id === bookClub?.creatorId && (
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                  title="Change Image"
                >
                  <FiImage />
                </button>
                {bookClub?.imageUrl && (
                  <button
                    onClick={handleDeleteImage}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                    title="Delete Image"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          
          <h2 className="text-white font-bold text-lg truncate">{bookClub?.name}</h2>
          <button 
            onClick={() => navigate('/')}
            className="mt-2 flex items-center gap-2 text-gray-400 hover:text-white text-sm"
          >
            <FiHome /> Back to Home
          </button>
        </div>

        {/* Rooms List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-1 mb-2">
              <h3 className="text-gray-400 text-xs font-semibold uppercase">Rooms</h3>
              {auth?.user && (
                <button 
                  onClick={handleCreateRoom}
                  className="text-gray-400 hover:text-white"
                  title="Create Room"
                >
                  <FiPlus size={14} />
                </button>
              )}
            </div>
            
            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => switchRoom(room)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                  currentRoom?.id === room.id
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <FiHash size={16} />
                <span className="truncate">{room.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Connected Users */}
        <div className="border-t border-gray-700 p-2">
          <div className="flex items-center gap-2 px-2 py-1 mb-2">
            <FiUsers className="text-gray-400" size={14} />
            <h3 className="text-gray-400 text-xs font-semibold uppercase">
              Online ({connectedUsers.length})
            </h3>
          </div>
          <div className="max-h-32 overflow-y-auto">
            {connectedUsers.map(user => (
              <div key={user.id} className="px-2 py-1 text-sm text-gray-300 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="truncate">{user.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Room Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiHash className="text-gray-400" />
            <h2 className="text-white font-semibold">{currentRoom?.name}</h2>
          </div>
          {auth?.user && (
            <button className="text-gray-400 hover:text-white">
              <FiSettings />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <FiHash className="mx-auto text-4xl mb-2 opacity-30" />
              <p className="text-sm">Welcome to #{currentRoom?.name}</p>
              <p className="text-xs mt-1">Start a conversation!</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={msg.id || idx} className="flex flex-col">
                {msg.type === 'system' ? (
                  <div className="text-center">
                    <span className="text-xs text-gray-500 italic">{msg.text}</span>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {msg.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-white">{msg.username}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-300 break-words">{msg.text}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {auth?.user ? (
          <form onSubmit={handleSendMessage} className="bg-gray-800 border-t border-gray-700 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message #${currentRoom?.name}`}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                Send
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-gray-800 border-t border-gray-700 p-4 text-center">
            <p className="text-gray-400">
              Please <button onClick={() => navigate('/login')} className="text-purple-400 hover:underline">log in</button> to chat
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookClub;
