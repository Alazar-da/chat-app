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
  getFirestore,
  writeBatch 
} from 'firebase/firestore';
import { db } from './firebase';

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
  imageUrl:string;
  edited?: boolean;
  deleted?: boolean;
}

export interface PrivateChat {
  id: string;
  participantIds: string[];
  participants: {
    [userId: string]: {
      email: string;
      username: string;
      displayName?: string;
      photoURL?: string;
    }
  };
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp;
  createdAt: Timestamp;
}

// Generate consistent chat ID between two users
export const generateChatId = (userId1: string, userId2: string): string => {
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

// Get or create private chat
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getOrCreatePrivateChat = async (currentUserId: string, otherUserId: string, userData: any) => {
  console.log('🔍 Creating chat between:', currentUserId, 'and', otherUserId);
  console.log('📝 User data:', userData);
  
  const chatId = generateChatId(currentUserId, otherUserId);
  console.log('💬 Generated chat ID:', chatId);
  
  try {
    // Check if chat already exists
    const chatRef = doc(db, 'privateChats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (chatSnap.exists()) {
      console.log('✅ Chat already exists');
      return chatId;
    }
    
    console.log('🆕 Creating new chat...');
    
    // Create new chat data
    const chatData = {
      id: chatId,
      participantIds: [currentUserId, otherUserId],
      participants: {
        [currentUserId]: {
          email: userData.currentUser.email || '',
          username: userData.currentUser.username || userData.currentUser.email?.split('@')[0] || 'User',
          displayName: userData.currentUser.displayName || userData.currentUser.email?.split('@')[0] || 'User',
          photoURL: userData.currentUser.photoURL || ''
        },
        [otherUserId]: {
          email: userData.otherUser.email || '',
          username: userData.otherUser.username || userData.otherUser.email?.split('@')[0] || 'User',
          displayName: userData.otherUser.displayName || userData.otherUser.email?.split('@')[0] || 'User',
          photoURL: userData.otherUser.photoURL || ''
        }
      },
      createdAt: serverTimestamp(),
      lastMessageTimestamp: serverTimestamp(),
      lastMessage: '' // Initialize with empty last message
    };
    
    console.log('📤 Saving chat data:', chatData);
    
    await setDoc(chatRef, chatData);
    console.log('✅ Chat created successfully');
    
    return chatId;
  } catch (error) {
    console.error('❌ Error creating chat:', error);
    throw error;
  }
};

// Send message
export const sendMessage = async (chatId: string, senderId: string, text: string) => {
  try {
    console.log('📨 Sending message to chat:', chatId);
    
    const messagesRef = collection(db, 'privateChats', chatId, 'messages');
    const messageData = {
      senderId,
      text,
      timestamp: serverTimestamp(),
      edited: false,
      deleted: false
    };
    
    console.log('💬 Message data:', messageData);
    
    const docRef = await addDoc(messagesRef, messageData);
    
    // Update last message in chat
    const chatRef = doc(db, 'privateChats', chatId);
    await updateDoc(chatRef, {
      lastMessage: text,
      lastMessageTimestamp: serverTimestamp()
    });
    
    console.log('✅ Message sent successfully, ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error sending message:', error);
    throw error;
  }
};

// Edit message
export const editMessage = async (chatId: string, messageId: string, newText: string) => {
  try {
    const messageRef = doc(db, 'privateChats', chatId, 'messages', messageId);
    await updateDoc(messageRef, {
      text: newText,
      edited: true
    });

    // Update last message if this is the latest message
    const chatRef = doc(db, 'privateChats', chatId);
    await updateDoc(chatRef, {
      lastMessage: newText,
      lastMessageTimestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error editing message:', error);
    throw error;
  }
};

// Delete message (soft delete)
export const deleteMessage = async (chatId: string, messageId: string) => {
  try {
    const messageRef = doc(db, 'privateChats', chatId, 'messages', messageId);
    await updateDoc(messageRef, {
      text: 'This message was deleted',
      deleted: true
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

// Get user's chat list
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchUserChatList = async (userId: string): Promise<any[]> => {
  try {
    console.log('🔍 Fetching chats for user:', userId);
    
    const chatsRef = collection(db, 'privateChats');
    const q = query(
      chatsRef, 
      where('participantIds', 'array-contains', userId)
      // Remove orderBy temporarily for debugging
    );
    
    const querySnapshot = await getDocs(q);
    console.log('📋 Found chats:', querySnapshot.docs.length);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chats: any[] = [];
    
    for (const docSnap of querySnapshot.docs) {
      const chatData = docSnap.data();
      console.log('💬 Chat data:', chatData);
      
      // Get the other participant's info
      const otherUserId = chatData.participantIds.find((id: string) => id !== userId);
      console.log('👤 Other user ID:', otherUserId);
      
      if (otherUserId && chatData.participants && chatData.participants[otherUserId]) {
        const otherUser = chatData.participants[otherUserId];
        console.log('👤 Other user data:', otherUser);
        
        chats.push({
          id: otherUserId,
          chatId: docSnap.id,
          email: otherUser.email,
          username: otherUser.username,
          displayName: otherUser.displayName,
          photoURL: otherUser.photoURL,
          lastMessage: chatData.lastMessage || 'No messages yet',
          lastMessageTimestamp: chatData.lastMessageTimestamp
        });
      } else {
        console.warn('⚠️ Missing participant data for chat:', docSnap.id);
      }
    }
    
    console.log('✅ Final chat list:', chats);
    return chats;
  } catch (error) {
    console.error('❌ Error fetching user chats:', error);
    return [];
  }
};

// Search users for new chats
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const searchUsers = async (currentUserId: string, searchTerm: string): Promise<any[]> => {
  try {
    console.log('🔍 Searching users with term:', searchTerm);
    
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    console.log('📋 Total users in database:', querySnapshot.docs.length);
    
    const users = querySnapshot.docs
      .map(doc => {
        const userData = doc.data();
        console.log('👤 User found:', { id: doc.id, ...userData });
        return {
          id: doc.id,
          ...userData
        };
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((user:any) => {
        const matches = user.id !== currentUserId && 
          (
            user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        console.log(`👤 User ${user.username} matches:`, matches);
        return matches;
      });
    
    console.log('✅ Search results:', users);
    return users;
  } catch (error) {
    console.error('❌ Error searching users:', error);
    return [];
  }
};

// Listen for real-time messages
export const subscribeToMessages = (chatId: string, callback: (messages: Message[]) => void) => {
  console.log('🔔 Subscribing to messages for chat:', chatId);
  
  const messagesRef = collection(db, 'privateChats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    console.log('📨 New messages received:', snapshot.docs.length);
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Message[];
    callback(messages);
  }, (error) => {
    console.error('❌ Error in message subscription:', error);
  });
};


export const sendImageMessage = async (
  chatId: string,
  senderId: string,
  imageUrl: string
) => {
  if (!chatId || !senderId || !imageUrl) {
    console.error("Missing chatId, senderId, or imageUrl");
    return;
  }

  try {
    const messagesRef = collection(db, "privateChats", chatId, "messages");

    await addDoc(messagesRef, {
      senderId,
      imageUrl,
      type: "image", // helpful for rendering logic
      createdAt: serverTimestamp(),
    });

    console.log("✅ Image message sent successfully");
  } catch (error) {
    console.error("❌ Error sending image message:", error);
  }
};

export const deletePrivateChat = async (
  chatId: string,
  currentUserId: string,
  otherUserId: string
): Promise<void> => {
  try {
    if (!chatId || !currentUserId || !otherUserId) {
      throw new Error('Missing required parameters');
    }

    const db = getFirestore();
    const batch = writeBatch(db); // Correct way to create a batch

    // Reference to the chat document
    const chatRef = doc(db, 'privateChats', chatId);
    const chatDoc = await getDoc(chatRef);

    if (!chatDoc.exists()) {
      throw new Error('Chat not found');
    }

    const chatData = chatDoc.data();

    // Verify the user is part of this chat
    if (!chatData.participants || !chatData.participants.includes(currentUserId)) {
      throw new Error('You are not authorized to delete this chat');
    }

    // Delete all messages in the chat
    const messagesRef = collection(db, 'privateChats', chatId, 'messages');
    const messagesSnapshot = await getDocs(messagesRef);
    
    messagesSnapshot.forEach((messageDoc) => {
      batch.delete(messageDoc.ref);
    });

    // Delete the chat document
    batch.delete(chatRef);

    // Update both users' chat lists to remove this chat
    const currentUserChatRef = doc(db, 'users', currentUserId, 'privateChats', otherUserId);
    const otherUserChatRef = doc(db, 'users', otherUserId, 'privateChats', currentUserId);

    // Check if documents exist before deleting
    const [currentUserChatDoc, otherUserChatDoc] = await Promise.all([
      getDoc(currentUserChatRef),
      getDoc(otherUserChatRef)
    ]);

    if (currentUserChatDoc.exists()) {
      batch.delete(currentUserChatRef);
    }

    if (otherUserChatDoc.exists()) {
      batch.delete(otherUserChatRef);
    }

    // Commit the batch
    await batch.commit();

    console.log(`Chat ${chatId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting private chat:', error);
    throw error;
  }
};

// If you prefer soft delete (mark as deleted but keep data):
export const deletePrivateChatSoft = async (
  chatId: string,
  currentUserId: string,
  otherUserId: string
): Promise<void> => {
  try {
    if (!chatId || !currentUserId || !otherUserId) {
      throw new Error('Missing required parameters');
    }

    const db = getFirestore();

    // Mark chat as deleted for current user only (soft delete)
    const userChatRef = doc(db, 'users', currentUserId, 'privateChats', otherUserId);
    
    await updateDoc(userChatRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
    });

    console.log(`Chat ${chatId} marked as deleted for user ${currentUserId}`);
  } catch (error) {
    console.error('Error soft deleting private chat:', error);
    throw error;
  }
};

// If you need to update fetchUserChatList to filter soft-deleted chats:
/*
export const fetchUserChatList = async (userId: string): Promise<ChatUser[]> => {
  const db = getFirestore();
  const userChatsRef = collection(db, 'users', userId, 'privateChats');
  
  // Query to exclude soft-deleted chats
  const q = query(
    userChatsRef,
    where('deleted', '!=', true)
  );
  
  const snapshot = await getDocs(q);
  // ... rest of your function
};
*/