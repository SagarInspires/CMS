'use client';

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import SlashCommands from './extensions/SlashCommands/SlashCommands';
import { suggestion } from './extensions/SlashCommands/suggestion';
import { ImageBlock } from './extensions/ImageBlock/ImageBlock';
import { sharedEditorExtensions } from '@/lib/editor/extensions';
import { Toolbar } from './Toolbar';
import { MenuBar } from './MenuBar';
import { Outline } from './Outline';
import { CommentsSidebar } from './CommentsSidebar';
import { RevisionsSidebar } from './RevisionsSidebar';
import { Comment } from './extensions/Comment/Comment';
import { Bold, Italic, Strikethrough, Code, Link as LinkIcon, Highlighter, MessageSquarePlus, ListTree, MessageSquare, History } from 'lucide-react';
import { useState, useEffect } from 'react';

type WritingCanvasProps = {
  initialContent?: string;
  initialTitle?: string;
  onUpdate: (
    json: any, 
    html: string, 
    stats: { chars: number; words: number; readingTime: number }
  ) => void;
  onTitleChange: (title: string) => void;
  articleId: string;
  isLocked?: boolean;
};

export function WritingCanvas({ 
  initialContent = '', 
  initialTitle = '',
  onUpdate,
  onTitleChange,
  articleId,
  isLocked = false
}: WritingCanvasProps) {
  const [title] = useState(initialTitle || '');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [activeSidebar, setActiveSidebar] = useState<'outline' | 'comments' | 'revisions' | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      ...sharedEditorExtensions.filter(ext => ext.name !== 'imageBlock'),
      Placeholder.configure({
        placeholder: "Type '/' for commands",
        emptyEditorClass: 'is-editor-empty',
      }),
      CharacterCount.configure({
        limit: null,
      }),
      SlashCommands.configure({ suggestion }),
      ImageBlock, // Client-side version with ReactNodeViewRenderer
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-lg sm:prose-xl xl:prose-2xl prose-stone focus:outline-none min-h-[60vh] pb-32 max-w-none editorial-canvas prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tighter prose-headings:text-white prose-p:font-sans prose-p:leading-relaxed prose-p:tracking-tight prose-p:text-white/80 prose-blockquote:font-serif prose-blockquote:font-style-italic prose-blockquote:border-l-white/20 prose-blockquote:text-white/60 prose-img:rounded-[2rem] prose-img:shadow-[0_0_40px_rgba(255,255,255,0.05)] prose-img:border prose-img:border-white/[0.08] prose-strong:text-white prose-a:text-white',
      },
    },
    onUpdate: ({ editor }) => {
      const words = editor.storage.characterCount.words();
      const chars = editor.storage.characterCount.characters();
      const readingTime = Math.ceil(words / 225); // Average 225 words per minute
      onUpdate(editor.getJSON(), editor.getHTML(), { chars, words, readingTime });
    },
    onSelectionUpdate: ({ editor }) => {
      const isComment = editor.isActive('comment');
      if (isComment) {
        const commentId = editor.getAttributes('comment').commentId;
        if (commentId) {
          setActiveCommentId(commentId);
          setActiveSidebar('comments');
        }
      } else {
        setActiveCommentId(null);
      }
    },
  });

  // Synchronize locking
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isLocked);
    }
  }, [editor, isLocked]);

  if (!editor) {
    return <div className="animate-pulse h-96 bg-muted/20 rounded-xl" />;
  }

  return (
    <div className="w-full relative flex flex-col items-center">
      <div className="w-full max-w-[800px] xl:max-w-[1200px] transition-all">
        <MenuBar editor={editor} />
        <Toolbar 
          editor={editor} 
          activeSidebar={activeSidebar}
          setActiveSidebar={setActiveSidebar}
        />
      </div>
      
      {/* Contextual Bubble Menu */}
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="flex items-center gap-1 bg-popover text-popover-foreground border shadow-elegant rounded-md p-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-accent ${editor.isActive('bold') ? 'bg-accent text-accent-foreground' : ''}`}
          aria-label="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-accent ${editor.isActive('italic') ? 'bg-accent text-accent-foreground' : ''}`}
          aria-label="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded hover:bg-accent ${editor.isActive('underline') ? 'bg-accent text-accent-foreground' : ''}`}
          aria-label="Underline"
        >
          <span className="font-serif font-bold underline px-1">U</span>
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button
          onClick={() => {
            const url = window.prompt('URL');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            } else if (url === '') {
              editor.chain().focus().unsetLink().run();
            }
          }}
          className={`p-1.5 rounded hover:bg-accent ${editor.isActive('link') ? 'bg-accent text-accent-foreground' : ''}`}
          aria-label="Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button
          onClick={() => {
            const commentId = `comment-${Date.now()}`;
            editor.chain().focus().setComment(commentId).run();
            setActiveCommentId(commentId);
            setActiveSidebar('comments');
            
            // Get selected text to pass to sidebar
            const { from, to } = editor.state.selection;
            const text = editor.state.doc.textBetween(from, to, ' ');
            // Wait for React to mount the CommentsSidebar
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('open-comment-thread', { detail: { commentId, text } }));
            }, 50);
          }}
          className="p-1.5 rounded hover:bg-accent text-amber-500 hover:text-amber-600"
          aria-label="Add Comment"
          title="Add Comment"
        >
          <MessageSquarePlus className="w-4 h-4" />
        </button>
      </BubbleMenu>

      <div className="max-w-[800px] xl:max-w-[1200px] w-full mx-auto px-8 py-16 relative flex gap-8 transition-all">
        <div className="flex-1 min-w-0" data-testid="rich-text-editor">
          <h1 className="sr-only">Article editor</h1>
          <input
            type="text"
            name="title"
            value={initialTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            disabled={isLocked}
            placeholder="Document Title"
            className="w-full text-5xl sm:text-6xl md:text-7xl font-sans font-bold tracking-tighter text-white bg-transparent border-none focus:outline-none focus:ring-0 mb-8 placeholder:text-white/20 leading-[0.95] disabled:opacity-50"
          />
          
          {/* TipTap Canvas */}
          <EditorContent editor={editor} className="editorial-canvas" />
        </div>
        
        {/* Right Sidebar */}
        {activeSidebar && (
          <div className="hidden lg:flex flex-col w-80 flex-shrink-0 border-l border-white/[0.08] pl-6 h-[calc(100vh-60px)] sticky top-[60px]">
            
            {/* Sidebar Tabs */}
          <div className="flex items-center gap-4 border-b border-white/[0.08] mb-4 pb-2">
            <button
              onClick={() => setActiveSidebar('outline')}
              className={`flex items-center gap-1.5 text-sm font-medium pb-2 border-b-2 transition-colors -mb-[9px] ${
                activeSidebar === 'outline' ? 'border-white text-white' : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              <ListTree className="w-4 h-4" />
              Outline
            </button>
            <button
              onClick={() => setActiveSidebar('comments')}
              className={`flex items-center gap-1.5 text-sm font-medium pb-2 border-b-2 transition-colors -mb-[9px] ${
                activeSidebar === 'comments' ? 'border-white text-white' : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Comments
            </button>
            <button
              onClick={() => setActiveSidebar('revisions')}
              className={`flex items-center gap-1.5 text-sm font-medium pb-2 border-b-2 transition-colors -mb-[9px] ${
                activeSidebar === 'revisions' ? 'border-white text-white' : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              Revisions
            </button>
          </div>

          <div className="flex-1 overflow-hidden relative border-t border-white/[0.08] mt-[1px]">
            {activeSidebar === 'outline' && <Outline editor={editor} />}
            {activeSidebar === 'comments' && (
              <CommentsSidebar 
                editor={editor} 
                activeCommentId={activeCommentId} 
                onClose={() => setActiveSidebar(null)}
                articleId={articleId}
              />
            )}
            {activeSidebar === 'revisions' && (
              <RevisionsSidebar 
                editor={editor}
                onClose={() => setActiveSidebar(null)}
                articleId={articleId}
              />
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
