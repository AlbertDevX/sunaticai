import { useEffect } from 'react';
import { Plus, MessageSquare, Code2, Trash2, Terminal } from 'lucide-react';
import { Chat } from '../../types';

interface ChatSidebarProps {
  chats: Chat[];
  activeChat: Chat | null;
  loading: boolean;
  onLoadChats: () => void;
  onSelectChat: (chat: Chat) => void;
  onNewChat: (mode: 'chat' | 'ide') => void;
  onDeleteChat: (id: string) => void;
}

export function ChatSidebar({
  chats, activeChat, loading, onLoadChats, onSelectChat, onNewChat, onDeleteChat,
}: ChatSidebarProps) {
  useEffect(() => {
    onLoadChats();
  }, [onLoadChats]);

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} dias`;
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  }

  const grouped = chats.reduce<Record<string, Chat[]>>((acc, chat) => {
    const label = formatDate(chat.updated_at);
    if (!acc[label]) acc[label] = [];
    acc[label].push(chat);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full bg-[#080810] border-r border-[#1a1a28]">
      <div className="p-4 border-b border-[#1a1a28]">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-lg flex items-center justify-center">
            <Terminal className="w-3.5 h-3.5 text-[#050508]" />
          </div>
          <span className="text-white font-semibold text-sm">CodeSec AI</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNewChat('chat')}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 text-xs font-medium rounded-lg transition-all duration-150"
          >
            <Plus className="w-3.5 h-3.5" />
            Chat
          </button>
          <button
            onClick={() => onNewChat('ide')}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-xs font-medium rounded-lg transition-all duration-150"
          >
            <Plus className="w-3.5 h-3.5" />
            IDE
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        )}

        {!loading && chats.length === 0 && (
          <div className="text-center py-10 px-4">
            <MessageSquare className="w-8 h-8 text-[#2a2a3a] mx-auto mb-3" />
            <p className="text-[#4b5563] text-xs">Sin conversaciones aun</p>
            <p className="text-[#374151] text-[11px] mt-1">Crea un nuevo chat o IDE</p>
          </div>
        )}

        {Object.entries(grouped).map(([label, groupChats]) => (
          <div key={label} className="mb-4">
            <p className="text-[10px] text-[#374151] font-mono uppercase tracking-wider px-2 mb-1.5">{label}</p>
            {groupChats.map(chat => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={activeChat?.id === chat.id}
                onSelect={() => onSelectChat(chat)}
                onDelete={() => onDeleteChat(chat.id)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function ChatItem({ chat, isActive, onSelect, onDelete }: ChatItemProps) {
  return (
    <div
      onClick={onSelect}
      className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 mb-0.5 ${
        isActive
          ? 'bg-[#1a1a28] text-white'
          : 'text-[#6b7280] hover:bg-[#111120] hover:text-[#9ca3af]'
      }`}
    >
      {chat.mode === 'ide' ? (
        <Code2 className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-[#374151] group-hover:text-emerald-400/60'}`} />
      ) : (
        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-[#374151] group-hover:text-cyan-400/60'}`} />
      )}
      <span className="flex-1 text-xs truncate">{chat.title}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all rounded"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}
