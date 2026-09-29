// src/pages/DocumentEditor.jsx
import { useParams } from 'react-router-dom';
import DocumentEditorComponent from '../components/editor/DocumentEditor';

/**
 * Thin route-level wrapper: pulls `documentId` from the URL and hands
 * it to the feature component. Kept separate from
 * components/editor/DocumentEditor.jsx so routing concerns never leak
 * into the reusable editor component itself.
 */
const DocumentEditorPage = () => {
  const { documentId } = useParams();

  return (
    <div className="h-full">
      <DocumentEditorComponent documentId={documentId} />
    </div>
  );
};

export default DocumentEditorPage;