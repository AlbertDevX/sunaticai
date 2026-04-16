import { useState, useRef, useEffect } from 'react';
import {
  Play, Square, Copy, Check, Wand2, ChevronDown,
  FolderOpen, FileCode2, Terminal, RefreshCw, Loader2, Plus, X,
} from 'lucide-react';

interface IDETab {
  id: string;
  name: string;
  language: string;
  content: string;
}

const LANGUAGES = [
  'python', 'javascript', 'typescript', 'bash', 'rust', 'go', 'c', 'cpp',
  'java', 'php', 'ruby', 'sql', 'html', 'css', 'dockerfile', 'yaml', 'json',
];

const STARTER_CODE: Record<string, string> = {
  python: '#!/usr/bin/env python3\n# CodeSec AI — Auto Builder\n\n',
  javascript: '// CodeSec AI — Auto Builder\n\n',
  typescript: '// CodeSec AI — Auto Builder\n\n',
  bash: '#!/bin/bash\n# CodeSec AI — Auto Builder\n\n',
  rust: 'fn main() {\n    // CodeSec AI — Auto Builder\n}\n',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    // CodeSec AI — Auto Builder\n}\n',
  c: '#include <stdio.h>\n\nint main() {\n    // CodeSec AI — Auto Builder\n    return 0;\n}\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // CodeSec AI — Auto Builder\n    return 0;\n}\n',
  html: '<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8">\n  <title>CodeSec</title>\n</head>\n<body>\n\n</body>\n</html>\n',
};

interface OnlineIDEProps {
  onSendAI: (content: string) => Promise<string | null>;
  sending: boolean;
}

export function OnlineIDE({ onSendAI, sending }: OnlineIDEProps) {
  const [tabs, setTabs] = useState<IDETab[]>([
    { id: '1', name: 'main.py', language: 'python', content: STARTER_CODE['python'] },
  ]);
  const [activeTab, setActiveTab] = useState('1');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [langDropdown, setLangDropdown] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const currentTab = tabs.find(t => t.id === activeTab) ?? tabs[0];

  function updateTabContent(content: string) {
    setTabs(prev => prev.map(t => t.id === activeTab ? { ...t, content } : t));
  }

  function syncScroll() {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

  useEffect(() => {
    syncScroll();
  }, [currentTab?.content]);

  function addTab() {
    const id = crypto.randomUUID();
    const newTab: IDETab = {
      id,
      name: `file${tabs.length + 1}.py`,
      language: 'python',
      content: STARTER_CODE['python'],
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTab(id);
  }

  function closeTab(id: string) {
    if (tabs.length === 1) return;
    const idx = tabs.findIndex(t => t.id === id);
    setTabs(prev => prev.filter(t => t.id !== id));
    if (activeTab === id) {
      setActiveTab(tabs[idx === 0 ? 1 : idx - 1].id);
    }
  }

  function changeLanguage(lang: string) {
    const ext: Record<string, string> = {
      python: 'py', javascript: 'js', typescript: 'ts', bash: 'sh',
      rust: 'rs', go: 'go', c: 'c', cpp: 'cpp', java: 'java', php: 'php',
      ruby: 'rb', sql: 'sql', html: 'html', css: 'css',
      dockerfile: 'Dockerfile', yaml: 'yml', json: 'json',
    };
    const name = `${currentTab.name.split('.')[0]}.${ext[lang] ?? lang}`;
    setTabs(prev => prev.map(t =>
      t.id === activeTab
        ? { ...t, language: lang, name, content: STARTER_CODE[lang] ?? t.content }
        : t
    ));
    setLangDropdown(false);
  }

  async function handleAIBuild() {
    if (!aiPrompt.trim() || aiLoading || sending) return;
    setAiLoading(true);
    try {
      const prompt = `[IDE AUTO BUILDER - Lenguaje: ${currentTab.language}]\n\nGenera codigo completo y funcional para: ${aiPrompt}\n\nResponde SOLO con el codigo, sin explicaciones adicionales. El codigo debe estar listo para ejecutar.`;
      const result = await onSendAI(prompt);
      if (result) {
        const code = extractCodeBlock(result, currentTab.language) ?? result;
        updateTabContent(code);
        setOutput(`[CodeSec AI] Codigo generado para: ${aiPrompt}\n[${new Date().toLocaleTimeString()}] Auto-build completado`);
        setShowOutput(true);
      }
    } finally {
      setAiLoading(false);
      setAiPrompt('');
    }
  }

  function extractCodeBlock(text: string, lang: string): string | null {
    const patterns = [
      new RegExp(`\`\`\`${lang}\\n([\\s\\S]*?)\`\`\``, 'i'),
      /```(?:\w+)?\n([\s\S]*?)```/,
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (m) return m[1].trim();
    }
    return null;
  }

  function copyCode() {
    navigator.clipboard.writeText(currentTab.content);
  }

  function copyOutput() {
    navigator.clipboard.writeText(output);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  }

  const lineCount = (currentTab?.content ?? '').split('\n').length;

  return (
    <div className="flex-1 flex flex-col bg-[#050508] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1a1a28] bg-[#080810]">
        <FileCode2 className="w-4 h-4 text-emerald-400" />
        <span className="text-white text-sm font-medium">IDE Online</span>
        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Auto Builder
        </span>
      </div>

      <div className="flex items-center gap-1 px-2 pt-2 border-b border-[#1a1a28] bg-[#080810] overflow-x-auto">
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-mono cursor-pointer transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-[#0d0d1a] text-white border-t border-x border-[#1e1e2e]'
                : 'text-[#4b5563] hover:text-[#9ca3af] hover:bg-[#0d0d1a]/50'
            }`}
          >
            <span>{tab.name}</span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addTab}
          className="p-1.5 text-[#374151] hover:text-[#6b7280] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-[#080810] border-b border-[#1a1a28]">
        <div className="relative">
          <button
            onClick={() => setLangDropdown(!langDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0d0d1a] border border-[#1e1e2e] hover:border-[#2a2a3a] text-[#9ca3af] text-xs font-mono rounded-lg transition-all"
          >
            <span>{currentTab?.language}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {langDropdown && (
            <div className="absolute top-full left-0 mt-1 w-36 bg-[#0d0d1a] border border-[#1e1e2e] rounded-xl shadow-xl z-50 py-1 max-h-56 overflow-y-auto">
              {LANGUAGES.map(l => (
                <button
                  key={l}
                  onClick={() => changeLanguage(l)}
                  className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors ${
                    l === currentTab?.language
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-[#6b7280] hover:text-white hover:bg-[#1a1a28]'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 flex items-center gap-2 bg-[#0d0d1a] border border-[#1e1e2e] focus-within:border-emerald-500/40 rounded-lg px-3 py-1 transition-colors">
          <Wand2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAIBuild()}
            placeholder="Describe lo que quieres construir..."
            className="flex-1 bg-transparent text-[#d0d8e8] placeholder-[#374151] text-xs outline-none font-mono"
          />
          <button
            onClick={handleAIBuild}
            disabled={aiLoading || sending || !aiPrompt.trim()}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 text-emerald-400 text-xs font-mono rounded-md transition-all"
          >
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            Build
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={copyCode} className="p-1.5 text-[#374151] hover:text-[#6b7280] transition-colors rounded-lg hover:bg-[#1a1a28]" title="Copiar">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setOutput(''); setShowOutput(!showOutput); }} className="p-1.5 text-[#374151] hover:text-[#6b7280] transition-colors rounded-lg hover:bg-[#1a1a28]" title="Terminal">
            <Terminal className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { updateTabContent(STARTER_CODE[currentTab?.language] ?? ''); }} className="p-1.5 text-[#374151] hover:text-[#6b7280] transition-colors rounded-lg hover:bg-[#1a1a28]" title="Reset">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden flex">
          <div
            ref={lineNumbersRef}
            className="select-none overflow-hidden bg-[#060610] border-r border-[#1a1a28] text-right pr-3 pl-3 text-[#2a3040] font-mono text-xs leading-6 pt-4 min-w-[3rem]"
            style={{ overflowY: 'hidden' }}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1}>{i + 1}</div>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            value={currentTab?.content ?? ''}
            onChange={e => updateTabContent(e.target.value)}
            onScroll={syncScroll}
            spellCheck={false}
            className="flex-1 bg-[#060610] text-[#a8c4dc] font-mono text-sm leading-6 resize-none outline-none p-4 pl-4 overflow-auto"
            style={{ tabSize: 2 }}
          />
        </div>

        {showOutput && (
          <div className="border-t border-[#1a1a28] bg-[#03030a]" style={{ height: '160px' }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a28]">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-[#4b5563] font-mono">output</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={copyOutput} className="text-[11px] text-[#374151] hover:text-[#6b7280] flex items-center gap-1 transition-colors">
                  {copiedOutput ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
                <button onClick={() => setShowOutput(false)} className="text-[#374151] hover:text-[#6b7280]">
                  <Square className="w-3 h-3" />
                </button>
              </div>
            </div>
            <pre className="p-3 text-xs font-mono text-emerald-400/80 overflow-auto h-[calc(160px-36px)] whitespace-pre-wrap leading-5">
              {output || '— sin output —'}
            </pre>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 px-4 py-2 border-t border-[#1a1a28] bg-[#080810] text-[10px] font-mono text-[#2a3040]">
        <div className="flex items-center gap-1.5">
          <FolderOpen className="w-3 h-3" />
          <span>workspace</span>
        </div>
        <span>·</span>
        <span>{currentTab?.language}</span>
        <span>·</span>
        <span>{lineCount} lineas</span>
        <span>·</span>
        <span>UTF-8</span>
        <div className="ml-auto flex items-center gap-1.5">
          <Play className="w-3 h-3 text-emerald-400" />
          <span className="text-emerald-400">AI Ready</span>
        </div>
      </div>
    </div>
  );
}
