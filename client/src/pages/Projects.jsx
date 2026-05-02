import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, createProject, deleteProject } from '../api/projects';
import { useAuth } from '../context/AuthContext';
import './Projects.css';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();

  const load = () => {
    getProjects()
      .then(r => setProjects(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createProject({ name, description: desc || undefined });
      setName('');
      setDesc('');
      setShowCreate(false);
      load();
    } catch {} finally { setBusy(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    await deleteProject(id);
    load();
  };

  const getMyRole = (p) => p.members?.find(m => m.user.id === user?.id)?.role;

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Project
        </button>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create Project</h2>
            <form onSubmit={handleCreate} className="modal-form">
              <div className="field">
                <label>Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Project name" required autoFocus />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional description" rows={3} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!projects.length ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <Link to={`/projects/${p.id}`} key={p.id} className="project-card">
              <div className="project-card-header">
                <div className="project-icon">{p.name[0].toUpperCase()}</div>
                <button
                  className="project-delete"
                  onClick={e => { e.preventDefault(); handleDelete(p.id); }}
                  title="Delete project"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
              <h3 className="project-name">{p.name}</h3>
              {p.description && <p className="project-desc">{p.description}</p>}
              <div className="project-meta">
                <span>{p._count?.tasks || 0} tasks</span>
                <span>{p.members?.length || 0} members</span>
                {getMyRole(p) === 'ADMIN' && <span className="project-role-tag project-role-admin">Admin</span>}
                {getMyRole(p) === 'MEMBER' && <span className="project-role-tag project-role-member">Member</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
