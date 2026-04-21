import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, Tooltip, XAxis,
} from 'recharts';
import {
  Clock, GitPullRequest, TrendingUp, TrendingDown,
  AlertTriangle, MoreHorizontal, Download,
} from 'lucide-react';
import api from '../lib/api';
import { useSocket } from '../hooks/useSocket';
import { useFilterStore } from '../store';

function StabilityGauge({ value }: { value: number }) {
  const size = 130;
  const sw = 10;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value >= 99 ? '#3fb950' : value >= 95 ? '#d29922' : '#f85149';
  
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="health-score-ring"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'Clash Display,Inter,sans-serif', fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>
          {value}%
        </span>
        <span style={{ fontSize: 9, color: 'var(--dd-text-muted)', marginTop: 2, letterSpacing: '0.06em' }}>Global Uptime</span>
      </div>
    </div>
  );
}

function WIPItem({ number, title, author, ago, status }: any) {
  const statusMap: any = {
    Review: { cls: 'badge-accent', label: 'Review' },
    Draft:  { cls: 'badge-gray',   label: 'Draft' },
    Idle:   { cls: 'badge-gray',   label: 'Idle' },
  };
  const s = statusMap[status] ?? statusMap.Draft;
  
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
      borderBottom: '1px solid var(--dd-border)',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'linear-gradient(135deg,#6577f3,#00cba9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0,
      }}>
        {author?.[0]?.toUpperCase() ?? 'U'}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--dd-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--dd-text-muted)' }}>{ago} · @{author}</div>
      </div>
      <span className={`badge ${s.cls}`} style={{ flexShrink: 0 }}>{s.label}</span>
    </div>
  );
}

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="dd-card" style={{ padding: '8px 12px', fontSize: 11 }}>
      <div style={{ color: 'var(--dd-text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { days } = useFilterStore();
  const { status } = useSocket();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', days],
    queryFn: () => api.get(`/metrics/dashboard?days=${days}`).then(r => r.data.data),
    refetchInterval: 60_000,
  });

  const cycleData = data?.throughputTrend?.length
    ? data.throughputTrend
    : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => ({
        date: d,
        hours: [3.2, 4.1, 3.8, 5.2, 4.5, 3.1, 5.8][i],
      }));

  const throughputData = data?.throughputTrend?.length
    ? data.throughputTrend
    : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => ({
        date: d,
        commits: [12,18,14,22,16,8,24][i],
        deployments: [2,5,3,6,4,1,7][i],
      }));

  const wipItems = [
    { number: 1, title: 'feat/auth-v2-migration',        author: 'mchenry', ago: '2h ago', status: 'Review' },
    { number: 2, title: 'fix/api-latency-issue',          author: 'sarahj',  ago: '5h ago', status: 'Draft'  },
    { number: 3, title: 'infra/kubernetes-cluster-up',    author: 'davey_t', ago: '1d ago', status: 'Idle'   },
  ];

  const cycleTime = data?.avgCycleTimeHours ?? 4.2;
  const reviewLatency = data?.avgReviewLatencyHours ?? 2.1;
  const throughput7d = data?.throughput7d ?? 28;
  const openPRs = data?.openPRs ?? 14;
  const uptime = 99.98;
  const latency = 24;
  const errorRate = 0.02;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Operational Overview</h1>
          <p className="page-subtitle">
            Real-time engineering intelligence across all active pipelines and infrastructure layers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" style={{ fontSize: 12 }}>
            <Download size={13} /> Export Report
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}
        className="animate-fade-in-up delay-100">
        {[
          { label: 'Cycle Time',     value: `${cycleTime}d`,       sub: 'vs. prev sprint avg', icon: Clock,        trend: -12 },
          { label: 'Throughput',     value: `${throughput7d}`,     sub: 'PRs merged / 7d',     icon: TrendingUp,   trend: 8 },
          { label: 'Active PRs',     value: `${openPRs}`,          sub: 'requiring review',     icon: GitPullRequest, trend: null },
          { label: 'Review Latency', value: `${reviewLatency}h`,   sub: 'avg first response',   icon: AlertTriangle, trend: -5 },
        ].map(({ label, value, sub, icon: Icon, trend }) => (
          <div key={label} className="dd-card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ padding: 6, borderRadius: 8, background: 'rgba(101,119,243,0.12)' }}>
                <Icon size={14} style={{ color: 'var(--dd-accent)' }} />
              </div>
              {trend !== null && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: (trend ?? 0) < 0 ? 'var(--dd-green)' : 'var(--dd-red)',
                  display: 'flex', alignItems: 'center', gap: 2,
                }}>
                  {(trend ?? 0) < 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                  {Math.abs(trend ?? 0)}%
                </span>
              )}
            </div>
            <div style={{ fontFamily: 'Clash Display,Inter,sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--dd-text)', lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--dd-text-muted)', marginTop: 3 }}>{label}</div>
            <div style={{ fontSize: 10, color: 'var(--dd-text-dim)', marginTop: 1 }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="dd-card animate-fade-in-up delay-200" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dd-text)' }}>Cycle Time</div>
                <div style={{ fontSize: 11, color: 'var(--dd-text-muted)', marginTop: 2 }}>Average time from commit to production</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-green">+ 12.4%</span>
                <button style={{ background: 'none', border: 'none', color: 'var(--dd-text-muted)', cursor: 'pointer' }}><MoreHorizontal size={15} /></button>
              </div>
            </div>
            <div style={{ height: 130 }}>
              {isLoading ? <div className="skeleton" style={{ height: 130 }} /> : (
                <ResponsiveContainer>
                  <AreaChart data={cycleData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="cycleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="10%" stopColor="#6577f3" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="#6577f3" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: '#8b949e', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<DarkTooltip />} />
                    <Area type="monotone" dataKey="hours" stroke="#6577f3" fill="url(#cycleGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="dd-card animate-fade-in-up delay-300" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dd-text)' }}>Throughput</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--dd-text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#6577f3', display: 'inline-block' }} /> Commits
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#00cba9', display: 'inline-block' }} /> Deployments
                </span>
              </div>
            </div>
            <div style={{ height: 120 }}>
              {isLoading ? <div className="skeleton" style={{ height: 120 }} /> : (
                <ResponsiveContainer>
                  <BarChart data={throughputData} barGap={2} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <XAxis dataKey="date" tick={{ fill: '#8b949e', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="commits"     radius={[3,3,0,0]} maxBarSize={18} fill="#6577f3" fillOpacity={0.7} />
                    <Bar dataKey="deployments" radius={[3,3,0,0]} maxBarSize={18} fill="#00cba9" fillOpacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: 'var(--dd-text-muted)',
            padding: '8px 4px',
          }}>
            <span className="status-dot live" />
            <span>Production environment is healthy</span>
            <span style={{ margin: '0 4px' }}>·</span>
            <span>Last updated: 3 minutes ago</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="dd-card animate-fade-in-up delay-200" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dd-text)' }}>WIP Tracking</div>
              <span className="badge badge-accent">{openPRs} Active</span>
            </div>
            <div>
              {wipItems.map((item, i) => (
                <WIPItem key={i} {...item} />
              ))}
            </div>
            <button style={{
              marginTop: 10, width: '100%', background: 'none', border: 'none',
              color: 'var(--dd-accent)', fontSize: 12, fontWeight: 500, cursor: 'pointer', textAlign: 'center',
            }}>
              View all {openPRs} Pull Requests →
            </button>
          </div>

          <div className="dd-card animate-fade-in-up delay-300" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dd-text)' }}>System Stability</div>
              <span className="badge badge-cyan">NOMINAL</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <StabilityGauge value={uptime} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, textAlign: 'center' }}>
              {[
                { label: 'Latency', value: `${latency}ms` },
                { label: 'Error Rate', value: `${errorRate}%`, color: 'var(--dd-green)' },
                { label: 'Incidents', value: '0', color: 'var(--dd-green)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="dd-card" style={{ padding: '8px 4px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: color ?? 'var(--dd-text)' }}>{value}</div>
                  <div style={{ fontSize: 10, color: 'var(--dd-text-muted)', marginTop: 1 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                Generate Report
              </button>
              <button className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }}>
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
