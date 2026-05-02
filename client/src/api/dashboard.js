import api from './client';

export const getStats = () => api.get('/dashboard/stats');
