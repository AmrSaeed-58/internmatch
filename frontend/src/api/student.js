import API from './axios';

export const getProfile = () => API.get('/student/profile');
export const updateProfile = (data) => API.put('/student/profile', data);

export const uploadProfilePicture = (file) => {
  const formData = new FormData();
  formData.append('profilePicture', file);
  return API.post('/student/profile/picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const deleteProfilePicture = () => API.delete('/student/profile/picture');

export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append('resume', file);
  return API.post('/student/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const confirmResume = (data) => API.post('/student/resume/confirm', data);
export const getResume = () => API.get('/student/resume');
export const deleteResume = () => API.delete('/student/resume');

export const getSkills = () => API.get('/student/skills');
export const addSkills = (skills) => API.post('/student/skills', { skills });
export const updateSkill = (skillId, proficiencyLevel) =>
  API.put(`/student/skills/${skillId}`, { proficiencyLevel });
export const removeSkill = (skillId) => API.delete(`/student/skills/${skillId}`);

export const changePassword = (data) => API.put('/student/change-password', data);

export const getNotificationPreferences = () => API.get('/student/notification-preferences');
export const updateNotificationPreferences = (data) => API.put('/student/notification-preferences', data);

// Notifications
export const getNotifications = (params = {}) => API.get('/student/notifications', { params });
export const markNotificationRead = (id) => API.put(`/student/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.put('/student/notifications/read-all');

export const deleteAccount = (password) => API.delete('/student/account', { data: { password } });

// Applications
export const getApplications = (params = {}) => API.get('/student/applications', { params });
export const getApplication = (id) => API.get(`/student/applications/${id}`);
export const getApplicationHistory = (id) => API.get(`/student/applications/${id}/history`);
export const applyToInternship = (data) => API.post('/student/applications', data);
export const withdrawApplication = (id) => API.put(`/student/applications/${id}/withdraw`);

// Recommendations
export const getRecommendations = (params = {}) => API.get('/student/recommendations', { params });

// Bookmarks
export const getBookmarks = (params = {}) => API.get('/student/bookmarks', { params });
export const addBookmark = (internshipId) => API.post(`/student/bookmarks/${internshipId}`);
export const removeBookmark = (internshipId) => API.delete(`/student/bookmarks/${internshipId}`);
