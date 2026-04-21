import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, Activity, ArrowRight, ArrowLeft, Loader, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store';
import api from '../lib/api';

export default function ConnectPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) { setError('Please enter a repository URL or Owner/Repo'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/github/setup', { repoUrl });
      if (data.success) {
        setSuccess(true);
        useAuthStore.setState((state) => ({
          user: state.user ? { ...state.user, githubUsername: data.owner } : null
        }));
        setTimeout(() => navigate('/dashboard'), 1200);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to connect. Check the repo URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    'facebook/react',
    'vercel/next.js',
    'microsoft/vscode',
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--dd-bg)',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
    }}>
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0d1117 0%, #161b27 100%)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 64px',
      }}>
        <div style={{ position: 'absolute', width: 400, height: 400, top: '-80px', left: '-80px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(101,119,243,0.12) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, bottom: '-40px', right: '-40px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,203,169,0.09) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #6577f3, #00cba9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={20} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'Clash Display, Inter, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--dd-text)' }}>DevDeck</div>
            <div style={{ fontSize: 9, letterSpacing: '0.12em', color: 'var(--dd-text-muted)', textTransform: 'uppercase' }}>Engineering Intel</div>
          </div>
        </div>

        <h1 style={{ fontFamily: 'Clash Display, Inter, sans-serif', fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, color: 'var(--dd-text)', marginBottom: 16 }}>
          Connect your<br />
          <span style={{ background: 'linear-gradient(135deg, #6577f3, #00cba9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GitHub Repository</span>
        </h1>
        <p style={{ fontSize: 15, color: 'var(--dd-text-muted)', lineHeight: 1.65, maxWidth: 380, marginBottom: 48 }}>
          Link your target repository to unlock real-time PR health tracking, cycle time analytics, and AI-powered insights.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { icon: '📊', title: 'Live PR Matrix',      desc: 'Bubble visualization of all open PRs by health status.' },
            { icon: '⚡', title: 'Cycle Time Tracking', desc: 'Automated measurement from commit to production.' },
            { icon: '🤖', title: 'AI Stall Predictor',  desc: 'ML-powered prediction of PRs likely to stall.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dd-text)', marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--dd-text-muted)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 72px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--dd-text-muted)', fontSize: 13, cursor: 'pointer', marginBottom: 40, padding: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--dd-text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--dd-text-muted)')}
        >
          <ArrowLeft size={15} /> Back to Dashboard
        </button>

        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Clash Display, Inter, sans-serif', fontSize: 28, fontWeight: 700, color: 'var(--dd-text)', marginBottom: 8 }}>
            Welcome, {user?.name?.split(' ')[0] ?? 'there'} 👋
          </h2>
          <p style={{ fontSize: 14, color: 'var(--dd-text-muted)' }}>
            Enter your GitHub repository to start tracking engineering metrics.
          </p>
        </div>

        <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--dd-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Repository
            </label>
            <div style={{ position: 'relative' }}>
              <GitBranch size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--dd-text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="owner/repository"
                value={repoUrl}
                onChange={e => { setRepoUrl(e.target.value); setError(''); }}
                style={{
                  width: '100%', padding: '13px 14px 13px 40px',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${error ? 'var(--dd-red)' : 'rgba(255,255,255,0.09)'}`,
                  borderRadius: 10, color: 'var(--dd-text)', fontSize: 14,
                  outline: 'none', fontFamily: 'monospace',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { if (!error) e.target.style.borderColor = 'var(--dd-accent)'; }}
                onBlur={e => { if (!error) e.target.style.borderColor = 'rgba(255,255,255,0.09)'; }}
              />
            </div>
            {error && <div style={{ fontSize: 12, color: 'var(--dd-red)', marginTop: 6 }}>{error}</div>}
          </div>

          <div>
            <div style={{ fontSize: 11, color: 'var(--dd-text-dim)', marginBottom: 8 }}>Examples:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {examples.map(ex => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setRepoUrl(ex)}
                  style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--dd-text-muted)',
                    cursor: 'pointer', fontFamily: 'monospace', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--dd-text)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--dd-text-muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '14px 0', marginTop: 8,
              background: success ? '#3fb950' : 'var(--dd-accent)',
              border: 'none', borderRadius: 10,
              color: 'white', fontSize: 14, fontWeight: 600,
              cursor: loading || success ? 'not-allowed' : 'pointer',
              opacity: loading || success ? 0.9 : 1,
              transition: 'all 0.2s',
            }}
          >
            {success ? (
              <><CheckCircle2 size={17} /> Connected! Redirecting…</>
            ) : loading ? (
              <><Loader size={17} style={{ animation: 'spin 1s linear infinite' }} /> Connecting…</>
            ) : (
              <>Connect Repository <ArrowRight size={17} /></>
            )}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 28, padding: '12px 16px', background: 'rgba(101,119,243,0.06)', border: '1px solid rgba(101,119,243,0.15)', borderRadius: 10 }}>
          <CheckCircle2 size={14} style={{ color: '#3fb950', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--dd-text-muted)' }}>
            Read-only access only. DevDeck never writes to your repository.
          </span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
