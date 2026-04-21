import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as d3 from 'd3';
import { BarChart, Bar, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Filter, Download, ChevronRight, Zap } from 'lucide-react';
import api from '../lib/api';

type BubbleHealth = 'healthy' | 'at-risk' | 'stalled';
const healthColor: Record<BubbleHealth, string> = {
  healthy: '#3fb950',
  'at-risk': '#d29922',
  stalled: '#f85149',
};

function BubbleMatrix({ data }: { data: any[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; pr: any }>({
    visible: false, x: 0, y: 0, pr: null,
  });

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data.length) return;
    const width  = containerRef.current.clientWidth;
    const height = 340;

    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const gridG = svg.append('g').attr('class', 'grid');
    for (let x = 0; x < width; x += 60) {
      gridG.append('line').attr('x1', x).attr('y1', 0).attr('x2', x).attr('y2', height)
        .attr('stroke', 'rgba(255,255,255,0.04)').attr('stroke-width', 1);
    }
    for (let y = 0; y < height; y += 60) {
      gridG.append('line').attr('x1', 0).attr('y1', y).attr('x2', width).attr('y2', y)
        .attr('stroke', 'rgba(255,255,255,0.04)').attr('stroke-width', 1);
    }

    const sizeExtent = d3.extent(data, (d: any) => d.size) as [number, number];
    const rScale = d3.scaleSqrt().domain([0, sizeExtent[1] || 1]).range([14, 54]);
    const nodes  = data.map((d: any) => ({ ...d, r: rScale(d.size || 1) }));

    const simulation = d3.forceSimulation(nodes as any)
      .force('charge', d3.forceManyBody().strength(6))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.r + 4).strength(0.9))
      .stop();

    for (let i = 0; i < 140; i++) simulation.tick();

    const g = svg.append('g');

    const circles = g.selectAll('circle')
      .data(nodes).enter()
      .append('circle')
      .attr('class', 'pr-bubble')
      .attr('cx', (d: any) => Math.max(d.r, Math.min(width - d.r, d.x ?? width / 2)))
      .attr('cy', (d: any) => Math.max(d.r, Math.min(height - d.r, d.y ?? height / 2)))
      .attr('r',  (d: any) => d.r)
      .attr('fill',        (d: any) => healthColor[d.health as BubbleHealth] + '22')
      .attr('stroke',      (d: any) => healthColor[d.health as BubbleHealth])
      .attr('stroke-width', 1.5)
      .style('filter', (d: any) => `drop-shadow(0 0 8px ${healthColor[d.health as BubbleHealth]}55)`);

    g.selectAll('text.pr-label')
      .data(nodes.filter((d: any) => d.r > 18)).enter()
      .append('text').attr('class', 'pr-label')
      .attr('x', (d: any) => Math.max(d.r, Math.min(width - d.r, d.x ?? width / 2)))
      .attr('y', (d: any) => Math.max(d.r, Math.min(height - d.r, d.y ?? height / 2)) - 4)
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('fill', '#e6edf3').attr('font-size', (d: any) => Math.min(d.r / 2.8, 12))
      .attr('font-weight', '700').attr('font-family', 'Inter').attr('pointer-events', 'none')
      .text((d: any) => `#${d.number}`);

    g.selectAll('text.pr-loc')
      .data(nodes.filter((d: any) => d.r > 28)).enter()
      .append('text').attr('class', 'pr-loc')
      .attr('x', (d: any) => Math.max(d.r, Math.min(width - d.r, d.x ?? width / 2)))
      .attr('y', (d: any) => Math.max(d.r, Math.min(height - d.r, d.y ?? height / 2)) + 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8b949e').attr('font-size', 9).attr('font-family', 'Inter').attr('pointer-events', 'none')
      .text((d: any) => `${((d.linesAdded || 0) / 1000).toFixed(1)}k LoC`);

    circles
      .on('mouseover', function (event: any, d: any) {
        d3.select(this).attr('fill', healthColor[d.health as BubbleHealth] + '44');
        const rect = containerRef.current!.getBoundingClientRect();
        setTooltip({ visible: true, x: event.clientX - rect.left, y: event.clientY - rect.top, pr: d });
      })
      .on('mousemove', function (event: any) {
        const rect = containerRef.current!.getBoundingClientRect();
        setTooltip((t) => ({ ...t, x: event.clientX - rect.left, y: event.clientY - rect.top }));
      })
      .on('mouseout', function (_: any, d: any) {
        d3.select(this).attr('fill', healthColor[d.health as BubbleHealth] + '22');
        setTooltip((t) => ({ ...t, visible: false }));
      });

    svg.append('text').attr('x', 8).attr('y', height - 8)
      .attr('fill', '#484f58').attr('font-size', 9).attr('font-family', 'Inter')
      .text('INSTANT REVIEW');
    svg.append('text').attr('x', width - 8).attr('y', height - 8)
      .attr('fill', '#484f58').attr('font-size', 9).attr('font-family', 'Inter')
      .attr('text-anchor', 'end').text('48H+ LATENCY');
    svg.append('text').attr('x', 8).attr('y', 14)
      .attr('fill', '#484f58').attr('font-size', 9).attr('font-family', 'Inter')
      .text('X: REVIEW LATENCY (HRS)   Y: PR AGE (DAYS)');
  }, [data]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <svg ref={svgRef} style={{ width: '100%', display: 'block' }} />
      {tooltip.visible && tooltip.pr && (
        <div className="dd-card" style={{
          position: 'absolute', left: tooltip.x + 12, top: tooltip.y - 50,
          padding: '10px 14px', fontSize: 12, minWidth: 200, pointerEvents: 'none', zIndex: 20,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>PR #{tooltip.pr.number}</div>
          <div style={{ color: 'var(--dd-text-muted)', marginBottom: 6, fontSize: 11 }}>{tooltip.pr.title}</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ color: 'var(--dd-green)', fontSize: 11 }}>+{tooltip.pr.linesAdded}</span>
            <span style={{ color: 'var(--dd-red)',   fontSize: 11 }}>-{tooltip.pr.linesRemoved}</span>
            <span className={`badge badge-${tooltip.pr.health === 'healthy' ? 'green' : tooltip.pr.health === 'at-risk' ? 'amber' : 'red'}`}>
              {tooltip.pr.health}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PRHealthPage() {
  const { data: bubbleData, isLoading: bubbleLoading } = useQuery({
    queryKey: ['bubble-matrix'],
    queryFn: () => api.get('/prs/bubble-matrix').then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const totalOpen = bubbleData?.length ?? 0;
  const stalled   = bubbleData?.filter((b: any) => b.health === 'stalled').length ?? 0;
  const atRisk    = bubbleData?.filter((b: any) => b.health === 'at-risk').length  ?? 0;
  const healthy   = totalOpen - stalled - atRisk;

  const velocityData = ['Jan','Feb','Mar','Apr','May','Jun','Jul'].map((m, i) => ({
    month: m, pts: [0,0,2,8,16,28,44][i],
  }));

  const stalledServices = [
    { name: 'Auth-Gateway',   icon: '🔐', stalled: 3, avg: '12d' },
    { name: 'Data-Warehouse',  icon: '🗃️', stalled: 1, avg:  '4d' },
    { name: 'Checkout-Core',   icon: '🛒', stalled: 2, avg:  '9d' },
  ];

  const stallPredictions = [
    { pr: 'AUTH-Infrastructure-v2', risk: 86, status: 'Risk', bar: 'var(--dd-red)' },
    { pr: 'FE-Dashboard-Refactor',  risk: 67, status: 'Risk', bar: 'var(--dd-amber)' },
    { pr: 'API-Gateway-Security',   risk: 52, status: 'Review', bar: 'var(--dd-amber)' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">PR Health Matrix</h1>
          <p className="page-subtitle">
            Visualizing velocity and review quality across active streams.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost"><Filter size={13} /> Filter</button>
          <button className="btn-primary"><Download size={13} /> Export Report</button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, fontSize: 12, color: 'var(--dd-text-muted)' }}>
        {[['healthy','var(--dd-green)','Healthy'], ['at-risk','var(--dd-amber)','Stalled']].map(([k,c,l]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c as string, display: 'inline-block' }} />
            {l}
          </span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="dd-card animate-scale-in" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dd-text)' }}>Health Overview</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="badge badge-green">{healthy} HEALTHY</span>
                <span className="badge badge-amber">{stalled} AT RISK</span>
                <span style={{ fontSize: 11, color: 'var(--dd-text-dim)' }}>Updated 2 minutes ago</span>
              </div>
            </div>
            {bubbleLoading ? (
              <div className="skeleton" style={{ height: 340 }} />
            ) : (bubbleData?.length > 0) ? (
              <BubbleMatrix data={bubbleData} />
            ) : (
              <BubbleMatrix data={[
                { number: 412, title: 'feat/auth-v2', health: 'healthy',  size: 400,  linesAdded: 400,  linesRemoved: 80  },
                { number: 398, title: 'fix/api',       health: 'healthy',  size: 180,  linesAdded: 180,  linesRemoved: 30  },
                { number: 756, title: 'infra/k8s',     health: 'at-risk',  size: 950,  linesAdded: 950,  linesRemoved: 200 },
                { number: 822, title: 'CORE-88',        health: 'healthy',  size: 2200, linesAdded: 2200, linesRemoved: 400 },
                { number: 633, title: 'PR-700',         health: 'at-risk',  size: 700,  linesAdded: 700,  linesRemoved: 120 },
                { number: 504, title: 'PR-504',         health: 'healthy',  size: 300,  linesAdded: 300,  linesRemoved: 60  },
              ]} />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div className="dd-card animate-fade-in-up delay-300" style={{ padding: '14px 16px', gridColumn: 'span 1' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--dd-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Velocity Trend</div>
              <div style={{ height: 70 }}>
                <ResponsiveContainer>
                  <BarChart data={velocityData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Bar dataKey="pts" radius={[3,3,0,0]} maxBarSize={14}>
                      {velocityData.map((_, i) => (
                        <Cell key={i} fill={i === velocityData.length - 1 ? '#00cba9' : '#3fb950'} fillOpacity={i === velocityData.length - 1 ? 1 : 0.55} />
                      ))}
                    </Bar>
                    <Tooltip contentStyle={{ background: '#1c2333', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, fontSize: 10 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ fontSize: 10, color: 'var(--dd-text-muted)', marginTop: 6 }}>+32% vs last sprint cycle</div>
            </div>

            <div className="dd-card animate-fade-in-up delay-400" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--dd-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Active Developers</div>
              <div style={{ fontFamily: 'Clash Display,Inter,sans-serif', fontSize: 36, fontWeight: 700, color: 'var(--dd-text)', lineHeight: 1 }}>42</div>
              <div style={{ display: 'flex', marginTop: 8, gap: -6 }}>
                {['#6577f3','#00cba9','#3fb950','#d29922','#f85149'].map((c, i) => (
                  <div key={i} style={{
                    width: 22, height: 22, borderRadius: '50%', border: '2px solid var(--dd-card)',
                    background: c, marginLeft: i > 0 ? -6 : 0, fontSize: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700,
                  }}>
                    {['M','S','K','J','R'][i]}
                  </div>
                ))}
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', border: '2px solid var(--dd-card)',
                  background: 'rgba(255,255,255,0.08)', marginLeft: -6, fontSize: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dd-text-muted)', fontWeight: 700,
                }}>+38</div>
              </div>
            </div>

            <div className="dd-card animate-fade-in-up delay-500" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--dd-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>PR Summary</div>
              {[
                { label: 'Success Rate', value: '94.2%', icon: '✓', color: 'var(--dd-green)' },
                { label: 'Conflicts',    value: '7 Active', icon: '⚠', color: 'var(--dd-amber)' },
                { label: 'Wait Review',  value: '22 Items', icon: '⏳', color: 'var(--dd-text-muted)' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--dd-text-muted)' }}>
                    <span style={{ marginRight: 4 }}>{icon}</span>{label}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="dd-card animate-fade-in-up delay-200" style={{ padding: '16px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Zap size={14} style={{ color: '#d29922' }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dd-text)' }}>Stall Predictor</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--dd-text-muted)', marginBottom: 12 }}>
              AI analysis of current review patterns predicts stalling for these items:
            </div>
            {stallPredictions.map(({ pr, risk, status, bar }) => (
              <div key={pr} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--dd-text)' }}>{pr}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: bar }}>{risk}%</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 3 }}>
                  <div style={{ height: '100%', width: `${risk}%`, background: bar, borderRadius: 2, transition: 'width 1s ease' }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--dd-text-dim)' }}>{status}</div>
              </div>
            ))}
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 12, marginTop: 4 }}>
              Automate Reminders
            </button>
          </div>

          <div className="dd-card animate-fade-in-up delay-300" style={{ padding: '16px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', color: 'var(--dd-text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Risk Profile</div>
            {[
              { label: 'Churn Rate', value: '18%', pct: 18, color: 'var(--dd-red)' },
              { label: 'Review Depth', value: '4.2', pct: 60, color: 'var(--dd-green)' },
            ].map(({ label, value, pct, color }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'var(--dd-text-muted)' }}>{label}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color }}>{value}</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
            <div style={{ fontSize: 10, color: 'var(--dd-text-dim)', marginTop: 4 }}>Avg comments per PR thread</div>
          </div>

          <div className="dd-card animate-fade-in-up delay-400" style={{ padding: '16px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', color: 'var(--dd-text-muted)', textTransform: 'uppercase' }}>Stalled Services</div>
              <span className="badge badge-red">4 ALERTS</span>
            </div>
            {stalledServices.map(({ name, icon, stalled: s, avg }) => (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 8,
                background: 'rgba(255,255,255,0.03)',
                marginBottom: 6, cursor: 'pointer',
              }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--dd-text)' }}>{name}</div>
                  <div style={{ fontSize: 10, color: 'var(--dd-text-muted)' }}>{s} Stalled PRs · {avg} Avg</div>
                </div>
                <ChevronRight size={13} style={{ color: 'var(--dd-text-dim)' }} />
              </div>
            ))}
            <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 11, marginTop: 6 }}>
              View All Services
            </button>
          </div>

          <div className="dd-card animate-fade-in-up delay-500" style={{ padding: '14px 16px', background: 'rgba(101,119,243,0.06)', borderColor: 'rgba(101,119,243,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Zap size={13} style={{ color: 'var(--dd-accent)' }} />
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--dd-accent)', textTransform: 'uppercase' }}>AI Recommendation</div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--dd-text-muted)', lineHeight: 1.6 }}>
              Consider re-assigning <strong style={{ color: 'var(--dd-text)' }}>#1189</strong> to Sarah K. — she has historical context on the Payment Gateway.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
