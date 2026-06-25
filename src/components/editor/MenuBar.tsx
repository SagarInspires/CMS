import { Editor } from '@tiptap/react';
import '@tiptap/starter-kit';
import '@tiptap/extension-underline';
import '@tiptap/extension-text-align';
import { useState, useRef, useEffect } from 'react';

interface MenuBarProps {
  editor: Editor | null;
}

const MenuDropdown = ({ label, children }: { label: string, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
          isOpen ? 'bg-glass/[0.1] text-foreground' : 'text-foreground/60 hover:bg-glass/[0.05] hover:text-foreground'
        }`}
      >
        {label}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-surface border border-glass/[0.08] rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 py-1">
          {children}
        </div>
      )}
    </div>
  );
};

const MenuItem = ({ label, onClick, shortcut }: { label: string, onClick: () => void, shortcut?: string }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left px-4 py-2 text-sm hover:bg-glass/[0.05] text-foreground/90 hover:text-foreground flex justify-between items-center transition-colors"
  >
    <span>{label}</span>
    {shortcut && <span className="text-xs text-foreground/40">{shortcut}</span>}
  </button>
);

export function MenuBar({ editor }: MenuBarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-surface border-b border-glass/[0.08] text-foreground">
      <MenuDropdown label="File">
        <MenuItem label="New document" onClick={() => {}} />
        <MenuItem label="Save draft" onClick={() => {}} shortcut="Cmd+S" />
        <div className="h-px bg-border my-1" />
        <MenuItem label="Export PDF" onClick={() => {}} />
        <MenuItem label="Export HTML" onClick={() => {}} />
      </MenuDropdown>

      <MenuDropdown label="Edit">
        <MenuItem label="Undo" onClick={() => editor.chain().focus().undo().run()} shortcut="Cmd+Z" />
        <MenuItem label="Redo" onClick={() => editor.chain().focus().redo().run()} shortcut="Cmd+Shift+Z" />
        <div className="h-px bg-glass/[0.08] my-1" />
        <MenuItem label="Select all" onClick={() => editor.chain().focus().selectAll().run()} shortcut="Cmd+A" />
      </MenuDropdown>

      <MenuDropdown label="View">
        <MenuItem label="Show word count" onClick={() => {}} />
        <MenuItem label="Focus mode" onClick={() => {}} />
      </MenuDropdown>

      <MenuDropdown label="Format">
        <MenuItem label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} shortcut="Cmd+B" />
        <MenuItem label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} shortcut="Cmd+I" />
        <MenuItem label="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} shortcut="Cmd+U" />
        <MenuItem label="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} />
        <div className="h-px bg-glass/[0.08] my-1" />
        <MenuItem label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} />
      </MenuDropdown>
    </div>
  );
}
