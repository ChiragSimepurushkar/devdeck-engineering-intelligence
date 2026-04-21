import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  orgId: string;
  githubUsername?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('devdeck_token', token);
        set({ user, token });
      },
      setUser: (user) => set({ user }),
      clearAuth: () => {
        localStorage.removeItem('devdeck_token');
        set({ user: null, token: null });
      },
    }),
    { name: 'devdeck-auth', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);

// Dashboard filter store
interface FilterStore {
  days: number;
  selectedRepo: string | null;
  setDays: (days: number) => void;
  setRepo: (repo: string | null) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  days: 30,
  selectedRepo: null,
  setDays: (days) => set({ days }),
  setRepo: (repo) => set({ selectedRepo: repo }),
}));

// Notifications persistence store
interface NotifStore {
  readIds: number[];
  dismissedIds: number[];
  markRead: (id: number) => void;
  markAllRead: (ids: number[]) => void;
  dismiss: (id: number) => void;
}

export const useNotifStore = create<NotifStore>()(
  persist(
    (set) => ({
      readIds: [],
      dismissedIds: [],
      markRead: (id) => set((s) => ({ readIds: [...s.readIds, id] })),
      markAllRead: (ids) => set((s) => ({ readIds: Array.from(new Set([...s.readIds, ...ids])) })),
      dismiss: (id) => set((s) => ({ dismissedIds: [...s.dismissedIds, id] })),
    }),
    { name: 'devdeck-notifs' }
  )
);
