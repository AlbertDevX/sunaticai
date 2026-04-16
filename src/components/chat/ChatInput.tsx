import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Loader2, Paperclip, Command } from 'lucide-react';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = 'Pregunta algo sobre codigo o ciberseguridad...' }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function adjustHeight() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  const quickPrompts = [
    'Explica buffer overflow',
    'Crea un script Python',
    'SQL injection demo',
    'CTF Writeup',
  ];

  return (
    <div className="border-t border-[#1a1a28] bg-[#080810] p-4">
      {!input && (
        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-none pb-1">
          {quickPrompts.map(p => (
            <button
              key={p}
              onClick={() => setInput(p)}
              disabled={disabled}
              className="shrink-0 px-3 py-1.5 bg-[#111120] hover:bg-[#1a1a2e] border border-[#1e1e30] hover:border-[#2a2a40] text-[#6b7280] hover:text-[#9ca3af] text-xs rounded-lg transition-all duration-150 font-mono disabled:opacity-40"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3 bg-[#0d0d1a] border border-[#1e1e30] focus-within:border-cyan-500/40 rounded-xl p-3 transition-colors duration-200">
        <button className="p-1.5 text-[#374151] hover:text-[#6b7280] transition-colors rounded-lg hover:bg-[#1a1a28]">
          <Paperclip className="w-4 h-4" />
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => { setInput(e.target.value); adjustHeight(); }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="flex-1 bg-transparent text-[#d0d8e8] placeholder-[#374151] text-sm resize-none outline-none leading-relaxed min-h-[24px] max-h-[200px] disabled:opacity-50"
        />

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-[#2a2a3a] font-mono">
            <Command className="w-3 h-3" />
            <span>Enter</span>
          </div>
          <button
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:from-[#1e1e30] disabled:to-[#1e1e30] rounded-lg flex items-center justify-center transition-all duration-200 shadow-lg shadow-cyan-500/20 disabled:shadow-none"
          >
            {disabled ? (
              <Loader2 className="w-4 h-4 text-[#374151] animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-[#050508]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
