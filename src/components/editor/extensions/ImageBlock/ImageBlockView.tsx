import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { AlignLeft, AlignCenter, AlignRight, Maximize, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';

export function ImageBlockView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const { src, alt, caption, alignment, uploading, progress, error } = node.attrs;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    updateAttributes({ uploading: true, progress: 0, error: null });
    
    // Client-side validation
    if (!file.type.startsWith('image/')) {
      updateAttributes({ uploading: false, error: 'Only image files are allowed.' });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      updateAttributes({ uploading: false, error: 'Image size must be under 5MB.' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Fake progress for UX
      const interval = setInterval(() => {
        updateAttributes({ progress: Math.min(node.attrs.progress + 10, 90) });
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const { url } = await response.json();
      updateAttributes({ src: url, uploading: false, progress: 100 });
      
    } catch (err: any) {
      updateAttributes({ uploading: false, error: err.message || 'An error occurred during upload.' });
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const getAlignmentClass = () => {
    switch (alignment) {
      case 'left': return 'mr-auto ml-0 max-w-[50%]';
      case 'right': return 'ml-auto mr-0 max-w-[50%]';
      case 'full': return 'max-w-none w-screen relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] px-0';
      default: return 'mx-auto';
    }
  };

  return (
    <NodeViewWrapper className={`my-8 relative group ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`} data-drag-handle>
      
      {/* Upload Placeholder State */}
      {!src && !uploading && !error && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 border-2 border-dashed border-border rounded-xl bg-muted/20 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
          <span className="text-sm font-medium text-muted-foreground">Click or drop an image here</span>
          <input type="file" className="hidden" ref={fileInputRef} onChange={onFileChange} accept="image/*" />
        </div>
      )}

      {/* Uploading State */}
      {uploading && (
        <div className="w-full h-48 border rounded-xl bg-muted/20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="w-full p-4 border border-destructive/20 bg-destructive/10 rounded-xl flex flex-col items-center justify-center">
          <span className="text-destructive font-medium mb-2">{error}</span>
          <div className="flex gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-1 text-sm bg-background border rounded hover:bg-accent">Retry</button>
            <button onClick={deleteNode} className="px-4 py-1 text-sm bg-destructive text-destructive-foreground rounded hover:opacity-90">Remove</button>
          </div>
          <input type="file" className="hidden" ref={fileInputRef} onChange={onFileChange} accept="image/*" />
        </div>
      )}

      {/* Render Image State */}
      {src && !uploading && (
        <figure className={`flex flex-col m-0 ${getAlignmentClass()}`}>
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="rounded-xl w-full h-auto shadow-sm" />
            
            {/* Toolbar (Only visible on selection) */}
            {selected && (
              <div className="absolute top-2 right-2 bg-popover/90 backdrop-blur text-popover-foreground shadow-lg rounded-md p-1 border flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => updateAttributes({ alignment: 'left' })} className={`p-1.5 rounded hover:bg-accent ${alignment === 'left' ? 'bg-accent text-accent-foreground' : ''}`}><AlignLeft className="w-4 h-4" /></button>
                <button onClick={() => updateAttributes({ alignment: 'center' })} className={`p-1.5 rounded hover:bg-accent ${alignment === 'center' ? 'bg-accent text-accent-foreground' : ''}`}><AlignCenter className="w-4 h-4" /></button>
                <button onClick={() => updateAttributes({ alignment: 'right' })} className={`p-1.5 rounded hover:bg-accent ${alignment === 'right' ? 'bg-accent text-accent-foreground' : ''}`}><AlignRight className="w-4 h-4" /></button>
                <button onClick={() => updateAttributes({ alignment: 'full' })} className={`p-1.5 rounded hover:bg-accent ${alignment === 'full' ? 'bg-accent text-accent-foreground' : ''}`}><Maximize className="w-4 h-4" /></button>
                <div className="w-px h-4 bg-border mx-1" />
                <button onClick={() => {
                  const newAlt = window.prompt('Alt Text:', alt);
                  if (newAlt !== null) updateAttributes({ alt: newAlt });
                }} className="px-2 text-xs font-medium hover:bg-accent rounded">Alt</button>
                <button onClick={deleteNode} className="p-1.5 rounded text-destructive hover:bg-destructive/20"><Trash2 className="w-4 h-4" /></button>
              </div>
            )}
          </div>
          
          <figcaption className="mt-2">
            <input 
              type="text" 
              placeholder="Write a caption..." 
              value={caption} 
              onChange={e => updateAttributes({ caption: e.target.value })}
              className="w-full text-center text-sm text-muted-foreground bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground/40"
            />
          </figcaption>
        </figure>
      )}

    </NodeViewWrapper>
  );
}
