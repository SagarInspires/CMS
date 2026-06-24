import { Editor } from '@tiptap/react';
import '@tiptap/starter-kit';
import '@tiptap/extension-underline';
import '@tiptap/extension-text-align';
import '@tiptap/extension-task-list';
import { 
  Bold, Italic, Underline, Strikethrough, Code, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare, 
  Heading1, Heading2, Heading3, TextQuote, 
  Undo, Redo, RemoveFormatting,
  Table as TableIcon, Trash, Plus, Trash2, ArrowDownToLine, ArrowRightToLine, Image as ImageIcon, Loader2, PanelRightClose, PanelRightOpen
} from 'lucide-react';
import { useCallback, useState, useRef, useEffect } from 'react';
import { LinkDialog } from './dialogs/LinkDialog';

interface ToolbarProps {
  editor: Editor | null;
  activeSidebar?: 'outline' | 'comments' | 'revisions' | null;
  setActiveSidebar?: (sidebar: 'outline' | 'comments' | 'revisions' | null) => void;
}

const ToolbarButton = ({ 
  onClick, 
  isActive, 
  disabled, 
  children,
  title
}: { 
  onClick: () => void, 
  isActive?: boolean, 
  disabled?: boolean, 
  children: React.ReactNode,
  title: string
}) => (
  <button
    type="button"
    onClick={onClick}
    onMouseDown={(e) => e.preventDefault()}
    disabled={disabled}
    title={title}
    aria-label={title}
    className={`p-1.5 rounded-sm flex items-center justify-center transition-colors
      ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-border mx-1" />;

const DropdownButton = ({ 
  icon: Icon, 
  title, 
  children,
  isActive
}: { 
  icon: React.ElementType, 
  title: string, 
  children: React.ReactNode,
  isActive?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <ToolbarButton onClick={() => setIsOpen(!isOpen)} title={title} isActive={isOpen || isActive}>
        <Icon className="w-4 h-4" />
      </ToolbarButton>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-popover text-popover-foreground border border-border rounded-md shadow-elegant z-50 py-1 flex flex-col">
          {children}
        </div>
      )}
    </div>
  );
};

const DropdownItem = ({ onClick, label, icon: Icon }: { onClick: () => void, label: string, icon?: React.ElementType }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
  >
    {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
    <span>{label}</span>
  </button>
);

export function Toolbar({ editor, activeSidebar, setActiveSidebar }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!editor) {
    return null;
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be under 5MB.');
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();
      const altText = window.prompt('Enter alt text for this image (recommended for accessibility):') || '';
      
      editor.chain().focus().setImageBlock({ src: url, alt: altText, alignment: 'center' }).run();
    } catch (error: any) {
      alert(error.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-1 bg-background border-b border-border shadow-sm sticky top-[60px] z-10 w-full overflow-x-auto">
      
      {/* History */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Cmd+Z)"
      >
        <Undo className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Cmd+Shift+Z)"
      >
        <Redo className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        title="Clear Formatting"
      >
        <RemoveFormatting className="w-4 h-4" />
      </ToolbarButton>

      <Divider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </ToolbarButton>

      <Divider />

      {/* Inline Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Cmd+B)"
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Cmd+I)"
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline (Cmd+U)"
      >
        <Underline className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Inline Code"
      >
        <Code className="w-4 h-4" />
      </ToolbarButton>

      <LinkDialog editor={editor} />

      <Divider />

      {/* Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        isActive={editor.isActive({ textAlign: 'justify' })}
        title="Justify"
      >
        <AlignJustify className="w-4 h-4" />
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive('taskList')}
        title="Task List"
      >
        <CheckSquare className="w-4 h-4" />
      </ToolbarButton>

      <Divider />

      {/* Blocks */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Blockquote"
      >
        <TextQuote className="w-4 h-4" />
      </ToolbarButton>

      <Divider />

      {/* Tables */}
      <DropdownButton icon={TableIcon} title="Tables" isActive={editor.isActive('table')}>
        <DropdownItem 
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} 
          label="Insert Table (3x3)" 
          icon={Plus} 
        />
        {editor.isActive('table') && (
          <>
            <div className="h-px bg-border my-1" />
            <DropdownItem onClick={() => editor.chain().focus().addColumnAfter().run()} label="Add Column After" icon={ArrowRightToLine} />
            <DropdownItem onClick={() => editor.chain().focus().deleteColumn().run()} label="Delete Column" icon={Trash} />
            <div className="h-px bg-border my-1" />
            <DropdownItem onClick={() => editor.chain().focus().addRowAfter().run()} label="Add Row After" icon={ArrowDownToLine} />
            <DropdownItem onClick={() => editor.chain().focus().deleteRow().run()} label="Delete Row" icon={Trash} />
            <div className="h-px bg-border my-1" />
            <DropdownItem onClick={() => editor.chain().focus().mergeCells().run()} label="Merge Cells" />
            <DropdownItem onClick={() => editor.chain().focus().splitCell().run()} label="Split Cell" />
            <div className="h-px bg-border my-1" />
            <DropdownItem onClick={() => editor.chain().focus().deleteTable().run()} label="Delete Table" icon={Trash2} />
          </>
        )}
      </DropdownButton>

      <Divider />

      {/* Image Upload */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
      />
      <ToolbarButton
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        title="Upload Image"
      >
        {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <ImageIcon className="w-4 h-4" />}
      </ToolbarButton>

      {setActiveSidebar && (
        <>
          <Divider />
          <ToolbarButton
            onClick={() => setActiveSidebar(activeSidebar ? null : 'outline')}
            isActive={!!activeSidebar}
            title={activeSidebar ? "Close Sidebar" : "Open Sidebar"}
          >
            {activeSidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </ToolbarButton>
        </>
      )}

    </div>
  );
}
