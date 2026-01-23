import { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../../../context';
import { FiHash, FiUsers, FiPlus, FiSettings, FiHome, FiImage, FiTrash2, FiMail, FiStar, FiCalendar } from 'react-icons/fi';
import MyBookClubsSidebar from '../../../components/MyBookClubsSidebar';
import SideBarRooms from '../../../components/SideBarRooms';
import DMSidebar from '../../../components/DMSidebar';
import DMChat from '../../../components/DMChat';
import AddCurrentBookModal from '../../../components/AddCurrentBookModal';
import CurrentBookDetailsModal from '../../../components/CurrentBookDetailsModal';
import AddBookToBookclubModal from '../../../components/AddBookToBookclubModal';
import CalendarView from '../../../components/CalendarView';
import AddEventModal from '../../../components/AddEventModal';
import BookSuggestionsView from '../../../components/BookSuggestionsView';
import FileUpload from '../../../components/FileUpload';
import MessageAttachment from '../../../components/MessageAttachment';

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
  const [addCurrentBookState, setAddCurrentBookState] = useState(false);
  const [currentBookDetailsOpen, setCurrentBookDetailsOpen] = useState(false);
  const [currentBookData, setCurrentBookData] = useState(null);
  const [showBooksHistory, setShowBooksHistory] = useState(false);
  const [bookclubBooks, setBookclubBooks] = useState({ current: [], upcoming: [], completed: [] });
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  
  // Calendar states
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [selectedEventDate, setSelectedEventDate] = useState(null);
  const [calendarRefresh, setCalendarRefresh] = useState(null);

  // Suggestions states
  const [showSuggestions, setShowSuggestions] = useState(false);

  // File upload states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  // DM states
  const [conversations, setConversations] = useState([]);
  const [currentDMUser, setCurrentDMUser] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [friends, setFriends] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  
  const ws = useRef(null);
  const dmWs = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const fileUploadRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset books history and calendar view when bookClubId changes
  useEffect(() => {
    setShowBooksHistory(false);
    setShowCalendar(false);
    setShowSuggestions(false);
    setBookclubBooks({ current: [], upcoming: [], completed: [] });
  }, [bookClubId]);

  // Fetch bookclub books history
  const fetchBookclubBooks = async () => {
    if (!auth?.token || !bookClubId) return;
    
    setLoadingBooks(true);
    try {
      const response = await fetch(
        `http://localhost:3000/v1/bookclub/${bookClubId}/books`,
        {
          headers: {
            'Authorization': `Bearer ${auth.token}`
          }
        }
      );
      const data = await response.json();
      
      if (data.success) {
        // Organize books by status
        const organized = {
          current: data.data.filter(book => book.status === 'current'),
          upcoming: data.data.filter(book => book.status === 'upcoming'),
          completed: data.data.filter(book => book.status === 'completed')
        };
        setBookclubBooks(organized);
      }
    } catch (err) {
      console.error('Error fetching bookclub books:', err);
    } finally {
      setLoadingBooks(false);
    }
  };

  const handleShowBooksHistory = () => {
    setShowBooksHistory(true);
    setShowCalendar(false);
    setShowSuggestions(false);
    fetchBookclubBooks();
  };

  const handleStatusChange = async (bookId, newStatus) => {
    if (!auth?.token) return;
    
    try {
      const response = await fetch(
        `http://localhost:3000/v1/bookclub/${bookClubId}/books/${bookId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );
      
      const data = await response.json();
      if (data.success) {
        // Refresh the books list
        fetchBookclubBooks();
      } else {
        alert(data.error || 'Failed to update book status');
      }
    } catch (err) {
      console.error('Error updating book status:', err);
      alert('Failed to update book status');
    }
  };



  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (selectedUserId) {
        setSelectedUserId(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [selectedUserId]);

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
              userId: msg.userId,
              attachments: msg.attachments || []
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
              userId: data.message.userId,
              attachments: data.message.attachments || []
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    console.log('=== SEND MESSAGE DEBUG ===');
    console.log('Message text:', newMessage);
    console.log('Selected files count:', selectedFiles.length);
    console.log('Selected files:', selectedFiles);
    console.log('FileUploadRef exists:', !!fileUploadRef.current);
    
    if ((!newMessage.trim() && selectedFiles.length === 0) || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.log('Validation failed - returning early');
      return;
    }

    setUploadingFiles(true);
    
    try {
      let attachments = [];
      
      // Upload files if any are selected
      if (selectedFiles.length > 0 && fileUploadRef.current) {
        console.log('Starting file upload...');
        attachments = await fileUploadRef.current.uploadFiles();
        console.log('Uploaded attachments:', attachments);
      } else {
        console.log('No files to upload or ref missing');
      }

      // Send message via WebSocket
      console.log('Sending WebSocket message with attachments:', attachments);
      const messageData = {
        type: 'chat-message',
        message: newMessage.trim() || null,
        attachments: attachments
      };
      console.log('Full message data:', messageData);
      ws.current.send(JSON.stringify(messageData));

      setNewMessage('');
      setSelectedFiles([]); // Clear selected files after sending
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleFilesSelected = (files) => {
    setSelectedFiles(files);
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
      setShowBooksHistory(false);
      setShowCalendar(false);
      setShowSuggestions(false);
      
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

  const handleSendFriendRequest = async (userId) => {
    if (!auth?.token) return;
    
    try {
      const response = await fetch('http://localhost:3000/v1/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ recipientId: userId })
      });
      
      const data = await response.json();
      console.log('Friend request response:', data, 'Status:', response.status);
      
      if (response.ok) {
        alert('Friend request sent!');
        setSelectedUserId(null);
      } else {
        console.error('Friend request failed:', data);
        alert(data.error || data.message || 'Failed to send friend request');
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
      alert('Failed to send friend request: ' + err.message);
    }
  };

  const handleStartDM = async (userId) => {
    setViewMode('dm');
    await fetchDMMessages(userId);
    setSelectedUserId(null);
  };

  // Calendar event handlers
  const handleAddEvent = (date = null) => {
    setEventToEdit(null);
    setSelectedEventDate(date);
    setShowAddEventModal(true);
  };

  const handleEditEvent = (event) => {
    setEventToEdit(event);
    setShowAddEventModal(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!auth?.token) return;
    
    try {
      const response = await fetch(`http://localhost:3000/v1/editor/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      
      if (response.ok) {
        // Event deleted successfully - calendar will refetch
        return true;
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete event');
        return false;
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event');
      return false;
    }
  };

  const handleEventSaved = () => {
    // Trigger calendar refresh
    if (calendarRefresh) {
      calendarRefresh();
    }
    setShowAddEventModal(false);
    setEventToEdit(null);
    setSelectedEventDate(null);
  };

  const handleCalendarRefreshCallback = (refreshFn) => {
    setCalendarRefresh(() => refreshFn);
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
            auth={auth}
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
              setAddCurrentBookState={setAddCurrentBookState}
              addCurrentBookState={addCurrentBookState}
              onCurrentBookClick={(bookData) => {
                setCurrentBookData(bookData);
                setCurrentBookDetailsOpen(true);
              }}
              onShowBooksHistory={handleShowBooksHistory}
              setShowBooksHistory={setShowBooksHistory}
              showBooksHistory={showBooksHistory}
              onShowCalendar={() => {
                setShowCalendar(true);
                setShowBooksHistory(false);
                setShowSuggestions(false);
                setCurrentRoom(null);
              }}
              showCalendar={showCalendar}
              onShowSuggestions={() => {
                setShowSuggestions(true);
                setShowBooksHistory(false);
                setShowCalendar(false);
                setCurrentRoom(null);
              }}
              showSuggestions={showSuggestions}
            />
          )}
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
                {showBooksHistory ? (
                  <>
                    <h2 className="text-white font-semibold">BookClub Books History</h2>
                  </>
                ) : showCalendar ? (
                  <>
                    <FiCalendar className="text-gray-400" />
                    <h2 className="text-white font-semibold">BookClub Calendar</h2>
                  </>
                ) : showSuggestions ? (
                  <>
                    <h2 className="text-white font-semibold">Book Suggestions & Voting</h2>
                  </>
                ) : (
                  <>
                    <FiHash className="text-gray-400" />
                    <h2 className="text-white font-semibold">{currentRoom?.name}</h2>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {auth?.user && !showBooksHistory && !showCalendar && !showSuggestions && (
                  <button className="text-gray-400 hover:text-white">
                    <FiSettings />
                  </button>
                )}
              </div>
            </div>

            {/* Content Area - Calendar, Books History, Suggestions, or Messages */}
            {showCalendar ? (
              <div className="flex-1 overflow-hidden">
                <CalendarView
                  bookClubId={bookClubId}
                  auth={auth}
                  onAddEvent={handleAddEvent}
                  onEditEvent={handleEditEvent}
                  onDeleteEvent={handleDeleteEvent}
                  onEventSaved={handleCalendarRefreshCallback}
                />
              </div>
            ) : showSuggestions ? (
              <div className="flex-1 overflow-hidden">
                <BookSuggestionsView
                  bookClubId={bookClubId}
                  auth={auth}
                />
              </div>
            ) : showBooksHistory ? (
              <div className="flex-1 overflow-y-auto p-6">
                {loadingBooks ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p>Loading books...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 cursor-pointer"
                        onClick={() => setShowAddBookModal(true)}
                      >
                        <FiPlus size={20} />
                        Add New Book to Bookclub
                    </div>
                    {/* Current Book */}
                    {bookclubBooks.current.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                          <span className="text-2xl">📖</span> Currently Reading
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {bookclubBooks.current.map(bookClubBook => (
                            <div
                              key={bookClubBook.id}
                              className="bg-gray-800 rounded-lg p-4 border border-purple-500 hover:bg-gray-700 transition-colors"
                            >
                              <div 
                                onClick={() => {
                                  setCurrentBookData(bookClubBook);
                                  setCurrentBookDetailsOpen(true);
                                }}
                                className="flex gap-3 cursor-pointer mb-3"
                              >
                                <img
                                  src={bookClubBook.book?.coverUrl || '/images/default.webp'}
                                  alt={bookClubBook.book?.title}
                                  className="w-20 h-28 object-cover rounded shadow-md"
                                  onError={(e) => { e.target.src = '/images/default.webp'; }}
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                                    {bookClubBook.book?.title}
                                  </h4>
                                  <p className="text-gray-400 text-xs mb-2">
                                    {bookClubBook.book?.author}
                                  </p>
                                  {bookClubBook.startDate && bookClubBook.endDate && (
                                    <p className="text-xs text-purple-400">
                                      {new Date(bookClubBook.startDate).toLocaleDateString()} - {new Date(bookClubBook.endDate).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <select
                                value={bookClubBook.status}
                                onChange={(e) => handleStatusChange(bookClubBook.bookId, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="current">📖 Currently Reading</option>
                                <option value="upcoming">📚 Coming Up Next</option>
                                <option value="completed">✅ Completed</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upcoming Books */}
                    {bookclubBooks.upcoming.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                          <span className="text-2xl">📚</span> Coming Up Next
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {bookclubBooks.upcoming.map(bookClubBook => (
                            <div
                              key={bookClubBook.id}
                              className="bg-gray-800 rounded-lg p-4 border border-blue-500 hover:bg-gray-700 transition-colors"
                            >
                              <div 
                                onClick={() => {
                                  setCurrentBookData(bookClubBook);
                                  setCurrentBookDetailsOpen(true);
                                }}
                                className="flex gap-3 cursor-pointer mb-3"
                              >
                                <img
                                  src={bookClubBook.book?.coverUrl || '/images/default.webp'}
                                  alt={bookClubBook.book?.title}
                                  className="w-20 h-28 object-cover rounded shadow-md"
                                  onError={(e) => { e.target.src = '/images/default.webp'; }}
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                                    {bookClubBook.book?.title}
                                  </h4>
                                  <p className="text-gray-400 text-xs mb-2">
                                    {bookClubBook.book?.author}
                                  </p>
                                  {bookClubBook.startDate && (
                                    <p className="text-xs text-blue-400">
                                      Starts: {new Date(bookClubBook.startDate).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <select
                                value={bookClubBook.status}
                                onChange={(e) => handleStatusChange(bookClubBook.bookId, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="current">📖 Currently Reading</option>
                                <option value="upcoming">📚 Coming Up Next</option>
                                <option value="completed">✅ Completed</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Completed Books */}
                    {bookclubBooks.completed.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                          <span className="text-2xl">✅</span> Completed
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {bookclubBooks.completed.map(bookClubBook => (
                            <div
                              key={bookClubBook.id}
                              className="bg-gray-800 rounded-lg p-4 border border-green-500 hover:bg-gray-700 transition-colors"
                            >
                              <div 
                                onClick={() => {
                                  setCurrentBookData(bookClubBook);
                                  setCurrentBookDetailsOpen(true);
                                }}
                                className="flex gap-3 cursor-pointer mb-3"
                              >
                                <img
                                  src={bookClubBook.book?.coverUrl || '/images/default.webp'}
                                  alt={bookClubBook.book?.title}
                                  className="w-20 h-28 object-cover rounded shadow-md"
                                  onError={(e) => { e.target.src = '/images/default.webp'; }}
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                                    {bookClubBook.book?.title}
                                  </h4>
                                  <p className="text-gray-400 text-xs mb-2">
                                    {bookClubBook.book?.author}
                                  </p>
                                  {bookClubBook.endDate && (
                                    <p className="text-xs text-green-400">
                                      Finished: {new Date(bookClubBook.endDate).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <select
                                value={bookClubBook.status}
                                onChange={(e) => handleStatusChange(bookClubBook.bookId, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                              >
                                <option value="current">📖 Currently Reading</option>
                                <option value="upcoming">📚 Coming Up Next</option>
                                <option value="completed">✅ Completed</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {bookclubBooks.current.length === 0 && bookclubBooks.upcoming.length === 0 && bookclubBooks.completed.length === 0 && (
                      <div className="text-center text-gray-500 mt-8">
                        <FiStar className="mx-auto text-4xl mb-2 opacity-30" />
                        <p className="text-sm">No books added yet</p>
                        <p className="text-xs mt-1">Add a current book to get started!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
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
                      <>
                        {/* Debug: Log message data */}
                        {console.log('Message:', msg.id, 'Text:', msg.text, 'Attachments:', msg.attachments)}
                        {msg.userId === auth?.user?.id ? (
                          <div className="flex gap-3 justify-end">
                            <div className="text-right max-w-md self-end">
                              {msg.text && (
                                <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl px-4 py-3 shadow-lg mb-2">
                                  <p className="text-white break-words font-medium">{msg.text}</p>
                                </div>
                              )}
                              {msg.attachments && msg.attachments.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                  {msg.attachments.map((attachment) => (
                                    <MessageAttachment
                                      key={attachment.id}
                                      attachment={attachment}
                                      canDelete={true}
                                      onDelete={async () => {
                                        try {
                                          await fetch(`http://localhost:4000/chat-files/${attachment.id}`, {
                                            method: 'DELETE',
                                            headers: { 'Authorization': `Bearer ${auth.token}` }
                                          });
                                        } catch (err) {
                                          console.error('Error deleting file:', err);
                                        }
                                      }}
                                      auth={auth}
                                    />
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {msg.username?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-bold text-white">{msg.username}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              {msg.text && <p className="text-gray-200 break-words leading-relaxed mb-2">{msg.text}</p>}
                              {msg.attachments && msg.attachments.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                  {msg.attachments.map((attachment) => (
                                    <MessageAttachment
                                      key={attachment.id}
                                      attachment={attachment}
                                      canDelete={false}
                                      auth={auth}
                                    />
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
              </div>
            )}

            {/* Message Input - Only show when not viewing special views */}
            {!showBooksHistory && !showCalendar && !showSuggestions && auth?.user ? (
              <form onSubmit={handleSendMessage} className="bg-gray-800 border-t border-gray-700 relative">
                {/* File Upload Preview */}
                <FileUpload 
                  ref={fileUploadRef}
                  onFilesSelected={handleFilesSelected} 
                  auth={auth}
                  disabled={!currentRoom}
                />
                
                <div className="flex gap-2 p-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message #${currentRoom?.name}`}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && selectedFiles.length === 0) || uploadingFiles}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                  >
                    {uploadingFiles ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            ) : !showBooksHistory && !showCalendar && !showSuggestions ? (
              <div className="bg-gray-800 border-t border-gray-700 p-4 text-center">
                <p className="text-gray-400">
                  Please <button onClick={() => navigate('/login', { state: { from: `/bookclub/${bookClubId}` } })} className="text-purple-400 hover:underline">log in</button> to chat
                </p>
              </div>
            ) : null}

          </div>
          )}
          {/* Connected Users - only show in bookclub mode */}
          {viewMode === 'bookclub' && (
          <div className="w-44 bg-gray-800 border-l border-gray-700 p-2">
            <div className="flex items-center gap-2 px-2 py-1 mb-2">
              <FiUsers className="text-gray-400" size={14} />
              <h3 className="text-gray-400 text-xs font-semibold uppercase">
                Online ({connectedUsers.length})
              </h3>
            </div>
            <div className="max-h-screen overflow-y-auto w-full space-y-2">
              {bookClubMembers.map(user => {
                const isOnline = connectedUsers.some(connectedUser => connectedUser.userId === user.id);
                const isCurrentUser = user.id === auth?.user?.id;
                const isFriend = friends.some(friend => friend.id === user.id);
                return (
                  <div key={user.id} className="relative">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrentUser) {
                          navigate(`/profile/${user.id}`);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const menuWidth = 180; // min-w-[180px]
                          const spaceOnRight = window.innerWidth - rect.right;
                          
                          // Position to the left if not enough space on right
                          const left = spaceOnRight >= menuWidth + 8 
                            ? rect.right + 8 
                            : rect.left - menuWidth - 8;
                          
                          const newPosition = {
                            top: rect.top,
                            left: left
                          };
                          console.log('Setting menu position:', newPosition, 'Screen width:', window.innerWidth);
                          setMenuPosition(newPosition);
                          setSelectedUserId(selectedUserId === user.id ? null : user.id);
                        }
                      }}
                      className="px-2 py-1 text-sm text-gray-300 flex items-center gap-2 hover:bg-gray-700 rounded cursor-pointer"
                    >
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
                      {isFriend && (
                        <FiUsers className="text-white ml-auto" size={18} title="Friend" />
                      )}
                    </div>
                    
                    {/* User Actions Menu */}
                    {selectedUserId === user.id && !isCurrentUser && (
                      <div 
                        className="fixed bg-gray-700 border-black rounded-lg shadow-xl z-[9999] min-w-[100px]"
                        style={{
                          top: `${menuPosition.top + 45}px`
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {console.log('Rendering menu at:', menuPosition, 'for user:', user.id)}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/profile/${user.id}`);
                            setSelectedUserId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-600 rounded-t-lg transition-colors"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartDM(user.id);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-600 transition-colors border-t border-gray-600"
                        >
                          Send a DM
                        </button>
                        
                        {!isFriend && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendFriendRequest(user.id);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-600 rounded-b-lg transition-colors border-t border-gray-600"
                          >
                            Add to Friends
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          )}
        </div>

        {/* Add Current Book Modal */}
        {addCurrentBookState && (
          <AddCurrentBookModal
            bookClubId={bookClubId}
            onClose={() => setAddCurrentBookState(false)}
            onBookAdded={(book) => {
              console.log('Book added:', book);
              setAddCurrentBookState(false);
              // Trigger refresh in SideBarRooms by updating a timestamp or similar
            }}
          />
        )}

        {/* Current Book Details Modal */}
        {currentBookDetailsOpen && currentBookData && (
          <CurrentBookDetailsModal
            bookClubId={bookClubId}
            currentBookData={currentBookData}
            onClose={() => setCurrentBookDetailsOpen(false)}
            onBookUpdated={(updatedBook) => {
              setCurrentBookData(updatedBook);
              // Trigger refresh in SideBarRooms
            }}
            onBookRemoved={() => {
              setCurrentBookData(null);
              setCurrentBookDetailsOpen(false);
              // Trigger refresh in SideBarRooms
            }}
          />
        )}


        {/* Add Book to Bookclub Modal */}
        {showAddBookModal && (
          <AddBookToBookclubModal
            bookClubId={bookClubId}
            onClose={() => setShowAddBookModal(false)}
            onBookAdded={(book) => {
              console.log('Book added:', book);
              setShowAddBookModal(false);
              // Refresh the books list
              fetchBookclubBooks();
            }}
          />
        )}

        {/* Add/Edit Event Modal */}
        {showAddEventModal && (
          <AddEventModal
            isOpen={showAddEventModal}
            onClose={() => {
              setShowAddEventModal(false);
              setEventToEdit(null);
              setSelectedEventDate(null);
            }}
            bookClubId={bookClubId}
            auth={auth}
            eventToEdit={eventToEdit}
            selectedDate={selectedEventDate}
            onEventSaved={handleEventSaved}
          />
        )}
    </div>
  );
};

export default BookClub;
