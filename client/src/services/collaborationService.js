import api from './api';

const collaborationService = {
  async getActiveCollaborators(documentId) {
    const { data } = await api.get(`/documents/${documentId}/collaborators`);
    return data;
  },

  async getComments(documentId) {
    const { data } = await api.get(`/documents/${documentId}/comments`);
    return data; // { comments: [...] }
  },

  async addComment(documentId, payload) {
    const { data } = await api.post(`/documents/${documentId}/comments`, payload);
    return data; // comment
  },

  async resolveComment(documentId, commentId) {
    const { data } = await api.patch(`/documents/${documentId}/comments/${commentId}`, {
      resolved: true,
    });
    return data; // updated comment
  },

  async deleteComment(documentId, commentId) {
    const { data } = await api.delete(`/documents/${documentId}/comments/${commentId}`);
    return data;
  },

  async getShareableUsers(documentId, query = '') {
  const { data } = await api.get('/users', { params: { excludeDocument: documentId, query } });
  return data; // { users: [...] }
},
};

export default collaborationService;