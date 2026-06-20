'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useRef, useState } from 'react';

type TiptapEditorProps = {
  initialContent?: string;
  onUpdate: (json: any, html: string) => void;
};

export function TiptapEditor({ initialContent = '<p>Start writing your article here...</p>', onUpdate }: TiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-xl max-w-full h-auto',
        },
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[400px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getJSON(), editor.getHTML());
    },
  });

  if (!editor) {
    return (
      <p role="status">
        Loading editor…
      </p>
    );
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset state
    setUploadError(null);
    
    // Client-side validation
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are allowed.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be under 5MB.');
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
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const { url } = await response.json();

      // Ask for alt text
      const altText = window.prompt('Enter alt text for this image (recommended for accessibility):') || '';

      // Insert image safely into Tiptap with alt text
      editor.chain().focus().setImage({ src: url, alt: altText }).run();
      
    } catch (error: any) {
      setUploadError(error.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
      }
    }
  };

  return (
    <div data-testid="rich-text-editor" className="border rounded-md overflow-hidden bg-background flex flex-col">
      {/* Hidden Inputs for Form Submission avoiding stale closure */}
      <input type="hidden" name="content" value={JSON.stringify(editor.getJSON())} />
      <input type="hidden" name="htmlContent" value={editor.getHTML()} />

      {/* Toolbar */}
      <div className="bg-muted p-2 flex flex-wrap gap-2 border-b items-center">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-3 py-1 text-sm border rounded transition-colors ${editor.isActive('bold') ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}>Bold</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-3 py-1 text-sm border rounded transition-colors ${editor.isActive('italic') ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}>Italic</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-3 py-1 text-sm border rounded transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}>H2</button>
        
        <div className="w-px h-6 bg-border mx-1" />

        {/* Hidden File Input */}
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          className="hidden" 
        />
        
        {/* Upload Button */}
        <button 
          type="button" 
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()} 
          className="px-3 py-1 text-sm bg-background border rounded hover:bg-accent flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Upload Image"
        >
          {isUploading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              Add Image
            </span>
          )}
        </button>

        {uploadError && (
          <span className="text-xs text-destructive font-medium ml-2 animate-in fade-in">
            {uploadError}
          </span>
        )}
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 bg-background relative">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
