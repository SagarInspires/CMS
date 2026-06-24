import { History, RotateCcw, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';

interface RevisionsSidebarProps {
  editor: Editor | null;
  articleId: string;
  onClose: () => void;
}

interface RevisionMeta {
  id: string;
  version: number;
  title: string;
  author: string;
  date: string;
}

export function RevisionsSidebar({ editor, articleId, onClose }: RevisionsSidebarProps) {
  const [revisions, setRevisions] = useState<RevisionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRev, setSelectedRev] = useState<string | null>(null);
  
  // Stash the current draft when the sidebar opens
  const draftContentRef = useRef<any>(null);
  
  useEffect(() => {
    if (editor && !draftContentRef.current) {
      draftContentRef.current = editor.getJSON();
    }
  }, [editor]);

  // Restore draft and editable state when unmounting
  useEffect(() => {
    return () => {
      if (editor && draftContentRef.current) {
        editor.setEditable(true);
        editor.commands.setContent(draftContentRef.current);
      }
    };
  }, [editor]);

  const fetchRevisions = useCallback(async () => {
    try {
      const res = await fetch(`/api/articles/${articleId}/revisions`);
      if (res.ok) {
        const data = await res.json();
        setRevisions(data.revisions || []);
      }
    } catch (err) {
      console.error('Failed to fetch revisions', err);
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRevisions();
  }, [fetchRevisions]);

  const handlePreview = async (revId: string | null) => {
    setSelectedRev(revId);
    if (!editor) return;

    if (revId === null) {
      // Back to current draft
      editor.setEditable(true);
      editor.commands.setContent(draftContentRef.current);
    } else {
      // Preview a specific revision
      try {
        const res = await fetch(`/api/articles/${articleId}/revisions/${revId}`);
        if (res.ok) {
          const data = await res.json();
          editor.setEditable(false); // Lock the editor during preview
          editor.commands.setContent(data.revision.contentJson);
        }
      } catch (err) {
        console.error('Failed to preview revision', err);
      }
    }
  };

  const handleRestore = async (revId: string) => {
    if (!editor) return;
    
    // We need to pass the generated HTML to the backend to save processing.
    // The editor currently contains the previewed revision.
    const htmlContent = editor.getHTML();

    if(window.confirm('Are you sure you want to restore this version? You will lose any unsaved changes.')) {
      try {
        const res = await fetch(`/api/articles/${articleId}/revisions/${revId}/restore`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ htmlContent })
        });
        if (res.ok) {
          // Success! Reload the page to reset all states securely
          window.location.reload();
        } else {
          alert('Failed to restore revision.');
        }
      } catch (err) {
        console.error('Restore failed', err);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-border w-80 shadow-[-4px_0_24px_-16px_rgba(0,0,0,0.1)]">
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <History className="w-4 h-4" />
          Version History
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            <button
              onClick={() => handlePreview(null)}
              className={`w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden group
                ${selectedRev === null ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50 bg-card'}
              `}
            >
              {selectedRev === null && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              )}
              <div className="font-medium text-sm">Current Draft</div>
              <div className="text-xs text-muted-foreground mt-1">Unsaved changes</div>
            </button>

            {revisions.map((rev) => (
              <button
                key={rev.id}
                onClick={() => handlePreview(rev.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden group
                  ${selectedRev === rev.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50 bg-card'}
                `}
              >
                {selectedRev === rev.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                )}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate pr-2">v{rev.version}. {rev.title}</span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(rev.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span className="truncate pr-2">{rev.author}</span>
                  {selectedRev === rev.id && (
                    <span 
                      className="text-primary hover:underline flex items-center gap-1 font-medium bg-background px-1.5 py-0.5 rounded shadow-sm border whitespace-nowrap shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(rev.id);
                      }}
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore
                    </span>
                  )}
                </div>
              </button>
            ))}

            {revisions.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                No revisions yet.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
