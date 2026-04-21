import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell, Settings, Search, Palette,
  Command, X, GitPullRequest,
  CheckCheck, Clock, AlertCircle, LogOut, User
} from 'lucide-react';
import { useAuthStore } from '../store';

const THEMES = [
  { id: 'ethereal',  label: 'Ethereal Dark',  accent: '#6577f3', bg: '#0d1117' },
  { id: 'midnight',  label: 'Midnight Blue',  accent: '#3b82f6', bg: '#0a0f1e' },
  { id: 'forest',    label: 'Forest Dark',    accent: '#10b981', bg: '#0a1a12' },
  { id: 'rose',      label: 'Rose Nebula',    accent: '#f43f5e', bg: '#1a0a0f' },
  { id: 'amber',     label: 'Amber Dusk',     accent: '#f59e0b', bg: '#1a1200' },
  { id: 'cyberpunk', label: 'Cyberpunk',      accent: '#a855f7', bg: '#0d0a1a' },
];


const NOTIFS = [
  { icon: GitPullRequest, color: '#f85149', title: 'PR #756 is stalled',   sub: '48h without review · infra/k8s', time: '2m ago' },
  { icon: CheckCheck,     color: '#3fb950', title: 'PR #412 merged',        sub: 'feat/auth-v2 → main',             time: '14m ago' },
  { icon: AlertCircle,    color: '#d29922', title: 'High review latency',   sub: '3 PRs waiting > 24h',             time: '1h ago' },
  { icon: Clock,          color: '#6577f3', title: 'Sprint ends in 2 days', sub: '8 open items, 14 completed',      time: '3h ago' },
];

const Panel = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 200,
    background: '#1c2333', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
    minWidth: 280, ...style,
  }}>
    {children}
  </div>
);

export default function TopBar({ title }: { title?: string }) {
  const { user, clearAuth } = useAuthStore();
  const navigate   = useNavigate();
  const location   = useLocation();

  const [activeTheme,   setActiveTheme]   = useState('ethereal');
  const [showSettings,  setShowSettings]  = useState(false);
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showProfile,   setShowProfile]   = useState(false);
  const [search,        setSearch]        = useState('');
  const [unread,        setUnread]        = useState(NOTIFS.length);
  const [autoRefresh,   setAutoRefresh]   = useState(true);
  const [soundNotifs,   setSoundNotifs]   = useState(false);

  const settingsRef  = useRef<HTMLDivElement>(null);
  const notifsRef    = useRef<HTMLDivElement>(null);
  const shortcutsRef = useRef<HTMLDivElement>(null);
  const profileRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current  && !settingsRef.current.contains(e.target as Node))  setShowSettings(false);
      if (notifsRef.current    && !notifsRef.current.contains(e.target as Node))    setShowNotifs(false);
      if (shortcutsRef.current && !shortcutsRef.current.contains(e.target as Node)) setShowShortcuts(false);
      if (profileRef.current   && !profileRef.current.contains(e.target as Node))   setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const closeAll = () => { setShowSettings(false); setShowNotifs(false); setShowShortcuts(false); setShowProfile(false); };

  const applyTheme = (t: typeof THEMES[0]) => {
    document.documentElement.style.setProperty('--dd-accent', t.accent);
    document.documentElement.style.setProperty('--dd-accent-dim', t.accent + '26');
    document.documentElement.style.setProperty('--dd-bg', t.bg);
    document.body.style.background = t.bg;
    setActiveTheme(t.id);
  };

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} style={{
      width: 36, height: 20, borderRadius: 10, cursor: 'pointer', border: 'none',
      background: on ? 'var(--dd-accent)' : 'rgba(255,255,255,0.1)',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 18 : 3,
        width: 14, height: 14, borderRadius: '50%', background: 'white',
        transition: 'left 0.2s',
      }} />
    </button>
  );

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dd-text)', whiteSpace: 'nowrap' }}>
          DevDeck Ethereal
        </span>
        {title && (
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--dd-accent)', background: 'var(--dd-accent-dim)', padding: '3px 12px', borderRadius: 100, border: '1px solid rgba(101,119,243,0.3)' }}>
            {title}
          </span>
        )}
      </div>

      <div className="topbar-search">
        <Search size={13} />
        <input
          placeholder="Search PRs, repos, or team members…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') setSearch(''); }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--dd-text-muted)', cursor: 'pointer' }}>
            <X size={12} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

        <div ref={shortcutsRef} style={{ position: 'relative' }}>
          <button
            className="topbar-icon-btn"
            title="Theme Shortcuts (⌘K)"
            onClick={() => { setShowShortcuts(v => !v); setShowSettings(false); setShowNotifs(false); setShowProfile(false); }}
            style={{ gap: 4, width: 'auto', padding: '0 10px', color: showShortcuts ? 'var(--dd-accent)' : undefined }}
          >
            <Command size={13} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>⌘K</span>
          </button>

          {showShortcuts && (
            <Panel style={{ minWidth: 280 }}>
              <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', color: 'var(--dd-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Theme Shortcuts</div>
                <div style={{ fontSize: 11, color: 'var(--dd-text-dim)' }}>Press ⌘ + number to switch theme</div>
              </div>
              {THEMES.map((t, i) => (
                <div
                  key={t.id}
                  onClick={() => { applyTheme(t); setShowShortcuts(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', background: activeTheme === t.id ? 'rgba(101,119,243,0.06)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = activeTheme === t.id ? 'rgba(101,119,243,0.06)' : 'none')}
                >
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: t.accent, boxShadow: `0 0 6px ${t.accent}88`, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--dd-text)', flex: 1 }}>{t.label}</span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {activeTheme === t.id && <span style={{ fontSize: 10, color: t.accent, fontWeight: 700 }}>Active</span>}
                    <kbd style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: 'var(--dd-text)', fontFamily: 'monospace' }}>
                      ⌘{i + 1}
                    </kbd>
                  </div>
                </div>
              ))}
              <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--dd-text-dim)' }}>All themes</span>
                <button
                  onClick={() => { navigate('/settings'); setShowShortcuts(false); }}
                  style={{ background: 'none', border: 'none', color: 'var(--dd-accent)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                >
                  Open Settings →
                </button>
              </div>
            </Panel>
          )}
        </div>

        <div ref={notifsRef} style={{ position: 'relative' }}>
          <button
            className="topbar-icon-btn"
            title="Notifications"
            onClick={() => { setShowNotifs(v => !v); setShowSettings(false); setShowShortcuts(false); setShowProfile(false); setUnread(0); }}
            style={{ position: 'relative', color: showNotifs ? 'var(--dd-accent)' : undefined }}
          >
            <Bell size={15} />
            {unread > 0 && (
              <span style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, background: 'var(--dd-red)', borderRadius: '50%', border: '1.5px solid #161b27' }} />
            )}
          </button>

          {showNotifs && (
            <Panel style={{ minWidth: 320 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dd-text)' }}>Notifications</span>
                <button onClick={() => setShowNotifs(false)} style={{ background: 'none', border: 'none', color: 'var(--dd-text-muted)', cursor: 'pointer' }}><X size={14} /></button>
              </div>
              {NOTIFS.map(({ icon: Icon, color, title: t, sub, time }) => (
                <div key={t} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} style={{ color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--dd-text)' }}>{t}</div>
                    <div style={{ fontSize: 11, color: 'var(--dd-text-muted)', marginTop: 2 }}>{sub}</div>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--dd-text-dim)', whiteSpace: 'nowrap', paddingTop: 2 }}>{time}</span>
                </div>
              ))}
              <div style={{ padding: '10px 16px', textAlign: 'center' }}>
                <button onClick={() => setShowNotifs(false)} style={{ background: 'none', border: 'none', color: 'var(--dd-accent)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                  Mark all as read
                </button>
              </div>
            </Panel>
          )}
        </div>

        <div ref={settingsRef} style={{ position: 'relative' }}>
          <button
            className="topbar-icon-btn"
            title="Settings & Themes"
            onClick={() => { setShowSettings(v => !v); setShowNotifs(false); setShowShortcuts(false); setShowProfile(false); }}
            style={{ color: showSettings ? 'var(--dd-accent)' : undefined }}
          >
            <Settings size={15} />
          </button>

          {showSettings && (
            <Panel style={{ minWidth: 300 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dd-text)' }}>Settings</span>
                <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'var(--dd-text-muted)', cursor: 'pointer' }}><X size={14} /></button>
              </div>

              <div style={{ padding: '12px 16px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', color: 'var(--dd-text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
                  <Palette size={12} /> Theme
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => applyTheme(t)} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                      background: activeTheme === t.id ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)',
                      border: activeTheme === t.id ? `1px solid ${t.accent}55` : '1px solid rgba(255,255,255,0.06)',
                      textAlign: 'left', color: 'var(--dd-text)', transition: 'all 0.15s',
                    }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.accent, flexShrink: 0, boxShadow: `0 0 6px ${t.accent}88` }} />
                      <span style={{ fontSize: 11, fontWeight: 500 }}>{t.label}</span>
                      {activeTheme === t.id && <span style={{ marginLeft: 'auto', fontSize: 10, color: t.accent }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '8px 16px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', color: 'var(--dd-text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Preferences</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--dd-text-muted)' }}>Auto-refresh data</span>
                  <Toggle on={autoRefresh} onToggle={() => setAutoRefresh(v => !v)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--dd-text-muted)' }}>Sound notifications</span>
                  <Toggle on={soundNotifs} onToggle={() => setSoundNotifs(v => !v)} />
                </div>
              </div>
            </Panel>
          )}
        </div>

        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowProfile(v => !v); closeAll(); setShowProfile(v => !v); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} className="topbar-avatar" style={{ outline: showProfile ? '2px solid var(--dd-accent)' : undefined }} />
              : <div className="topbar-avatar-placeholder" style={{ outline: showProfile ? '2px solid var(--dd-accent)' : undefined }}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</div>
            }
          </button>

          {showProfile && (
            <Panel style={{ minWidth: 220 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dd-text)' }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--dd-text-muted)', marginTop: 2 }}>{user?.email}</div>
              </div>
              {[
                { icon: User,          label: 'View Profile',     action: () => { setShowProfile(false); } },
                { icon: GitPullRequest, label: 'My Pull Requests', action: () => { navigate('/prs'); setShowProfile(false); } },
                { icon: Settings,      label: 'Preferences',      action: () => { setShowProfile(false); setShowSettings(true); } },
              ].map(({ icon: Icon, label, action }) => (
                <div key={label} onClick={action} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <Icon size={14} style={{ color: 'var(--dd-text-muted)' }} />
                  <span style={{ fontSize: 13, color: 'var(--dd-text)' }}>{label}</span>
                </div>
              ))}
              <div onClick={() => { clearAuth(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,81,73,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <LogOut size={14} style={{ color: 'var(--dd-red)' }} />
                <span style={{ fontSize: 13, color: 'var(--dd-red)' }}>Sign out</span>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </header>
  );
}
