import React from 'react';
import { FiMessageCircle, FiArrowLeft } from 'react-icons/fi';

const DMSidebar = ({ conversations, currentConversation, onSelectConversation, onBackToBookclub, auth }) => {
  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <button 
          onClick={onBackToBookclub}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4"
        >
          <FiArrowLeft /> Back to Bookclub
        </button>
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <FiMessageCircle />
          Direct Messages
        </h2>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {conversations.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm">
              No conversations yet
            </div>
          ) : (
            conversations
              .filter(conv => conv.otherUser) // Filter out conversations without otherUser
              .map(conv => (
              <button
                key={conv.otherUser.id}
                onClick={() => onSelectConversation(conv.otherUser.id)}
                className={`w-full p-3 rounded mb-1 text-left transition-colors ${
                  currentConversation === conv.otherUser.id
                    ? 'bg-gray-700'
                    : 'hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={conv.otherUser.profileImage 
                      ? `http://localhost:3001${conv.otherUser.profileImage}` 
                      : '/images/default.webp'
                    }
                    alt={conv.otherUser.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium truncate">
                        {conv.otherUser.name}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="bg-purple-600 text-white text-xs rounded-full px-2 py-0.5">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className="text-gray-400 text-sm truncate">
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DMSidebar;
