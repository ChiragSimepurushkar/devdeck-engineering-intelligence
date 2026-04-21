import { useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../lib/firebase';
import { useAuthStore } from '../store';
import api from '../lib/api';
import { Activity, GitPullRequest, BarChart2, Users, Zap, Clock, TrendingUp, Shield } from 'lucide-react';

export default function LandingPage() {
  const { setAuth, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const { data } = await api.post('/auth/firebase', { idToken });
      if (data && data.success && data.user) {
        const authUser = data.user as Record<string, any>;
        setAuth(authUser as any, data.accessToken);
        navigate(authUser.githubUsername ? '/dashboard' : '/connect');
      }
    } catch (err) {
      console.error('Sign-in failed', err);
    }
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#0d1117', display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden', flex: 1 }}>

      {/* LEFT PANEL — Branding & Features */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg, #0d1117 0%, #111827 60%, #0d1117 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '52px 64px',
      }}>
        {/* Glow orbs */}
        <div style={{ position: 'absolute', width: 480, height: 480, top: '-120px', left: '-80px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(101,119,243,0.14) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 360, height: 360, bottom: '-80px', right: '-60px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,203,169,0.1) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg, #6577f3, #00cba9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={20} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'Clash Display, Inter, sans-serif', fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: '#e6edf3' }}>DevDeck</div>
            <div style={{ fontSize: 9, letterSpacing: '0.14em', color: '#8b949e', textTransform: 'uppercase', fontWeight: 600 }}>Engineering Intel</div>
          </div>
        </div>

        {/* Headline block */}
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 0' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(101,119,243,0.12)', border: '1px solid rgba(101,119,243,0.25)',
            borderRadius: 100, padding: '5px 14px', fontSize: 11, fontWeight: 700,
            color: '#6577f3', letterSpacing: '0.05em', textTransform: 'uppercase',
            marginBottom: 24, width: 'fit-content',
          }}>
            <Zap size={11} /> Live GitHub Intelligence
          </div>

          <h1 style={{
            fontFamily: 'Clash Display, Inter, sans-serif',
            fontSize: 'clamp(2.6rem, 4.5vw, 4rem)',
            fontWeight: 700, letterSpacing: '-0.04em',
            lineHeight: 1.06, marginBottom: 20,
            color: '#e6edf3',
          }}>
            Engineering<br />
            Intelligence,<br />
            <span style={{ background: 'linear-gradient(135deg, #6577f3, #00cba9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Visualised
            </span>
          </h1>

          <p style={{ fontSize: 15, color: '#8b949e', lineHeight: 1.7, maxWidth: 420, marginBottom: 40 }}>
            Transform raw GitHub activity into real-time signals. Monitor cycle time, PR health, and reviewer workload — all in one unified control tower.
          </p>

          {/* Feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { icon: GitPullRequest, label: 'PR Bubble Matrix',      desc: 'Live health by size & age',    color: '#6577f3' },
              { icon: Clock,          label: 'Cycle Time Tracking',   desc: 'Commit to production delta',   color: '#00cba9' },
              { icon: BarChart2,      label: 'Sprint Health Score',   desc: 'Velocity & throughput trends', color: '#3fb950' },
              { icon: Users,          label: 'Reviewer Load Index',   desc: 'Balanced review assignment',   color: '#d29922' },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div key={label} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#e6edf3', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#8b949e' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar at bottom */}
        <div style={{ display: 'flex', gap: 36, position: 'relative' }}>
          {[
            { label: 'Metrics Tracked', value: '12+' },
            { label: 'Real-time via',   value: 'Webhooks' },
            { label: 'Data Source',     value: 'GitHub API' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontFamily: 'Clash Display, Inter, sans-serif', fontSize: '1.35rem', fontWeight: 700, background: 'linear-gradient(135deg, #6577f3, #00cba9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {value}
              </div>
              <div style={{ color: '#484f58', fontSize: 11, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL — Login form */}
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 80px',
        background: '#0d1117',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', width: 300, height: 300, bottom: 0, right: 0, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,203,169,0.06) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 400, width: '100%' }}>
          <div style={{ marginBottom: 44 }}>
            <h2 style={{ fontFamily: 'Clash Display, Inter, sans-serif', fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: '#e6edf3', marginBottom: 10 }}>
              Sign in to DevDeck
            </h2>
            <p style={{ fontSize: 14, color: '#8b949e', lineHeight: 1.6 }}>
              Connect your GitHub account to start tracking your engineering metrics in real time.
            </p>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '15px 20px',
              background: '#161b27',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, color: '#e6edf3',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: 24,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1c2333'; e.currentTarget.style.borderColor = 'rgba(101,119,243,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#161b27'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Security note */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', background: 'rgba(63,185,80,0.05)', border: '1px solid rgba(63,185,80,0.15)', borderRadius: 10, marginBottom: 32 }}>
            <Shield size={14} style={{ color: '#3fb950', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.6 }}>
              <strong style={{ color: '#e6edf3' }}>Read-only access.</strong> DevDeck never writes to your repositories. Your GitHub data is only used for analytics.
            </p>
          </div>

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40 }}>
            {['PR Tracking', 'Cycle Time', 'AI Insights', 'Team Analytics'].map(f => (
              <span key={f} style={{
                fontSize: 11, fontWeight: 500, color: '#8b949e',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 100, padding: '4px 12px',
              }}>{f}</span>
            ))}
          </div>

          {/* Trust badges */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24 }}>
            <div style={{ fontSize: 11, color: '#484f58', textAlign: 'center', marginBottom: 16 }}>Trusted by engineering teams</div>
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
              {[
                { metric: '99.9%', label: 'Uptime' },
                { metric: '< 1s',  label: 'Latency' },
                { metric: 'SOC2',  label: 'Compliant' },
              ].map(({ metric, label }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>{metric}</div>
                  <div style={{ fontSize: 10, color: '#8b949e', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
