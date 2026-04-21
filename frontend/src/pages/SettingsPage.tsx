import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette, Bell, User, Shield, Monitor, ArrowLeft,
  Check, Globe, Zap, Moon, Sun, Sliders, RefreshCw,
  GitBranch, LogOut, Mail, Key
} from 'lucide-react';
import { useAuthStore } from '../store';

const THEMES = [
  { id: 'ethereal',  label: 'Ethereal Dark',  accent: '#6577f3', bg: '#0d1117', preview: ['#0d1117','#161b27','#6577f3'] },
  { id: 'midnight',  label: 'Midnight Blue',  accent: '#3b82f6', bg: '#0a0f1e', preview: ['#0a0f1e','#0f172a','#3b82f6'] },
  { id: 'forest',    label: 'Forest Dark',    accent: '#10b981', bg: '#0a1a12', preview: ['#0a1a12','#0f2418','#10b981'] },
  { id: 'rose',      label: 'Rose Nebula',    accent: '#f43f5e', bg: '#1a0a0f', preview: ['#1a0a0f','#2a0f18','#f43f5e'] },
  { id: 'amber',     label: 'Amber Dusk',     accent: '#f59e0b', bg: '#1a1200', preview: ['#1a1200','#261a00','#f59e0b'] },
  { id: 'cyberpunk', label: 'Cyberpunk',      accent: '#a855f7', bg: '#0d0a1a', preview: ['#0d0a1a','#160f26','#a855f7'] },
];

const SECTIONS = [
  { id: 'appearance', label: 'Appearance',    icon: Palette  },
  { id: 'account',    label: 'Account',       icon: User     },
  { id: 'notifications', label: 'Notifications', icon: Bell  },
  { id: 'integrations',  label: 'Integrations',  icon: GitBranch },
  { id: 'security',   label: 'Security',      icon: Shield   },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      width: 40, height: 22, borderRadius: 11, cursor: 'pointer', border: 'none',
      background: on ? 'var(--dd-accent)' : 'rgba(255,255,255,0.1)',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 4, left: on ? 20 : 4,
        width: 14, height: 14, borderRadius: '50%', background: 'white',
        transition: 'left 0.2s',
      }} />
    </button>
  );
}

function SectionRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--dd-text)' }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--dd-text-muted)', marginTop: 3 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0, marginLeft: 24 }}>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('appearance');
  const [activeTheme, setActiveTheme] = useState('ethereal');
  const [prefs, setPrefs] = useState({
    autoRefresh: true,
    soundNotifs: false,
    emailWeekly: true,
    emailAlerts: true,
    slackInteg: false,
    compactMode: false,
    reducedMotion: false,
  });
  const pref = (k: keyof typeof prefs) => () => setPrefs(p => ({ ...p, [k]: !p[k] }));

  const applyTheme = (t: typeof THEMES[0]) => {
    document.documentElement.style.setProperty('--dd-accent', t.accent);
    document.documentElement.style.setProperty('--dd-accent-dim', t.accent + '26');
    document.documentElement.style.setProperty('--dd-bg', t.bg);
    document.body.style.background = t.bg;
    setActiveTheme(t.id);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--dd-border)', borderRadius: 8, color: 'var(--dd-text-muted)', fontSize: 13, cursor: 'pointer', padding: '7px 12px', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--dd-text)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--dd-text-muted)'; e.currentTarget.style.borderColor = 'var(--dd-border)'; }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Manage your account, appearance, and preferences.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Sidebar nav */}
        <div className="dd-card" style={{ padding: '8px 8px', position: 'sticky', top: 24 }}>
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: activeSection === id ? 'var(--dd-accent-dim)' : 'none',
                color: activeSection === id ? 'var(--dd-text)' : 'var(--dd-text-muted)',
                fontSize: 13, fontWeight: activeSection === id ? 600 : 400,
                textAlign: 'left', transition: 'all 0.15s', marginBottom: 2,
              }}
              onMouseEnter={e => { if (activeSection !== id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (activeSection !== id) e.currentTarget.style.background = 'none'; }}
            >
              <Icon size={15} style={{ color: activeSection === id ? 'var(--dd-accent)' : 'inherit' }} />
              {label}
            </button>
          ))}

          <div style={{ margin: '8px 0', borderTop: '1px solid var(--dd-border)' }} />

          <button
            onClick={() => { clearAuth(); navigate('/'); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'none', color: 'var(--dd-red)', fontSize: 13, fontWeight: 400, textAlign: 'left',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,81,73,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>

        {/* Content */}
        <div>

          {/* APPEARANCE */}
          {activeSection === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="dd-card animate-fade-in" style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <Palette size={16} style={{ color: 'var(--dd-accent)' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--dd-text)' }}>Theme</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => applyTheme(t)}
                      style={{
                        display: 'flex', flexDirection: 'column', gap: 10,
                        padding: '14px', borderRadius: 10, cursor: 'pointer',
                        background: activeTheme === t.id ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                        border: activeTheme === t.id ? `2px solid ${t.accent}` : '2px solid rgba(255,255,255,0.06)',
                        textAlign: 'left', transition: 'all 0.2s', position: 'relative',
                      }}
                    >
                      {/* Mini preview */}
                      <div style={{ display: 'flex', gap: 4, height: 36, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ flex: 1, background: t.preview[0] }} />
                        <div style={{ width: 40, background: t.preview[1] }} />
                        <div style={{ width: 10, background: t.preview[2] }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--dd-text)' }}>{t.label}</div>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.accent, marginTop: 4, boxShadow: `0 0 6px ${t.accent}88` }} />
                        </div>
                        {activeTheme === t.id && (
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={11} color="white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="dd-card animate-fade-in-up delay-100" style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Monitor size={16} style={{ color: 'var(--dd-accent)' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--dd-text)' }}>Display</h3>
                </div>
                <SectionRow label="Compact Mode" desc="Reduce padding and spacing across the UI">
                  <Toggle on={prefs.compactMode} onToggle={pref('compactMode')} />
                </SectionRow>
                <SectionRow label="Reduced Motion" desc="Disable animations for better accessibility">
                  <Toggle on={prefs.reducedMotion} onToggle={pref('reducedMotion')} />
                </SectionRow>
                <SectionRow label="Auto-refresh Data" desc="Automatically refresh metrics every 60 seconds">
                  <Toggle on={prefs.autoRefresh} onToggle={pref('autoRefresh')} />
                </SectionRow>
              </div>
            </div>
          )}

          {/* ACCOUNT */}
          {activeSection === 'account' && (
            <div className="dd-card animate-fade-in" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <User size={16} style={{ color: 'var(--dd-accent)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--dd-text)' }}>Account</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, marginBottom: 20, border: '1px solid var(--dd-border)' }}>
                {user?.avatar
                  ? <img src={user.avatar} style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid var(--dd-border)' }} />
                  : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#6577f3,#00cba9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white' }}>{user?.name?.[0]}</div>
                }
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--dd-text)' }}>{user?.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--dd-text-muted)', marginTop: 2 }}>{user?.email}</div>
                  <div style={{ marginTop: 6 }}><span className="badge badge-accent">Staff Engineer</span></div>
                </div>
              </div>

              <SectionRow label="Display Name" desc={user?.name ?? ''}>
                <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>Edit</button>
              </SectionRow>
              <SectionRow label="Email" desc={user?.email ?? ''}>
                <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>Edit</button>
              </SectionRow>
              <SectionRow label="GitHub Account" desc="Connected via OAuth">
                <span className="badge badge-green">Connected</span>
              </SectionRow>
              <SectionRow label="Organization" desc="Link to a GitHub organization">
                <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>Link Org</button>
              </SectionRow>

              <div style={{ marginTop: 24, padding: '16px', background: 'rgba(248,81,73,0.05)', border: '1px solid rgba(248,81,73,0.15)', borderRadius: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dd-red)', marginBottom: 6 }}>Danger Zone</div>
                <div style={{ fontSize: 12, color: 'var(--dd-text-muted)', marginBottom: 12 }}>Permanently delete your account and all associated data.</div>
                <button style={{ background: 'rgba(248,81,73,0.12)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 8, color: 'var(--dd-red)', fontSize: 13, fontWeight: 600, padding: '8px 16px', cursor: 'pointer' }}>
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <div className="dd-card animate-fade-in" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Bell size={16} style={{ color: 'var(--dd-accent)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--dd-text)' }}>Notifications</h3>
              </div>
              <div style={{ fontSize: 13, color: 'var(--dd-text-muted)', marginBottom: 20 }}>Choose how and when you receive alerts.</div>

              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', color: 'var(--dd-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Email</div>
              <SectionRow label="Weekly Summary" desc="Receive a weekly digest of your engineering metrics">
                <Toggle on={prefs.emailWeekly} onToggle={pref('emailWeekly')} />
              </SectionRow>
              <SectionRow label="Stall Alerts" desc="Get notified when PRs stall for more than 24 hours">
                <Toggle on={prefs.emailAlerts} onToggle={pref('emailAlerts')} />
              </SectionRow>

              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', color: 'var(--dd-text-muted)', textTransform: 'uppercase', marginTop: 20, marginBottom: 4 }}>In-App</div>
              <SectionRow label="Sound Notifications" desc="Play a sound when important events occur">
                <Toggle on={prefs.soundNotifs} onToggle={pref('soundNotifs')} />
              </SectionRow>
            </div>
          )}

          {/* INTEGRATIONS */}
          {activeSection === 'integrations' && (
            <div className="dd-card animate-fade-in" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <GitBranch size={16} style={{ color: 'var(--dd-accent)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--dd-text)' }}>Integrations</h3>
              </div>
              {[
                { name: 'GitHub', desc: 'Pull request data, commits, and webhook events.', connected: true, icon: '🐙' },
                { name: 'Slack',  desc: 'Get alerts and summaries in your Slack workspace.', connected: false, icon: '💬' },
                { name: 'Jira',   desc: 'Sync sprint and issue data from Jira projects.',   connected: false, icon: '📋' },
                { name: 'PagerDuty', desc: 'Trigger incidents from critical pipeline failures.', connected: false, icon: '🚨' },
              ].map(({ name, desc, connected, icon }) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--dd-border)', borderRadius: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dd-text)' }}>{name}</div>
                      <div style={{ fontSize: 12, color: 'var(--dd-text-muted)', marginTop: 2 }}>{desc}</div>
                    </div>
                  </div>
                  {connected
                    ? <span className="badge badge-green">Connected</span>
                    : <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>Connect</button>
                  }
                </div>
              ))}
            </div>
          )}

          {/* SECURITY */}
          {activeSection === 'security' && (
            <div className="dd-card animate-fade-in" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Shield size={16} style={{ color: 'var(--dd-accent)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--dd-text)' }}>Security</h3>
              </div>
              <div style={{ fontSize: 13, color: 'var(--dd-text-muted)', marginBottom: 20 }}>Manage your account security and access.</div>

              <SectionRow label="Google SSO" desc="Sign in via Google — no password required">
                <span className="badge badge-green">Active</span>
              </SectionRow>
              <SectionRow label="Active Sessions" desc="You have 1 active session on this device">
                <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>View Sessions</button>
              </SectionRow>
              <SectionRow label="API Token" desc="Generate a personal API token for CI integrations">
                <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>Generate</button>
              </SectionRow>
              <SectionRow label="Audit Log" desc="View all account activity and login events">
                <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>View Log</button>
              </SectionRow>

              <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(0,203,169,0.05)', border: '1px solid rgba(0,203,169,0.15)', borderRadius: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--dd-text-muted)', lineHeight: 1.6 }}>
                  🔒 Your account is secured with Google OAuth. DevDeck stores no passwords and never has write access to your GitHub repositories.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
