import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export const RichTextEditor = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const modules = {
    toolbar: [
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  return (
    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 quill-custom">
      <style dangerouslySetInnerHTML={{__html: `
        .quill-custom .ql-toolbar {
          border: none;
          border-bottom: 1px solid var(--tw-prose-hr, #e5e7eb);
          background-color: inherit;
        }
        .dark .quill-custom .ql-toolbar {
          border-bottom-color: #374151;
        }
        .quill-custom .ql-container {
          border: none;
          font-family: inherit;
          font-size: inherit;
        }
        .quill-custom .ql-editor {
          min-height: 100px;
        }
        .dark .quill-custom .ql-stroke {
          stroke: #d1d5db;
        }
        .dark .quill-custom .ql-fill {
          fill: #d1d5db;
        }
        .dark .quill-custom .ql-picker {
          color: #d1d5db;
        }
        .dark .quill-custom .ql-picker-options {
          background-color: #1f2937;
          border-color: #374151;
        }
      `}} />
      <ReactQuill 
        theme="snow" 
        value={value} 
        onChange={onChange} 
        modules={modules}
      />
    </div>
  );
};
