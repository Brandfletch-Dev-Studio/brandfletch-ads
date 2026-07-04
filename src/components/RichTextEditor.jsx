import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

/**
 * RichTextEditor — lightweight contenteditable-based HTML editor.
 * Replaces react-quill which crashes on React 18 (uses removed ReactDOM.findDOMNode).
 * Produces the same HTML output and is compatible with the existing BlogPost renderer.
 */

const TOOLBAR_ACTIONS = [
  { cmd: 'bold',          icon: '<b>B</b>',           title: 'Bold' },
  { cmd: 'italic',        icon: '<i>I</i>',           title: 'Italic' },
  { cmd: 'underline',     icon: '<u>U</u>',           title: 'Underline' },
  { sep: true },
  { cmd: 'h2',            icon: 'H2',                 title: 'Heading 2', block: true },
  { cmd: 'h3',            icon: 'H3',                 title: 'Heading 3', block: true },
  { sep: true },
  { cmd: 'insertUnorderedList', icon: '• List',       title: 'Bullet List' },
  { cmd: 'insertOrderedList',   icon: '1. List',      title: 'Numbered List' },
  { sep: true },
  { cmd: 'createLink',    icon: '🔗',                 title: 'Insert Link', prompt: true },
  { cmd: 'unlink',        icon: '✂️ Link',             title: 'Remove Link' },
  { sep: true },
  { cmd: 'removeFormat',  icon: '✕ Format',           title: 'Clear Formatting' },
];

// Some browsers (mainly mobile Safari) ignore document.execCommand('defaultParagraphSeparator')
// and wrap each Enter-created line in an unstyled <div> instead of a <p> — which has no
// margin, so paragraphs render tightly packed with no visible break. Normalize any direct-child
// <div> into a real <p> so it always gets the .bf-article p spacing on the public blog page.
function normalizeParagraphs(html) {
  if (!html || !html.includes('<div')) return html;
  const container = document.createElement('div');
  container.innerHTML = html;
  container.querySelectorAll(':scope > div').forEach(div => {
    const p = document.createElement('p');
    p.innerHTML = div.innerHTML;
    div.replaceWith(p);
  });
  return container.innerHTML;
}

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);
  const isInternalChange = useRef(false);

  // Force the browser to wrap each Enter-created line in a real <p> tag
  // (default behavior varies by browser — Chrome uses <div>, some mobile
  // browsers just insert a <br> — neither matches the .bf-article p { margin }
  // spacing the public blog page expects). Must be set before any typing.
  useEffect(() => {
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch { /* unsupported, ignore */ }
  }, []);

  // Sync external value → DOM (only when value changes from outside)
  useEffect(() => {
    const el = editorRef.current;
    if (!el || isInternalChange.current) return;
    if (el.innerHTML !== (value || '')) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = useCallback(() => {
    isInternalChange.current = true;
    const html = normalizeParagraphs(editorRef.current?.innerHTML || '');
    onChange(html === '<br>' || html === '<p><br></p>' ? '' : html);
    // Reset flag after React processes the update
    setTimeout(() => { isInternalChange.current = false; }, 0);
  }, [onChange]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') || '';
    if (!text) return;
    // Split on blank lines / single newlines into paragraphs, escape HTML,
    // and insert as real <p> tags so pasted content behaves the same as typed content.
    const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = text
      .split(/\r?\n/)
      .filter(line => line.trim() !== '')
      .map(line => `<p>${escape(line)}</p>`)
      .join('');
    document.execCommand('insertHTML', false, html || escape(text));
    handleInput();
  }, [handleInput]);

  const execCmd = useCallback((action, e) => {
    e.preventDefault();
    editorRef.current?.focus();
    if (action.block) {
      // Toggle heading via formatBlock
      document.execCommand('formatBlock', false, action.cmd);
    } else if (action.prompt) {
      const url = window.prompt('Enter URL:', 'https://');
      if (url) document.execCommand(action.cmd, false, url);
    } else {
      document.execCommand(action.cmd, false, null);
    }
    handleInput();
  }, [handleInput]);

  return (
    <div className="rich-editor-wrapper border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 p-2 bg-muted border-b border-border">
        {TOOLBAR_ACTIONS.map((action, i) =>
          action.sep ? (
            <div key={i} className="w-px h-6 bg-border mx-1 self-center" />
          ) : (
            <button
              key={i}
              type="button"
              title={action.title}
              onMouseDown={(e) => execCmd(action, e)}
              className="px-2 py-1 rounded text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors min-w-[28px] text-center"
              dangerouslySetInnerHTML={{ __html: action.icon }}
            />
          )
        )}
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        className={cn(
          'min-h-[320px] p-4 text-foreground text-sm leading-relaxed focus:outline-none',
          'prose prose-sm max-w-none',
          '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2',
          '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-2',
          '[&_p]:mb-2 [&_ul]:pl-5 [&_ul]:list-disc [&_ol]:pl-5 [&_ol]:list-decimal',
          '[&_li]:mb-1 [&_a]:text-primary [&_a]:underline',
          '[&_strong]:font-bold [&_em]:italic [&_u]:underline',
          '[&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground',
        )}
        data-placeholder={placeholder || 'Write your blog post here…'}
      />
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
      `}</style>
      <p className="text-xs text-muted-foreground px-4 py-2 border-t border-border bg-muted/30">
        Tip: Select text then use toolbar to format · Use H2/H3 for headings · 🔗 to add links
      </p>
    </div>
  );
}

