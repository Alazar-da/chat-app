import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  setDoc,
  Timestamp,
  serverTimestamp 
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