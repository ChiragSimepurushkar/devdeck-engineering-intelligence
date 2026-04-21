import { Users, Filter, Download } from 'lucide-react';

export default function TeamPage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Performance</h1>
          <p className="page-subtitle">
            Individual and team velocity metrics.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost"><Filter size={13} /> Filter</button>
          <button className="btn-primary"><Download size={13} /> Export Report</button>
        </div>
      </div>

      <div className="dd-card" style={{ padding: 40, textAlign: 'center', color: 'var(--dd-text-muted)' }}>
        <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--dd-text)' }}>Team Analytics Dashboard</h3>
        <p style={{ fontSize: 13, marginTop: 8 }}>This feature is configured. Connect your GitHub organization to view detailed team metrics.</p>
      </div>
    </div>
  );
}
