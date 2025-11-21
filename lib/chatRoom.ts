import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
  Timestamp,
  serverTimestamp,
  FieldValue
} from 'firebase/firestore';
import { db } from './firebase';

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdById: string;
  createdAt: Timestamp;
  members: string[];
  memberCount: number;
  isPublic: boolean;
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp;
}

export interface RoomMessage {
  id: string;
  text: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  timestamp: Timestamp;
  imageUrl?: string;
  edited?: boolean;
  deleted?: boolean;
  replyTo?: string;
  isSystemMessage?: boolean;
}

// Types for creating data
interface CreateChatRoomData {
  name: string;
  description?: string;
  createdBy: string;
  createdById: string;
  createdAt: FieldValue;
  members: string[];
  memberCount: number;
  isPublic: boolean;
  lastMessageTimestamp: FieldValue;
}

interface CreateRoomMessageData {
  text: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  timestamp: FieldValue;
  imageUrl?: string;
  edited?: boolean;
  deleted?: boolean;
  replyTo?: string;
  isSystemMessage?: boolean;
}

// Create a new chat room
export const createChatRoom = async (
  name: string,
  description: string,
  createdBy: string,
  createdById: string,
  isPublic: boolean = true
): Promise<string> => {
  try {
    console.log('🆕 Creating new chat room:', { name, description, createdBy, createdById, isPublic });
    
    const roomRef = doc(collection(db, 'chatRooms'));
    const roomData: CreateChatRoomData = {
      name: name.trim(),
      description: description.trim(),
      createdBy,
      createdById,
      createdAt: serverTimestamp(),
      members: [createdById],
      memberCount: 1,
      isPublic,
      lastMessageTimestamp: serverTimestamp()
    };

    console.log('📤 Saving room data:', roomData);
    await setDoc(roomRef, roomData);
    
    console.log('✅ Room created successfully with ID:', roomRef.id);
    return roomRef.id;
  } catch (error) {
    console.error('❌ Error creating chat room:', error);
    throw error;
  }
};

// Get all public chat rooms
export const getPublicChatRooms = async (): Promise<ChatRoom[]> => {
  try {
    console.log('🔍 Fetching public chat rooms...');
    
    const roomsRef = collection(db, 'chatRooms');
    const q = query(
      roomsRef,
      where('isPublic', '==', true)
      // Remove orderBy temporarily for debugging
    );

    const querySnapshot = await getDocs(q);
    console.log('📋 Found public rooms:', querySnapshot.docs.length);
    
    const rooms = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('🏠 Room data:', { id: doc.id, ...data });
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        createdById: data.createdById,
        createdAt: data.createdAt,
        members: data.members || [],
        memberCount: data.memberCount || 0,
        isPublic: data.isPublic,
        lastMessage: data.lastMessage,
        lastMessageTimestamp: data.lastMessageTimestamp
      } as ChatRoom;
    });
    
    console.log('✅ Public rooms fetched:', rooms);
    return rooms;
  } catch (error) {
    console.error('❌ Error fetching public rooms:', error);
    return [];
  }
};

// Get rooms where user is a member
export const getUserChatRooms = async (userId: string): Promise<ChatRoom[]> => {
  try {
    console.log('🔍 Fetching user chat rooms for:', userId);
    
    const roomsRef = collection(db, 'chatRooms');
    const q = query(
      roomsRef,
      where('members', 'array-contains', userId)
    );

    const querySnapshot = await getDocs(q);
    console.log('📋 Found user rooms:', querySnapshot.docs.length);
    
    const rooms = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        createdById: data.createdById,
        createdAt: data.createdAt,
        members: data.members || [],
        memberCount: data.memberCount || 0,
        isPublic: data.isPublic,
        lastMessage: data.lastMessage,
        lastMessageTimestamp: data.lastMessageTimestamp
      } as ChatRoom;
    });
    
    return rooms;
  } catch (error) {
    console.error('❌ Error fetching user rooms:', error);
    return [];
  }
};

// Join a chat room
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const joinChatRoom = async (roomId: string, userId: string, userData: any): Promise<void> => {
  try {
    console.log('🎯 Joining room:', { roomId, userId, userData });
    
    const roomRef = doc(db, 'chatRooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      console.error('❌ Room not found:', roomId);
      throw new Error('Room not found');
    }

    const roomData = roomSnap.data();
    console.log('🏠 Room data:', roomData);

    // Check if user is already a member
    if (roomData.members && roomData.members.includes(userId)) {
      console.log('ℹ️ User already a member of room');
      return; // User is already a member
    }

    console.log('➕ Adding user to room members...');
    
    // Add user to members array and increment member count
    const currentMembers = roomData.members || [];
    const currentMemberCount = roomData.memberCount || 0;
    
    const updateData = {
      members: [...currentMembers, userId],
      memberCount: currentMemberCount + 1
    };
    
    console.log('📤 Updating room with:', updateData);
    await updateDoc(roomRef, updateData);

    // Send join notification
    console.log('💬 Sending join notification...');
    await sendRoomMessage(roomId, userId, userData, `${userData.displayName || userData.username} joined the room`, true);

    console.log('✅ Successfully joined room');
  } catch (error) {
    console.error('❌ Error joining chat room:', error);
    throw error;
  }
};

// Leave a chat room
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const leaveChatRoom = async (roomId: string, userId: string, userData: any): Promise<void> => {
  try {
    console.log('🚪 Leaving room:', { roomId, userId });
    
    const roomRef = doc(db, 'chatRooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomSnap.data();

    // Remove user from members array and decrement member count
    const currentMembers = roomData.members || [];
    const currentMemberCount = roomData.memberCount || 0;
    
    const updatedMembers = currentMembers.filter((member: string) => member !== userId);
    
    await updateDoc(roomRef, {
      members: updatedMembers,
      memberCount: Math.max(0, currentMemberCount - 1)
    });

    // Send leave notification
    await sendRoomMessage(roomId, userId, userData, `${userData.displayName || userData.username} left the room`, true);

  } catch (error) {
    console.error('❌ Error leaving chat room:', error);
    throw error;
  }
};

// Send message to room
export const sendRoomMessage = async (
  roomId: string,
  senderId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userData: any,
  text: string,
  isSystemMessage: boolean = false
): Promise<string> => {
  try {
    console.log('💬 Sending room message:', { roomId, senderId, text, isSystemMessage });
    
    const messagesRef = collection(db, 'chatRooms', roomId, 'messages');
    const messageData: CreateRoomMessageData = {
      text: text.trim(),
      senderId,
      senderEmail: userData.email || 'unknown@example.com',
      senderName: userData.displayName || userData.username || userData.email?.split('@')[0] || 'Unknown User',
      timestamp: serverTimestamp(),
      edited: false,
      deleted: false,
      isSystemMessage
    };

    console.log('📤 Saving message data:', messageData);
    const docRef = await addDoc(messagesRef, messageData);

    // Update last message in room
    const roomRef = doc(db, 'chatRooms', roomId);
    await updateDoc(roomRef, {
      lastMessage: isSystemMessage ? 'System message' : text.trim(),
      lastMessageTimestamp: serverTimestamp()
    });

    console.log('✅ Message sent successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error sending room message:', error);
    throw error;
  }
};

// Send image message to room
export const sendRoomImageMessage = async (
  roomId: string,
  senderId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userData: any,
  imageUrl: string
): Promise<string> => {
  try {
    const messagesRef = collection(db, 'chatRooms', roomId, 'messages');
    const messageData: CreateRoomMessageData = {
      text: '',
      imageUrl,
      senderId,
      senderEmail: userData.email || 'unknown@example.com',
      senderName: userData.displayName || userData.username || userData.email?.split('@')[0] || 'Unknown User',
      timestamp: serverTimestamp(),
      edited: false,
      deleted: false,
      isSystemMessage: false
    };

    const docRef = await addDoc(messagesRef, messageData);

    // Update last message in room
    const roomRef = doc(db, 'chatRooms', roomId);
    await updateDoc(roomRef, {
      lastMessage: '📷 Image',
      lastMessageTimestamp: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('❌ Error sending room image message:', error);
    throw error;
  }
};

// Edit room message
export const editRoomMessage = async (roomId: string, messageId: string, newText: string): Promise<void> => {
  try {
    const messageRef = doc(db, 'chatRooms', roomId, 'messages', messageId);
    await updateDoc(messageRef, {
      text: newText.trim(),
      edited: true
    });

    // Update last message if this is the latest message
    const roomRef = doc(db, 'chatRooms', roomId);
    await updateDoc(roomRef, {
      lastMessage: newText.trim(),
      lastMessageTimestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('❌ Error editing room message:', error);
    throw error;
  }
};

// Delete room message (soft delete)
export const deleteRoomMessage = async (roomId: string, messageId: string): Promise<void> => {
  try {
    const messageRef = doc(db, 'chatRooms', roomId, 'messages', messageId);
    await updateDoc(messageRef, {
      text: 'This message was deleted',
      deleted: true
    });
  } catch (error) {
    console.error('❌ Error deleting room message:', error);
    throw error;
  }
};

// Subscribe to room messages
export const subscribeToRoomMessages = (
  roomId: string,
  callback: (messages: RoomMessage[]) => void
) => {
  console.log('🔔 Subscribing to room messages:', roomId);
  
  const messagesRef = collection(db, 'chatRooms', roomId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(q, (snapshot) => {
    console.log('📨 Room messages updated:', snapshot.docs.length);
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text,
        senderId: data.senderId,
        senderEmail: data.senderEmail,
        senderName: data.senderName,
        timestamp: data.timestamp,
        imageUrl: data.imageUrl,
        edited: data.edited,
        deleted: data.deleted,
        replyTo: data.replyTo,
        isSystemMessage: data.isSystemMessage
      } as RoomMessage;
    });
    callback(messages);
  }, (error) => {
    console.error('❌ Error in room messages subscription:', error);
  });
};

// Subscribe to room updates
export const subscribeToRooms = (callback: (rooms: ChatRoom[]) => void) => {
  console.log('🔔 Subscribing to room updates');
  
  const roomsRef = collection(db, 'chatRooms');
  const q = query(roomsRef); // Remove orderBy for now

  return onSnapshot(q, (snapshot) => {
    console.log('🏠 Rooms updated:', snapshot.docs.length);
    const rooms = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        createdById: data.createdById,
        createdAt: data.createdAt,
        members: data.members || [],
        memberCount: data.memberCount || 0,
        isPublic: data.isPublic,
        lastMessage: data.lastMessage,
        lastMessageTimestamp: data.lastMessageTimestamp
      } as ChatRoom;
    });
    callback(rooms);
  }, (error) => {
    console.error('❌ Error in rooms subscription:', error);
  });
};

// Get room details
export const getRoomDetails = async (roomId: string): Promise<ChatRoom | null> => {
  try {
    const roomRef = doc(db, 'chatRooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (roomSnap.exists()) {
      const data = roomSnap.data();
      return {
        id: roomSnap.id,
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        createdById: data.createdById,
        createdAt: data.createdAt,
        members: data.members || [],
        memberCount: data.memberCount || 0,
        isPublic: data.isPublic,
        lastMessage: data.lastMessage,
        lastMessageTimestamp: data.lastMessageTimestamp
      } as ChatRoom;
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching room details:', error);
    return null;
  }
};

// Check if user is room member
export const isRoomMember = async (roomId: string, userId: string): Promise<boolean> => {
  try {
    console.log('🔍 Checking room membership:', { roomId, userId });
    
    const roomRef = doc(db, 'chatRooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (roomSnap.exists()) {
      const roomData = roomSnap.data();
      const isMember = roomData.members && roomData.members.includes(userId);
      console.log('✅ Membership check result:', isMember);
      return isMember;
    }
    
    console.log('❌ Room does not exist');
    return false;
  } catch (error) {
    console.error('❌ Error checking room membership:', error);
    return false;
  }
};