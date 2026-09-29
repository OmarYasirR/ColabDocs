import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlineDocumentText,
  HiOutlineTrash,
  HiOutlineShare,
  HiOutlineStar,
  HiStar,
  HiOutlineClock,
  HiOutlineUsers,
  HiOutlineHome,
  HiOutlineArrowUturnLeft,
} from 'react-icons/hi2';

import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Spinner from '../components/common/Spinner';

import useDocument from '../hooks/useDocument';
import useUI from '../hooks/useUI';
import { formatRelativeTime, truncateText, stripHtml } from '../utils/helpers';
import { validateDocumentTitle } from '../utils/validators';

const FILTER_CONFIG = {
  documents: {
    label: 'My Documents',
    icon: HiOutlineDocumentText,
    emptyTitle: 'No documents yet',
    emptyBody: 'Create your first document to start collaborating with your team in real time.',
    match: (doc) => !doc.isTrashed,
  },
  recent: {
    label: 'Recent',
    icon: HiOutlineClock,
    emptyTitle: 'Nothing recent',
    emptyBody: 'Documents you open or edit will show up here.',
    match: (doc) => !doc.isTrashed,
    sort: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    limit: 12,
  },
  favorites: {
    label: 'Favorites',
    icon: HiOutlineStar,
    emptyTitle: 'No favorites yet',
    emptyBody: 'Star a document to pin it here for quick access.',
    match: (doc) => Boolean(doc.isFavorite) && !doc.isTrashed,
  },
  shared: {
    label: 'Shared with me',
    icon: HiOutlineUsers,
    emptyTitle: 'Nothing shared with you yet',
    emptyBody: 'Documents your teammates share with you will appear here.',
    match: (doc) => doc.role && doc.role !== 'owner' && !doc.isTrashed,
  },
  trash: {
    label: 'Trash',
    icon: HiOutlineTrash,
    emptyTitle: 'Trash is empty',
    emptyBody: 'Deleted documents are kept here until permanently removed.',
    match: (doc) => Boolean(doc.isTrashed),
  },
};

const DEFAULT_FILTER = {
  key: 'documents',
  label: 'My Documents',
  icon: HiOutlineHome,
  emptyTitle: 'No documents yet',
  emptyBody: 'Create your first document to start collaborating with your team in real time.',
  match: (doc) => !doc.isTrashed,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { filter } = useParams();
  const { notify } = useUI();
  const {
    documents,
    listStatus,
    loadDocuments,
    addDocument,
    removeDocument,
    removeDocumentPermanently,
    restoreDocument,
    toggleFavorite,
  } = useDocument();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [titleError, setTitleError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const activeFilter = filter && FILTER_CONFIG[filter] ? { key: filter, ...FILTER_CONFIG[filter] } : DEFAULT_FILTER;
  const isTrashView = activeFilter.key === 'trash';

  useEffect(() => {
    console.log(documents)
    loadDocuments(filter ? { filter } : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const visibleDocuments = useMemo(() => {
    let list = documents.filter(activeFilter.match);
    if (activeFilter.sort) list = [...list].sort(activeFilter.sort);
    if (activeFilter.limit) list = list.slice(0, activeFilter.limit);
    return list;
  }, [documents, activeFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateDocumentTitle(newTitle)) {
      setTitleError('Give your document a title (max 120 characters)');
      return;
    }

    setIsCreating(true);
    const result = await addDocument({ title: newTitle, content: '' });
    setIsCreating(false);

    if (result.success) {
      setIsCreateOpen(false);
      setNewTitle('');
      navigate(`/documents/${result.document.id}`);
    }
  };

  // In the trash view, the trash icon permanently deletes; everywhere
  // else it soft-deletes (moves to trash).
  const handleDelete = async (e, documentId) => {
    e.stopPropagation();
    const result = isTrashView
      ? await removeDocumentPermanently(documentId)
      : await removeDocument(documentId);
    if (!result.success) {
      notify('Could not complete that action', 'error');
    }
  };

  const handleRestore = async (e, documentId) => {
    e.stopPropagation();
    await restoreDocument(documentId);
  };

  const handleToggleFavorite = async (e, doc) => {
    e.stopPropagation();
    await toggleFavorite(doc.id, !doc.isFavorite);
  };

  const FilterIcon = activeFilter.icon;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5 text-slate-400" />
            <h1 className="text-2xl font-semibold text-slate-900">{activeFilter.label}</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {visibleDocuments.length} document{visibleDocuments.length === 1 ? '' : 's'}
          </p>
        </div>

        {!isTrashView && (
          <Button icon={HiOutlinePlus} onClick={() => setIsCreateOpen(true)}>
            New document
          </Button>
        )}
      </div>

      {listStatus === 'loading' && (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      )}

      {listStatus === 'succeeded' && visibleDocuments.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
            <FilterIcon className="h-7 w-7 text-indigo-500" />
          </div>
          <h3 className="text-base font-medium text-slate-800">{activeFilter.emptyTitle}</h3>
          <p className="max-w-xs text-sm text-slate-500">{activeFilter.emptyBody}</p>
          {!isTrashView && (
            <Button className="mt-2" icon={HiOutlinePlus} onClick={() => setIsCreateOpen(true)}>
              New document
            </Button>
          )}
        </div>
      )}

      {listStatus === 'succeeded' && visibleDocuments.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleDocuments.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => navigate(`/documents/${doc.id}`)}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-popover"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <HiOutlineDocumentText className="h-5 w-5" />
                </div>

                <div className="flex items-center gap-0.5">
                  {!isTrashView && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleToggleFavorite(e, doc)}
                      className="rounded-md p-1.5 text-slate-400 opacity-0 hover:bg-amber-50 hover:text-amber-500 group-hover:opacity-100 data-[active=true]:opacity-100"
                      data-active={doc.isFavorite}
                      aria-label={doc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      title={doc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {doc.isFavorite ? (
                        <HiStar className="h-4 w-4 text-amber-400" />
                      ) : (
                        <HiOutlineStar className="h-4 w-4" />
                      )}
                    </span>
                  )}

                  {!isTrashView && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-md p-1.5 text-slate-400 opacity-0 hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
                      aria-label="Share document"
                    >
                      <HiOutlineShare className="h-4 w-4" />
                    </span>
                  )}

                  {isTrashView && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleRestore(e, doc.id)}
                      className="rounded-md p-1.5 text-slate-400 opacity-0 hover:bg-emerald-50 hover:text-emerald-600 group-hover:opacity-100"
                      aria-label="Restore document"
                      title="Restore"
                    >
                      <HiOutlineArrowUturnLeft className="h-4 w-4" />
                    </span>
                  )}

                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleDelete(e, doc.id)}
                    className="rounded-md p-1.5 text-slate-400 opacity-0 hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                    aria-label={isTrashView ? 'Delete permanently' : 'Move to trash'}
                    title={isTrashView ? 'Delete permanently' : 'Move to trash'}
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                  </span>
                </div>
              </div>

              <h3 className="mt-3 truncate text-sm font-semibold text-slate-900">
                {doc.title || 'Untitled document'}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                {truncateText(stripHtml(doc.content), 90) || 'No content yet'}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                Edited {formatRelativeTime(doc.updatedAt)}
              </p>
            </button>
          ))}
        </div>
      )}

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New document"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={isCreating}>
              Create
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <Input
            label="Document title"
            name="title"
            value={newTitle}
            onChange={(e) => {
              setNewTitle(e.target.value);
              if (titleError) setTitleError(null);
            }}
            placeholder="Q3 Roadmap"
            error={titleError}
            autoFocus
          />
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;