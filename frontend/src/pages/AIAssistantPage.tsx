import { Bot, Zap } from 'lucide-react';

export default function AIAssistantPage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Assistant</h1>
          <p className="page-subtitle">
            Chat with DevDeck Ethereal's AI for repository insights and predictions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="badge badge-accent">
            <Zap size={12} /> Beta
          </div>
        </div>
      </div>

      <div className="dd-card" style={{ padding: 40, textAlign: 'center', color: 'var(--dd-text-muted)' }}>
        <Bot size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--dd-text)' }}>DevDeck AI</h3>
        <p style={{ fontSize: 13, marginTop: 8 }}>Your AI assistant is ready. Ask questions about cycle time, stalled PRs, or reviewer workload.</p>
        <div style={{ marginTop: 24, maxWidth: 500, margin: '24px auto 0' }}>
          <input
            type="text"
            placeholder="Ask AI..."
            style={{
              width: '100%', padding: '12px 14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--dd-border)',
              borderRadius: 8, color: 'var(--dd-text)',
              fontSize: 14, outline: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}
