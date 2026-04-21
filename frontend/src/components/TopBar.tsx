import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell, Settings, Search,
  Command, X, GitPullRequest,
  LogOut, User
} from 'lucide-react';
import { useAuthStore, useNotifStore } from '../store';
import { THEMES, applyThemeVars, getStoredTheme } from '../lib/themes';

const Panel = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 200,
    background: 'var(--dd-card)',
    border: '1px solid var(--dd-border)',
    borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
    minWidth: 280, ...style,
  }}>
    {children}
  </div>
);

export default function TopBar({ title }: { title?: string }) {
  const { user, clearAuth }  = useAuthStore();
  const { readIds, dismissedIds } = useNotifStore();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [activeTheme,   setActiveTheme]   = useState(() => getStoredTheme().id);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showProfile,   setShowProfile]   = useState(false);
  const [search,        setSearch]        = useState('');

  const shortcutsRef = useRef<HTMLDivElement>(null);
  const profileRef   = useRef<HTMLDivElement>(null);

  // Restore theme on mount
  useEffect(() => {
    const t = getStoredTheme();
    applyThemeVars(t);
    setActiveTheme(t.id);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shortcutsRef.current && !shortcutsRef.current.contains(e.target as Node)) setShowShortcuts(false);
      if (profileRef.current   && !profileRef.current.contains(e.target as Node))   setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const closeAll = () => { setShowShortcuts(false); setShowProfile(false); };

  const handleApplyTheme = (t: typeof THEMES[0]) => {
    applyThemeVars(t);
    setActiveTheme(t.id);
  };

  const unreadCount = [1, 2, 3].filter(id => !readIds.includes(id) && !dismissedIds.includes(id)).length;

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} style={{
      width: 36, height: 20, borderRadius: 10, cursor: 'pointer', border: 'none',
      background: on ? 'var(--dd-accent)' : 'var(--dd-surface-strong)',
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
          DevDeck
        </span>
        {title && (
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--dd-accent)', background: 'var(--dd-accent-dim)', padding: '3px 12px', borderRadius: 100, border: '1px solid var(--dd-border-active)' }}>
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

        {/* ⌘K — Theme Switcher */}
        <div ref={shortcutsRef} style={{ position: 'relative' }}>
          <button
            className="topbar-icon-btn"
            title="Theme Switcher (⌘K)"
            onClick={() => { setShowShortcuts(v => !v); setShowProfile(false); }}
            style={{ gap: 4, width: 'auto', padding: '0 10px', color: showShortcuts ? 'var(--dd-accent)' : undefined }}
          >
            <Command size={13} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>⌘K</span>
          </button>

          {showShortcuts && (
            <Panel style={{ minWidth: 288 }}>
              <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid var(--dd-border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', color: 'var(--dd-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Theme</div>
                <div style={{ fontSize: 11, color: 'var(--dd-text-dim)' }}>Click to switch — changes the entire UI</div>
              </div>
              {THEMES.map((t, i) => (
                <div
                  key={t.id}
                  onClick={() => { handleApplyTheme(t); setShowShortcuts(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                    cursor: 'pointer', borderBottom: '1px solid var(--dd-border)',
                    background: activeTheme === t.id ? 'var(--dd-accent-dim)' : 'none',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = activeTheme === t.id ? 'var(--dd-accent-dim)' : 'var(--dd-hover-overlay)')}
                  onMouseLeave={e => (e.currentTarget.style.background = activeTheme === t.id ? 'var(--dd-accent-dim)' : 'none')}
                >
                  {/* Colour swatch */}
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: t.accent, boxShadow: `0 0 6px ${t.accent}88`, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--dd-text)', flex: 1 }}>{t.label}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {activeTheme === t.id && <span style={{ fontSize: 10, color: t.accent, fontWeight: 700 }}>Active</span>}
                    {!t.isLight && (
                      <kbd style={{ background: 'var(--dd-surface)', border: '1px solid var(--dd-border)', borderRadius: 5, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: 'var(--dd-text)', fontFamily: 'monospace' }}>
                        ⌘{i + 1}
                      </kbd>
                    )}
                    {t.isLight && (
                      <kbd style={{ background: 'var(--dd-surface)', border: '1px solid var(--dd-border)', borderRadius: 5, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: 'var(--dd-text)', fontFamily: 'monospace' }}>
                        ⌘7
                      </kbd>
                    )}
                  </div>
                </div>
              ))}
              <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { navigate('/settings'); setShowShortcuts(false); }}
                  style={{ background: 'none', border: 'none', color: 'var(--dd-accent)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                >
                  All settings →
                </button>
              </div>
            </Panel>
          )}
        </div>

        {/* Bell → /notifications */}
        <button
          className="topbar-icon-btn"
          title="Notifications"
          onClick={() => { navigate('/notifications'); closeAll(); }}
          style={{ position: 'relative' }}
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, background: 'var(--dd-red)', borderRadius: '50%', border: '2px solid var(--dd-sidebar-bg)' }} />
          )}
        </button>

        {/* Gear → /settings */}
        <button
          className="topbar-icon-btn"
          title="Settings"
          onClick={() => { navigate('/settings'); closeAll(); }}
        >
          <Settings size={15} />
        </button>

        {/* Avatar / Profile dropdown */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowProfile(v => !v); setShowShortcuts(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {user?.avatar
              ? <img src={user.avatar} alt={user?.name} className="topbar-avatar" style={{ outline: showProfile ? '2px solid var(--dd-accent)' : undefined }} />
              : <div className="topbar-avatar-placeholder" style={{ outline: showProfile ? '2px solid var(--dd-accent)' : undefined }}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</div>
            }
          </button>

          {showProfile && (
            <Panel style={{ minWidth: 230 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--dd-border)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dd-text)' }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--dd-text-muted)', marginTop: 2 }}>{user?.email}</div>
              </div>
              {[
                { icon: User,          label: 'View Profile',      action: () => { setShowProfile(false); } },
                { icon: GitPullRequest, label: 'My Pull Requests',  action: () => { navigate('/prs'); setShowProfile(false); } },
                { icon: Settings,      label: 'Settings',           action: () => { navigate('/settings'); setShowProfile(false); } },
              ].map(({ icon: Icon, label, action }) => (
                <div key={label} onClick={action} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--dd-border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--dd-hover-overlay)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <Icon size={14} style={{ color: 'var(--dd-text-muted)' }} />
                  <span style={{ fontSize: 13, color: 'var(--dd-text)' }}>{label}</span>
                </div>
              ))}
              <div onClick={() => { clearAuth(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--dd-red-dim)')}
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
