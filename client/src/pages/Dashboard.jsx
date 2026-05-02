import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStats } from '../api/dashboard';
import './Dashboard.css';

const statusLabels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
const statusColors = { TODO: 'var(--info)', IN_PROGRESS: 'var(--warning)', DONE: 'var(--success)' };
const priorityColors = { LOW: 'var(--text-muted)', MEDIUM: 'var(--info)', HIGH: 'var(--warning)', URGENT: 'var(--danger)' };
const priorityClass = { LOW: 'priority-low', MEDIUM: 'priority-med', HIGH: 'priority-high', URGENT: 'priority-urgent' };

function daysOverdue(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'Due today';
  if (diff === 1) return '1 day overdue';
  return `${diff} days overdue`;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading...</div>;
  if (!stats) return <div className="page-empty">Could not load dashboard.</div>;

  const maxStatusCount = Math.max(...Object.values(stats.byStatus || {}), 1);
  const maxUserCount = Math.max(...(stats.byUser || []).map(u => u.count), 1);

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Overview</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-accent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.projectCount}</span>
            <span className="stat-label">Projects</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.byStatus?.DONE || 0}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-danger">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.overdue}</span>
            <span className="stat-label">Overdue</span>
          </div>
        </div>
      </div>

      {stats.overdueTasks?.length > 0 && (
        <div className="overdue-section">
          <h3 className="panel-title">Overdue</h3>
          <div className="overdue-list">
            {stats.overdueTasks.map(t => (
              <Link to={`/projects/${t.project.id}`} key={t.id} className="overdue-item">
                <span className={`priority-dot ${priorityClass[t.priority]}`} />
                <div className="overdue-info">
                  <span className="overdue-task-title">{t.title}</span>
                  <span className="overdue-meta">
                    {t.project.name}
                    {t.assignee && <> · {t.assignee.name}</>}
                  </span>
                </div>
                <span className="overdue-days">{daysOverdue(t.dueDate)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-panels">
        <div className="panel">
          <h3 className="panel-title">Tasks by Status</h3>
          <div className="bar-chart">
            {Object.entries(statusLabels).map(([k, label]) => (
              <div key={k} className="bar-row">
                <span className="bar-label">{label}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${((stats.byStatus?.[k] || 0) / maxStatusCount) * 100}%`,
                      background: statusColors[k]
                    }}
                  />
                </div>
                <span className="bar-value">{stats.byStatus?.[k] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">Tasks by Priority</h3>
          <div className="bar-chart">
            {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(k => (
              <div key={k} className="bar-row">
                <span className="bar-label">{k.charAt(0) + k.slice(1).toLowerCase()}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${((stats.byPriority?.[k] || 0) / Math.max(...Object.values(stats.byPriority || {}), 1)) * 100}%`,
                      background: priorityColors[k]
                    }}
                  />
                </div>
                <span className="bar-value">{stats.byPriority?.[k] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel panel-full">
          <h3 className="panel-title">Tasks per User</h3>
          {stats.byUser?.length ? (
            <div className="bar-chart">
              {stats.byUser.map((u, i) => (
                <div key={i} className="bar-row">
                  <span className="bar-label">{u.name}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${(u.count / maxUserCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="bar-value">{u.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="panel-empty">No assigned tasks yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
