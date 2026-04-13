import API from './axios';

export const getConversations = (params = {}) =>
  API.get('/messages/conversations', { params });

export const createConversation = (data) =>
  API.post('/messages/conversations', data);

export const getMessages = (conversationId, params = {}) =>
  API.get(`/messages/conversations/${conversationId}/messages`, { params });

export const sendMessage = (conversationId, content) =>
  API.post(`/messages/conversations/${conversationId}/messages`, { content });

export const markAsRead = (conversationId) =>
  API.put(`/messages/conversations/${conversationId}/read`);
