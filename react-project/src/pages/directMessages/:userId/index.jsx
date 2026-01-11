import { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../../../context';
import { FiArrowLeft, FiSend } from 'react-icons/fi';

const DirectMessagePage = () => {
  const { userId } = useParams();
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize WebSocket connection for DMs
  useEffect(() => {
    if (!auth?.user?.id || !auth?.user?.name) return;

    const ws = new WebSocket('ws://localhost:4000');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('📨 WebSocket connected for DMs');
      // Join DM connection
      ws.send(JSON.stringify({
        type: 'join-dm',
        userId: auth.user.id,
        username: auth.user.name
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'dm-joined':
          console.log('✅ Joined DM connection');
          break;
          
        case 'dm-sent':
          // Message we sent was confirmed - add it if not already in list
          setMessages(prev => {
            if (prev.find(m => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
          setSendingMessage(false);
          break;
          
        case 'dm-received':
          // New message received from someone else
          const newMsg = data.message;
          
          // Update messages if this is the active conversation
          if (newMsg.senderId === userId || newMsg.receiverId === userId) {
            setMessages(prev => {
              if (prev.find(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
          
          // Update conversations list
          fetchConversations();
          break;
          
        case 'error':
          console.error('WebSocket error:', data.message);
          setSendingMessage(false);
          alert(data.message || 'Failed to send message');
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('📪 WebSocket disconnected from DMs');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [auth?.user?.id, auth?.user?.name, userId]);

  // Fetch conversations list
  const fetchConversations = async () => {
    if (!auth?.token) return;

    try {
      const response = await fetch('http://localhost:3000/v1/messages/conversations', {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        // Backend returns { success: true, data: [...conversations] }
        setConversations(data.data || []);
      } else {
        console.error('Failed to fetch conversations:', data.message);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  // Fetch messages with specific user (initial load only)
  const fetchMessages = async () => {
    if (!userId || !auth?.token) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/v1/messages/${userId}`, {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessages(data.data.messages || []);
        setOtherUser(data.data.otherUser);
      } else {
        setError(data.message || 'Failed to load messages');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchConversations();
    if (userId) {
      fetchMessages();
    }
  }, [userId, auth]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sendingMessage || !wsRef.current) return;

    setSendingMessage(true);
    
    // Send via WebSocket
    wsRef.current.send(JSON.stringify({
      type: 'dm-message',
      receiverId: userId,
      content: newMessage.trim()
    }));
    
    setNewMessage('');
  };

  if (!auth?.user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Please log in to view messages</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-white font-bold text-xl">Messages</h2>
          <button 
            onClick={() => navigate('/')}
            className="mt-2 flex items-center gap-2 text-gray-400 hover:text-white text-sm"
          >
            <FiArrowLeft /> Back to Home
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-2">Add friends to start messaging!</p>
            </div>
          ) : (
            conversations.map(({ friend, lastMessage, unreadCount }) => (
              <div
                key={friend.id}
                onClick={() => navigate(`/messages/${friend.id}`)}
                className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition ${
                  userId === friend.id ? 'bg-gray-700' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <img 
                    src={friend.profileImage 
                      ? `http://localhost:3001${friend.profileImage}` 
                      : '/images/default.webp'
                    }
                    alt={friend.name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold truncate">{friend.name}</h3>
                      {unreadCount > 0 && (
                        <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {lastMessage && (
                      <p className="text-sm text-gray-400 truncate mt-1">
                        {lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Current User */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex items-center gap-3">
            <img 
              src={auth.user.profileImage 
                ? `http://localhost:3001${auth.user.profileImage}` 
                : '/images/default.webp'
              }
              alt={auth.user.name}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => { e.target.src = '/images/default.webp'; }}
            />
            <span className="text-white font-medium truncate">{auth.user.name}</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-col flex-1">
        {userId && otherUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <img 
                  src={otherUser.profileImage 
                    ? `http://localhost:3001${otherUser.profileImage}` 
                    : '/images/default.webp'
                  }
                  alt={otherUser.name}
                  className="w-10 h-10 rounded-full object-cover cursor-pointer"
                  onClick={() => navigate(`/profile/${otherUser.id}`)}
                  onError={(e) => { e.target.src = '/images/default.webp'; }}
                />
                <div>
                  <h2 
                    className="text-white font-semibold cursor-pointer hover:underline"
                    onClick={() => navigate(`/profile/${otherUser.id}`)}
                  >
                    {otherUser.name}
                  </h2>
                  <p className="text-xs text-gray-400">{otherUser.email}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {error ? (
                <div className="text-center text-red-400">{error}</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">Say hello to {otherUser.name}!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.senderId === auth.user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-md ${
                      msg.senderId === auth.user.id 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-700 text-gray-100'
                    } rounded-2xl px-4 py-2`}>
                      <p className="break-words">{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.senderId === auth.user.id ? 'text-purple-200' : 'text-gray-400'
                      }`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="bg-gray-800 border-t border-gray-700 p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${otherUser.name}...`}
                  className="flex-1 px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <FiSend /> {sendingMessage ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-lg">Select a conversation</p>
              <p className="text-sm mt-2">Choose a friend from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessagePage;
