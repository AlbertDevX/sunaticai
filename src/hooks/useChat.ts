import { useState, useCallback, useEffect } from 'react';
import { 
  getUserChats, 
  getChatMessages, 
  createMessageInDB, 
  createChatInDB, 
  deleteChatFromDB, 
  updateChatTitleInDB,
  timestampToISO 
} from '../lib/firebase';
import { Chat, Message, AIResponse, AppView, UserProfile } from '../types';
import { callAI, getAvailableModels } from '../lib/ai';
import { saveConversation, addTrainingData } from '../lib/sqlite';

import { initializeFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const db = initializeFirestore(app, { localCache: persistentLocalCache() });

export function useChat(userId: string | undefined, profile?: UserProfile) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(
    import.meta.env.VITE_DEFAULT_MODEL || 'gemini-1.5-pro'
  );
  const availableModels = getAvailableModels();

  // Load chats when userId changes
  useEffect(() => {
    if (!userId) {
      setChats([]);
      return;
    }

    setLoading(true);
    const unsubscribe = getUserChats(userId, (fetchedChats) => {
      const formattedChats = fetchedChats.map(chat => ({
        id: chat.id,
        user_id: chat.user_id,
        title: chat.title,
        mode: chat.mode as 'chat' | 'ide',
        created_at: chat.created_at ? timestampToISO(chat.created_at) : new Date().toISOString(),
        updated_at: chat.updated_at ? timestampToISO(chat.updated_at) : new Date().toISOString(),
      }));
      setChats(formattedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Load messages when activeChat changes
  const loadMessages = useCallback((chatId: string) => {
    const unsubscribe = getChatMessages(chatId, (fetchedMessages) => {
      const formattedMessages = fetchedMessages.map(msg => ({
        id: msg.id,
        chat_id: msg.chat_id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        is_restricted: msg.is_restricted ?? false,
        metadata: msg.metadata ?? {},
        created_at: msg.created_at ? timestampToISO(msg.created_at) : new Date().toISOString(),
      }));
      setMessages(formattedMessages);
    });

    return unsubscribe;
  }, []);

  const createChat = useCallback(async (mode: AppView = 'chat', title = 'New Chat') => {
    if (!userId) return null;
    
    const { id, error } = await createChatInDB(userId, title, mode);
    if (error || !id) return null;

    const newChat: Chat = {
      id,
      user_id: userId,
      title,
      mode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChat);
    setMessages([]);
    return newChat;
  }, [userId]);

  const selectChat = useCallback(async (chat: Chat) => {
    setActiveChat(chat);
    loadMessages(chat.id);
  }, [loadMessages]);

  const deleteChat = useCallback(async (chatId: string) => {
    await deleteChatFromDB(chatId);
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (activeChat?.id === chatId) {
      setActiveChat(null);
      setMessages([]);
    }
  }, [activeChat]);

  const updateChatTitle = useCallback(async (chatId: string, title: string) => {
    await updateChatTitleInDB(chatId, title);
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, title, updated_at: new Date().toISOString() } : c));
  }, []);

  const sendMessage = useCallback(async (
    content: string,
    mode: AppView = 'chat',
    _sessionToken: string | null
  ): Promise<AIResponse> => {
    if (!userId || !content.trim()) return { error: 'Invalid request' };

    setSending(true);
    try {
      let chat = activeChat;

      if (!chat) {
        chat = await createChat(mode, content.slice(0, 50));
        if (!chat) return { error: 'Failed to create chat' };
      }

      // Save user message
      const { id: msgId, error: msgError } = await createMessageInDB(
        chat.id,
        'user',
        content,
        false,
        {}
      );

      if (msgError || !msgId) {
        return { error: 'Failed to save message' };
      }

      const savedMsg: Message = {
        id: msgId,
        chat_id: chat.id,
        role: 'user',
        content,
        is_restricted: false,
        metadata: {},
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, savedMsg]);

      // Call AI endpoint with age verification - DIRECT FRONTEND CALL
      const historyMsgs = [...messages, savedMsg]
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }));

      // Direct call to AI provider from frontend (no backend needed)
      const aiData = await callAI(historyMsgs, selectedModel, profile?.age_verified ?? false);

      if (aiData.error) {
        return aiData;
      }

      if (aiData.content) {
        // Save AI response to Firebase
        const { id: aiMsgId } = await createMessageInDB(
          chat.id,
          'assistant',
          aiData.content,
          aiData.restricted ?? false,
          { model: aiData.model, usage: aiData.usage }
        );

        if (aiMsgId) {
          const aiMsg: Message = {
            id: aiMsgId,
            chat_id: chat.id,
            role: 'assistant',
            content: aiData.content ?? '',
            is_restricted: aiData.restricted ?? false,
            metadata: { model: aiData.model, usage: aiData.usage },
            created_at: new Date().toISOString(),
          };
          setMessages(prev => [...prev, aiMsg]);
        }

        // Save conversation to SQLite for training
        const allMessages = [...messages, savedMsg, ...(aiMsgId ? [{
          id: aiMsgId,
          chat_id: chat.id,
          role: 'assistant' as const,
          content: aiData.content ?? '',
          is_restricted: false,
          metadata: {},
          created_at: new Date().toISOString(),
        }] : [])];
        
        const trainingMessages = allMessages.map(m => ({ role: m.role, content: m.content }));
        await saveConversation(chat.id, trainingMessages, selectedModel);

        // Auto-train: Add high-quality responses to training data
        if (!aiData.restricted && aiData.content.length > 50) {
          await addTrainingData(
            content,
            aiData.content,
            selectedModel,
            'chat_response',
            5 // Default high quality for non-restricted responses
          );
        }

        // Update chat title if it's the first message
        if (messages.length === 0) {
          await updateChatTitle(chat.id, content.slice(0, 60));
        }
      }

      return aiData;
    } finally {
      setSending(false);
    }
  }, [userId, activeChat, messages, createChat, updateChatTitle, profile, selectedModel]);

  return {
    chats,
    activeChat,
    messages,
    loading,
    sending,
    selectedModel,
    setSelectedModel,
    availableModels,
    loadChats: () => {}, // No longer needed with real-time listener
    createChat,
    selectChat,
    deleteChat,
    sendMessage,
    setActiveChat,
    setMessages,
  };
}
