import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { useAuthStore } from './store';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

import LandingPage from './pages/LandingPage';
import ConnectPage from './pages/ConnectPage';
import DashboardPage from './pages/DashboardPage';
import PRHealthPage from './pages/PRHealthPage';
import TeamPage from './pages/TeamPage';
import AIAssistantPage from './pages/AIAssistantPage';
import SettingsPage from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  return user ? <>{children}</> : <Navigate to="/" replace />;
}

function AppLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <TopBar title={title} />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster 
          position="bottom-right"
          toastOptions={{ style: { background: '#1c2333', color: '#e6edf3', border: '1px solid rgba(255,255,255,0.09)' } }}
        />
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/connect" element={
            <ProtectedRoute><ConnectPage /></ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout title="Dashboard"><DashboardPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/prs" element={
            <ProtectedRoute>
              <AppLayout title="Analytics"><PRHealthPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/team" element={
            <ProtectedRoute>
              <AppLayout title="Team"><TeamPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/ai" element={
            <ProtectedRoute>
              <AppLayout title="AI Assistant"><AIAssistantPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <AppLayout title="Settings"><SettingsPage /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
