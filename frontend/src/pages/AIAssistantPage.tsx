import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Zap, RefreshCw, Shield, Users, AlertTriangle, ChevronRight, Sparkles } from 'lucide-react';
import api from '../lib/api';
import { openAlertBox } from '../lib/toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: AlertTriangle, label: 'What are the top blockers?',    prompt: 'What are the most critical blockers in our current sprint that I should address today?' },
  { icon: Users,         label: 'Summarize team workload',       prompt: 'Summarize the current reviewer workload and flag anyone who is overloaded.' },
  { icon: Shield,        label: 'Why is sprint health low?',      prompt: 'Why is our sprint health score low and what specific actions can improve it?' },
  { icon: RefreshCw,     label: 'Which PRs have high churn?',    prompt: 'Which PRs are experiencing the most review churn and why might that be happening?' },
  { icon: Sparkles,      label: 'Cycle time breakdown',           prompt: 'Break down where our cycle time is being lost — is it review wait, coding, or merge delays?' },
];

function MarkdownText({ text }: { text: string }) {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-size:12px">$1</code>')
    .replace(/^### (.*)/gm, '<h3 style="font-size:14px;font-weight:700;margin:12px 0 6px;color:#e6edf3">$1</h3>')
    .replace(/^## (.*)/gm, '<h2 style="font-size:15px;font-weight:700;margin:12px 0 6px;color:#e6edf3">$1</h2>')
    .replace(/^- (.*)/gm, '<li style="margin:4px 0;padding-left:4px">$1</li>')
    .replace(/^\d+\. (.*)/gm, '<li style="margin:4px 0;padding-left:4px">$1</li>')
    .replace(/(<li.*<\/li>(\n|$))+/g, '<ul style="margin:8px 0;padding-left:20px">$&</ul>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '8px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--dd-accent)',
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm **DevDeck AI**, your engineering intelligence co-pilot.\n\nI have access to your real GitHub PR data, sprint metrics, and team velocity. Ask me anything about your engineering team's health.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await api.post('/ai/chat', { message: text.trim(), history });
      const reply = res.data.data.reply;
      setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }]);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'AI is unavailable. Make sure GEMINI_API_KEY is set in backend/.env';
      openAlertBox('error', errMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}`, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0, flexShrink: 0, padding: '20px 0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--dd-accent-dim)', border: '1px solid rgba(101,119,243,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={18} style={{ color: 'var(--dd-accent)' }} />
          </div>
          <div>
            <h1 className="page-title">AI Assistant</h1>
            <p className="page-subtitle">Powered by Google Gemini · Grounded in your real PR data</p>
          </div>
        </div>
        <div className="badge badge-accent"><Zap size={11} /> Gemini 1.5 Flash</div>
      </div>

      {/* Quick Prompts */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, flexShrink: 0 }}>
        {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
          <button
            key={label}
            onClick={() => sendMessage(prompt)}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--dd-border)',
              color: 'var(--dd-text-muted)', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(101,119,243,0.5)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--dd-text)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--dd-border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--dd-text-muted)'; }}
          >
            <Icon size={12} />
            {label}
            <ChevronRight size={10} />
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="dd-card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, marginBottom: 20,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            }}>
              {/* Avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: msg.role === 'assistant' ? 'var(--dd-accent-dim)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${msg.role === 'assistant' ? 'rgba(101,119,243,0.3)' : 'var(--dd-border)'}`,
              }}>
                {msg.role === 'assistant'
                  ? <Bot size={15} style={{ color: 'var(--dd-accent)' }} />
                  : <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--dd-text)' }}>U</span>
                }
              </div>
              {/* Bubble */}
              <div style={{
                maxWidth: '78%',
                padding: '12px 16px',
                borderRadius: msg.role === 'assistant' ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                background: msg.role === 'assistant' ? 'rgba(255,255,255,0.03)' : 'var(--dd-accent-dim)',
                border: `1px solid ${msg.role === 'assistant' ? 'var(--dd-border)' : 'rgba(101,119,243,0.25)'}`,
                fontSize: 13, lineHeight: 1.65, color: 'var(--dd-text)',
              }}>
                {msg.role === 'assistant' ? <MarkdownText text={msg.content} /> : msg.content}
                <div style={{ fontSize: 10, color: 'var(--dd-text-dim)', marginTop: 8, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dd-accent-dim)', border: '1px solid rgba(101,119,243,0.3)', flexShrink: 0 }}>
                <Bot size={15} style={{ color: 'var(--dd-accent)' }} />
              </div>
              <div style={{ padding: '12px 16px', borderRadius: '4px 12px 12px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--dd-border)' }}>
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--dd-border)', display: 'flex', gap: 8 }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about blockers, cycle time, reviewer recommendations…  (Enter to send, Shift+Enter for newline)"
            rows={1}
            style={{
              flex: 1, resize: 'none', padding: '10px 14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--dd-border)',
              borderRadius: 8, color: 'var(--dd-text)',
              fontSize: 13, outline: 'none', fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(101,119,243,0.5)'}
            onBlur={e => e.target.style.borderColor = 'var(--dd-border)'}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="btn-primary"
            style={{ padding: '0 16px', borderRadius: 8, flexShrink: 0 }}
          >
            {loading ? <RefreshCw size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
