import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, GitPullRequest, Users, Bot,
  LogOut, Plus, Activity, CheckCircle2, Settings, Clock
} from 'lucide-react';
import { useAuthStore } from '../store';
import api from '../lib/api';
import { openAlertBox } from '../lib/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const NAV_ITEMS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Overview'    },
  { to: '/prs',        icon: GitPullRequest,  label: 'PR Health'   },
  { to: '/cycle-time', icon: Clock,           label: 'Cycle Time'  },
  { to: '/team',       icon: Users,           label: 'Team'        },
  { to: '/ai',         icon: Bot,             label: 'AI Assistant'},
  { to: '/settings',   icon: Settings,        label: 'Settings'    },
];

export default function Sidebar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: () => api.post('/github/sync-all'),
    onSuccess: () => {
      openAlertBox('success', 'Sync triggered! Fetching latest GitHub payloads in the background.');
      // Refetch data after a slight delay
      setTimeout(() => queryClient.invalidateQueries(), 2000);
    },
    onError: () => openAlertBox('error', 'Failed to trigger sync'),
  });

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    clearAuth();
    navigate('/');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #6577f3, #00cba9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Activity size={16} color="white" />
          </div>
          <div>
            <div className="sidebar-logo-title">DevDeck</div>
            <div className="sidebar-logo-sub">Engineering Intel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <div className={`sidebar-item ${isActive ? 'active' : ''}`}>
                <Icon size={16} />
                <span>{label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <button
          className="sidebar-new-project"
          onClick={() => navigate('/connect')}
        >
          <Plus size={14} />
          New Project
        </button>

        <div className="sidebar-item" style={{ cursor: 'default' }}>
          <CheckCircle2 size={15} style={{ color: 'var(--dd-green)' }} />
          <span style={{ fontSize: 12, color: 'var(--dd-text-muted)' }}>System Status</span>
        </div>

        <button className="sidebar-item" onClick={handleLogout}>
          <LogOut size={15} />
          <span>Logout</span>
        </button>

        {/* User avatar at very bottom */}
        {user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', marginTop: 4,
            borderTop: '1px solid var(--dd-border)',
          }}>
            {user.avatar
              ? <img src={user.avatar} alt={user.name} style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--dd-border)' }} />
              : (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#6577f3,#00cba9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: 'white',
                }}>
                  {user.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
              )
            }
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--dd-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--dd-text-muted)' }}>Staff Engineer</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
