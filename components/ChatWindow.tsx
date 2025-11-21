'use client';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { User } from 'firebase/auth';
import { 
  sendRoomMessage,
  sendRoomImageMessage,
  editRoomMessage,
  deleteRoomMessage,
  subscribeToRoomMessages,
  RoomMessage,
  isRoomMember
} from '@/lib/chatRoom';
import {
  sendMessage,
  sendImageMessage,
  editMessage,
  deleteMessage,
  subscribeToMessages,
  Message
} from '@/lib/privateChat';
import { compressAndUploadImage } from "@/utils/uploadImage";
import { 
  FiSend, 
  FiImage, 
  FiEdit3, 
  FiTrash2, 
  FiX,
  FiSmile,
  FiDownload
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatWindowProps {
  chatId: string;
  currentUser: User;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedUser: any;
  isGroupChat?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  roomInfo?: any;
}

type ChatMessage = Message | RoomMessage;

const isRoomMessage = (message: ChatMessage): message is RoomMessage => {
  return (message as RoomMessage).senderName !== undefined;
};

const isSystemMessage = (message: ChatMessage): boolean => {
  if (isRoomMessage(message)) return message.isSystemMessage === true;
  return false;
};

export default function ChatWindow({ 
  chatId, 
  currentUser, 
  selectedUser, 
  isGroupChat = false 
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMember, setIsMember] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageMessageId, setSelectedImageMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const deleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) return;
    if (isGroupChat) checkMembership();

    const unsubscribe = isGroupChat 
      ? subscribeToRoomMessages(chatId, setMessages)
      : subscribeToMessages(chatId, setMessages);

    return () => unsubscribe();
  }, [chatId, isGroupChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
      if (deleteRef.current && !deleteRef.current.contains(event.target as Node)) {
        setDeleteConfirm(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkMembership = async () => {
    try {
      const member = await isRoomMember(chatId, currentUser.uid);
      setIsMember(member);
    } catch (error) {
      console.error('Error checking membership:', error);
      setIsMember(false);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loading || !isMember) return;

    setLoading(true);
    try {
      const userData = {
        email: currentUser.email,
        username: currentUser.displayName || currentUser.email?.split('@')[0],
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL
      };

      if (isGroupChat) {
        await sendRoomMessage(chatId, currentUser.uid, userData, newMessage);
      } else {
        await sendMessage(chatId, currentUser.uid, newMessage);
      }
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMessage = async (message: ChatMessage) => {
    if (loading || !isMember) return;
    
    // FIX: Prevent reload by checking if message actually changed
    if (message.text === newMessage) {
      setEditingMessage(null);
      setNewMessage('');
      setActiveMenu(null);
      return;
    }

    setLoading(true);
    try {
      if (isGroupChat) {
        await editRoomMessage(chatId, message.id, newMessage);
      } else {
        await editMessage(chatId, message.id, newMessage);
      }
      setEditingMessage(null);
      setNewMessage('');
      setActiveMenu(null);
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Error editing message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (loading || !isMember) return;

    setLoading(true);
    try {
      if (isGroupChat) {
        await deleteRoomMessage(chatId, messageId);
      } else {
        await deleteMessage(chatId, messageId);
      }
      setDeleteConfirm(null);
      setActiveMenu(null);
      setSelectedImage(null);
      setSelectedImageMessageId(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Error deleting message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isMember) return;

    setLoading(true);
    try {
      const imageUrl = await compressAndUploadImage(file, "profile_images");

      const userData = {
        email: currentUser.email,
        username: currentUser.displayName || currentUser.email?.split('@')[0],
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL
      };

      if (isGroupChat) {
        await sendRoomImageMessage(chatId, currentUser.uid, userData, imageUrl);
      } else {
        await sendImageMessage(chatId, currentUser.uid, imageUrl);
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Image upload failed. Please try again.');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const startEditing = (message: ChatMessage) => {
    setEditingMessage(message);
    setNewMessage(message.text);
    setActiveMenu(null);
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setNewMessage('');
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate();
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getSenderName = (message: ChatMessage) => {
    if (isRoomMessage(message)) {
      return message.senderName || message.senderEmail?.split('@')[0] || 'Unknown';
    } else {
      return selectedUser ? 
        (selectedUser.displayName || selectedUser.username || selectedUser.email?.split('@')[0] || 'Unknown') :
        'Unknown';
    }
  };

  // Function to open image with message ID
  const openImage = (imageUrl: string, messageId: string) => {
    setSelectedImage(imageUrl);
    setSelectedImageMessageId(messageId);
  };

  if (!isMember && isGroupChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white to-blue-50/30">
        <div className="text-center max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <span className="text-3xl text-red-500">🚫</span>
          </motion.div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            Not a Member
          </h3>
          <p className="text-gray-600">
            You are not a member of this room. Please join the room to participate in the conversation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="relative w-full flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Delete Confirmation Popup */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={deleteRef}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiTrash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Delete Message?
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this message? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(deleteConfirm)}
                    disabled={loading}
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Viewer Popup */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative max-w-4xl max-h-[90vh] w-full"
            >
              {/* Top Action Buttons */}
              <div className="absolute -top-12 right-0 flex gap-4">
                {/* Download Button */}
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(selectedImage, { mode: "cors" });
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `chat-image-${Date.now()}.jpg`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (err) {
                      console.error("Failed to download image:", err);
                    }
                  }}
                  className="text-white hover:text-green-300 transition-colors duration-200 cursor-pointer flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20"  title="Download image"
                >
                  <FiDownload className="w-5 h-5" />
                  <span className="text-sm">Download</span>
                </button>

                {/* Delete Button - Only show if user owns the message */}
                {selectedImageMessageId && messages.find(m => m.id === selectedImageMessageId)?.senderId === currentUser.uid && (
                  <button
                    onClick={() => {
                      setDeleteConfirm(selectedImageMessageId);
                      setSelectedImage(null);
                    }}
                    className="text-white hover:text-red-300 transition-colors duration-200 cursor-pointer flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20"   title="Delete image"
                  >
                    <FiTrash2 className="w-5 h-5" />
                    <span className="text-sm">Delete</span>
                  </button>
                )}

                {/* Close Button */}
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setSelectedImageMessageId(null);
                  }}
                  className="text-white hover:text-gray-300 transition-colors duration-200 cursor-pointer flex items-center gap-2 bg-red-500/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-red-400/50"  >
                  <FiX className="w-5 h-5" />
                  <span className="text-sm">Close</span>
                </button>
              </div>
              
              {/* Image */}
              <img
                src={selectedImage}
                alt="Full size"
                className="w-full h-full object-contain rounded-lg max-h-[80vh]"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 mt-16 mb-24">
        <AnimatePresence>
          {messages.filter(msg => !msg.deleted).map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex ${message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div className="relative group max-w-[70%]">
                <div
                  className={`relative rounded-2xl text-sm shadow-lg backdrop-blur-sm
                    ${message.imageUrl?"p-2":"p-4"}
                    ${
                    isSystemMessage(message)
                      ? 'bg-yellow-100/80 border border-yellow-300 mx-auto text-center'
                      : message.senderId === currentUser.uid
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-none'
                      : 'bg-white/90 border border-slate-200/80 rounded-bl-none'
                  }`}
                >
                  {/* Sender name for group chats */}
                  {isGroupChat && message.senderId !== currentUser.uid && !isSystemMessage(message) && (
                    <div className="text-xs font-medium text-blue-600 mb-1">
                      {getSenderName(message)}
                    </div>
                  )}

                  {/* Message content */}
                  {message.imageUrl ? (
                    <div className="relative">
                      {/* Image Container with Beautiful Design */}
                      <div className="relative group">
                        {/* Gradient Border Effect */}
                        <div className={`absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                          message.senderId === currentUser.uid 
                            ? 'bg-gradient-to-r from-blue-400 to-purple-500 blur-sm' 
                            : 'bg-gradient-to-r from-gray-300 to-gray-400 blur-sm'
                        }`}></div>
                        
                        {/* Main Image Container */}
                        <div className={`relative rounded-lg overflow-hidden transform transition-all duration-300 
                          ${message.senderId === currentUser.uid 
                            ? 'bg-gradient-to-br from-blue-400/10 to-purple-500/10' 
                            : 'bg-gradient-to-br from-gray-50 to-gray-100'
                          } group-hover:scale-[1.02]`}
                          style={{
                            transform: 'perspective(1000px) rotateY(-0.8deg) rotateX(0.4deg)'
                          }}
                        >
                          {/* Image */}
                          <img
                            src={message.imageUrl}
                            alt="uploaded"
                            onClick={() => openImage(message.imageUrl!, message.id)}
                            className="w-full h-32 object-cover cursor-zoom-in transition-all duration-500 group-hover:brightness-105"
                          />
                          
                          {/* Hover Overlay */}
                          <div onClick={() => openImage(message.imageUrl!, message.id)} className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center hover:cursor-pointer">
                            <div className="transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                              <div className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                                message.senderId === currentUser.uid 
                                  ? 'bg-white/20 text-white' 
                                  : 'bg-black/20 text-white'
                              }`}>
                                Click to view
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Text below image if exists */}
                      {message.text && (
                        <div className="mt-2 px-1">
                          <p className={`text-sm break-words ${
                            message.senderId === currentUser.uid ? 'text-white/90' : 'text-gray-700'
                          }`}>
                            {message.text}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <p className="break-words pr-8">{message.text}</p>
                      {message.senderId === currentUser.uid && !isSystemMessage(message) && (
                        <button
                          onClick={() => setActiveMenu(activeMenu === message.id ? null : message.id)}
                          className="absolute top-0 right-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full cursor-pointer"
                        >
                        </button>
                      )}
                    </div>
                  )}
                  
                  <div className={`text-xs mt-2 flex items-center space-x-1 ${
                    message.senderId === currentUser.uid ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    <span className={isSystemMessage(message) ? "text-red-500" : ""}>
                      {formatMessageTime(message.timestamp)}
                    </span>
                    {message.edited && <span>• edited</span>}
                  </div>
                </div>

                {/* Floating Menu - Only for text messages */}
                <AnimatePresence>
                  {activeMenu === message.id && !message.imageUrl && (
                    <motion.div
                      ref={menuRef}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute top-8 right-0 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-10 min-w-32"
                    >
                      <button
                        onClick={() => startEditing(message)}
                        className={`${isSystemMessage(message) ? "hidden" : ""} flex items-center space-x-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mb-1 cursor-pointer`}
                      >
                        <FiEdit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          setDeleteConfirm(message.id);
                          setActiveMenu(null);
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white/95 backdrop-blur-sm shadow-2xl border-t border-slate-200/60 p-4">
        <div className="max-w-5xl mx-auto">
          {editingMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between bg-yellow-50 p-3 rounded-xl mb-3 border border-yellow-200"
            >
              <span className="text-sm text-yellow-800 font-medium">Editing message</span>
              <button
                onClick={cancelEditing}
                className="text-yellow-600 hover:text-yellow-800 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </motion.div>
          )}
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (editingMessage) {
                handleEditMessage(editingMessage);
              } else {
                handleSendMessage(e);
              }
            }}
            className="flex items-center space-x-2"
          >
            {/* Image Upload Button */}
            <label className="hover:cursor-pointer bg-white border border-slate-300 text-slate-600 p-3 rounded-2xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center cursor-pointer">
              <FiImage className="w-5 h-5" />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload} 
                disabled={loading}
              />
            </label>
            
            {/* Message Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={editingMessage ? "Edit your message..." : "Type your message..."}
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <FiSmile className="w-5 h-5" />
              </button>
            </div>
            
            {/* Send Button */}
            <motion.button
              type="submit"
              disabled={loading || !newMessage.trim()}
              whileHover={{ scale: loading ? 1 : 1.05 }}
              whileTap={{ scale: loading ? 1 : 0.95 }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FiSend className="w-5 h-5" />
              )}
            </motion.button>
          </form>
        </div>
      </div>
    </section>
  );
}