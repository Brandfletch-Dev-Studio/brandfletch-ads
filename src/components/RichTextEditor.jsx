import { useRef, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// ── Quill toolbar config ──────────────────────────────────────────────────────
const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  [{ font: [] }],
  [{ size: ['small', false, 'large', 'huge'] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  ['blockquote', 'code-block'],
  ['link', 'image', 'video'],
  ['clean'],
];

const FORMATS = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'align',
  'list', 'bullet', 'indent',
  'blockquote', 'code-block',
  'link', 'image', 'video',
];

export default function RichTextEditor({ value, onChange, placeholder }) {
  const quillRef = useRef(null);

  const handleChange = useCallback((content) => {
    onChange(content === '<p><br></p>' ? '' : content);
  }, [onChange]);

  return (
    <div className="rich-editor-wrapper">
      <style>{`
        .rich-editor-wrapper .ql-toolbar.ql-snow {
          border-radius: 8px 8px 0 0;
          border-color: hsl(var(--border));
          background: hsl(var(--muted));
          flex-wrap: wrap;
        }
        .rich-editor-wrapper .ql-container.ql-snow {
          border-radius: 0 0 8px 8px;
          border-color: hsl(var(--border));
          font-size: 15px;
          min-height: 320px;
        }
        .rich-editor-wrapper .ql-editor {
          min-height: 320px;
          color: hsl(var(--foreground));
          line-height: 1.7;
          padding: 16px;
        }
        .rich-editor-wrapper .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
        }
        .rich-editor-wrapper .ql-snow .ql-stroke { stroke: hsl(var(--foreground)); }
        .rich-editor-wrapper .ql-snow .ql-fill  { fill:   hsl(var(--foreground)); }
        .rich-editor-wrapper .ql-snow .ql-picker-label { color: hsl(var(--foreground)); }
        .rich-editor-wrapper .ql-snow .ql-picker-options {
          background: hsl(var(--popover));
          border-color: hsl(var(--border));
          color: hsl(var(--foreground));
        }
        .rich-editor-wrapper .ql-snow.ql-toolbar button:hover .ql-stroke,
        .rich-editor-wrapper .ql-snow .ql-toolbar button:hover .ql-stroke,
        .rich-editor-wrapper .ql-snow.ql-toolbar button.ql-active .ql-stroke,
        .rich-editor-wrapper .ql-snow .ql-toolbar button.ql-active .ql-stroke { stroke: hsl(var(--primary)); }
        .rich-editor-wrapper .ql-snow.ql-toolbar button:hover .ql-fill,
        .rich-editor-wrapper .ql-snow .ql-toolbar button:hover .ql-fill,
        .rich-editor-wrapper .ql-snow.ql-toolbar button.ql-active .ql-fill,
        .rich-editor-wrapper .ql-snow .ql-toolbar button.ql-active .ql-fill { fill: hsl(var(--primary)); }
        .rich-editor-wrapper .ql-editor blockquote {
          border-left: 4px solid hsl(var(--primary));
          background: hsl(var(--muted));
          padding: 10px 16px;
          border-radius: 0 6px 6px 0;
          color: hsl(var(--muted-foreground));
        }
        .rich-editor-wrapper .ql-editor a { color: hsl(var(--primary)); text-decoration: underline; }
        .rich-editor-wrapper .ql-editor pre.ql-syntax {
          background: hsl(var(--muted));
          border-radius: 6px;
          color: hsl(var(--foreground));
          font-size: 13px;
        }
        .rich-editor-wrapper .ql-editor h1 { font-size: 2em; font-weight: 700; margin: 0.5em 0; }
        .rich-editor-wrapper .ql-editor h2 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0; }
        .rich-editor-wrapper .ql-editor h3 { font-size: 1.2em; font-weight: 600; margin: 0.5em 0; }
        .rich-editor-wrapper .ql-editor ul, .rich-editor-wrapper .ql-editor ol { padding-left: 1.5em; }
        .rich-editor-wrapper .ql-editor img { max-width: 100%; border-radius: 8px; margin: 8px 0; }
        .rich-editor-wrapper .ql-editor .ql-video { width: 100%; min-height: 300px; border-radius: 8px; }
        /* Button styling in content */
        .rich-editor-wrapper .ql-editor a[data-btn] {
          display: inline-block;
          padding: 10px 24px;
          background: hsl(var(--primary));
          color: white !important;
          border-radius: 8px;
          text-decoration: none !important;
          font-weight: 600;
          margin: 8px 4px;
        }
      `}</style>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={handleChange}
        modules={{ toolbar: TOOLBAR }}
        formats={FORMATS}
        placeholder={placeholder || 'Write your content here…'}
      />
      <p className="text-xs text-muted-foreground mt-2">
        Tip: Use <strong>H1/H2/H3</strong> for headings · <strong>Link</strong> tool to add buttons · <strong>Image</strong> to embed media
      </p>
    </div>
  );
}
