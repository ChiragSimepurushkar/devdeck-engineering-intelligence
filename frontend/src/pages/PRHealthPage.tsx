import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as d3 from 'd3';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GitPullRequest, Clock, AlertCircle } from 'lucide-react';
import api from '../lib/api';

type BubbleHealth = 'healthy' | 'at-risk' | 'stalled';
const healthColor: Record<BubbleHealth, string> = {
  healthy: '#10b981',
  'at-risk': '#f59e0b',
  stalled: '#ef4444',
};

// Nuance signal: human-readable labels and colours per stall reason.
// Culture problems get orange/red. Legitimate complexity gets blue/purple.
const STALL_META: Record<string, { label: string; color: string }> = {
  REVIEWER_INACTIVE: { label: '⚠ Reviewer inactive',      color: '#f59e0b' },
  NO_REVIEWER:       { label: '⚠ No reviewer assigned',   color: '#f59e0b' },
  CHURNING:          { label: '🔄 High churn',            color: '#ef4444' },
  COMPLEX_IN_REVIEW: { label: '✓ Complex — in review',   color: '#06b6d4' },
  NEEDS_EXPERT:      { label: '🔍 Needs expert reviewer', color: '#8b5cf6' },
  STALLED:           { label: '✗ Stalled',                color: '#ef4444' },
};

/* ---------- D3 Bubble Matrix ---------- */
function BubbleMatrix({ data }: { data: any[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; pr: any }>({
    visible: false, x: 0, y: 0, pr: null,
  });

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data.length) return;
    const width = containerRef.current.clientWidth;
    const height = 380;

    const svg = d3.select(svgRef.current)
      .attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    // Size scale
    const sizeExtent = d3.extent(data, (d: any) => d.size) as [number, number];
    const rScale = d3.scaleSqrt().domain([0, sizeExtent[1]]).range([8, 48]);

    const nodes = data.map((d: any) => ({ ...d, r: rScale(d.size || 1) }));

    const simulation = d3.forceSimulation(nodes as any)
      .force('charge', d3.forceManyBody().strength(5))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.r + 3).strength(0.9))
      .stop();

    for (let i = 0; i < 120; i++) simulation.tick();

    const g = svg.append('g');

    // Draw bubbles
    const circles = g.selectAll('circle')
      .data(nodes).enter()
      .append('circle')
      .attr('class', 'pr-bubble')
      .attr('cx', (d: any) => Math.max(d.r, Math.min(width - d.r, d.x ?? width / 2)))
      .attr('cy', (d: any) => Math.max(d.r, Math.min(height - d.r, d.y ?? height / 2)))
      .attr('r', (d: any) => d.r)
      .attr('fill', (d: any) => healthColor[d.health as BubbleHealth] + '30')
      .attr('stroke', (d: any) => healthColor[d.health as BubbleHealth])
      .attr('stroke-width', 1.5)
      .style('filter', (d: any) => `drop-shadow(0 0 8px ${healthColor[d.health as BubbleHealth]}60)`);

    // Labels
    g.selectAll('text.pr-number')
      .data(nodes.filter((d: any) => d.r > 20)).enter()
      .append('text')
      .attr('x', (d: any) => Math.max(d.r, Math.min(width - d.r, d.x ?? width / 2)))
      .attr('y', (d: any) => Math.max(d.r, Math.min(height - d.r, d.y ?? height / 2)))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-size', (d: any) => Math.min(d.r / 2.5, 14))
      .attr('font-weight', '600')
      .attr('font-family', 'Inter')
      .attr('pointer-events', 'none')
      .text((d: any) => `#${d.number}`);

    // Hover
    circles
      .on('mouseover', function (event: any, d: any) {
        d3.select(this).attr('fill', healthColor[d.health as BubbleHealth] + '55');
        const rect = containerRef.current!.getBoundingClientRect();
        setTooltip({ visible: true, x: event.clientX - rect.left, y: event.clientY - rect.top, pr: d });
      })
      .on('mousemove', function (event: any) {
        const rect = containerRef.current!.getBoundingClientRect();
        setTooltip((t) => ({ ...t, x: event.clientX - rect.left, y: event.clientY - rect.top }));
      })
      .on('mouseout', function (_: any, d: any) {
        d3.select(this).attr('fill', healthColor[d.health as BubbleHealth] + '30');
        setTooltip((t) => ({ ...t, visible: false }));
      });
  }, [data]);

  return (
    <div ref={containerRef} className="relative" style={{ width: '100%' }}>
      <svg ref={svgRef} style={{ width: '100%', display: 'block' }} />
      {tooltip.visible && tooltip.pr && (
        <div className="glass-card pointer-events-none absolute z-10 p-3"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40, minWidth: 220, fontSize: 12 }}>
          <div className="font-medium mb-1">PR #{tooltip.pr.number}</div>
          <div style={{ color: 'var(--color-text-secondary)' }} className="truncate mb-2">{tooltip.pr.title}</div>
          <div className="flex gap-2 flex-wrap mb-2">
            <span style={{ color: 'var(--color-healthy)' }}>+{tooltip.pr.linesAdded}</span>
            <span style={{ color: 'var(--color-danger)' }}>-{tooltip.pr.linesRemoved}</span>
            <span className={`badge badge-${tooltip.pr.health === 'healthy' ? 'healthy' : tooltip.pr.health === 'at-risk' ? 'warning' : 'danger'}`}>
              {tooltip.pr.health}
            </span>
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{tooltip.pr.complexity}</span>
          </div>
          {/* Nuance signal — the key PS-03 differentiator */}
          {tooltip.pr.stallReason && STALL_META[tooltip.pr.stallReason] && (
            <div style={{
              marginTop: 4,
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              background: STALL_META[tooltip.pr.stallReason].color + '22',
              color: STALL_META[tooltip.pr.stallReason].color,
              border: `1px solid ${STALL_META[tooltip.pr.stallReason].color}55`,
            }}>
              {STALL_META[tooltip.pr.stallReason].label}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- PR Health Page ---------- */
export default function PRHealthPage() {
  const { data: bubbleData, isLoading: bubbleLoading } = useQuery({
    queryKey: ['bubble-matrix'],
    queryFn: () => api.get('/prs/bubble-matrix').then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const { data: histoData, isLoading: histoLoading } = useQuery({
    queryKey: ['latency-histogram'],
    queryFn: () => api.get('/prs/stats/latency-histogram').then(r => r.data.data),
  });

  const totalOpen = bubbleData?.length ?? 0;
  const stalled = bubbleData?.filter((b: any) => b.health === 'stalled').length ?? 0;
  const atRisk = bubbleData?.filter((b: any) => b.health === 'at-risk').length ?? 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8 animate-fade-in">
        <div className="p-2 rounded-xl" style={{ background: 'rgba(124,58,237,0.15)' }}>
          <GitPullRequest size={20} style={{ color: 'var(--color-accent-1)' }} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">PR Health</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Bubble = lines changed · Color = activity health</p>
        </div>
        <div className="ml-auto flex gap-3">
          {[['healthy', '#10b981', 'Active'], ['at-risk', '#f59e0b', 'At Risk'], ['stalled', '#ef4444', 'Stalled']].map(([key, color, label]) => (
            <div key={key} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <div className="w-3 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex gap-3 mb-6 animate-fade-in delay-100">
        <div className="glass-card px-4 py-3 flex items-center gap-2">
          <GitPullRequest size={14} style={{ color: 'var(--color-accent-1)' }} />
          <span className="text-sm"><strong>{totalOpen}</strong> open PRs</span>
        </div>
        <div className="glass-card px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} style={{ color: 'var(--color-danger)' }} />
          <span className="text-sm"><strong>{stalled}</strong> stalled</span>
        </div>
        <div className="glass-card px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} style={{ color: 'var(--color-warning)' }} />
          <span className="text-sm"><strong>{atRisk}</strong> at risk</span>
        </div>
      </div>

      <div className="bento-grid">
        {/* D3 Bubble Matrix */}
        <div className="glass-card p-6 animate-scale-in" style={{ gridColumn: 'span 8' }}>
          <h3 className="font-medium text-sm mb-4">Open PR Bubble Matrix</h3>
          {bubbleLoading ? (
            <div className="skeleton" style={{ height: 380 }} />
          ) : bubbleData?.length > 0 ? (
            <BubbleMatrix data={bubbleData} />
          ) : (
            <div className="flex flex-col items-center justify-center" style={{ height: 380, color: 'var(--color-text-muted)' }}>
              <GitPullRequest size={40} className="mb-3" style={{ opacity: 0.3 }} />
              <p>No open PRs found</p>
              <p className="text-xs mt-1">Connect a GitHub repo to see data</p>
            </div>
          )}
        </div>

        {/* Review Latency Histogram */}
        <div className="glass-card p-6 animate-fade-in-up delay-200" style={{ gridColumn: 'span 4' }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} style={{ color: 'var(--color-accent-2)' }} />
            <h3 className="font-medium text-sm">Review Latency Distribution</h3>
          </div>
          {histoLoading ? <div className="skeleton h-64" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={histoData || []} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="label" width={50} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(10,15,35,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [v, 'PRs']}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}>
                  {(histoData || []).map((_: any, i: number) => (
                    <Cell key={i} fill={i < 2 ? '#10b981' : i < 4 ? '#f59e0b' : '#ef4444'}
                      style={{ filter: `drop-shadow(0 0 4px ${i < 2 ? '#10b98155' : i < 4 ? '#f59e0b55' : '#ef444455'})` }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
