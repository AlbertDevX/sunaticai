import { useEffect, useRef } from 'react';
import { Terminal, Shield, Code2, AlertTriangle, Wifi } from 'lucide-react';
import { Message, Chat } from '../../types';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

interface ChatWindowProps {
  activeChat: Chat | null;
  messages: Message[];
  sending: boolean;
  ageVerified: boolean;
  restrictionError: string | null;
  onSend: (content: string) => void;
  onClearError: () => void;
}

export function ChatWindow({
  activeChat, messages, sending, ageVerified, restrictionError, onSend, onClearError,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050508] relative overflow-hidden">
        <GridBg />
        <div className="relative z-10 text-center px-6 max-w-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-cyan-500/25">
            <Terminal className="w-8 h-8 text-[#050508]" />
          </div>
          <h2 className="text-white text-2xl font-bold mb-3">CodeSec AI</h2>
          <p className="text-[#4b5563] text-sm mb-8 leading-relaxed">
            IA especializada en programacion y ciberseguridad ofensiva/defensiva. Usa el panel izquierdo para iniciar una nueva sesion.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Code2, title: 'Programacion', desc: 'Todos los lenguajes, frameworks y arquitecturas', color: 'text-cyan-400' },
              { icon: Shield, title: 'CiberSec', desc: 'Pentesting, CTF, exploits, analisis de malware', color: 'text-emerald-400' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-[#0d0d14] border border-[#1e1e2e] rounded-xl p-4 text-left">
                <Icon className={`w-5 h-5 ${color} mb-2`} />
                <p className="text-white text-sm font-medium mb-1">{title}</p>
                <p className="text-[#4b5563] text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          {!ageVerified && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg text-left">
              <AlertTriangle className="w-4 h-4 text-amber-400/70 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-400/60 leading-relaxed">
                Acceso a contenido avanzado (18+) limitado. La verificacion se realiza automaticamente via Google si tienes la edad requerida.
              </p>
            </div>
          )}
          {ageVerified && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-lg">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <p className="text-[11px] text-emerald-400/70 font-mono">Modo sin restricciones activo · 18+ verificado</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#050508] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#1a1a28] bg-[#080810]">
        <Terminal className="w-4 h-4 text-cyan-400" />
        <h2 className="text-white text-sm font-medium truncate">{activeChat.title}</h2>
        {ageVerified && (
          <span className="ml-auto shrink-0 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            18+ OK
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {messages.length === 0 && (
          <div className="text-center text-[#2a2a3a] text-xs font-mono py-8">
            — Inicio de sesion —
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {sending && <TypingIndicator />}

        {restrictionError && (
          <AgeRestrictionBanner message={restrictionError} onClose={onClearError} />
        )}

        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={onSend} disabled={sending} />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shrink-0">
        <Terminal className="w-3.5 h-3.5 text-[#050508]" />
      </div>
      <div className="bg-[#0d0d1a] border border-[#1e1e2e] rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AgeRestrictionBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="flex gap-3 mb-4 animate-[fadeIn_0.3s_ease]">
      <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
      </div>
      <div className="flex-1 bg-amber-500/5 border border-amber-500/20 rounded-2xl rounded-tl-sm px-4 py-3">
        <p className="text-amber-400 text-xs font-semibold mb-1">Restriccion de edad</p>
        <p className="text-amber-400/70 text-xs leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="mt-2 text-[11px] text-amber-500/50 hover:text-amber-400/70 transition-colors underline underline-offset-2"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

function GridBg() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/3 rounded-full blur-3xl" />
      <svg className="absolute inset-0 w-full h-full opacity-[0.015]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="cgrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cgrid)" />
      </svg>
    </div>
  );
}
