import React from 'react';
import { FiHome } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const MyBookClubsSidebar = ({ bookClubs, currentBookClubId, onSelectBookClub }) => {
    const navigate = useNavigate();

    return (
        <div className="w-20 bg-gray-900 border-r border-gray-700 flex flex-col items-center py-4 gap-3 overflow-y-auto">
          {/* Home Button */}
          <button
            onClick={() => navigate('/')}
            className="w-12 h-12 rounded-full bg-gray-700 hover:bg-purple-600 flex items-center justify-center text-white transition-colors flex-shrink-0"
            title="Home"
          >
            <FiHome size={20} />
          </button>
          
          {/* Separator */}
          <div className="w-10 h-px bg-gray-700"></div>
          
          {/* My Bookclubs */}
          {bookClubs.map((club) => (
            <button
              key={club.id}
              onClick={() => onSelectBookClub(club.id)}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all flex-shrink-0 ${
                club.id === currentBookClubId
                  ? 'bg-purple-600 ring-2 ring-purple-400'
                  : 'bg-gray-700 hover:bg-purple-600 hover:rounded-2xl'
              }`}
              title={club.name}
            >
              {club.imageUrl ? (
                <img
                  src={`http://localhost:4000${club.imageUrl}`}
                  alt={club.name}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => { 
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <span className={club.imageUrl ? 'hidden' : ''}>
                {club.name.substring(0, 2).toUpperCase()}
              </span>
            </button>
          ))}
          
          {/* Add Bookclub Button */}
          <button
            onClick={() => navigate('/create-bookclub')}
            className="w-12 h-12 rounded-full bg-gray-700 hover:bg-green-600 flex items-center justify-center text-white text-2xl transition-colors flex-shrink-0"
            title="Create Bookclub"
          >
            +
          </button>
        </div>
    );
};



export default MyBookClubsSidebar;