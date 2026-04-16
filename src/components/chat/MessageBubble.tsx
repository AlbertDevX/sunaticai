import { useState, ReactNode } from 'react';
import { Copy, Check, Terminal, User, AlertTriangle } from 'lucide-react';
import { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 mb-6">
        <div className="max-w-[75%]">
          <div className="bg-[#1a2a3a] border border-cyan-500/20 rounded-2xl rounded-tr-sm px-4 py-3">
            <p className="text-[#e0e8f0] text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
        <div className="w-7 h-7 rounded-lg bg-[#1a2a3a] border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-3.5 h-3.5 text-cyan-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-6">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-cyan-500/20">
        <Terminal className="w-3.5 h-3.5 text-[#050508]" />
      </div>
      <div className="flex-1 min-w-0">
        {message.is_restricted && (
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-amber-400/70 font-mono">Contenido restringido · Verificado 18+</span>
          </div>
        )}
        <AIMessageContent content={message.content} />
      </div>
    </div>
  );
}

function AIMessageContent({ content }: { content: string }) {
  const parts = parseMarkdown(content);

  return (
    <div className="text-[#c8d0dc] text-sm leading-relaxed space-y-3">
      {parts.map((part, i) => {
        if (part.type === 'code') {
          return <CodeBlock key={i} code={part.content} language={part.language ?? ''} />;
        }
        if (part.type === 'heading') {
          return <h3 key={i} className="text-white font-semibold text-base mt-4 mb-1">{part.content}</h3>;
        }
        if (part.type === 'list') {
          return (
            <ul key={i} className="space-y-1 pl-2">
              {part.items?.map((item, j) => (
                <li key={j} className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1.5 shrink-0">▸</span>
                  <span className="text-[#c8d0dc]">{renderInlineFormat(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">{renderInlineFormat(part.content)}</p>
        );
      })}
    </div>
  );
}

function renderInlineFormat(text: string): ReactNode[] {
  const segments: ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(text.slice(lastIndex, match.index));
    }
    const raw = match[0];
    if (raw.startsWith('`') && raw.endsWith('`')) {
      segments.push(
        <code key={match.index} className="bg-[#1a1a28] text-cyan-300 px-1.5 py-0.5 rounded text-[12px] font-mono">
          {raw.slice(1, -1)}
        </code>
      );
    } else if (raw.startsWith('**') && raw.endsWith('**')) {
      segments.push(<strong key={match.index} className="text-white">{raw.slice(2, -2)}</strong>);
    } else if (raw.startsWith('*') && raw.endsWith('*')) {
      segments.push(<em key={match.index} className="text-[#a0b0c0]">{raw.slice(1, -1)}</em>);
    } else {
      segments.push(raw);
    }
    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex));
  }

  return segments.length > 0 ? segments : [text];
}

interface ParsedPart {
  type: 'text' | 'code' | 'heading' | 'list';
  content: string;
  language?: string;
  items?: string[];
}

function parseMarkdown(content: string): ParsedPart[] {
  const parts: ParsedPart[] = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      parts.push({ type: 'code', content: codeLines.join('\n'), language });
      i++;
      continue;
    }

    if (/^#{1,3} /.test(line)) {
      parts.push({ type: 'heading', content: line.replace(/^#{1,3} /, '') });
      i++;
      continue;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2));
        i++;
      }
      parts.push({ type: 'list', content: '', items });
      continue;
    }

    if (line.trim()) {
      const textLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].startsWith('```') &&
        !lines[i].startsWith('#') &&
        !lines[i].startsWith('- ') &&
        !lines[i].startsWith('* ')
      ) {
        textLines.push(lines[i]);
        i++;
      }
      if (textLines.length) {
        parts.push({ type: 'text', content: textLines.join('\n') });
        continue;
      }
    }

    i++;
  }

  return parts.length ? parts : [{ type: 'text', content }];
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[#1e2a38] bg-[#080c12] my-2">
      <div className="flex items-center justify-between px-4 py-2 bg-[#0d1520] border-b border-[#1e2a38]">
        <span className="text-[11px] text-[#4a6080] font-mono uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[11px] text-[#4a6080] hover:text-cyan-400 transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] font-mono text-[#a8c0d8] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
