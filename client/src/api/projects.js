import api from './client';

export const getProjects = () => api.get('/projects');
export const getProject = (id) => api.get(`/projects/${id}`);
export const createProject = (d) => api.post('/projects', d);
export const updateProject = (id, d) => api.put(`/projects/${id}`, d);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const addMember = (id, email, role) => api.post(`/projects/${id}/members`, { email, role });
export const removeMember = (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`);
