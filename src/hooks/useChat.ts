import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Chat, Message, AIResponse, AppView } from '../types';

export function useChat(userId: string | undefined) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const loadChats = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    setChats(data ?? []);
    setLoading(false);
  }, [userId]);

  const loadMessages = useCallback(async (chatId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    setMessages(data ?? []);
  }, []);

  const createChat = useCallback(async (mode: AppView = 'chat', title = 'New Chat') => {
    if (!userId) return null;
    const { data } = await supabase
      .from('chats')
      .insert({ user_id: userId, title, mode })
      .select()
      .single();
    if (data) {
      setChats(prev => [data, ...prev]);
      setActiveChat(data);
      setMessages([]);
    }
    return data;
  }, [userId]);

  const selectChat = useCallback(async (chat: Chat) => {
    setActiveChat(chat);
    await loadMessages(chat.id);
  }, [loadMessages]);

  const deleteChat = useCallback(async (chatId: string) => {
    await supabase.from('chats').delete().eq('id', chatId);
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (activeChat?.id === chatId) {
      setActiveChat(null);
      setMessages([]);
    }
  }, [activeChat]);

  const updateChatTitle = useCallback(async (chatId: string, title: string) => {
    await supabase
      .from('chats')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', chatId);
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, title } : c));
  }, []);

  const sendMessage = useCallback(async (
    content: string,
    mode: AppView = 'chat',
    sessionToken: string | null
  ): Promise<AIResponse> => {
    if (!userId || !content.trim()) return { error: 'Invalid request' };
    if (!sessionToken) return { error: 'No active session' };

    setSending(true);
    try {
      let chat = activeChat;

      if (!chat) {
        chat = await createChat(mode, content.slice(0, 50));
        if (!chat) return { error: 'Failed to create chat' };
      }

      const userMsg: Omit<Message, 'id' | 'created_at'> = {
        chat_id: chat.id,
        role: 'user',
        content,
        is_restricted: false,
        metadata: {},
      };

      const { data: savedMsg } = await supabase
        .from('messages')
        .insert(userMsg)
        .select()
        .single();

      if (savedMsg) {
        setMessages(prev => [...prev, savedMsg]);
      }

      const historyMessages = [...messages, savedMsg ?? { ...userMsg, id: '', created_at: '' }]
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            messages: historyMessages,
            chatId: chat.id,
          }),
        }
      );

      if (!response.ok && response.status !== 403) {
        return { error: 'AI service error' };
      }

      const aiData: AIResponse = await response.json();

      if (aiData.content) {
        const { data: aiMsg } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chat.id)
          .eq('role', 'assistant')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (aiMsg) {
          setMessages(prev => [...prev, aiMsg]);
        } else {
          const tempMsg: Message = {
            id: crypto.randomUUID(),
            chat_id: chat.id,
            role: 'assistant',
            content: aiData.content ?? '',
            is_restricted: false,
            metadata: {},
            created_at: new Date().toISOString(),
          };
          setMessages(prev => [...prev, tempMsg]);
        }

        if (messages.length === 0) {
          await updateChatTitle(chat.id, content.slice(0, 60));
          setChats(prev => prev.map(c =>
            c.id === chat!.id
              ? { ...c, title: content.slice(0, 60), updated_at: new Date().toISOString() }
              : c
          ));
        }
      }

      return aiData;
    } finally {
      setSending(false);
    }
  }, [userId, activeChat, messages, createChat, updateChatTitle]);

  return {
    chats,
    activeChat,
    messages,
    loading,
    sending,
    loadChats,
    createChat,
    selectChat,
    deleteChat,
    sendMessage,
    setActiveChat,
    setMessages,
  };
}
