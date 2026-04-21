import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Bot, Send, Sparkles, User } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  'Why is our sprint score dropping?',
  'Which PRs are at risk this week?',
  'Who should review the latest PRs?',
  'What are the top blockers right now?',
];

export default function AIAssistantPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hey ${user?.name?.split(' ')[0] || 'there'} 👋 I'm your DevDeck AI assistant. I have access to your real-time PR data, team metrics, and sprint health. Ask me anything about your engineering team.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const chat = useMutation({
    mutationFn: (msg: string) => api.post('/ai/chat', { message: msg }).then(r => r.data.data.reply),
    onSuccess: (reply) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    },
  });

  const handleSend = (msg?: string) => {
    const text = msg || input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: 'user', content: text, timestamp: new Date() }]);
    setInput('');
    chat.mutate(text);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  return (
    <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center gap-3 mb-6 animate-fade-in flex-shrink-0">
        <div className="p-2 rounded-xl animate-pulse-glow" style={{ background: 'rgba(124,58,237,0.15)' }}>
          <Bot size={20} style={{ color: 'var(--color-accent-1)' }} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">AI Assistant</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Grounded in your real PR data</p>
        </div>
        <span className="badge badge-accent ml-auto flex items-center gap-1">
          <Sparkles size={10} /> Context-aware
        </span>
      </div>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0 animate-fade-in delay-100">
        {QUICK_PROMPTS.map((q) => (
          <button key={q} onClick={() => handleSend(q)} className="btn-ghost text-xs" style={{ padding: '6px 14px' }}>
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="glass-card flex-1 overflow-y-auto p-6 space-y-4" style={{ minHeight: 0 }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 animate-fade-in-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: msg.role === 'assistant' ? 'rgba(124,58,237,0.2)' : 'rgba(6,182,212,0.2)', border: '1px solid var(--glass-border)' }}>
              {msg.role === 'assistant' ? <Bot size={14} style={{ color: 'var(--color-accent-1)' }} /> : <User size={14} style={{ color: 'var(--color-accent-2)' }} />}
            </div>
            <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'}`}
              style={{
                background: msg.role === 'user' ? 'rgba(6,182,212,0.1)' : 'var(--glass-bg)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(6,182,212,0.2)' : 'var(--glass-border)'}`,
                whiteSpace: 'pre-wrap',
              }}>
              {msg.content}
            </div>
          </div>
        ))}
        {chat.isPending && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.2)' }}>
              <Bot size={14} style={{ color: 'var(--color-accent-1)' }} />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full" style={{ background: 'var(--color-accent-1)', animation: `pulse-glow 1.2s ${i * 0.2}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3 mt-4 flex-shrink-0 animate-fade-in delay-200">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask about sprint health, blockers, reviewer recommendations..."
          className="flex-1 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--color-text-primary)', outline: 'none' }}
        />
        <button onClick={() => handleSend()} disabled={!input.trim() || chat.isPending} className="btn-magnetic" style={{ padding: '12px 20px' }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
