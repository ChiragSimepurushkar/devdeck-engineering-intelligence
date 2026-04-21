import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store';
import api from '../lib/api';
import { openAlertBox } from '../lib/toast';
import { Save, User, Building, Clock } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';

export function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'org'>('profile');

  // --- Profile State ---
  const [profileName, setProfileName] = useState(user?.name || '');
  const [githubUsername, setGithubUsername] = useState(user?.githubUsername || '');

  // --- Org State ---
  const [orgName, setOrgName] = useState('');
  const [businessHoursStart, setBusinessHoursStart] = useState(9);
  const [businessHoursEnd, setBusinessHoursEnd] = useState(18);
  const [timezone, setTimezone] = useState('UTC');

  // Fetch Org Settings
  const { data: orgData } = useQuery({
    queryKey: ['org-settings'],
    queryFn: async () => {
      const res = await api.get('/orgs/settings');
      return res.data.org;
    },
    enabled: !!user?.orgId,
  });

  useEffect(() => {
    if (orgData) {
      setOrgName(orgData.name || '');
      setBusinessHoursStart(orgData.config?.businessHoursStart || 9);
      setBusinessHoursEnd(orgData.config?.businessHoursEnd || 18);
      setTimezone(orgData.config?.timezone || 'UTC');
    }
  }, [orgData]);

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.put('/users/me', payload);
      return res.data;
    },
    onSuccess: (data) => {
      useAuthStore.getState().setUser(data.user);
      openAlertBox('success', 'Profile updated successfully!');
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.put('/orgs/settings', payload);
      return res.data;
    },
    onSuccess: () => {
      openAlertBox('success', 'Organization settings updated!');
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name: profileName, githubUsername });
  };

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgMutation.mutate({ name: orgName, businessHoursStart, businessHoursEnd, timezone });
  };

  return (
    <div className="flex-1 overflow-y-auto p-12">
      <header className="mb-12">
        <h1 className="text-5xl font-black mb-4">Settings</h1>
        <p className="text-slate-400 text-lg">Manage your personal profile and organization preferences.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'profile' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="inline-block w-5 h-5 mr-2" />
          Personal Profile
        </button>
        <button
          onClick={() => setActiveTab('org')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'org' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/50' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="inline-block w-5 h-5 mr-2" />
          Organization
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Settings */}
        {activeTab === 'profile' && (
          <div className="glass-card p-8 animate-fade-in-up">
            <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Display Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">GitHub Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="e.g. torvalds"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="w-full magnetic-btn bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold py-4 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
              >
                <Save className="w-5 h-5 mr-2" />
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        )}

        {/* Org Settings */}
        {activeTab === 'org' && (
          <div className="glass-card p-8 animate-fade-in-up">
            <h2 className="text-2xl font-bold mb-6">Organization Preferences</h2>
            <form onSubmit={handleOrgSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Organization Name</label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Start Hour (0-23)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={businessHoursStart}
                      onChange={(e) => setBusinessHoursStart(parseInt(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">End Hour (0-23)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={businessHoursEnd}
                      onChange={(e) => setBusinessHoursEnd(parseInt(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-white"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={updateOrgMutation.isPending}
                className="w-full magnetic-btn bg-violet-500 hover:bg-violet-600 text-white font-bold py-4 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
              >
                <Save className="w-5 h-5 mr-2" />
                {updateOrgMutation.isPending ? 'Saving...' : 'Save Organization'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
