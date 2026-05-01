import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  Timestamp, 
  serverTimestamp,
  enableMultiTabIndexedDbPersistence
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Enable offline persistence for multi-tab support
try {
  enableMultiTabIndexedDbPersistence();
} catch (err) {
  console.warn('Persistence already enabled or failed:', err);
}

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Auth functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return { user: null, error };
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error };
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const updateUserProfile = async (user: User, displayName?: string, photoURL?: string) => {
  if (displayName || photoURL) {
    await updateFirebaseProfile(user, { displayName, photoURL });
  }
};

// Firestore functions
export const createUserProfile = async (userId: string, profileData: {
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  age_verified: boolean;
  birth_year: number | null;
}) => {
  try {
    const userRef = doc(db, 'user_profiles', userId);
    await setDoc(userRef, {
      ...profileData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return { error: null };
  } catch (error: any) {
    // Handle offline errors gracefully
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.warn('Firebase offline - profile creation queued');
      return { error: null }; // Don't fail on offline
    }
    console.error('Error creating user profile:', error);
    return { error };
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const userRef = doc(db, 'user_profiles', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return { data: { id: userId, ...userSnap.data() }, error: null };
    }
    return { data: null, error: null };
  } catch (error: any) {
    // Handle offline errors gracefully - return cached/null data
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.warn('Firebase offline - using cached data');
      return { data: null, error: null };
    }
    console.error('Error getting user profile:', error);
    return { data: null, error };
  }
};

export const updateUserProfileInDB = async (userId: string, updates: Partial<{
  age_verified: boolean;
  birth_year: number;
  display_name: string;
  avatar_url: string;
}>) => {
  try {
    const userRef = doc(db, 'user_profiles', userId);
    await updateDoc(userRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { error };
  }
};

// Chat functions
export const createChatInDB = async (userId: string, title: string, mode: 'chat' | 'ide') => {
  try {
    const chatRef = await addDoc(collection(db, 'chats'), {
      user_id: userId,
      title,
      mode,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return { id: chatRef.id, error: null };
  } catch (error) {
    console.error('Error creating chat:', error);
    return { id: null, error };
  }
};

export const getUserChats = (userId: string, callback: (chats: Array<{ id: string; user_id: string; title: string; mode: 'chat' | 'ide'; created_at: any; updated_at: any }>) => void) => {
  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, where('user_id', '==', userId), orderBy('updated_at', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(chats as any);
  }, (error) => {
    console.error('Error fetching chats:', error);
    callback([]);
  });
};

export const deleteChatFromDB = async (chatId: string) => {
  try {
    await deleteDoc(doc(db, 'chats', chatId));
    return { error: null };
  } catch (error) {
    console.error('Error deleting chat:', error);
    return { error };
  }
};

export const updateChatTitleInDB = async (chatId: string, title: string) => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      title,
      updated_at: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    console.error('Error updating chat title:', error);
    return { error };
  }
};

// Message functions
export const createMessageInDB = async (chatId: string, role: 'user' | 'assistant' | 'system', content: string, is_restricted: boolean = false, metadata: Record<string, unknown> = {}) => {
  try {
    const messageRef = await addDoc(collection(db, 'messages'), {
      chat_id: chatId,
      role,
      content,
      is_restricted,
      metadata,
      created_at: serverTimestamp(),
    });
    return { id: messageRef.id, error: null };
  } catch (error) {
    console.error('Error creating message:', error);
    return { id: null, error };
  }
};

export const getChatMessages = (chatId: string, callback: (messages: Array<{ id: string; chat_id: string; role: string; content: string; is_restricted: boolean; metadata: Record<string, unknown>; created_at: any }>) => void) => {
  const messagesRef = collection(db, 'messages');
  const q = query(messagesRef, where('chat_id', '==', chatId), orderBy('created_at', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(messages as any);
  }, (error) => {
    console.error('Error fetching messages:', error);
    callback([]);
  });
};

// Helper to convert Firestore timestamp to ISO string
export const timestampToISO = (timestamp: any): string => {
  if (!timestamp) return new Date().toISOString();
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString();
  }
  return timestamp;
};
