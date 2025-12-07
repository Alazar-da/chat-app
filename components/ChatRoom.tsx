'use client';

import { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import Sidebar from '@/components/SideBar';
import ChatWindow from '@/components/ChatWindow';
import {
  createChatRoom,
  getUserChatRooms,
  joinChatRoom,
  leaveChatRoom,
  deleteChatRoom,
  updateChatRoom,
  subscribeToRooms,
  ChatRoom as IChatRoom
} from '@/lib/chatRoom';
import {
  HiOutlinePlusCircle,
  HiOutlineChatAlt2,
  HiOutlineSearch,
  HiOutlineArrowLeft,
  HiOutlineX,
  HiOutlineExclamationCircle,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUsers,
  HiOutlineGlobe,
  HiOutlineLockClosed,
  HiOutlineCheck,
  HiOutlineChevronDown,
  HiOutlineCalendar,
  HiOutlineArrowRight,
  HiOutlineExclamation
} from 'react-icons/hi';
import { FaDoorOpen, FaCrown, FaEdit, FaTimes } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';

interface ChatRoomProps {
  user: User;
}

interface RoomActionMenuProps {
  room: IChatRoom;
  userId: string;
  onEdit: () => void;
  onDelete: () => void;
  onLeave: () => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

const RoomActionMenu = ({ 
  room, 
  userId, 
  onEdit, 
  onDelete, 
  onLeave,
  isMenuOpen,
  setIsMenuOpen 
}: RoomActionMenuProps) => {
  const isOwner = room.createdById === userId;
  const isMember = room.members.includes(userId);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsMenuOpen(!isMenuOpen);
        }}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <BsThreeDotsVertical className="text-gray-500" />
      </button>
      
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-1 animate-fadeIn">
            {isOwner ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                >
                  <HiOutlinePencil className="text-sm" />
                  Edit Room
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <HiOutlineTrash className="text-sm" />
                  Delete Room
                </button>
              </>
            ) : isMember ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLeave();
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <FaDoorOpen className="text-sm" />
                Leave Room
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(); // This will trigger join
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-green-600 hover:bg-green-50 flex items-center gap-2 transition-colors"
              >
                <HiOutlineArrowRight className="text-sm" />
                Join Room
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  roomName 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  roomName: string; 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl max-w-md w-full shadow-2xl transform transition-all border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-100 to-red-50 flex items-center justify-center">
              <HiOutlineExclamation className="text-2xl text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Delete Room</h3>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
            </div>
          </div>
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
            <p className="text-sm text-red-800">
              Are you sure you want to delete <span className="font-semibold">"{roomName}"</span>?
            </p>
            <ul className="mt-2 text-xs text-red-700 space-y-1">
              <li className="flex items-center gap-1">
                <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                All messages will be permanently deleted
              </li>
              <li className="flex items-center gap-1">
                <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                All members will be removed from the room
              </li>
              <li className="flex items-center gap-1">
                <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                This action is irreversible
              </li>
            </ul>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="px-6 py-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200 active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-red-200 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <HiOutlineTrash className="text-lg" />
            Delete Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ChatRoom({ user }: ChatRoomProps) {
  const [rooms, setRooms] = useState<IChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<IChatRoom | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRoom, setEditingRoom] = useState<IChatRoom | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ 
    name: '', 
    description: ''
  });
  const [menuOpenRoomId, setMenuOpenRoomId] = useState<string | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<IChatRoom | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Room subscription for real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToRooms(setRooms);
    return unsubscribe;
  }, []);

  // Get joined rooms
  const joinedRooms = useMemo(() => {
    return rooms.filter(room => room.members.includes(user.uid));
  }, [rooms, user.uid]);

  // Get search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return rooms.filter(room => {
      // If room is private and user is not a member, don't show it
      if (!room.isPublic && !room.members.includes(user.uid)) {
        return false;
      }
      
      return (
        room.name.toLowerCase().includes(query) ||
        (room.description && room.description.toLowerCase().includes(query)) ||
        room.createdBy.toLowerCase().includes(query)
      );
    });
  }, [rooms, user.uid, searchQuery]);

  // Handle create room
  const handleCreateRoom = async () => {
    if (!newRoomData.name.trim()) {
      return setError('Room name is required');
    }

    setLoading(true);
    try {
      await createChatRoom(
        newRoomData.name,
        newRoomData.description,
        user.displayName || user.email?.split('@')[0] || 'User',
        user.uid,
        true // Default to public
      );
      setNewRoomData({ name: '', description: '' });
      setIsCreatingRoom(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit room
  const handleEditRoom = async () => {
    if (!editingRoom || !editForm.name.trim()) {
      setEditingRoom(null);
      return;
    }

    setLoading(true);
    try {
      await updateChatRoom(
        editingRoom.id,
        editForm.name,
        editForm.description,
        editingRoom.isPublic
      );
      setEditingRoom(null);
      setEditForm({ name: '', description: '' });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update room');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete room
  const handleDeleteRoom = async (room: IChatRoom) => {
    setRoomToDelete(room);
    setShowDeleteModal(true);
    setMenuOpenRoomId(null);
  };

  // Confirm delete
  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;

    setLoading(true);
    try {
      await deleteChatRoom(roomToDelete.id);
      if (selectedRoom?.id === roomToDelete.id) {
        setSelectedRoom(null);
      }
      setError(null);
      setShowDeleteModal(false);
      setRoomToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete room');
    } finally {
      setLoading(false);
    }
  };

  // Handle join room
  const handleJoinRoom = async (room: IChatRoom) => {
    if (room.members.includes(user.uid)) {
      setSelectedRoom(room);
      return;
    }

    if (!room.isPublic) {
      return setError('This is a private room. You need an invitation to join.');
    }

    setLoading(true);
    try {
      await joinChatRoom(room.id, user.uid, {
        username: user.displayName || user.email?.split('@')[0] || 'User',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        photoURL: user.photoURL || ''
      });
      setSelectedRoom(room);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  // Handle leave room
  const handleLeaveRoom = async (room: IChatRoom) => {
    setLoading(true);
    try {
      await leaveChatRoom(room.id, user.uid, {
        username: user.displayName || user.email?.split('@')[0] || 'User',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        photoURL: user.photoURL || ''
      });
      if (selectedRoom?.id === room.id) {
        setSelectedRoom(null);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full flex min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30 text-gray-800">
      <Sidebar chat={selectedRoom ? true : false} />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setRoomToDelete(null);
        }}
        onConfirm={confirmDeleteRoom}
        roomName={roomToDelete?.name || ''}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row transition-all duration-300">
        {/* Rooms List */}
        <div
          className={`${
            selectedRoom ? 'hidden' : 'flex'
          } flex-col w-full lg:w-96 border-r border-gray-200 bg-white/90 backdrop-blur-lg shadow-xl`}
        >
          {/* Header */}
          <div className="px-4 border-b flex flex-col gap-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white pt-10 lg:pt-4 pb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <HiOutlineChatAlt2 className="text-2xl" />
                <span>Chat Rooms</span>
              </h2>
              {error && (
                <button
                  onClick={() => setError(null)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <HiOutlineX />
                </button>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search rooms to join..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-b border-red-200 text-red-600 px-4 py-3 flex items-center text-sm">
              <HiOutlineExclamationCircle className="mr-2 flex-shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="ml-2">
                <HiOutlineX />
              </button>
            </div>
          )}

          {/* Create Room Button */}
          <div className="p-4 border-b">
            {!isCreatingRoom ? (
              <button
                onClick={() => setIsCreatingRoom(true)}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-medium"
              >
                <HiOutlinePlusCircle className="text-xl" />
                <span>Create New Room</span>
              </button>
            ) : (
              <div className="space-y-4 p-4 bg-gradient-to-br from-white to-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Room name *"
                    value={newRoomData.name}
                    onChange={(e) => setNewRoomData({...newRoomData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newRoomData.description}
                    onChange={(e) => setNewRoomData({...newRoomData, description: e.target.value})}
                    rows={2}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateRoom}
                    disabled={loading || !newRoomData.name.trim()}
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
                  >
                    {loading ? 'Creating...' : 'Create Room'}
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingRoom(false);
                      setNewRoomData({ name: '', description: '' });
                    }}
                    className="px-4 py-2.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Rooms List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading && !isCreatingRoom ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading rooms...</p>
              </div>
            ) : searchQuery.trim() ? (
              // Search Results
              <>
                <div className="text-xs text-gray-500 font-medium px-2 mb-3">
                  SEARCH RESULTS ({searchResults.length})
                </div>
                {searchResults.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <HiOutlineSearch className="text-xl text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">
                      No rooms found matching "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  searchResults.map((room) => {
                    const isMember = room.members.includes(user.uid);
                    return (
                      <div
                        key={room.id}
                        className={`group relative p-4 rounded-xl border transition-all cursor-pointer hover:shadow-lg active:scale-[0.99] ${
                          selectedRoom?.id === room.id
                            ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-indigo-25 shadow-md'
                            : isMember
                            ? 'border-green-200 bg-gradient-to-br from-green-50/50 to-white'
                            : 'border-gray-200 bg-white hover:border-indigo-300'
                        } mb-3`}
                        onClick={() => handleJoinRoom(room)}
                      >
                        <div className="flex gap-3">
                          {/* Room Avatar */}
                          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                            room.createdById === user.uid
                              ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                              : isMember
                              ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                              : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                          }`}>
                            {room.name.charAt(0).toUpperCase()}
                          </div>
                          
                          {/* Room Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {room.name}
                                {isMember && (
                                  <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                    Joined
                                  </span>
                                )}
                              </h3>
                              <RoomActionMenu
                                room={room}
                                userId={user.uid}
                                onEdit={() => {
                                  if (isMember) {
                                    setEditingRoom(room);
                                    setEditForm({
                                      name: room.name,
                                      description: room.description || ''
                                    });
                                  } else {
                                    handleJoinRoom(room);
                                  }
                                }}
                                onDelete={() => handleDeleteRoom(room)}
                                onLeave={() => handleLeaveRoom(room)}
                                isMenuOpen={menuOpenRoomId === room.id}
                                setIsMenuOpen={(open) => setMenuOpenRoomId(open ? room.id : null)}
                              />
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {room.description || 'No description'}
                            </p>
                            
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <HiOutlineUsers className="text-sm" />
                                {room.memberCount}
                              </span>
                              <span className="flex items-center gap-1">
                                  <>
                                    <HiOutlineGlobe className="text-sm" />
                                    Public
                                  </>
                              </span>
                              {!isMember && room.isPublic && (
                                <span className="text-indigo-600 font-medium flex items-center gap-1">
                                  <HiOutlineArrowRight className="text-xs" />
                                  Join
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            ) : (
              // Joined Rooms (when no search)
              <>
                <div className="text-xs text-gray-500 font-medium px-2 mb-3">
                  YOUR ROOMS ({joinedRooms.length})
                </div>
                {joinedRooms.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HiOutlineUsers className="text-2xl text-indigo-500" />
                    </div>
                    <h3 className="text-gray-700 font-medium mb-2">No rooms yet</h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">
                      You haven't joined any rooms yet. Create one or search for rooms to join!
                    </p>
                  </div>
                ) : (
                  joinedRooms.map((room) => (
                    <div
                      key={room.id}
                      className={`group relative p-4 rounded-xl border transition-all cursor-pointer hover:shadow-lg active:scale-[0.99] ${
                        selectedRoom?.id === room.id
                          ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-indigo-25 shadow-md'
                          : 'border-gray-200 bg-white hover:border-indigo-300'
                      } mb-3`}
                      onClick={() => handleJoinRoom(room)}
                    >
                      <div className="flex gap-3">
                        {/* Room Avatar */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                          room.createdById === user.uid
                            ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                            : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                        }`}>
                          {room.name.charAt(0).toUpperCase()}
                        </div>
                        
                        {/* Room Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {room.name}
                            </h3>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {room.description || 'No description'}
                          </p>
                          
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <HiOutlineUsers className="text-sm" />
                              {room.memberCount}
                            </span>
                            <span className="flex items-center gap-1">
                                <>
                                  <HiOutlineGlobe className="text-sm" />
                                  Public
                                </>
                            </span>
                            {room.createdById === user.uid && (
                              <span className="text-amber-600 font-medium">
                                <FaCrown className="inline mr-1 text-xs" />
                                Owner
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>

        {/* Chat Window */}
        {selectedRoom && (
          <div className="flex-1 w-full flex flex-col h-screen overflow-hidden bg-white relative animate-fadeIn">
            {/* Header */}
            <div className="fixed top-0 lg:left-64 left-0 right-0 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white z-50 pt-10 lg:pt-4 pb-6">
              <div className="max-w-5xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    onClick={() => setSelectedRoom(null)}
                  >
                    <HiOutlineArrowLeft className="text-xl" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                      selectedRoom.createdById === user.uid
                        ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                        : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                    }`}>
                      {selectedRoom.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{selectedRoom.name}</h3>
                        {selectedRoom.createdById === user.uid && (
                          <FaCrown className="text-amber-300" />
                        )}
                      </div>
                      <p className="text-sm opacity-90 flex items-center gap-1">
                        <HiOutlineUsers className="text-xs" />
                        {selectedRoom.memberCount} members
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Room Action Menu - Only show if user is owner or member */}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpenRoomId(menuOpenRoomId === selectedRoom.id ? null : selectedRoom.id)}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      <BsThreeDotsVertical className="text-xl" />
                    </button>
                    
                    {menuOpenRoomId === selectedRoom.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-40"
                          onClick={() => setMenuOpenRoomId(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-1 animate-fadeIn">
                          {selectedRoom.createdById === user.uid ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingRoom(selectedRoom);
                                  setEditForm({
                                    name: selectedRoom.name,
                                    description: selectedRoom.description || ''
                                  });
                                  setMenuOpenRoomId(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                              >
                                <HiOutlinePencil className="text-sm" />
                                Edit Room
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRoom(selectedRoom);
                                  setMenuOpenRoomId(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                              >
                                <HiOutlineTrash className="text-sm" />
                                Delete Room
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLeaveRoom(selectedRoom);
                                setMenuOpenRoomId(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            >
                              <FaDoorOpen className="text-sm" />
                              Leave Room
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Room Modal */}
            {editingRoom && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Edit Room</h3>
                      <button
                        onClick={() => {
                          setEditingRoom(null);
                          setEditForm({ name: '', description: '' });
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <HiOutlineX className="text-lg" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Room Name
                        </label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          placeholder="Enter room name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          rows={3}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                          placeholder="Enter room description"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex gap-2">
                    <button
                      onClick={handleEditRoom}
                      disabled={loading || !editForm.name.trim()}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg disabled:opacity-50 transition-all"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingRoom(null);
                        setEditForm({ name: '', description: '' });
                      }}
                      className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Window */}
            <div className="flex-1 pt-20">
              <ChatWindow
                chatId={selectedRoom.id}
                currentUser={user}
                selectedUser={null}
                isGroupChat={true}
                roomInfo={selectedRoom}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}