import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, GitBranch, Activity, Loader, Search, Unlock } from 'lucide-react';
import { useAuthStore } from '../store';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function ConnectPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<1 | 2>(1); // 1 = PAT, 2 = Repos

  // Step 1 State
  const [pat, setPat] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorPat, setErrorPat] = useState('');

  // Step 2 State
  const [repos, setRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [search, setSearch] = useState('');
  const [addingRepo, setAddingRepo] = useState('');

  const handleVerifyPat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pat.trim()) { setErrorPat('Please enter a GitHub Personal Access Token'); return; }
    setVerifying(true);
    setErrorPat('');
    try {
      const { data } = await api.post('/github/connect-pat', { pat });
      if (data.success) {
        toast.success(`Connected as ${data.githubUsername}!`);
        useAuthStore.setState((state) => ({
          user: state.user ? { ...state.user, githubUsername: data.githubUsername } : null
        }));
        setStep(2);
        fetchRepos();
      }
    } catch (err: any) {
      setErrorPat(err.response?.data?.message || 'Invalid PAT. Make sure it has "repo" scope.');
    } finally {
      setVerifying(false);
    }
  };

  const fetchRepos = async () => {
    setLoadingRepos(true);
    try {
      const { data } = await api.get('/github/repos');
      if (data.success) setRepos(data.repos);
    } catch (err: any) {
      toast.error('Failed to fetch repositories.');
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleAddRepo = async (repo: any) => {
    setAddingRepo(repo.fullName);
    try {
      const { data } = await api.post('/github/add-repo', {
        owner: repo.owner,
        name: repo.name,
        fullName: repo.fullName,
        defaultBranch: repo.defaultBranch
      });
      if (data.success) {
        toast.success('Repository connected!');
        setTimeout(() => navigate('/dashboard'), 1000);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to connect repository.');
      setAddingRepo('');
    }
  };

  const filteredRepos = repos.filter(r => r.fullName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--dd-bg)',
      display: 'grid', gridTemplateColumns: '1fr 1fr',
    }}>
      {/* Left Decoration Panel */}
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
          <span style={{ background: 'linear-gradient(135deg, #6577f3, #00cba9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Workspace</span>
        </h1>
        <p style={{ fontSize: 15, color: 'var(--dd-text-muted)', lineHeight: 1.65, maxWidth: 380, marginBottom: 48 }}>
          Link your GitHub account to unlock real-time PR health tracking, cycle time analytics, and AI-powered insights.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { icon: '📊', title: 'Live PR Matrix',      desc: 'Bubble visualization of all open PRs by health status.' },
            { icon: '⚡', title: 'Cycle Time Tracking', desc: 'Automated measurement from commit to production.' },
            { icon: '🤖', title: 'AI Blockers',         desc: 'AI-powered parsing of blockers and overloaded reviewers.' },
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

      {/* Right Interaction Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 60, paddingBottom: 60, paddingLeft: 72, paddingRight: 72, maxHeight: '100vh', overflowY: 'auto' }}>
        
        {step === 1 ? (
          <div className="animate-fade-in-up">
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: 'Clash Display, Inter, sans-serif', fontSize: 28, fontWeight: 700, color: 'var(--dd-text)', marginBottom: 8 }}>
                Welcome, {user?.name?.split(' ')[0] ?? 'there'} 👋
              </h2>
              <p style={{ fontSize: 14, color: 'var(--dd-text-muted)' }}>
                Securely link your GitHub account using a Personal Access Token.
              </p>
            </div>

            <form onSubmit={handleVerifyPat} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 600, color: 'var(--dd-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <span>Personal Access Token</span>
                  <a href="https://github.com/settings/tokens/new?scopes=repo,read:org" target="_blank" rel="noreferrer" style={{ textTransform: 'none', color: 'var(--dd-accent)', textDecoration: 'none' }}>Get a token</a>
                </label>
                <div style={{ position: 'relative' }}>
                  <Key size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--dd-text-muted)', pointerEvents: 'none' }} />
                  <input
                    type="password"
                    placeholder="ghp_****************************"
                    value={pat}
                    onChange={e => { setPat(e.target.value); setErrorPat(''); }}
                    style={{
                      width: '100%', padding: '13px 14px 13px 40px',
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${errorPat ? 'var(--dd-red)' : 'rgba(255,255,255,0.09)'}`,
                      borderRadius: 10, color: 'var(--dd-text)', fontSize: 14,
                      outline: 'none', fontFamily: 'monospace',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => { if (!errorPat) e.target.style.borderColor = 'var(--dd-accent)'; }}
                    onBlur={e => { if (!errorPat) e.target.style.borderColor = 'rgba(255,255,255,0.09)'; }}
                  />
                </div>
                {errorPat && <div style={{ fontSize: 12, color: 'var(--dd-red)', marginTop: 6 }}>{errorPat}</div>}
              </div>

              <button
                type="submit"
                disabled={verifying || !pat}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '14px 0', marginTop: 8,
                  background: 'var(--dd-accent)', border: 'none', borderRadius: 10,
                  color: 'white', fontSize: 14, fontWeight: 600,
                  cursor: verifying || !pat ? 'not-allowed' : 'pointer',
                  opacity: verifying || !pat ? 0.7 : 1, transition: 'all 0.2s',
                }}
              >
                {verifying ? <><Loader size={17} style={{ animation: 'spin 1s linear infinite' }} /> Verifying…</> : <><Unlock size={17} /> Connect GitHub</>}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 28, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
              <ShieldIcon color="var(--dd-text-muted)" />
              <span style={{ fontSize: 12, color: 'var(--dd-text-muted)', lineHeight: 1.5 }}>
                Your token is fully encrypted at rest using AES-256-GCM. We only require read-only `repo` access.
              </span>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Clash Display, Inter, sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--dd-text)', marginBottom: 8 }}>
                Select a Repository
              </h2>
              <p style={{ fontSize: 13, color: 'var(--dd-text-muted)' }}>
                Choose the codebase you want to connect to your DevDeck dashboard.
              </p>
            </div>

            <div style={{ position: 'relative', marginBottom: 20 }}>
              <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--dd-text-muted)' }} />
              <input
                type="text"
                placeholder="Search repositories..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '11px 14px 11px 40px', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--dd-text)',
                  fontSize: 13, outline: 'none',
                }}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
              {loadingRepos ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 16 }}>
                  <Loader size={24} style={{ color: 'var(--dd-accent)', animation: 'spin 1s linear infinite' }} />
                  <div style={{ fontSize: 13, color: 'var(--dd-text-muted)' }}>Fetching repositories...</div>
                </div>
              ) : filteredRepos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--dd-text-dim)', fontSize: 13 }}>
                  No repositories found matching "{search}"
                </div>
              ) : (
                filteredRepos.map(repo => (
                  <div key={repo.id} onClick={() => !addingRepo && handleAddRepo(repo)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px', background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8,
                    cursor: addingRepo ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if(!addingRepo) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; } }}
                  onMouseLeave={e => { if(!addingRepo) { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; } }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <GitBranch size={14} color="var(--dd-text-dim)" />
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--dd-text)' }}>{repo.fullName}</span>
                        {repo.private && <span className="badge badge-gray" style={{ fontSize: 10 }}>Private</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--dd-text-dim)' }}>
                        {repo.description ? (repo.description.length > 60 ? repo.description.substring(0,60)+'...' : repo.description) : 'No description'}
                      </div>
                    </div>
                    
                    <button disabled={addingRepo === repo.fullName} style={{
                      padding: '6px 12px', background: addingRepo === repo.fullName ? 'var(--dd-accent-dim)' : 'transparent',
                      border: `1px solid ${addingRepo === repo.fullName ? 'var(--dd-accent)' : 'var(--dd-border)'}`,
                      borderRadius: 6, color: addingRepo === repo.fullName ? 'var(--dd-accent)' : 'var(--dd-text)',
                      fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      {addingRepo === repo.fullName ? <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Adding</> : 'Connect'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ShieldIcon({ color }: { color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  );
}
