import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import documentService from '../../services/documentService';
import { DOCUMENT_STATUS } from '../../utils/constants';

// ---------------------------------------------------------------------------
// Async thunks
// ---------------------------------------------------------------------------
export const fetchDocuments = createAsyncThunk(
  'document/fetchDocuments',
  async (params, { rejectWithValue }) => {
    try {
      const data = await documentService.listDocuments(params);
      return data.documents;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to load documents');
    }
  }
);

export const fetchDocumentById = createAsyncThunk(
  'document/fetchDocumentById',
  async (documentId, { rejectWithValue }) => {
    try {
      const data = await documentService.getDocument(documentId);
      return data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to load document');
    }
  }
);

export const createDocument = createAsyncThunk(
  'document/createDocument',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await documentService.createDocument(payload);
      return data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to create document');
    }
  }
);

export const saveDocument = createAsyncThunk(
  'document/saveDocument',
  async ({ documentId, changes }, { rejectWithValue }) => {
    try {
      const data = await documentService.updateDocument(documentId, changes);
      return data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to save document');
    }
  }
);

// Soft delete — moves to trash. Kept as `deleteDocument` for backward
// compatibility with existing call sites (Dashboard's non-trash views).
export const deleteDocument = createAsyncThunk(
  'document/deleteDocument',
  async (documentId, { rejectWithValue }) => {
    try {
      await documentService.deleteDocument(documentId);
      return documentId;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to delete document');
    }
  }
);

export const permanentlyDeleteDocument = createAsyncThunk(
  'document/permanentlyDeleteDocument',
  async (documentId, { rejectWithValue }) => {
    try {
      await documentService.permanentlyDeleteDocument(documentId);
      return documentId;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to permanently delete document');
    }
  }
);

export const restoreDocument = createAsyncThunk(
  'document/restoreDocument',
  async (documentId, { rejectWithValue }) => {
    try {
      const data = await documentService.restoreDocument(documentId);
      return data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to restore document');
    }
  }
);

export const toggleFavorite = createAsyncThunk(
  'document/toggleFavorite',
  async ({ documentId, isFavorite }, { rejectWithValue }) => {
    try {
      const data = await documentService.setFavorite(documentId, isFavorite);
      return data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to update favorite');
    }
  }
);

const initialState = {
  // Dashboard list
  documents: [],
  listStatus: 'idle', // idle | loading | succeeded | failed
  listError: null,

  // Currently open document (editor)
  activeDocument: null, // { id, title, content, ownerId, role, updatedAt, ... }
  activeStatus: 'idle',
  activeError: null,

  // Autosave state
  saveStatus: DOCUMENT_STATUS.SAVED, // saved | saving | unsaved | error
  lastSavedAt: null,
};

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    // Local edit before a save round-trip — marks doc dirty immediately
    // for responsive UI (Toolbar save-status indicator, etc.)
    localContentChanged(state, action) {
      if (!state.activeDocument) return;
      state.activeDocument.content = action.payload;
      state.saveStatus = DOCUMENT_STATUS.UNSAVED;
    },
    localTitleChanged(state, action) {
      if (!state.activeDocument) return;
      state.activeDocument.title = action.payload;
      state.saveStatus = DOCUMENT_STATUS.UNSAVED;
    },
    // Applied when another collaborator's edit arrives over the socket
    applyRemoteUpdate(state, action) {
      if (!state.activeDocument) return;
      const { content, title } = action.payload;
      if (content !== undefined) state.activeDocument.content = content;
      if (title !== undefined) state.activeDocument.title = title;
    },
    // Optimistic favorite toggle — flips immediately in the list so the
    // star icon feels instant; toggleFavorite.rejected below reverts it
    // if the request actually fails.
    favoriteToggledOptimistic(state, action) {
      const { documentId, isFavorite } = action.payload;
      const doc = state.documents.find((d) => d.id === documentId);
      if (doc) doc.isFavorite = isFavorite;
    },
    clearActiveDocument(state) {
      state.activeDocument = null;
      state.activeStatus = 'idle';
      state.activeError = null;
      state.saveStatus = DOCUMENT_STATUS.SAVED;
    },
    clearDocumentErrors(state) {
      state.listError = null;
      state.activeError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch list
      .addCase(fetchDocuments.pending, (state) => {
        state.listStatus = 'loading';
        state.listError = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.documents = action.payload;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.listError = action.payload;
      })

      // Fetch single
      .addCase(fetchDocumentById.pending, (state) => {
        state.activeStatus = 'loading';
        state.activeError = null;
      })
      .addCase(fetchDocumentById.fulfilled, (state, action) => {
        state.activeStatus = 'succeeded';
        state.activeDocument = action.payload;
        state.saveStatus = DOCUMENT_STATUS.SAVED;
      })
      .addCase(fetchDocumentById.rejected, (state, action) => {
        state.activeStatus = 'failed';
        state.activeError = action.payload;
      })

      // Create
      .addCase(createDocument.fulfilled, (state, action) => {
        state.documents.unshift(action.payload);
      })

      // Save (autosave)
      .addCase(saveDocument.pending, (state) => {
        state.saveStatus = DOCUMENT_STATUS.SAVING;
      })
      .addCase(saveDocument.fulfilled, (state, action) => {
        state.saveStatus = DOCUMENT_STATUS.SAVED;
        state.lastSavedAt = new Date().toISOString();
        if (state.activeDocument) {
          state.activeDocument.updatedAt = action.payload.updatedAt;
        }
        const idx = state.documents.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.documents[idx] = { ...state.documents[idx], ...action.payload };
      })
      .addCase(saveDocument.rejected, (state, action) => {
        state.saveStatus = DOCUMENT_STATUS.ERROR;
        state.activeError = action.payload;
      })

      // Soft delete (move to trash)
      .addCase(deleteDocument.fulfilled, (state, action) => {
        const doc = state.documents.find((d) => d.id === action.payload);
        if (doc) {
          doc.isTrashed = true;
        }
        if (state.activeDocument?.id === action.payload) {
          state.activeDocument = null;
        }
      })

      // Permanent delete (from trash view)
      .addCase(permanentlyDeleteDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter((d) => d.id !== action.payload);
      })

      // Restore from trash
      .addCase(restoreDocument.fulfilled, (state, action) => {
        const idx = state.documents.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) {
          state.documents[idx] = { ...state.documents[idx], ...action.payload, isTrashed: false };
        }
      })

      // Toggle favorite — reconcile optimistic update with server response;
      // on rejection, revert to the pre-toggle value.
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const idx = state.documents.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) {
          state.documents[idx] = { ...state.documents[idx], ...action.payload };
        }
      })
      .addCase(toggleFavorite.rejected, (state, action) => {
        state.listError = action.payload;
      })
  },
});

export const {
  localContentChanged,
  localTitleChanged,
  applyRemoteUpdate,
  favoriteToggledOptimistic,
  clearActiveDocument,
  clearDocumentErrors,
} = documentSlice.actions;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------
export const selectDocuments = (state) => state.document.documents;
export const selectDocumentListStatus = (state) => state.document.listStatus;
export const selectDocumentListError = (state) => state.document.listError;

export const selectActiveDocument = (state) => state.document.activeDocument;
export const selectActiveDocumentStatus = (state) => state.document.activeStatus;
export const selectActiveDocumentError = (state) => state.document.activeError;

export const selectSaveStatus = (state) => state.document.saveStatus;
export const selectLastSavedAt = (state) => state.document.lastSavedAt;

export default documentSlice.reducer;