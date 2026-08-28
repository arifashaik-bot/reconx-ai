import React, { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, Bot, User, CornerDownLeft, RefreshCw } from 'lucide-react';
import { api } from '../../services/api.js';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isAiGenerated?: boolean;
  timestamp: string;
  suggestedFollowups?: string[];
}

interface Props {
  runId?: string;
  runName?: string;
}

export const AiChatInterface: React.FC<Props> = ({ runId, runName }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      sender: 'ai',
      text: `👋 Hello! I am your **RECONX Senior Financial Reconciliation Analyst**.\n\nI have indexed all transactions, matches, exceptions, and settlement data for **${runName || 'the current reconciliation run'}**.\n\nAsk me any question or choose one of the suggested prompts below:`,
      isAiGenerated: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedFollowups: [
        'Explain overall reconciliation match rate and health',
        'Show top high-value amount discrepancies across files',
        'Explain missing settlements and uncollected gateway funds',
        'Find possible duplicate records across sources',
      ],
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prompts, setPrompts] = useState<{ category: string; text: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const res = await api.getAiPrompts();
        setPrompts(res.prompts);
      } catch (err) {
        console.error('Failed to load prompts:', err);
      }
    };
    fetchPrompts();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryToSend?: string) => {
    const query = (queryToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryToSend) setInputQuery('');
    setIsLoading(true);

    try {
      const res = await api.queryAiAnalyst(query, runId);
      const aiMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: res.answer,
        isAiGenerated: res.isAiGenerated,
        suggestedFollowups: res.suggestedFollowups,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: `⚠️ An error occurred while analyzing the reconciliation data: ${err.message || 'Server error'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[700px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>RECONX AI Financial Analyst</span>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                SQLite Grounded
              </span>
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-md">
              Context: {runName || 'Active Reconciliation Run'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div key={m.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-2xl ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className={`p-4 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-cyan-500 text-slate-950 font-semibold rounded-tr-none shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  {m.text}
                </div>

                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                  <span>{m.timestamp}</span>
                  {m.isAiGenerated !== undefined && !isUser && (
                    <span>• {m.isAiGenerated ? 'OpenAI GPT Model' : 'Deterministic Database Intelligence'}</span>
                  )}
                </div>

                {/* Followups */}
                {m.suggestedFollowups && m.suggestedFollowups.length > 0 && !isUser && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {m.suggestedFollowups.map((f, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(f)}
                        className="text-[11px] bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-700 px-2.5 py-1 rounded-lg transition-colors text-left"
                      >
                        ⚡ {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start items-center text-xs text-cyan-400 font-mono">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <span>Analyzing database records and financial math...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      {prompts.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/30 flex gap-2 overflow-x-auto text-[11px] no-scrollbar">
          {prompts.slice(0, 4).map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p.text)}
              className="shrink-0 px-2.5 py-1 rounded-md bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            >
              {p.text}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask a question (e.g. 'Explain match rate', 'Find discrepancies', 'Investigate TXN-90210')..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="p-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/10"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
