import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, GitPullRequest, CheckCheck, Clock,
  AlertCircle, ArrowLeft, Filter, CheckSquare, Trash2, ExternalLink
} from 'lucide-react';
import { useNotifStore } from '../store';

const ALL_NOTIFS = [
  {
    id: 1, icon: GitPullRequest, color: '#f85149', category: 'PR Alert',
    title: 'PR #756 is stalled',
    body: 'infra/k8s has had no reviewer activity in over 48 hours. This PR is blocking the v2.4 release pipeline.',
    time: '2 minutes ago', read: false, date: 'Today',
    action: { label: 'View PR', path: '/prs' },
  },
  {
    id: 2, icon: CheckCheck, color: '#3fb950', category: 'Merge',
    title: 'PR #412 successfully merged',
    body: 'feat/auth-v2 was merged into main by @sarah_k. Deployment triggered automatically.',
    time: '14 minutes ago', read: false, date: 'Today',
    action: { label: 'View PR', path: '/prs' },
  },
  {
    id: 3, icon: AlertCircle, color: '#d29922', category: 'Warning',
    title: 'High review latency detected',
    body: '3 open PRs have been waiting for a first review for more than 24 hours. Reviewer load may be unbalanced.',
    time: '1 hour ago', read: false, date: 'Today',
    action: { label: 'View Health', path: '/prs' },
  },
  {
    id: 4, icon: Clock, color: '#6577f3', category: 'Sprint',
    title: 'Sprint ends in 2 days',
    body: '8 open items remain in the current sprint. At current velocity, 5–6 items can be completed by EOD Friday.',
    time: '3 hours ago', read: true, date: 'Today',
    action: { label: 'View Dashboard', path: '/dashboard' },
  },
  {
    id: 5, icon: GitPullRequest, color: '#00cba9', category: 'PR Alert',
    title: 'PR #822 is ready for review',
    body: 'CORE-88 (Checkout-Core refactor) is approved by 1 reviewer and needs a second sign-off to merge.',
    time: 'Yesterday, 4:20 PM', read: true, date: 'Yesterday',
    action: { label: 'View PR', path: '/prs' },
  },
  {
    id: 6, icon: AlertCircle, color: '#f85149', category: 'Risk',
    title: 'Auth-Gateway-v2 stall risk: 86%',
    body: 'AI analysis estimates an 86% probability this PR will stall based on current review patterns and age.',
    time: 'Yesterday, 11:00 AM', read: true, date: 'Yesterday',
    action: { label: 'View Analysis', path: '/prs' },
  },
  {
    id: 7, icon: CheckCheck, color: '#3fb950', category: 'Merge',
    title: 'PR #398 merged — fix/api-timeout',
    body: 'The API timeout fix was merged after a 2-review approval. Production deploy in progress.',
    time: '2 days ago, 2:15 PM', read: true, date: '2 days ago',
    action: { label: 'View PR', path: '/prs' },
  },
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { readIds, dismissedIds, markRead, markAllRead, dismiss } = useNotifStore();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const notifs = ALL_NOTIFS
    .filter(n => !dismissedIds.includes(n.id))
    .map(n => ({ ...n, read: n.read || readIds.includes(n.id) }));

  const categories = ['all', ...Array.from(new Set(ALL_NOTIFS.map(n => n.category)))];
  const unreadCount = notifs.filter(n => !n.read).length;

  const visible = notifs.filter(n => {
    if (filter === 'unread' && n.read) return false;
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
    return true;
  });

  const handleMarkAllRead = () => markAllRead(notifs.map(n => n.id));
  const handleMarkRead    = (id: number) => markRead(id);
  const handleDismiss     = (id: number) => dismiss(id);

  const grouped = visible.reduce<Record<string, typeof visible>>((acc, n) => {
    acc[n.date] = acc[n.date] ?? [];
    acc[n.date].push(n);
    return acc;
  }, {});

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 className="page-title">Notifications</h1>
              {unreadCount > 0 && (
                <span className="badge badge-red">{unreadCount} new</span>
              )}
            </div>
            <p className="page-subtitle">Activity feed for your repositories and engineering metrics.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={handleMarkAllRead} style={{ fontSize: 12 }}>
            <CheckSquare size={13} /> Mark all read
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

        {/* Main feed */}
        <div>
          {/* Filter bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ display: 'flex', background: 'var(--dd-card)', border: '1px solid var(--dd-border)', borderRadius: 8, overflow: 'hidden' }}>
              {(['all', 'unread'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '7px 16px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                    background: filter === f ? 'var(--dd-accent)' : 'none',
                    color: filter === f ? 'white' : 'var(--dd-text-muted)',
                    transition: 'all 0.15s', textTransform: 'capitalize',
                  }}
                >
                  {f === 'all' ? `All (${notifs.length})` : `Unread (${unreadCount})`}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, border: '1px solid var(--dd-border)',
                    background: categoryFilter === c ? 'var(--dd-accent-dim)' : 'none',
                    color: categoryFilter === c ? 'var(--dd-accent)' : 'var(--dd-text-muted)',
                    fontSize: 11, fontWeight: 500, cursor: 'pointer',
                    textTransform: 'capitalize', transition: 'all 0.15s',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Notification groups */}
          {Object.keys(grouped).length === 0 ? (
            <div className="dd-card" style={{ padding: '48px', textAlign: 'center' }}>
              <Bell size={32} style={{ color: 'var(--dd-text-dim)', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 14, color: 'var(--dd-text-muted)' }}>No notifications match your filters.</div>
            </div>
          ) : (
            Object.entries(grouped).map(([date, items]) => (
              <div key={date} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--dd-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, paddingLeft: 4 }}>
                  {date}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map(({ id, icon: Icon, color, category, title, body, time, read, action }) => (
                    <div
                      key={id}
                      className="dd-card animate-fade-in-up"
                      style={{
                        padding: '16px 20px',
                        display: 'flex', gap: 14,
                        background: read ? 'var(--dd-card)' : 'rgba(101,119,243,0.05)',
                        borderColor: read ? 'var(--dd-border)' : 'rgba(101,119,243,0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onClick={() => handleMarkRead(id)}
                    >
                      {/* Unread dot */}
                      <div style={{ paddingTop: 4, width: 8, flexShrink: 0 }}>
                        {!read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--dd-accent)' }} />}
                      </div>

                      <div style={{ width: 36, height: 36, borderRadius: 9, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        <Icon size={16} style={{ color }} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color, background: color + '18', padding: '2px 8px', borderRadius: 100 }}>{category}</span>
                          <span style={{ fontSize: 11, color: 'var(--dd-text-dim)' }}>{time}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: read ? 500 : 700, color: 'var(--dd-text)', marginBottom: 4 }}>{title}</div>
                        <div style={{ fontSize: 12, color: 'var(--dd-text-muted)', lineHeight: 1.55 }}>{body}</div>
                        <button
                          onClick={e => { e.stopPropagation(); navigate(action.path); }}
                          style={{ background: 'none', border: 'none', color: 'var(--dd-accent)', fontSize: 12, fontWeight: 500, cursor: 'pointer', marginTop: 8, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          {action.label} <ExternalLink size={11} />
                        </button>
                      </div>

                      <button
                        onClick={e => { e.stopPropagation(); handleDismiss(id); }}
                        style={{ background: 'none', border: 'none', color: 'var(--dd-text-dim)', cursor: 'pointer', padding: 4, borderRadius: 6, flexShrink: 0, alignSelf: 'flex-start' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--dd-red)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--dd-text-dim)')}
                        title="Dismiss"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right sidebar summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 24 }}>
          <div className="dd-card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--dd-text-muted)', marginBottom: 14 }}>Summary</div>
            {[
              { label: 'Total',      value: notifs.length, color: 'var(--dd-text)' },
              { label: 'Unread',     value: unreadCount,   color: 'var(--dd-accent)' },
              { label: 'PR Alerts',  value: notifs.filter(n => n.category === 'PR Alert').length,  color: 'var(--dd-red)' },
              { label: 'Merges',     value: notifs.filter(n => n.category === 'Merge').length,     color: 'var(--dd-green)' },
              { label: 'Warnings',   value: notifs.filter(n => n.category === 'Warning').length,   color: 'var(--dd-amber)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--dd-text-muted)' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}</span>
              </div>
            ))}
          </div>

          <div className="dd-card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--dd-text-muted)', marginBottom: 12 }}>Quick Actions</div>
            {[
              { label: 'Go to PR Health',  path: '/prs',        color: 'var(--dd-accent)' },
              { label: 'View Dashboard',   path: '/dashboard',  color: 'var(--dd-cyan)' },
              { label: 'Cycle Time',       path: '/cycle-time', color: 'var(--dd-green)' },
            ].map(({ label, path, color }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px', marginBottom: 6, borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--dd-border)',
                  color: 'var(--dd-text)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--dd-border)'; e.currentTarget.style.color = 'var(--dd-text)'; }}
              >
                {label}
                <ExternalLink size={11} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
