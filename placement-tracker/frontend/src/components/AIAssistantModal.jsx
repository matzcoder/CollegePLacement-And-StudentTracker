import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles, User, HelpCircle } from 'lucide-react';
import { matchAssistantQuery, generateAssistantResponse } from '../lib/assistantMatcher';
import { usePlacement } from '../context/PlacementContext';

export default function AIAssistantModal({ isOpen, onClose }) {
  const { applications, stats } = usePlacement();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "👋 Hello! I am your AI Placement Assistant. I can help answer questions about your applications, shortlists, salary packages, and upcoming campus drives.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const SUGGESTIONS = [
    { label: '📋 Where did I apply?', query: 'Where did I apply?' },
    { label: '⚡ Am I shortlisted?', query: 'Am I shortlisted anywhere?' },
    { label: '💰 What is my package?', query: 'What is my package?' },
    { label: '🎉 Did I get an offer?', query: 'Did I get an offer?' },
    { label: '⏳ Pending applications', query: 'Which applications are pending?' },
    { label: '🏢 Companies visited', query: 'How many companies visited campus?' },
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isTyping) return;

    // Append user message
    setMessages((prev) => [...prev, { role: 'user', text: query }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const detectedIntent = matchAssistantQuery(query);
      const responseText = generateAssistantResponse(detectedIntent, applications, stats);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: responseText,
          intent: detectedIntent,
        },
      ]);
      setIsTyping(false);
    }, 250);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl shadow-indigo-950/40 flex flex-col h-[600px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 px-6 py-4 flex items-center justify-between border-b border-indigo-700/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Bot size={22} className="text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white">AI Placement Assistant</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                  <Sparkles size={10} className="text-amber-300" /> Live Data
                </span>
              </div>
              <p className="text-[11px] text-indigo-200/80 mt-0.5">
                Instant answers strictly scoped to your student records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            aria-label="Close Assistant"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="h-7 w-7 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={14} className="text-indigo-400" />
                </div>
              )}

              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-none shadow-md shadow-indigo-900/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                }`}
              >
                {m.text}
              </div>

              {m.role === 'user' && (
                <div className="h-7 w-7 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={14} className="text-violet-300" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-1 px-3 bg-slate-900/80 border border-slate-800/80 rounded-xl w-fit">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-[11px] text-slate-500 ml-1 font-medium">Assistant is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800/80 overflow-x-auto flex gap-1.5 scrollbar-none">
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s.query)}
              disabled={isTyping}
              className="text-[11px] font-semibold text-slate-300 bg-slate-800/80 hover:bg-indigo-950/80 hover:text-indigo-300 hover:border-indigo-700/70 border border-slate-700/70 px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-150 disabled:opacity-50"
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your applications, offers, shortlists..."
            disabled={isTyping}
            className="flex-1 bg-slate-950/80 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition"
          />
          <button
            onClick={() => handleSend()}
            disabled={isTyping || !input.trim()}
            className="h-10 w-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white flex items-center justify-center transition shadow-lg shadow-indigo-950/50 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            aria-label="Send Query"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
