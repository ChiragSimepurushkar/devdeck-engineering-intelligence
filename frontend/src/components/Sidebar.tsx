import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, GitPullRequest, Users, Bot, LogOut, Plus } from 'lucide-react';
import { useAuthStore } from '../store';
import api from '../lib/api';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/prs', icon: GitPullRequest, label: 'PR Health' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/ai', icon: Bot, label: 'AI Assistant' },
];

export default function Sidebar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    clearAuth();
    navigate('/');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="mb-4">
        <div className="font-display gradient-text font-bold" style={{ fontSize: '18px', letterSpacing: '-0.04em' }}>D</div>
      </div>

      <div style={{ height: 1, background: 'var(--glass-border)', width: '40px', margin: '4px 0' }} />

      {/* Nav */}
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} title={label}>
          {({ isActive }) => (
            <div className={`sidebar-icon ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
            </div>
          )}
        </NavLink>
      ))}

      <div style={{ flex: 1 }} />

      {/* Connect repo shortcut */}
      <button onClick={() => navigate('/connect')} className="sidebar-icon" title="Connect Repo">
        <Plus size={18} />
      </button>

      <div style={{ height: 1, background: 'var(--glass-border)', width: '40px', margin: '4px 0' }} />

      {/* Avatar */}
      {user?.avatar && (
        <img src={user.avatar} alt={user.name}
          className="rounded-full" style={{ width: 32, height: 32, border: '2px solid var(--glass-border)' }} />
      )}

      {/* Logout */}
      <button onClick={handleLogout} className="sidebar-icon" title="Sign out">
        <LogOut size={16} />
      </button>
    </aside>
  );
}
