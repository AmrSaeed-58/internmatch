import API from './axios';

export const getProfile = () => API.get('/employer/profile');
export const updateProfile = (data) => API.put('/employer/profile', data);

export const uploadProfilePicture = (file) => {
  const formData = new FormData();
  formData.append('profilePicture', file);
  return API.post('/employer/profile/picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const uploadCompanyLogo = (file) => {
  const formData = new FormData();
  formData.append('companyLogo', file);
  return API.post('/employer/profile/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// AI
export const extractSkillsFromDescription = (description) =>
  API.post('/employer/extract-skills', { description });

// Internships
export const createInternship = (data) => API.post('/employer/internships', data);
export const getInternships = (params) => API.get('/employer/internships', { params });
export const getInternship = (id) => API.get(`/employer/internships/${id}`);
export const updateInternship = (id, data) => API.put(`/employer/internships/${id}`, data);
export const resubmitInternship = (id) => API.put(`/employer/internships/${id}/resubmit`);
export const closeInternship = (id) => API.put(`/employer/internships/${id}/close`);
export const reopenInternship = (id) => API.put(`/employer/internships/${id}/reopen`);
export const deleteInternship = (id) => API.delete(`/employer/internships/${id}`);

// Applicants
export const getApplicants = (internshipId, params) =>
  API.get(`/employer/internships/${internshipId}/applicants`, { params });
export const getApplicantProfile = (studentId) =>
  API.get(`/employer/applicants/${studentId}/profile`);
export const updateApplicationStatus = (applicationId, data) =>
  API.put(`/employer/applications/${applicationId}/status`, data);
export const getApplicationHistory = (applicationId) =>
  API.get(`/employer/applications/${applicationId}/history`);
export const downloadResume = (applicationId) =>
  API.get(`/employer/applications/${applicationId}/resume`, { responseType: 'blob' });

// AI Candidates
export const getCandidates = (internshipId, params) =>
  API.get(`/employer/internships/${internshipId}/candidates`, { params });
export const getTopCandidates = () => API.get('/employer/top-candidates');
export const inviteStudent = (internshipId, studentId, message) =>
  API.post(`/employer/internships/${internshipId}/invite/${studentId}`, { message });

// Analytics
export const getAnalytics = () => API.get('/employer/analytics');

// Notifications
export const getNotifications = (params) => API.get('/employer/notifications', { params });
export const markNotificationRead = (id) => API.put(`/employer/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.put('/employer/notifications/read-all');

// Account
export const changePassword = (data) => API.put('/employer/change-password', data);
export const getNotificationPreferences = () => API.get('/employer/notification-preferences');
export const updateNotificationPreferences = (data) => API.put('/employer/notification-preferences', data);
export const deleteAccount = (password) => API.delete('/employer/account', { data: { password } });
