import apiClient from './axios';

export const bookclubAPI = {
  // Get all bookclubs for user
  getMyBookclubs: async () => {
    const response = await apiClient.get('/bookclubs/my');
    return response.data;
  },

  // Get bookclub by ID
  getBookclub: async (bookclubId) => {
    const response = await apiClient.get(`/bookclubs/${bookclubId}`);
    return response.data;
  },

  // Create new bookclub
  createBookclub: async (bookclubData) => {
    const response = await apiClient.post('/bookclubs', bookclubData);
    return response.data;
  },

  // Update bookclub
  updateBookclub: async (bookclubId, updates) => {
    const response = await apiClient.put(`/bookclubs/${bookclubId}`, updates);
    return response.data;
  },

  // Delete bookclub
  deleteBookclub: async (bookclubId) => {
    const response = await apiClient.delete(`/bookclubs/${bookclubId}`);
    return response.data;
  },

  // Join bookclub via invite
  joinBookclub: async (inviteCode) => {
    const response = await apiClient.post(`/bookclubs/join/${inviteCode}`);
    return response.data;
  },

  // Generate invite code
  generateInvite: async (bookclubId) => {
    const response = await apiClient.post(`/bookclubs/${bookclubId}/invite`);
    return response.data;
  },

  // Get bookclub books
  getBookclubBooks: async (bookclubId) => {
    const response = await apiClient.get(`/bookclub/${bookclubId}/books`);
    return response.data;
  },

  // Add book to bookclub
  addBookToBookclub: async (bookclubId, bookData) => {
    const response = await apiClient.post(`/bookclub/${bookclubId}/books`, bookData);
    return response.data;
  },

  // Get book suggestions
  getBookSuggestions: async (bookclubId) => {
    const response = await apiClient.get(`/bookclub/${bookclubId}/suggestions`);
    return response.data;
  },

  // Add book suggestion
  addBookSuggestion: async (bookclubId, suggestionData) => {
    const response = await apiClient.post(`/bookclub/${bookclubId}/suggestions`, suggestionData);
    return response.data;
  },

  // Vote on suggestion
  voteOnSuggestion: async (bookclubId, suggestionId, vote) => {
    const response = await apiClient.post(`/bookclub/${bookclubId}/suggestions/${suggestionId}/vote`, { vote });
    return response.data;
  },

  // Get reading progress
  getReadingProgress: async (bookclubId, bookId) => {
    const response = await apiClient.get(`/bookclub-books/${bookclubId}/books/${bookId}/progress`);
    return response.data;
  },

  // Update reading progress
  updateReadingProgress: async (bookclubId, bookId, progressData) => {
    const response = await apiClient.put(`/bookclub-books/${bookclubId}/books/${bookId}/progress`, progressData);
    return response.data;
  },

  // Upload bookclub image
  uploadImage: async (bookclubId, formData) => {
    const response = await apiClient.post(`/bookclubs/${bookclubId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
