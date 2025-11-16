'use client';

import { useState, useEffect, ChangeEvent, useRef } from 'react';
import { User } from 'firebase/auth';
import Sidebar from '@/components/SideBar';
import ChatWindow from '@/components/ChatWindow';
import {
  fetchUserChatList,
  generateChatId,
  searchUsers,
  getOrCreatePrivateChat,
} from '@/lib/privateChat';
import {
  HiOutlineArrowLeft,
  HiOutlineChatAlt2,
  HiOutlineX,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';
import { FaSearch } from 'react-icons/fa';

interface ChatUser {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  lastMessage?: string;
  lastMessageTimestamp?: any;
  chatId?: string;
}

interface PrivateChatProps {
  user: User;
}

export default function PrivateChat({ user }: PrivateChatProps) {
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load chat list
  useEffect(() => {
    if (!user?.uid) return;
    const loadChats = async () => {
      setLoading(true);
      try {
        const users = await fetchUserChatList(user.uid);
        setChatUsers(users);
      } catch {
        setError('Failed to load private chats');
      } finally {
        setLoading(false);
      }
    };
    loadChats();
  }, [user]);

  // Handle search
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const fetchResults = async () => {
      setSearchLoading(true);
      try {
        const results = await searchUsers(user.uid, q);
        const merged = results.map((u: any) => {
          const existing = chatUsers.find(c => c.id === u.id);
          return { ...u, chatId: existing?.chatId };
        });
        setSearchResults(merged);
        setShowDropdown(true);
      } finally {
        setSearchLoading(false);
      }
    };
    const t = setTimeout(fetchResults, 400);
    return () => clearTimeout(t);
  }, [searchQuery, chatUsers, user.uid]);

  const handleSelectUser = async (u: ChatUser) => {
    setLoading(true);
    try {
      let chatId = u.chatId;
      if (!chatId) {
        chatId = await getOrCreatePrivateChat(user.uid, u.id, {
          currentUser: {
            email: user.email || '',
            username: user.displayName || user.email?.split('@')[0] || 'User',
            photoURL: user.photoURL || '',
          },
          otherUser: {
            email: u.email,
            username: u.username,
            photoURL: u.photoURL || '',
          },
        });
      }
      const updated = await fetchUserChatList(user.uid);
      setChatUsers(updated);
      setSelectedUser({ ...u, chatId });
      setSearchQuery('');
      setShowDropdown(false);
    } 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (e: any) {
      setError(e.message || 'Error opening chat');
    } finally {
      setLoading(false);
    }
  };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatTime = (t: any) => {
    if (!t) return '';
    const d = t.toDate();
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 3600000;
    return diff < 24
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getDisplayName = (u: ChatUser) =>
    u.displayName || u.username || u.email.split('@')[0];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-purple-100 text-slate-800">
      <Sidebar chat={!!selectedUser} />

      <div className="flex-1 flex flex-col lg:flex-row transition-all duration-300">
        {/* Left Side — Chats + Search */}
        <div
          className={`${
            selectedUser ? 'hidden' : 'flex'
          } flex-col w-full lg:w-96 border-r border-slate-200 bg-white/80 backdrop-blur-md shadow-xl`}
        >
          <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <h2 className="text-lg font-semibold flex items-center space-x-2 justify-center w-full">
              <HiOutlineChatAlt2 className="text-2xl" />
              <span>Private Chats</span>
            </h2>
            {error && (
              <button onClick={() => setError(null)} className="hover:text-gray-200">
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

          {/* Search */}
          <div className="p-4 border-b relative" ref={dropdownRef}>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                className="w-full pl-10 pr-4 py-2 rounded-xl border focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {showDropdown && (
              <div className="absolute mt-2 left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-xl z-20 max-h-72 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-4 text-center text-gray-500">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No users found</div>
                ) : (
                  searchResults.map(u => (
                    <div
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className="p-3 hover:bg-indigo-50 cursor-pointer flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {getDisplayName(u)[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">
                          {getDisplayName(u)}{' '}
                          {!u.chatId && (
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{u.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="text-center text-gray-500 py-10">Loading...</div>
            ) : chatUsers.length === 0 ? (
              <div className="text-center text-gray-400 py-10">
                No chats yet. Search a user to start one!
              </div>
            ) : (
              chatUsers.map(u => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                    selectedUser?.id === u.id
                      ? 'border-indigo-300 bg-indigo-50'
                      : 'border-transparent bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {getDisplayName(u)[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold">{getDisplayName(u)}</h3>
                        <p className="text-sm text-gray-500 truncate">
                          {u.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                    {u.lastMessageTimestamp && (
                      <span className="text-xs text-gray-400">
                        {formatTime(u.lastMessageTimestamp)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side — Chat Window */}
        {selectedUser && (
          <div className="flex-1 flex flex-col min-h-screen bg-white relative animate-fadeIn">
            <div className="fixed top-0 lg:left-64 left-0 right-0 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white z-50">

      <div className="max-w-5xl mx-auto flex items-center space-x-3">
                <button
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 hover:cursor-pointer"
                  onClick={() => setSelectedUser(null)}
                >
                  <HiOutlineArrowLeft className="text-xl" />
                </button>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-semibold">
                  {getDisplayName(selectedUser)[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold">{getDisplayName(selectedUser)}</h3>
                  <p className="text-xs opacity-90">{selectedUser.email}</p>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <ChatWindow
                chatId={generateChatId(user.uid, selectedUser.id)}
                currentUser={user}
                selectedUser={selectedUser}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
