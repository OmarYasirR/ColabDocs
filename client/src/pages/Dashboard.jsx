import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
} from "react-icons/hi2";

import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";
import Skeleton from "../components/common/Skeleton";

import useDocument from "../hooks/useDocument";
import useUI from "../hooks/useUI";
import {
  formatRelativeTime,
  truncateText,
  stripHtml,
  cx,
} from "../utils/helpers";
import { validateDocumentTitle } from "../utils/validators";

const FILTER_CONFIG = {
  documents: {
    label: "My Documents",
    icon: HiOutlineDocumentText,
    emptyTitle: "No documents yet",
    emptyBody:
      "Create your first document to start collaborating with your team in real time.",
    match: (doc) => !doc.isTrashed,
  },
  recent: {
    label: "Recent",
    icon: HiOutlineClock,
    emptyTitle: "Nothing recent",
    emptyBody: "Documents you open or edit will show up here.",
    match: (doc) => !doc.isTrashed,
    sort: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    limit: 12,
  },
  favorites: {
    label: "Favorites",
    icon: HiOutlineStar,
    emptyTitle: "No favorites yet",
    emptyBody: "Star a document to pin it here for quick access.",
    match: (doc) => Boolean(doc.isFavorite) && !doc.isTrashed,
  },
  shared: {
    label: "Shared with me",
    icon: HiOutlineUsers,
    emptyTitle: "Nothing shared with you yet",
    emptyBody: "Documents your teammates share with you will appear here.",
    match: (doc) => doc.role && doc.role !== "owner" && !doc.isTrashed,
  },
  trash: {
    label: "Trash",
    icon: HiOutlineTrash,
    emptyTitle: "Trash is empty",
    emptyBody: "Deleted documents are kept here until permanently removed.",
    match: (doc) => Boolean(doc.isTrashed),
  },
};

const DEFAULT_FILTER = {
  key: "documents",
  label: "My Documents",
  icon: HiOutlineHome,
  emptyTitle: "No documents yet",
  emptyBody:
    "Create your first document to start collaborating with your team in real time.",
  match: (doc) => !doc.isTrashed,
};

const Dashboard = () => {
  const DocumentCardSkeleton = () => (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <Skeleton className="h-9 w-9" rounded="rounded-lg" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-6" />
        </div>
      </div>

      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-full" />
      <Skeleton className="mt-1.5 h-3 w-2/3" />
      <Skeleton className="mt-3 h-3 w-24" />
    </div>
  );

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
  const [newTitle, setNewTitle] = useState("");
  const [titleError, setTitleError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const activeFilter =
    filter && FILTER_CONFIG[filter]
      ? { key: filter, ...FILTER_CONFIG[filter] }
      : DEFAULT_FILTER;
  const isTrashView = activeFilter.key === "trash";

  useEffect(() => {
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
      setTitleError("Give your document a title (max 120 characters)");
      return;
    }

    setIsCreating(true);
    const result = await addDocument({ title: newTitle, content: "" });
    setIsCreating(false);

    if (result.success) {
      setIsCreateOpen(false);
      setNewTitle("");
      navigate(`/documents/${result.document.id}`);
    }
  };

  const handleDelete = async (e, documentId) => {
    e.stopPropagation();
    const result = isTrashView
      ? await removeDocumentPermanently(documentId)
      : await removeDocument(documentId);
    if (!result.success) notify("Could not complete that action", "error");
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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5 text-slate-400" />
            <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {activeFilter.label}
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {visibleDocuments.length} document
            {visibleDocuments.length === 1 ? "" : "s"}
          </p>
        </div>

        {!isTrashView && (
          <Button
            icon={HiOutlinePlus}
            onClick={() => setIsCreateOpen(true)}
            className="w-full sm:w-auto"
          >
            New document
          </Button>
        )}
      </div>

      {/* Loading */}
      {listStatus === "loading" && (
        <div
          className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
          aria-busy="true"
          aria-label="Loading documents"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <DocumentCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {listStatus === "succeeded" && visibleDocuments.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-3 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <FilterIcon className="h-8 w-8 text-indigo-500" />
          </div>
          <h3 className="text-base font-medium text-slate-800">
            {activeFilter.emptyTitle}
          </h3>
          <p className="max-w-sm text-sm text-slate-500">
            {activeFilter.emptyBody}
          </p>
          {!isTrashView && (
            <Button
              className="mt-2"
              icon={HiOutlinePlus}
              onClick={() => setIsCreateOpen(true)}
            >
              New document
            </Button>
          )}
        </div>
      )}

      {/* Document grid */}
      {listStatus === "succeeded" && visibleDocuments.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {visibleDocuments.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => navigate(`/documents/${doc.id}`)}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
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
                      className={cx(
                        "rounded-md p-1.5 transition-opacity",
                        "hover:bg-amber-50 hover:text-amber-500",
                        doc.isFavorite
                          ? "text-amber-400 opacity-100"
                          : "text-slate-400 opacity-100 ",
                      )}
                      aria-label={
                        doc.isFavorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                    >
                      {doc.isFavorite ? (
                        <HiStar className="h-4 w-4" />
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
                      className="rounded-md p-1.5 text-slate-400 opacity-100 transition-opacity hover:bg-slate-100 hover:text-slate-600 "
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
                      className="rounded-md p-1.5 text-slate-400 opacity-100 transition-opacity hover:bg-emerald-50 hover:text-emerald-600 "
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
                    className="rounded-md p-1.5 text-slate-400 opacity-100 transition-opacity hover:bg-rose-50 hover:text-rose-600 "
                    aria-label={
                      isTrashView ? "Delete permanently" : "Move to trash"
                    }
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                  </span>
                </div>
              </div>

              <h3 className="mt-3 truncate text-sm font-semibold text-slate-900">
                {doc.title || "Untitled document"}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                {truncateText(stripHtml(doc.content), 90) || "No content yet"}
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
