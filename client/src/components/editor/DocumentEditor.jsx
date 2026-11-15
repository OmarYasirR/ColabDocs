import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';

import Toolbar from './Toolbar';
import CollaborationPanel from './CollaborationPanel';
import CommentSection from './CommentSection';
import ShareModal from './ShareModal';
import EditorSkeleton from './EditorSkeleton';

import useDocument from '../../hooks/useDocument';
import useCollaboration from '../../hooks/useCollaboration';
import useDebounce from '../../hooks/useDebounce';
import { selectCurrentUser } from '../../redux/slices/authSlice';
import { AUTOSAVE_DEBOUNCE_MS } from '../../utils/constants';
import { getCursorColorForUser, cx } from '../../utils/helpers';

/**
 * The core editing surface for a single document, built on Tiptap + Yjs.
 *
 * Loading gate: renders a skeleton until the REST document, the Tiptap
 * editor instance, AND the Yjs document (`ydoc`) all exist. The `ydoc`
 * flag is what prevents a document with real prior content from
 * flashing empty — without it, the editor would render against a
 * still-empty Y.Doc before the server's seeded/synced state arrives.
 *
 * Comments panel:
 *   - always visible by default (showComments starts true)
 *   - desktop (lg+): 320px side panel on the right
 *   - mobile (< lg): inline panel below the editor, capped to ~45vh
 *   - Toolbar's comments button toggles it on any viewport
 */
const DocumentEditor = ({ documentId }) => {
  const currentUser = useSelector(selectCurrentUser);

  const [showComments, setShowComments] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const {
    activeDocument,
    activeStatus,
    saveStatus,
    updateTitle,
    saveNow,
  } = useDocument(documentId);

  const {
    ydoc,
    awareness,
    activeUsers,
    comments,
    addComment,
    resolveComment,
    deleteComment,
  } = useCollaboration(documentId);

  const localColor = currentUser
    ? getCursorColorForUser(currentUser.id)
    : '#4f46e5';

  const editor = useEditor(
    {
      extensions: ydoc
        ? [
            StarterKit.configure({
              heading: { levels: [1, 2, 3] },
              history: false, // Collaboration supplies Yjs-aware undo/redo
            }),
            Underline,
            Placeholder.configure({ placeholder: 'Start writing…' }),
            Collaboration.configure({ document: ydoc }),
            CollaborationCursor.configure({
              provider: { awareness },
              user: {
                id: currentUser?.id,
                name: currentUser?.name || 'Anonymous',
                color: localColor,
              },
            }),
          ]
        : [
            StarterKit,
            Underline,
            Placeholder.configure({ placeholder: 'Start writing…' }),
          ],
      editorProps: {
        attributes: {
          class:
            'prose prose-slate mx-auto max-w-3xl px-5 py-8 focus:outline-none min-h-full sm:px-8 sm:py-10 md:px-12',
        },
      },
      onUpdate: () => {
        // Only persist after Yjs is ready — otherwise the transient
        // pre-sync editor instance would fire on every keystroke
        // against a still-empty doc and overwrite the saved snapshot.
        if (!ydoc) return;
        debouncedPersist();
      },
    },
    [ydoc]
  );

  // ---------------------------------------------------------------------
  // Durable REST snapshot — debounced, decoupled from real-time sync.
  // ---------------------------------------------------------------------
  const [debouncedPersist] = useDebounce(() => {
    if (!editor || !ydoc) return;
    saveNow(editor.getHTML());
  }, AUTOSAVE_DEBOUNCE_MS);

  const editorRef = useRef(editor);
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const handleTitleChange = useCallback(
    (value) => updateTitle(value),
    [updateTitle]
  );

  const handleFormat = useCallback(
    (command) => {
      if (!editor) return;
      const chain = editor.chain().focus();
      switch (command) {
        case 'bold':
          chain.toggleBold().run();
          break;
        case 'italic':
          chain.toggleItalic().run();
          break;
        case 'underline':
          chain.toggleUnderline().run();
          break;
        case 'insertUnorderedList':
          chain.toggleBulletList().run();
          break;
        case 'insertOrderedList':
          chain.toggleOrderedList().run();
          break;
        case 'h1':
          chain.toggleHeading({ level: 1 }).run();
          break;
        case 'h2':
          chain.toggleHeading({ level: 2 }).run();
          break;
        case 'h3':
          chain.toggleHeading({ level: 3 }).run();
          break;
        default:
          break;
      }
    },
    [editor]
  );

  if (activeStatus === 'loading' || !activeDocument || !editor || !ydoc) {
    return <EditorSkeleton />;
  }

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        title={activeDocument.title}
        onTitleChange={handleTitleChange}
        saveStatus={saveStatus}
        onFormat={handleFormat}
        editor={editor}
        onShareClick={() => setIsShareOpen(true)}
        rightSlot={<CollaborationPanel activeUsers={activeUsers} />}
        commentsOpen={showComments}
        onToggleComments={() => setShowComments((s) => !s)}
      />

      
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Editing surface */}
        <div className="relative min-h-0 flex-1 overflow-y-auto bg-white">
          <EditorContent editor={editor} />
        </div>

        {/* Comments — inline below on mobile, side panel on desktop */}
        {showComments && (
          <div
            className={cx(
              'flex shrink-0 flex-col bg-white',
              // Mobile: capped inline panel, top border separates it
              'h-72 max-h-[45vh] border-t border-slate-200 sm:h-80',
              // Desktop: fixed-width side panel, left border separates it
              'lg:h-auto lg:w-80 lg:max-h-none lg:border-l lg:border-t-0'
            )}
          >
            <CommentSection
              comments={comments}
              currentUser={currentUser}
              onAddComment={addComment}
              onResolveComment={resolveComment}
              onDeleteComment={deleteComment}
              onClose={() => setShowComments(false)}
            />
          </div>
        )}

        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          documentId={documentId}
          ownerId={activeDocument.ownerId}
        />
      </div>
    </div>
  );
};

export default DocumentEditor;