// src/hooks/useDocument.js
import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  fetchDocuments,
  fetchDocumentById,
  createDocument,
  saveDocument,
  deleteDocument,
  permanentlyDeleteDocument,
  restoreDocument,
  toggleFavorite,
  localContentChanged,
  localTitleChanged,
  favoriteToggledOptimistic,
  clearActiveDocument,
  selectDocuments,
  selectDocumentListStatus,
  selectDocumentListError,
  selectActiveDocument,
  selectActiveDocumentStatus,
  selectSaveStatus,
  selectLastSavedAt,
} from '../redux/slices/documentSlice';
import { addToast } from '../redux/slices/uiSlice';
import useDebounce from './useDebounce';
import { AUTOSAVE_DEBOUNCE_MS } from '../utils/constants';

const useDocument = (documentId = null) => {
  
  const dispatch = useDispatch();

  const documents = useSelector(selectDocuments);
  const listStatus = useSelector(selectDocumentListStatus);
  const listError = useSelector(selectDocumentListError);

  const activeDocument = useSelector(selectActiveDocument);
  const activeStatus = useSelector(selectActiveDocumentStatus);
  const saveStatus = useSelector(selectSaveStatus);
  const lastSavedAt = useSelector(selectLastSavedAt);

  const pendingChangesRef = useRef({});

  useEffect(() => {
    if (!documentId) return undefined;
    dispatch(fetchDocumentById(documentId));
    return () => dispatch(clearActiveDocument());
  }, [documentId, dispatch]);

  // ---------------------------------------------------------------------
  // Dashboard: list operations
  // ---------------------------------------------------------------------
  const loadDocuments = useCallback(
    (params) => dispatch(fetchDocuments(params)),
    [dispatch]
  );

  const addDocument = useCallback(
    async (payload) => {
      const result = await dispatch(createDocument(payload));
      if (createDocument.fulfilled.match(result)) {
        dispatch(addToast({ type: 'success', message: 'Document created' }));
        return { success: true, document: result.payload };
      }
      dispatch(addToast({ type: 'error', message: result.payload || 'Could not create document' }));
      return { success: false };
    },
    [dispatch]
  );

  const removeDocument = useCallback(
    async (id) => {
      const result = await dispatch(deleteDocument(id));
      if (deleteDocument.fulfilled.match(result)) {
        dispatch(addToast({ type: 'success', message: 'Document moved to trash' }));
        return { success: true };
      }
      dispatch(addToast({ type: 'error', message: result.payload || 'Could not delete document' }));
      return { success: false };
    },
    [dispatch]
  );

  const removeDocumentPermanently = useCallback(
    async (id) => {
      const result = await dispatch(permanentlyDeleteDocument(id));
      if (permanentlyDeleteDocument.fulfilled.match(result)) {
        dispatch(addToast({ type: 'success', message: 'Document permanently deleted' }));
        return { success: true };
      }
      dispatch(addToast({ type: 'error', message: result.payload || 'Could not delete document' }));
      return { success: false };
    },
    [dispatch]
  );

  const restore = useCallback(
    async (id) => {
      const result = await dispatch(restoreDocument(id));
      if (restoreDocument.fulfilled.match(result)) {
        dispatch(addToast({ type: 'success', message: 'Document restored' }));
        return { success: true };
      }
      dispatch(addToast({ type: 'error', message: result.payload || 'Could not restore document' }));
      return { success: false };
    },
    [dispatch]
  );

  // Optimistic toggle: flip immediately, revert locally on failure —
  // handled here in the hook rather than via slice-level meta hacks.
  const toggleDocumentFavorite = useCallback(
    async (id, nextValue) => {
      dispatch(favoriteToggledOptimistic({ documentId: id, isFavorite: nextValue }));
      const result = await dispatch(toggleFavorite({ documentId: id, isFavorite: nextValue }));
      if (!toggleFavorite.fulfilled.match(result)) {
        dispatch(favoriteToggledOptimistic({ documentId: id, isFavorite: !nextValue }));
        dispatch(addToast({ type: 'error', message: 'Could not update favorite' }));
        return { success: false };
      }
      return { success: true };
    },
    [dispatch]
  );

  // ---------------------------------------------------------------------
  // Editor: debounced autosave
  // ---------------------------------------------------------------------
  const [debouncedSave] = useDebounce((id) => {
    const changes = pendingChangesRef.current;
    pendingChangesRef.current = {};
    dispatch(saveDocument({ documentId: id, changes }));
  }, AUTOSAVE_DEBOUNCE_MS);

  const updateContent = useCallback(
    (content) => {
      dispatch(localContentChanged(content));
      pendingChangesRef.current = { ...pendingChangesRef.current, content };
      if (documentId) debouncedSave(documentId);
    },
    [dispatch, documentId, debouncedSave]
  );

  const updateTitle = useCallback(
    (title) => {
      dispatch(localTitleChanged(title));
      pendingChangesRef.current = { ...pendingChangesRef.current, title };
      if (documentId) debouncedSave(documentId);
    },
    [dispatch, documentId, debouncedSave]
  );

  const saveNow = useCallback(
      (contentOverride) => {  
        if (!documentId) return;
        const changes = { 
          ...pendingChangesRef.current,
          ...(contentOverride !== undefined ? { content: contentOverride } : {}),
        };
        pendingChangesRef.current = {};
        dispatch(saveDocument({ documentId, changes }));
      },
      [dispatch, documentId]
  );

  return {
    // list
    documents,
    listStatus,
    listError,
    loadDocuments,
    addDocument,
    removeDocument,
    removeDocumentPermanently,
    restoreDocument: restore,
    toggleFavorite: toggleDocumentFavorite,
    // active document
    activeDocument,
    activeStatus,
    saveStatus,
    lastSavedAt,
    updateContent,
    updateTitle,
    saveNow,
  };
};

export default useDocument;