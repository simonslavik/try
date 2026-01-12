

import React, { useState, useRef, useEffect } from 'react';
import { FiHome, FiPlus, FiHash, FiMail } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import BookClubImage from './BookClubImage';


const SideBarRooms = ({
    bookClub,
    rooms,
    currentRoom,
    switchRoom,
    handleCreateRoom,
    auth,
    uploadingImage,
    fileInputRef,
    handleImageUpload,
    handleDeleteImage,
    onNameUpdate,
    onOpenDM
}) => {
    const navigate = useNavigate();
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState(bookClub?.name || '');
    const nameInputRef = useRef(null);

    useEffect(() => {
        setNewName(bookClub?.name || '');
    }, [bookClub]);

    const handleNameDoubleClick = () => {
        if (auth?.user && auth.user.id === bookClub?.creatorId) {
            setEditingName(true);
            setTimeout(() => {
                if (nameInputRef.current) {
                    nameInputRef.current.focus();
                }
            }, 0);
        }
    };

    const handleNameChange = (e) => {
        setNewName(e.target.value);
    };

    const handleNameBlur = async () => {
        await saveNameChange();
    };

    const handleNameKeyDown = async (e) => {
        if (e.key === 'Enter') {
            await saveNameChange();
        } else if (e.key === 'Escape') {
            setEditingName(false);
            setNewName(bookClub?.name || '');
        }
    };

    const saveNameChange = async () => {
        if (!newName.trim() || newName === bookClub?.name) {
            setEditingName(false);
            setNewName(bookClub?.name || '');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/v1/editor/bookclubs/${bookClub.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.token}`
                },
                body: JSON.stringify({ name: newName.trim() })
            });

            const data = await response.json();
            
            if (response.ok && onNameUpdate) {
                onNameUpdate(data.bookClub.name);
                setEditingName(false);
            } else {
                alert(data.error || 'Failed to update book club name');
                setEditingName(false);
                setNewName(bookClub?.name || '');
            }
        } catch (err) {
            console.error('Error updating book club name:', err);
            alert('Failed to update book club name');
            setEditingName(false);
            setNewName(bookClub?.name || '');
        }
    };

    return (
          <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
            {/* Bookclub Header with Image */}
            <div className="p-4 border-b border-gray-700">
              {/* Bookclub Image */}
              <BookClubImage 
                bookClub={bookClub} 
                auth={auth} 
                uploadingImage={uploadingImage} 
                fileInputRef={fileInputRef} 
                handleImageUpload={handleImageUpload} 
                handleDeleteImage={handleDeleteImage}
              />
              
              {editingName ? (
                <input
                  ref={nameInputRef}
                  type="text"
                  value={newName}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  onKeyDown={handleNameKeyDown}
                  className="text-white font-bold text-lg bg-gray-700 px-2 py-1 rounded border border-purple-500 focus:outline-none w-full"
                />
              ) : (
                <h2 
                  className={`text-white font-bold text-lg truncate ${
                    auth?.user && auth.user.id === bookClub?.creatorId 
                      ? 'cursor-pointer hover:text-purple-400' 
                      : ''
                  }`}
                  onDoubleClick={handleNameDoubleClick}
                  title={auth?.user && auth.user.id === bookClub?.creatorId ? 'Double-click to edit' : ''}
                >
                  {bookClub?.name}
                </h2>
              )}
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
          </div>
    );
};

export default SideBarRooms;