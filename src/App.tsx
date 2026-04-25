import { useState, useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { useChat } from './hooks/useChat';
import { LoginPage } from './components/auth/LoginPage';
import { ChatSidebar } from './components/chat/ChatSidebar';
import { ChatWindow } from './components/chat/ChatWindow';
import { OnlineIDE } from './components/ide/OnlineIDE';
import { Header } from './components/layout/Header';
import { AppView } from './types';

export default function App() {
  const { user, session, profile, loading, signInWithGoogle, signOut } = useAuth();
  const {
    chats, activeChat, messages, loading: chatsLoading, sending,
    loadChats, createChat, selectChat, deleteChat, sendMessage,
    setActiveChat, setMessages,
  } = useChat(user?.uid);

  const [activeView, setActiveView] = useState<AppView>('chat');
  const [restrictionError, setRestrictionError] = useState<string | null>(null);

  function handleViewChange(view: AppView) {
    setActiveView(view);
    if (view !== activeChat?.mode) {
      setActiveChat(null);
      setMessages([]);
    }
  }

  async function handleSend(content: string) {
    const result = await sendMessage(content, activeView, null);
    if (result?.error === 'age_restricted' && result.message) {
      setRestrictionError(result.message);
    }
  }

  const handleSendAI = useCallback(async (content: string): Promise<string | null> => {
    let chat = activeChat;
    if (!chat) {
      chat = await createChat('ide', content.slice(0, 50));
    }
    if (!chat) return null;

    const historyMsgs = [{ role: 'user', content }];

    try {
      const aiEndpoint = import.meta.env.VITE_AI_ENDPOINT || 'http://localhost:3000/api/ai-chat';
      const response = await fetch(aiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: historyMsgs, chatId: chat.id }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (data?.error === 'age_restricted') {
        setRestrictionError(data.message);
        return null;
      }
      return data?.content ?? null;
    } catch {
      return null;
    }
  }, [activeChat, createChat]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-[#374151] text-sm font-mono">Iniciando CodeSec AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onSignIn={signInWithGoogle} />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#050508] overflow-hidden">
      <Header
        profile={profile}
        activeView={activeView}
        onViewChange={handleViewChange}
        onSignOut={signOut}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-56 shrink-0 hidden md:flex flex-col">
          <ChatSidebar
            chats={chats.filter(c => c.mode === activeView)}
            activeChat={activeChat}
            loading={chatsLoading}
            onLoadChats={loadChats}
            onSelectChat={selectChat}
            onNewChat={async (mode) => {
              setActiveView(mode);
              await createChat(mode);
            }}
            onDeleteChat={deleteChat}
          />
        </div>

        <div className="flex-1 flex overflow-hidden">
          {activeView === 'chat' ? (
            <ChatWindow
              activeChat={activeChat}
              messages={messages}
              sending={sending}
              ageVerified={profile?.age_verified ?? false}
              restrictionError={restrictionError}
              onSend={handleSend}
              onClearError={() => setRestrictionError(null)}
            />
          ) : (
            <OnlineIDE
              onSendAI={handleSendAI}
              sending={sending}
            />
          )}
        </div>
      </div>
    </div>
  );
}
