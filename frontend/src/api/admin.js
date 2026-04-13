import API from './axios';

// Dashboard
export const getDashboardStats = () => API.get('/admin/dashboard-stats');

// Users
export const getUsers = (params) => API.get('/admin/users', { params });
export const getUserById = (id) => API.get(`/admin/users/${id}`);
export const updateUser = (id, data) => API.put(`/admin/users/${id}`, data);
export const toggleUserActive = (id) => API.put(`/admin/users/${id}/toggle-active`);
export const deleteUser = (id) => API.delete(`/admin/users/${id}`);

// Internships
export const getInternships = (params) => API.get('/admin/internships', { params });
export const approveInternship = (id) => API.put(`/admin/internships/${id}/approve`);
export const rejectInternship = (id, note) => API.put(`/admin/internships/${id}/reject`, { note });
export const deleteInternship = (id) => API.delete(`/admin/internships/${id}`);

// Logs
export const getLogs = (params) => API.get('/admin/logs', { params });
export const exportLogs = (params) => API.get('/admin/logs/export', { params, responseType: 'blob' });

// Reports
export const generateReport = (data) => API.post('/admin/reports/generate', data);
export const exportReport = (params) => API.get('/admin/reports/export', { params, responseType: 'blob' });

// Notifications
export const getNotifications = (params) => API.get('/admin/notifications', { params });
export const markNotificationRead = (id) => API.put(`/admin/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.put('/admin/notifications/read-all');

// Account
export const changePassword = (data) => API.put('/admin/change-password', data);
