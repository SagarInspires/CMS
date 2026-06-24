import { Editor } from '@tiptap/react';
import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, X, User, Loader2 } from 'lucide-react';

interface CommentsSidebarProps {
  editor: Editor | null;
  activeCommentId: string | null;
  onClose: () => void;
  articleId: string;
}

interface CommentReply {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  resolved: boolean;
}

interface CommentThread {
  id: string;      // The TipTap nodeId
  dbId: string;    // The Root Comment DB ID
  text: string;    // The anchored text
  replies: CommentReply[];
  resolved: boolean;
}

export function CommentsSidebar({ editor, activeCommentId, onClose, articleId }: CommentsSidebarProps) {
  const [threads, setThreads] = useState<Record<string, CommentThread>>({});
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/articles/${articleId}/comments`);
      if (res.ok) {
        const data = await res.json();
        const newThreads = data.threads || {};
        setThreads(newThreads);

        // Orphaned Mark Cleanup
        if (editor) {
          const validIds = new Set(Object.keys(newThreads));
          let hasOrphans = false;
          
          editor.state.doc.descendants((node, pos) => {
            if (node.marks) {
              node.marks.forEach(mark => {
                if (mark.type.name === 'comment' && !validIds.has(mark.attrs.commentId)) {
                  hasOrphans = true;
                }
              });
            }
          });

          // If orphans exist, we strip them. We use a transaction instead of commands to avoid focus issues
          if (hasOrphans) {
            const tr = editor.state.tr;
            editor.state.doc.descendants((node, pos) => {
              if (node.marks) {
                node.marks.forEach(mark => {
                  if (mark.type.name === 'comment' && !validIds.has(mark.attrs.commentId)) {
                    tr.removeMark(pos, pos + node.nodeSize, mark.type);
                  }
                });
              }
            });
            editor.view.dispatch(tr);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setLoading(false);
    }
  }, [articleId, editor]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchComments();
  }, [fetchComments]);

  // Listen for the custom event dispatched from the BubbleMenu when a NEW thread is initiated
  useEffect(() => {
    const handleOpenThread = async (e: any) => {
      const { commentId, text } = e.detail;
      if (!threads[commentId]) {
        // Create the root comment in DB immediately
        try {
          const res = await fetch(`/api/articles/${articleId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nodeId: commentId,
              textRange: text || 'Selected text...',
              content: 'Started a thread', // We save a default root message to anchor it
            })
          });
          if (res.ok) {
            await fetchComments();
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener('open-comment-thread', handleOpenThread);
    return () => window.removeEventListener('open-comment-thread', handleOpenThread);
  }, [threads, articleId, fetchComments]);

  if (!editor) return null;

  const currentThread = activeCommentId ? threads[activeCommentId] : null;

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeCommentId || !currentThread) return;

    setSending(true);
    try {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: currentThread.dbId,
          content: replyText
        })
      });

      if (res.ok) {
        setReplyText('');
        await fetchComments();
      }
    } catch (err) {
      console.error('Failed to reply', err);
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!activeCommentId || !currentThread) return;
    
    // Remove the mark from TipTap
    editor.chain().focus().unsetComment(activeCommentId).run();
    
    try {
      await fetch(`/api/articles/${articleId}/comments/${currentThread.dbId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve' })
      });
      await fetchComments();
    } catch (err) {
      console.error('Failed to resolve', err);
    }
    
    onClose();
  };

  return (
    <div className="w-80 border-l border-border bg-background h-[calc(100vh-60px)] sticky top-[60px] flex flex-col shadow-[-4px_0_24px_-16px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Comments
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : Object.values(threads).filter(t => !t.resolved).map(thread => (
          <div 
            key={thread.id} 
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              activeCommentId === thread.id 
                ? 'border-amber-400 bg-amber-500/5 shadow-sm' 
                : 'border-border bg-card hover:border-amber-400/50'
            }`}
            onClick={() => {
              // Optionally dispatch an event to select the text in the editor here
            }}
          >
            <div className="text-xs text-muted-foreground mb-2 italic border-l-2 border-amber-400 pl-2">
              &quot;{thread.text}&quot;
            </div>
            
            {thread.replies.map((reply, i) => (
              <div key={reply.id || i} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px]">
                      <User className="w-3 h-3" />
                    </div>
                    {reply.author}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(reply.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <div className="text-sm text-foreground pl-6.5">
                  {reply.content}
                </div>
              </div>
            ))}
            
            {activeCommentId === thread.id && (
              <div className="mt-4 pt-3 border-t border-border flex justify-end">
                <button 
                  onClick={handleResolve}
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
                >
                  Resolve thread
                </button>
              </div>
            )}
          </div>
        ))}

        {!loading && Object.keys(threads).length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            Select text and click the comment icon in the floating menu to leave a comment.
          </div>
        )}
      </div>

      {activeCommentId && currentThread && !currentThread.resolved && (
        <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
          <form onSubmit={handleReply} className="relative">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Reply..."
              disabled={sending}
              className="w-full bg-background border border-input rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!replyText.trim() || sending}
              className="absolute right-1.5 top-1.5 p-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
