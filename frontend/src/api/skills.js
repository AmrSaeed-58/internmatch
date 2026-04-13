import API from './axios';

export const searchSkills = (q, limit = 50) =>
  API.get('/skills', { params: { q, limit } });

export const getCategories = () => API.get('/skills/categories');
