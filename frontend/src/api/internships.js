import API from './axios';

/**
 * List active internships with filters + pagination.
 * @param {Object} params - Query params: page, limit, q, work_type, location, duration_min, duration_max, salary_min, skill, sort
 */
export const getInternships = (params = {}) =>
  API.get('/internships', { params });

/**
 * Get internship details by ID.
 * @param {number|string} id
 */
export const getInternship = (id) =>
  API.get(`/internships/${id}`);

export const getEmployerProfile = (id) =>
  API.get(`/internships/employers/${id}`);

/**
 * Get featured internships for landing page.
 */
export const getFeatured = () =>
  API.get('/internships/featured');

/**
 * Get platform stats for landing page.
 */
export const getStats = () =>
  API.get('/internships/stats');
