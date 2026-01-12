import { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../../../context';
import { FiHash, FiUsers, FiPlus, FiSettings, FiHome, FiImage, FiTrash2, FiMail } from 'react-icons/fi';
import MyBookClubsSidebar from '../../../components/MyBookClubsSidebar';
import SideBarRooms from '../../../components/SideBarRooms';
import DMSidebar from '../../../components/DMSidebar';
import DMChat from '../../../components/DMChat';

const BookClub = () => {
  const { id: bookClubId } = useParams();
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Mode state - check if navigation state specifies DM mode
  const [viewMode, setViewMode] = useState(location.state?.viewMode || 'bookclub'); // 'bookclub' or 'dm'
  
  // Bookclub states
  const [bookClub, setBookClub] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [bookClubMembers, setBookClubMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [myBookClubs, setMyBookClubs] = useState([]);

  
  // DM states
  const [conversations, setConversations] = useState([]);
  const [currentDMUser, setCurrentDMUser] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [friends, setFriends] = useState([]);
  
  const ws = useRef(null);
  const dmWs = useRef(null);
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
          setBookClubMembers(data.members || []);
          
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

  // Fetch my bookclubs only once on mount (not on bookClubId change to prevent reordering)
  useEffect(() => {
    if (auth?.user) {
        const headers = auth?.token 
          ? { Authorization: `Bearer ${auth.token}` }
          : {};
        
        fetch('http://localhost:3000/v1/editor/bookclubs?mine=true', { headers })
            .then(response => response.json())
            .then(data => {
                console.log('My Bookclubs response:', data);
                setMyBookClubs(data.bookClubs || []);
            })
            .catch(error => console.error('Error fetching my book clubs:', error));
    }
  }, [auth]);

  // WebSocket connection
  useEffect(() => {
    if (!bookClub || !auth?.token || !currentRoom) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:4000`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected to room:', currentRoom.name);
      
      // Send join message with display name
      const username = auth.user.name || 'Anonymous';
      ws.current.send(JSON.stringify({
        type: 'join',
        bookClubId: bookClubId,
        userId: auth.user.id,
        username: username,
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
            // Update members if provided
            if (data.members) {
              setBookClubMembers(data.members);
            }
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
            // Update members list if a new member joined
            if (data.members) {
              setBookClubMembers(data.members);
            }
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

  // DM WebSocket connection
  useEffect(() => {
    if (!auth?.user?.id || !auth?.user?.name) return;

    const ws = new WebSocket('ws://localhost:4000');
    dmWs.current = ws;

    ws.onopen = () => {
      console.log('📨 DM WebSocket connected');
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
          setDmMessages(prev => {
            if (prev.find(m => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
          setSendingMessage(false);
          break;
          
        case 'dm-received':
          // New message received from someone else
          const newMsg = data.message;
          
          // Update messages if this is the active conversation
          if (currentDMUser && (newMsg.senderId === currentDMUser.id || newMsg.receiverId === currentDMUser.id)) {
            setDmMessages(prev => {
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
      console.error('DM WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('📪 DM WebSocket disconnected');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [auth?.user?.id, auth?.user?.name, currentDMUser]);

  // Fetch conversations when switching to DM mode
  const fetchConversations = async () => {
    if (!auth?.token) return;
    
    try {
      const response = await fetch('http://localhost:3000/v1/messages/conversations', {
        headers: { Authorization: `Bearer ${auth.token}` }
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

  // Fetch friends list
  const fetchFriends = async () => {
    if (!auth?.token) return;
    
    try {
      const response = await fetch('http://localhost:3000/v1/friends/list', {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setFriends(data.data || []);
      } else {
        console.error('Failed to fetch friends:', data.message);
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
    }
  };

  useEffect(() => {
    if (viewMode === 'dm') {
      fetchConversations();
      fetchFriends();
    }
  }, [viewMode, auth]);

  // Fetch messages for selected DM conversation
  const fetchDMMessages = async (userId) => {
    if (!auth?.token) return;
    
    try {
      const response = await fetch(`http://localhost:3000/v1/messages/${userId}`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setDmMessages(data.data.messages || []);
        setCurrentDMUser(data.data.otherUser);
      } else {
        console.error('Failed to fetch messages:', data.message);
      }
    } catch (err) {
      console.error('Error fetching DM messages:', err);
    }
  };

  const handleSelectDMConversation = async (userId) => {
    await fetchDMMessages(userId);
  };

  const handleSendDM = (content) => {
    if (!content.trim() || sendingMessage || !dmWs.current || dmWs.current.readyState !== WebSocket.OPEN || !currentDMUser) {
      return;
    }

    setSendingMessage(true);
    
    dmWs.current.send(JSON.stringify({
      type: 'dm-message',
      receiverId: currentDMUser.id,
      content: content.trim()
    }));
  };

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
        <div className='flex justify-center'>
          {/* My Bookclubs Sidebar */}
          <MyBookClubsSidebar 
            bookClubs={myBookClubs} 
            currentBookClubId={bookClubId}
            viewMode={viewMode}
            onSelectBookClub={(id) => {
              setViewMode('bookclub');
              navigate(`/bookclub/${id}`);
            }}
            onOpenDM={() => setViewMode('dm')}
          />
          
          {/* Conditional Sidebar - Bookclub Rooms or DM Conversations */}
          {viewMode === 'dm' ? (
            <DMSidebar
              conversations={conversations}
              friends={friends}
              currentConversation={currentDMUser?.id}
              onSelectConversation={handleSelectDMConversation}
              onStartConversation={handleSelectDMConversation}
              onBackToBookclub={() => setViewMode('bookclub')}
              auth={auth}
            />
          ) : (
            <SideBarRooms
              bookClub={bookClub}
              rooms={rooms}
              currentRoom={currentRoom}
              switchRoom={switchRoom}
              handleCreateRoom={handleCreateRoom}
              auth={auth}
              uploadingImage={uploadingImage}
              fileInputRef={fileInputRef}
              handleImageUpload={handleImageUpload}
              handleDeleteImage={handleDeleteImage}
              onNameUpdate={(newName) => setBookClub(prev => ({ ...prev, name: newName }))}
              onOpenDM={() => setViewMode('dm')}
            />
          )}
          
          <div className='absolute bottom-0 flex justify-center pointer-events-none  '> 
            {auth?.user && (
              <div className="p-2 bg-gray-800 rounded-2xl flex items-center gap-2 shadow-lg pointer-events-auto w-78">
                  <img 
                    src={auth.user.profileImage 
                      ? `http://localhost:3001${auth.user.profileImage}` 
                      : '/images/default.webp'
                    } 
                    alt={auth.user.name} 
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                  />
                  <span className="text-white font-medium truncate">
                    {auth.user.name}
                  </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-1">
        {/* Main Chat Area - Conditional rendering based on mode */}
        {viewMode === 'dm' ? (
          <DMChat
            otherUser={currentDMUser}
            messages={dmMessages}
            onSendMessage={handleSendDM}
            auth={auth}
          />
        ) : (
          <div className="flex flex-col flex-1">
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
                      msg.userId === auth?.user?.id ? (
                        <div className="flex gap-3 justify-end">
                          <div className=" text-right bg-blue-400 rounded-2xl px-4 py-2 max-w-xs break-words self-end">
                            <p className="text-gray-300 break-words">{msg.text}</p>
                          </div>
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
                      )
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
                  Please <button onClick={() => navigate('/login', { state: { from: `/bookclub/${bookClubId}` } })} className="text-purple-400 hover:underline">log in</button> to chat
                </p>
              </div>
            )}

          </div>
          )}
          {/* Connected Users - only show in bookclub mode */}
          {viewMode === 'bookclub' && (
          <div className="w-34 bg-gray-800 border-l border-gray-700 p-2">
            <div className="flex items-center gap-2 px-2 py-1 mb-2">
              <FiUsers className="text-gray-400" size={14} />
              <h3 className="text-gray-400 text-xs font-semibold uppercase">
                Online ({connectedUsers.length})
              </h3>
            </div>
            <div className="max-h-screen overflow-y-auto">
              {bookClubMembers.map(user => {
                const isOnline = connectedUsers.filter(connectedUser => connectedUser.id === user.id);
                return (
                  <div onClick={() => navigate(`/profile/${user.id}`)} key={user.id} className="px-2 py-1 text-sm text-gray-300 flex items-center gap-2 hover:bg-gray-700 rounded cursor-pointer">
                    <div className="relative">
                      <img 
                        src={user.profileImage 
                          ? `http://localhost:3001${user.profileImage}` 
                          : '/images/default.webp'
                        } 
                        alt={user.username} 
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => { e.target.src = '/images/default.webp'; }}
                      />
                      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-800 ${
                        isOnline ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                    </div>
                    <span className="truncate">{user.username}</span>
                  </div>
                );
              })}
            </div>
          </div>
          )}
        </div>
    </div>
  );
};

export default BookClub;
