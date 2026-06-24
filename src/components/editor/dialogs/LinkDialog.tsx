import { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Link as LinkIcon, Check, X, ExternalLink } from 'lucide-react';

interface LinkDialogProps {
  editor: Editor | null;
}

export function LinkDialog({ editor }: LinkDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [openInNewTab, setOpenInNewTab] = useState(true);

  if (!editor) return null;

  const isActive = editor.isActive('link');

  const openDialog = () => {
    const previousUrl = editor.getAttributes('link').href;
    setUrl(previousUrl || '');
    setOpenInNewTab(editor.getAttributes('link').target === '_blank');
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setUrl('');
  };

  const setLink = () => {
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      closeDialog();
      return;
    }

    // Basic protocol validation
    let validUrl = url;
    if (!validUrl.match(/^https?:\/\//)) {
      validUrl = 'https://' + validUrl;
    }

    // Block unsafe protocols like javascript:
    if (validUrl.trim().toLowerCase().startsWith('javascript:')) {
      alert('Unsafe URL blocked.');
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ 
        href: validUrl,
        target: openInNewTab ? '_blank' : null,
        rel: openInNewTab ? 'noopener noreferrer' : null 
      })
      .run();

    closeDialog();
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={openDialog}
        title="Link (Cmd+K)"
        aria-label="Link"
        className={`p-1.5 rounded-sm flex items-center justify-center transition-colors
          ${isActive || isOpen ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}
        `}
      >
        <LinkIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-3 w-72 bg-popover text-popover-foreground border border-border rounded-md shadow-elegant z-50 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              type="url"
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 text-sm bg-background border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') setLink();
                if (e.key === 'Escape') closeDialog();
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="newTab"
              checked={openInNewTab}
              onChange={(e) => setOpenInNewTab(e.target.checked)}
              className="rounded-sm border-primary/50 text-primary focus:ring-primary h-4 w-4"
            />
            <label htmlFor="newTab" className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer">
              Open in new tab <ExternalLink className="w-3 h-3" />
            </label>
          </div>
          <div className="flex items-center justify-end gap-2 mt-1">
            {isActive && (
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                  closeDialog();
                }}
                className="text-xs text-destructive hover:underline px-2"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={closeDialog}
              className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={setLink}
              className="p-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
