import api from './client';

export const getTasks = (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params });
export const getTask = (projectId, taskId) => api.get(`/projects/${projectId}/tasks/${taskId}`);
export const createTask = (projectId, d) => api.post(`/projects/${projectId}/tasks`, d);
export const updateTask = (projectId, taskId, d) => api.put(`/projects/${projectId}/tasks/${taskId}`, d);
export const updateTaskStatus = (projectId, taskId, status) => api.patch(`/projects/${projectId}/tasks/${taskId}/status`, { status });
export const deleteTask = (projectId, taskId) => api.delete(`/projects/${projectId}/tasks/${taskId}`);
