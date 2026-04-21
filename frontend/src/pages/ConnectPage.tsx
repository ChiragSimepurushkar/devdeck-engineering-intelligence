import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { GitBranch, Plus, RefreshCw, CheckCircle2, ArrowRight, Key } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store';

const steps = ['Connect GitHub', 'Select Repos', 'Done'];

export default function ConnectPage() {
  const navigate = useNavigate();
  const { user, setAuth } = useAuthStore();
  const [step, setStep] = useState(user?.githubUsername ? 1 : 0);
  const [pat, setPat] = useState('');
  const [patError, setPatError] = useState('');
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [addingRepos, setAddingRepos] = useState(false);

  // Connect PAT
  const connectPAT = useMutation({
    mutationFn: (p: string) => api.post('/github/connect-pat', { pat: p }),
    onSuccess: (res) => {
      if (res.data.success) {
        // Update local user state with github username
        if (user) setAuth({ ...user, githubUsername: res.data.githubUsername }, localStorage.getItem('devdeck_token') || '');
        setStep(1);
        setPatError('');
      }
    },
    onError: (err: any) => setPatError(err.response?.data?.message || 'Failed to connect'),
  });

  // List available repos
  const { data: reposData, isLoading: reposLoading } = useQuery({
    queryKey: ['github-repos'],
    queryFn: () => api.get('/github/repos').then(r => r.data.repos),
    enabled: step === 1,
  });

  const handleAddRepos = async () => {
    setAddingRepos(true);
    try {
      for (const fullName of selectedRepos) {
        const [owner, name] = fullName.split('/');
        await api.post('/github/add-repo', { owner, name, fullName });
      }
      setStep(2);
    } finally {
      setAddingRepos(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-10">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 text-sm font-medium ${i <= step ? 'gradient-text' : ''}`}
                style={{ color: i > step ? 'var(--color-text-muted)' : undefined }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: i <= step ? 'var(--color-accent-gradient)' : 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                  {i < step ? <CheckCircle2 size={12} /> : i + 1}
                </div>
                {s}
              </div>
              {i < steps.length - 1 && <div className="flex-1 h-px" style={{ background: 'var(--glass-border)' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 0: PAT Input */}
        {step === 0 && (
          <div className="glass-card p-8 animate-scale-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(124,58,237,0.15)' }}>
                <Key size={20} style={{ color: 'var(--color-accent-1)' }} />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Connect GitHub</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Enter a Personal Access Token (PAT)</p>
              </div>
            </div>

            <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>Create a PAT at:</p>
              <a href="https://github.com/settings/tokens/new" target="_blank" rel="noreferrer"
                className="text-sm font-medium" style={{ color: 'var(--color-accent-2)' }}>
                github.com/settings/tokens/new ↗
              </a>
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                Scopes needed: <code className="px-1 rounded" style={{ background: 'var(--glass-bg)' }}>repo</code>, <code className="px-1 rounded" style={{ background: 'var(--glass-bg)' }}>read:user</code>
              </p>
            </div>

            <div className="mb-4">
              <input
                type="password"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full px-4 py-3 rounded-xl text-sm font-mono"
                style={{
                  background: 'var(--glass-bg)',
                  border: `1px solid ${patError ? 'var(--color-danger)' : 'var(--glass-border)'}`,
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                }}
              />
              {patError && <p className="text-xs mt-2" style={{ color: 'var(--color-danger)' }}>{patError}</p>}
            </div>

            <button
              onClick={() => connectPAT.mutate(pat)}
              disabled={!pat || connectPAT.isPending}
              className="btn-magnetic w-full"
            >
              {connectPAT.isPending ? 'Verifying...' : 'Connect GitHub'}
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 1: Repo Selection */}
        {step === 1 && (
          <div className="glass-card p-8 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl" style={{ background: 'rgba(124,58,237,0.15)' }}>
                  <GitBranch size={20} style={{ color: 'var(--color-accent-1)' }} />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Select Repositories</h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Choose repos to track</p>
                </div>
              </div>
              <span className="badge badge-accent">{selectedRepos.size} selected</span>
            </div>

            {reposLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto mb-6">
                {(reposData || []).map((repo: any) => {
                  const isSelected = selectedRepos.has(repo.fullName);
                  return (
                    <button
                      key={repo.fullName}
                      onClick={() => {
                        const s = new Set(selectedRepos);
                        isSelected ? s.delete(repo.fullName) : s.add(repo.fullName);
                        setSelectedRepos(s);
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl transition-all"
                      style={{
                        background: isSelected ? 'rgba(124,58,237,0.12)' : 'var(--glass-bg)',
                        border: `1px solid ${isSelected ? 'rgba(124,58,237,0.4)' : 'var(--glass-border)'}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-sm">{repo.fullName}</span>
                          {repo.language && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ background: 'var(--glass-bg)', color: 'var(--color-text-muted)' }}>
                              {repo.language}
                            </span>
                          )}
                        </div>
                        {isSelected && <CheckCircle2 size={16} style={{ color: 'var(--color-accent-1)' }} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleAddRepos} disabled={selectedRepos.size === 0 || addingRepos} className="btn-magnetic flex-1">
                {addingRepos ? <><RefreshCw size={16} className="animate-spin" /> Syncing...</> : <><Plus size={16} /> Track {selectedRepos.size} Repo{selectedRepos.size !== 1 ? 's' : ''}</>}
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn-ghost">
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Done */}
        {step === 2 && (
          <div className="glass-card p-8 animate-scale-in text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-glow"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)' }}>
              <CheckCircle2 size={32} style={{ color: 'var(--color-healthy)' }} />
            </div>
            <h2 className="font-display text-2xl font-bold mb-3">You're all set!</h2>
            <p className="mb-8" style={{ color: 'var(--color-text-secondary)' }}>
              GitHub sync started. PRs, reviews and metrics will appear on your dashboard in a few moments.
            </p>
            <button onClick={() => navigate('/dashboard')} className="btn-magnetic">
              Open Dashboard <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
