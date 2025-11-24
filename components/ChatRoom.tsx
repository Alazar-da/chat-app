'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import Sidebar from '@/components/SideBar';
import ChatWindow from '@/components/ChatWindow';
import {
  createChatRoom,
  getPublicChatRooms,
  getUserChatRooms,
  joinChatRoom,
  leaveChatRoom,
  subscribeToRooms,
  ChatRoom as IChatRoom
} from '@/lib/chatRoom';
import {
  HiOutlinePlusCircle,
  HiOutlineChatAlt2,
  HiUsers,
  HiOutlineArrowLeft,
  HiOutlineX,
  HiOutlineExclamationCircle
} from 'react-icons/hi';
import { FaDoorOpen, FaUserFriends } from 'react-icons/fa';

interface ChatRoomProps {
  user: User;
}

export default function ChatRoom({ user }: ChatRoomProps) {
  const [rooms, setRooms] = useState<IChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<IChatRoom | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [activeTab, setActiveTab] = useState<'public' | 'my-rooms'>('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Room subscription
  useEffect(() => {
    const unsubscribe = subscribeToRooms(setRooms);
    return unsubscribe;
  }, []);

  // Load initial rooms
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data =
          activeTab === 'public'
            ? await getPublicChatRooms()
            : await getUserChatRooms(user.uid);
        setRooms(data);
      } catch {
        setError('Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeTab, user.uid]);

  const filteredRooms = rooms.filter(r =>
    activeTab === 'public' ? r.isPublic : r.members.includes(user.uid)
  );

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return setError('Room name required');
    setLoading(true);
    try {
      await createChatRoom(
        newRoomName,
        newRoomDescription,
        user.displayName || user.email?.split('@')[0] || 'User',
        user.uid,
        true
      );
      setNewRoomName('');
      setNewRoomDescription('');
      setIsCreatingRoom(false);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (e: any) {
      setError(e.message || 'Error creating room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (room: IChatRoom) => {
    if (room.members.includes(user.uid)) return setSelectedRoom(room);
    setLoading(true);
    try {
      await joinChatRoom(room.id, user.uid, {
        username: user.displayName || user.email?.split('@')[0] || 'User',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        photoURL: user.photoURL || ''
      });
      setSelectedRoom(room);
    } 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (e: any) {
      setError(e.message || 'Error joining room');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!selectedRoom) return;
    setLoading(true);
    try {
      await leaveChatRoom(selectedRoom.id, user.uid, {
        username: user.displayName || user.email?.split('@')[0] || 'User',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        photoURL: user.photoURL || ''
      });
      setSelectedRoom(null);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (e: any) {
      setError(e.message || 'Error leaving room');
    } finally {
      setLoading(false);
    }
  };

  // --- UI ---
  return (
    <div className="relative w-full flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 text-slate-800">
      <Sidebar chat={selectedRoom?true:false}/>

      {/* Mobile View Toggle */}
      <div className="flex-1 flex flex-col lg:flex-row transition-all duration-300">
        {/* Rooms List */}
        <div
          className={`${
            selectedRoom ? 'hidden' : 'flex'
          } flex-col w-full lg:w-96 border-r border-slate-200 bg-white/80 backdrop-blur-md shadow-xl`}
        >
          <div className="px-4 border-b flex justify-between items-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white pt-10 lg:pt-4 pb-6">
            <h2 className="text-lg font-semibold flex items-center space-x-2 justify-center w-full pt-1">
              <HiOutlineChatAlt2 className="text-2xl" />
              <span>Chat Rooms</span>
            </h2>
            {error && (
              <button
                onClick={() => setError(null)}
                className="text-white hover:text-gray-200"
              >
                <HiOutlineX />
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-t border-b border-red-200 text-red-600 px-4 py-2 flex items-center text-sm">
              <HiOutlineExclamationCircle className="mr-2" />
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex text-sm font-medium border-b">
            <button
              onClick={() => setActiveTab('public')}
              className={`flex-1 py-3 transition-all ${
                activeTab === 'public'
                  ? 'bg-indigo-500 text-white'
                  : 'hover:bg-indigo-50 text-gray-600'
              }`}
            >
              <FaUserFriends className="inline mr-1" /> Public
            </button>
            <button
              onClick={() => setActiveTab('my-rooms')}
              className={`flex-1 py-3 transition-all ${
                activeTab === 'my-rooms'
                  ? 'bg-indigo-500 text-white'
                  : 'hover:bg-indigo-50 text-gray-600'
              }`}
            >
              <HiUsers className="inline mr-1" /> My Rooms
            </button>
          </div>

          {/* Create Room */}
          <div className="p-4 border-b">
            {!isCreatingRoom ? (
              <button
                onClick={() => setIsCreatingRoom(true)}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 rounded-xl flex items-center justify-center space-x-2 hover:shadow-lg transition"
              >
                <HiOutlinePlusCircle className="text-lg" />
                <span>Create Room</span>
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Room name..."
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  type="text"
                  placeholder="Description..."
                  value={newRoomDescription}
                  onChange={e => setNewRoomDescription(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-400"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateRoom}
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    onClick={() => setIsCreatingRoom(false)}
                    className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Rooms List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {loading ? (
              <div className="text-center text-gray-500 p-8">Loading...</div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center text-gray-400 py-10">
                No rooms found. Create one!
              </div>
            ) : (
              filteredRooms.map(room => (
                <div
                  key={room.id}
                  onClick={() => handleJoinRoom(room)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                    room.members.includes(user.uid)
                      ? 'border-green-300 bg-green-50 hover:bg-green-100'
                      : 'border-transparent bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{room.name}</h3>
                      <p className="text-sm text-gray-500">
                        {room.description || 'No description'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        👤 {room.memberCount} • by {room.createdBy}
                      </p>
                    </div>
                    {!room.members.includes(user.uid) && (
                      <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                        Join
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        {selectedRoom && (
          <div className="flex-1 w-full flex flex-col h-screen overflow-hidden bg-white relative animate-fadeIn">
            {/* Header */}
            <div className="fixed top-0 lg:left-64 left-0 right-0 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white z-50">
  <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 hover:cursor-pointer"
                  onClick={() => setSelectedRoom(null)}
                >
                  <HiOutlineArrowLeft className="text-xl" />
                </button>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-semibold">
                  {selectedRoom.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedRoom.name}</h3>
                  <p className="text-xs opacity-90">
                    {selectedRoom.memberCount} members
                  </p>
                </div>
              </div>
              <button
                onClick={handleLeaveRoom}
                disabled={loading}
                className="flex items-center bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded-lg hover:cursor-pointer"
              >
                <FaDoorOpen className="mr-1" />
                {loading ? 'Leaving...' : 'Leave'}
              </button>
            </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1">
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
