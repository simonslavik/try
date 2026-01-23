import React, { useState, useRef, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const DMChat = ({ otherUser, messages, onSendMessage, auth }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    onSendMessage(newMessage.trim());
    setNewMessage('');
  };

  if (!otherUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center text-gray-500">
          <p className="text-lg">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {/* DM Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center gap-3">
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
        <div className="flex-1">
          <h2 
            className="text-white font-semibold cursor-pointer hover:underline"
            onClick={() => navigate(`/profile/${otherUser.id}`)}
          >
            {otherUser.name}
          </h2>
          <p className="text-gray-400 text-sm">{otherUser.email}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={msg.id || idx} 
              className={`flex ${msg.senderId === auth?.user?.id ? 'justify-end' : 'justify-start'}`}
            >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl break-words ${
                    msg.senderId === auth?.user?.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-200'
                }`}>
                    <p>{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${otherUser.name}`}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <FiSend /> Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default DMChat;
