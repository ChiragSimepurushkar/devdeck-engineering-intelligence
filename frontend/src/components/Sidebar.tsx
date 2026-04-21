import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, GitPullRequest, Users, Bot, LogOut, Plus, Settings, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store';
import api from '../lib/api';
import { openAlertBox } from '../lib/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/prs', icon: GitPullRequest, label: 'PR Health' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/ai', icon: Bot, label: 'AI Assistant' },
  { to: '/settings', icon: Settings, label: 'Settings' },
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

      {/* Sync all shortcut */}
      <button 
        onClick={() => syncMutation.mutate()} 
        className={`sidebar-icon ${syncMutation.isPending ? 'text-cyan-400' : ''}`} 
        title="Sync All Data From GitHub"
      >
        <RefreshCw size={18} className={syncMutation.isPending ? 'animate-spin' : ''} />
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
