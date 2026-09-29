import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useEditor, EditorContent, EditorProvider  } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';

import Toolbar from './Toolbar';
import CollaborationPanel from './CollaborationPanel';
import CommentSection from './CommentSection';
import Spinner from '../common/Spinner';
import ShareModal from './ShareModal'

import useDocument from '../../hooks/useDocument';
import useCollaboration from '../../hooks/useCollaboration';
import useDebounce from '../../hooks/useDebounce';
import { selectCurrentUser } from '../../redux/slices/authSlice';
import { AUTOSAVE_DEBOUNCE_MS } from '../../utils/constants';
import { getCursorColorForUser } from '../../utils/helpers';

/**
 * The core editing surface for a single document, built on Tiptap + Yjs.
 *
 * Loading gate: renders a spinner until the editor exists, `ydoc`
 * exists. That last flag (from
 * useCollaboration -> SocketIOYjsProvider) is what prevents a document
 * with real prior content from flashing empty — without it, the editor
 * would render immediately against a still-empty `ydoc` before the
 * server's seeded/synced state has arrived.
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

  const localColor = currentUser ? getCursorColorForUser(currentUser.id) : '#4f46e5';


    
  console.log(ydoc)


  const editor = useEditor(
    {
      extensions: ydoc
        ? [
            StarterKit.configure({
              heading: { levels: [1, 2, 3] },
              history: false, // Collaboration extension supplies Yjs-aware undo/redo
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
        : [StarterKit, Underline, Placeholder.configure({ placeholder: 'Start writing…' })],
      editorProps: {
        attributes: {
          class: 'prose prose-slate mx-auto max-w-3xl px-12 py-10 focus:outline-none min-h-full',
        },
      },
      onUpdate: ({ editor }) => {
      // Only save if Yjs is ready (prevents saving during the initial pre‑sync render)
      if (!ydoc) return;
      debouncedPersist();
    },
    },
    [ydoc]
  );


  // ---------------------------------------------------------------------
  // Durable REST snapshot — debounced, decoupled from real-time sync.
  // Guarded on `ydoc` so the transient pre-sync editor instance (created
  // during the single render before `ydoc` exists) never triggers a save.
  // ---------------------------------------------------------------------
  const [debouncedPersist] = useDebounce(() => {
    if (!editor || !ydoc) return;
    saveNow(editor.getHTML());
  }, AUTOSAVE_DEBOUNCE_MS);


  // Flush a final save on true component unmount only (empty deps array
  // + ref), NOT on every editor-instance swap — re-keying this on
  // `[editor]` was the earlier bug: it fired on the placeholder-editor
  // teardown too, saving blank content over real content on every mount.
  const editorRef = useRef(editor);
  useEffect(() => {
    editorRef.current = editor;
    console.log('editor value have been set')
  }, [editor])

  const handleTitleChange = useCallback((value) => updateTitle(value),[updateTitle]);

  const handleFormat = useCallback(
    (command) => {
      if (!editor) return;
      const chain = editor.chain().focus();
      switch (command) {
        case 'bold': chain.toggleBold().run(); break;
        case 'italic': chain.toggleItalic().run(); break;
        case 'underline': chain.toggleUnderline().run(); break;
        case 'insertUnorderedList': chain.toggleBulletList().run(); break;
        default: break;
      }
    },
    [editor]
  );  


  useEffect(() => {
    console.log('activeStatus: ' + activeStatus)
    console.log('activeDocument: ' + activeDocument)
    console.log('editor: ' + editor)
    console.log('ydoc: ' + ydoc)
  }, [activeStatus, activeDocument, editor, ydoc])

  
  if (activeStatus === 'loading' || !activeDocument || !editor || !ydoc) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
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
        />

      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex-1 overflow-y-auto bg-white">
          <EditorContent editor={editor} />
        </div>

        {showComments && (
          <div className="w-80 shrink-0 border-l border-slate-200 bg-white">
            <CommentSection
              comments={comments}
              currentUser={currentUser}
              onAddComment={addComment}
              onResolveComment={resolveComment}
              onDeleteComment={deleteComment}
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