import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, addMember, removeMember, deleteProject } from '../api/projects';
import { createTask, updateTask, updateTaskStatus, deleteTask } from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import './ProjectDetail.css';

const statuses = ['TODO', 'IN_PROGRESS', 'DONE'];
const statusLabels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const priorityClass = { LOW: 'priority-low', MEDIUM: 'priority-med', HIGH: 'priority-high', URGENT: 'priority-urgent' };

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(null);
  const [memberModal, setMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const myRole = project?.members?.find(m => m.user.id === user.id)?.role;
  const isAdmin = myRole === 'ADMIN';

  const load = useCallback(() => {
    getProject(id)
      .then(r => setProject(r.data))
      .catch(() => nav('/projects'))
      .finally(() => setLoading(false));
  }, [id, nav]);

  useEffect(load, [load]);

  const openNewTask = () => setTaskModal({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
  const openEditTask = (t) => setTaskModal({ ...t, _edit: true, dueDate: t.dueDate ? t.dueDate.slice(0, 10) : '' });

  const saveTask = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const d = {
        title: taskModal.title,
        description: taskModal.description || undefined,
        priority: taskModal.priority,
        dueDate: taskModal.dueDate || null,
        assigneeId: taskModal.assigneeId || null
      };
      if (taskModal._edit) {
        d.status = taskModal.status;
        await updateTask(id, taskModal.id, d);
      } else {
        await createTask(id, d);
      }
      setTaskModal(null);
      load();
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed');
    } finally { setBusy(false); }
  };

  const changeStatus = async (taskId, status) => {
    await updateTaskStatus(id, taskId, status);
    load();
  };

  const removeTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await deleteTask(id, taskId);
    load();
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await addMember(id, memberEmail, memberRole);
      setMemberEmail('');
      setMemberRole('MEMBER');
      setMemberModal(false);
      load();
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed');
    } finally { setBusy(false); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    await removeMember(id, userId);
    load();
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its tasks?')) return;
    await deleteProject(id);
    nav('/projects');
  };

  const isOverdue = (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE';
  const getMemberRole = (userId) => project?.members?.find(m => m.user.id === userId)?.role;

  if (loading) return <div className="page-loading">Loading...</div>;
  if (!project) return null;

  return (
    <div className="project-detail">
      <div className="page-header">
        <div>
          <div className="detail-breadcrumb">
            <a onClick={() => nav('/projects')}>Projects</a>
            <span>/</span>
          </div>
          <h1>{project.name}</h1>
          {project.description && <p className="page-subtitle">{project.description}</p>}
        </div>
        <div className="header-actions">
          {isAdmin && (
            <button className="btn-ghost" onClick={() => setMemberModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              Add Member
            </button>
          )}
          <button className="btn-primary" onClick={openNewTask}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Task
          </button>
        </div>
      </div>

      <div className="members-bar">
        {project.members.map(m => (
          <div key={m.id} className="member-chip">
            <div className="member-avatar">{m.user.name[0].toUpperCase()}</div>
            <span>{m.user.name}</span>
            <span className={`role-badge role-${m.role.toLowerCase()}`}>{m.role}</span>
            {isAdmin && m.user.id !== user.id && (
              <button className="member-remove" onClick={() => handleRemoveMember(m.user.id)}>×</button>
            )}
          </div>
        ))}
      </div>

      <div className="task-board">
        {statuses.map(s => {
          const tasks = (project.tasks || []).filter(t => t.status === s);
          return (
            <div key={s} className="task-column">
              <div className="column-header">
                <span className={`column-dot status-${s.toLowerCase()}`} />
                <h3>{statusLabels[s]}</h3>
                <span className="column-count">{tasks.length}</span>
              </div>
              <div className="column-tasks">
                {tasks.map(t => (
                  <div key={t.id} className={`task-card ${isOverdue(t) ? 'task-overdue' : ''}`}>
                    <div className="task-card-top">
                      <span className={`priority-dot ${priorityClass[t.priority]}`} title={t.priority} />
                      <div className="task-card-actions">
                        {(isAdmin || t.assigneeId === user.id) && (
                          <select
                            value={t.status}
                            onChange={e => changeStatus(t.id, e.target.value)}
                            className="status-select"
                          >
                            {statuses.map(st => <option key={st} value={st}>{statusLabels[st]}</option>)}
                          </select>
                        )}
                        {isAdmin && (
                          <>
                            <button className="icon-btn" onClick={() => openEditTask(t)} title="Edit">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button className="icon-btn icon-btn-danger" onClick={() => removeTask(t.id)} title="Delete">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <h4 className="task-title">{t.title}</h4>
                    {t.description && <p className="task-desc">{t.description}</p>}
                    <div className="task-card-footer">
                      {t.assignee ? (
                        <div className="task-assignee">
                          <div className="mini-avatar">{t.assignee.name[0].toUpperCase()}</div>
                          <span>{t.assignee.name}</span>
                          {getMemberRole(t.assigneeId) === 'ADMIN' && <span className="admin-tag">Admin</span>}
                          {getMemberRole(t.assigneeId) === 'MEMBER' && <span className="member-tag">Member</span>}
                        </div>
                      ) : (
                        <div className="task-assignee">
                          <span className="unassigned-tag">Unassigned</span>
                        </div>
                      )}
                      <span className={`task-due ${isOverdue(t) ? 'due-overdue' : ''}`}>
                        {t.dueDate
                          ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : 'No date'}
                      </span>
                    </div>
                  </div>
                ))}
                {!tasks.length && <div className="column-empty">No tasks</div>}
              </div>
            </div>
          );
        })}
      </div>

      {isAdmin && (
        <div className="danger-zone">
          <button className="btn-danger" onClick={handleDeleteProject}>Delete Project</button>
        </div>
      )}

      {taskModal && (
        <div className="modal-overlay" onClick={() => setTaskModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{taskModal._edit ? 'Edit Task' : 'New Task'}</h2>
            <form onSubmit={saveTask} className="modal-form">
              {err && <div className="auth-error">{err}</div>}
              <div className="field">
                <label>Title</label>
                <input value={taskModal.title} onChange={e => setTaskModal({ ...taskModal, title: e.target.value })} required autoFocus />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea value={taskModal.description || ''} onChange={e => setTaskModal({ ...taskModal, description: e.target.value })} rows={3} />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Priority</label>
                  <select value={taskModal.priority} onChange={e => setTaskModal({ ...taskModal, priority: e.target.value })}>
                    {priorities.map(p => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Due Date</label>
                  <input type="date" value={taskModal.dueDate || ''} onChange={e => setTaskModal({ ...taskModal, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label>Assignee</label>
                <select value={taskModal.assigneeId || ''} onChange={e => setTaskModal({ ...taskModal, assigneeId: e.target.value })}>
                  <option value="">Unassigned</option>
                  {project.members.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
                </select>
              </div>
              {taskModal._edit && (
                <div className="field">
                  <label>Status</label>
                  <select value={taskModal.status} onChange={e => setTaskModal({ ...taskModal, status: e.target.value })}>
                    {statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setTaskModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {memberModal && (
        <div className="modal-overlay" onClick={() => { setMemberModal(false); setErr(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Member</h2>
            <form onSubmit={handleAddMember} className="modal-form">
              {err && <div className="auth-error">{err}</div>}
              <div className="field">
                <label>Email</label>
                <input type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="member@example.com" required autoFocus />
              </div>
              <div className="field">
                <label>Role</label>
                <select value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => { setMemberModal(false); setErr(''); }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Adding...' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
