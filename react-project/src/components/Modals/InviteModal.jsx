import React, { useState, useEffect, useContext } from 'react';
import { FiX, FiCopy, FiTrash2, FiCheck, FiLink, FiUsers, FiSearch } from 'react-icons/fi';
import AuthContext from '../../context';

const InviteModal = ({ bookClubId, bookClubName, onClose }) => {
  const { auth } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('link'); // 'link' or 'friends'
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const [creatingInvite, setCreatingInvite] = useState(false);
  
  // Friend search
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [sendingInvites, setSendingInvites] = useState(new Set());

  const GATEWAY_URL = 'http://localhost:3000';

  useEffect(() => {
    if (activeTab === 'link') {
      fetchInvites();
    } else {
      fetchFriends();
    }
  }, [activeTab]);

  const fetchInvites = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${GATEWAY_URL}/v1/editor/bookclubs/${bookClubId}/invites`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      const data = await response.json();
      if (data.success) {
        setInvites(data.invites);
      }
    } catch (error) {
      console.error('Error fetching invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${GATEWAY_URL}/v1/friends`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      const data = await response.json();
      if (data.success) {
        setFriends(data.friends);
        setSearchResults(data.friends);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    try {
      setCreatingInvite(true);
      const response = await fetch(`${GATEWAY_URL}/v1/editor/bookclubs/${bookClubId}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          expiresIn: null, // Never expires like Discord
          maxUses: null // Unlimited uses
        })
      });
      const data = await response.json();
      if (data.success) {
        fetchInvites();
      }
    } catch (error) {
      console.error('Error creating invite:', error);
    } finally {
      setCreatingInvite(false);
    }
  };

  const deleteInvite = async (inviteId) => {
    try {
      const response = await fetch(`${GATEWAY_URL}/v1/editor/bookclubs/${bookClubId}/invites/${inviteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      if (response.ok) {
        fetchInvites();
      }
    } catch (error) {
      console.error('Error deleting invite:', error);
    }
  };

  const copyInviteLink = (code) => {
    const link = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(link);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const sendDMInvite = async (userId, username) => {
    try {
      setSendingInvites(prev => new Set(prev).add(userId));
      
      // Create an invite link first
      const inviteResponse = await fetch(`${GATEWAY_URL}/v1/editor/bookclubs/${bookClubId}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          expiresIn: 24, // 24 hours for DM invites
          maxUses: 1 // Single use for direct invites
        })
      });
      
      const inviteData = await inviteResponse.json();
      if (!inviteData.success) {
        throw new Error('Failed to create invite');
      }

      const inviteLink = `${window.location.origin}/invite/${inviteData.invite.code}`;
      const message = `You've been invited to join "${bookClubName}"! Click here to join: ${inviteLink}`;

      // Send DM with invite
      const dmResponse = await fetch(`${GATEWAY_URL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          receiverId: userId,
          content: message
        })
      });

      if (dmResponse.ok) {
        alert(`Invite sent to ${username}!`);
      } else {
        alert('Failed to send invite');
      }
    } catch (error) {
      console.error('Error sending DM invite:', error);
      alert('Failed to send invite');
    } finally {
      setSendingInvites(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults(friends);
    } else {
      const filtered = friends.filter(friend =>
        friend.name.toLowerCase().includes(query.toLowerCase()) ||
        friend.email.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Invite to {bookClubName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-3 px-4 font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'link'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiLink size={20} />
            Invite Link
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-3 px-4 font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'friends'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiUsers size={20} />
            Invite Friends
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 200px)' }}>
          {activeTab === 'link' ? (
            <>
              {/* Create Invite Section */}
              <div className="mb-6">
                <button
                  onClick={createInvite}
                  disabled={creatingInvite}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 font-semibold flex items-center justify-center gap-2"
                >
                  {creatingInvite ? 'Creating...' : '+ Generate a New Invite Link'}
                </button>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Invite links never expire and can be used unlimited times
                </p>
              </div>

              {/* Active Invites */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Active Invites</h3>
                {loading ? (
                  <p className="text-center text-gray-500 py-8">Loading invites...</p>
                ) : invites.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No active invites. Create one to get started!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {invites.map(invite => (
                      <div
                        key={invite.id}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-mono text-sm text-purple-600 mb-1">
                              {window.location.origin}/invite/{invite.code}
                            </div>
                            <div className="text-xs text-gray-600">
                              Uses: {invite.currentUses} • Never expires
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => copyInviteLink(invite.code)}
                              className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                              title="Copy link"
                            >
                              {copied === invite.code ? (
                                <FiCheck size={20} />
                              ) : (
                                <FiCopy size={20} />
                              )}
                            </button>
                            <button
                              onClick={() => deleteInvite(invite.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete invite"
                            >
                              <FiTrash2 size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Friend Search */}
              <div className="mb-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search friends..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Friends List */}
              {loading ? (
                <p className="text-center text-gray-500 py-8">Loading friends...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {searchQuery ? 'No friends found' : 'No friends yet. Add some friends to invite them!'}
                </p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map(friend => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={friend.profileImage 
                            ? `http://localhost:3001${friend.profileImage}` 
                            : '/images/default.webp'}
                          alt={friend.name}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => { e.target.src = '/images/default.webp'; }}
                        />
                        <div>
                          <div className="font-medium text-gray-900">{friend.name}</div>
                          <div className="text-sm text-gray-600">{friend.email}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => sendDMInvite(friend.id, friend.name)}
                        disabled={sendingInvites.has(friend.id)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                      >
                        {sendingInvites.has(friend.id) ? 'Sending...' : 'Send Invite'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
