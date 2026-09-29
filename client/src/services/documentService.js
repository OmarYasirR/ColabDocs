// src/services/documentService.js
import api from './api';

const documentService = {
  async listDocuments(params = {}) {
    const { data } = await api.get('/documents', { params });
    return data; // { documents: [...] }
  },

  async getDocument(documentId) {
    const { data } = await api.get(`/documents/${documentId}`);
    return data; // document
  },

  async createDocument(payload) {
    const { data } = await api.post('/documents', payload);
    return data; // document
  },

  async updateDocument(documentId, payload) {
    const { data } = await api.patch(`/documents/${documentId}`, payload);
    return data; // document
  },

  async deleteDocument(documentId) {
    // Soft delete — moves the document to trash rather than permanently
    // removing it. Distinct from permanentlyDeleteDocument below.
    const { data } = await api.delete(`/documents/${documentId}`);
    return data;
  },

  async permanentlyDeleteDocument(documentId) {
    const { data } = await api.delete(`/documents/${documentId}/permanent`);
    return data;
  },

  async restoreDocument(documentId) {
    const { data } = await api.post(`/documents/${documentId}/restore`);
    return data; // document, with isTrashed: false
  },

  async setFavorite(documentId, isFavorite) {
    const { data } = await api.patch(`/documents/${documentId}/favorite`, { isFavorite });
    return data; // document, with updated isFavorite
  },

  async shareDocument(documentId, payload) {
    const { data } = await api.post(`/documents/${documentId}/share`, payload);
    return data;
  },

  async getCollaborators(documentId) {
  const { data } = await api.get(`/documents/${documentId}/collaborators`);
  return data;
},

async addCollaborator(documentId, payload) {
  const { data } = await api.post(`/documents/${documentId}/collaborators`, payload);
  return data;
},

async removeCollaborator(documentId, userId) {
  const { data } = await api.delete(`/documents/${documentId}/collaborators/${userId}`);
  return data;
},
};

export default documentService;