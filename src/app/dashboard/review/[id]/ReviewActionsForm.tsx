'use client';

import { useActionState, useState, useEffect, useRef } from 'react';
import { transitionArticle } from './actions';

export function ReviewActionsForm({ articleId, version, status, isAdmin, canPublish, canSchedule }: any) {
  const [state, formAction, isPending] = useActionState(transitionArticle, null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [prevVersion, setPrevVersion] = useState(version);

  // Derive state from props (React recommended pattern over useEffect)
  if (version !== prevVersion) {
    setPrevVersion(version);
    setActiveAction(null);
  }

  // Close dialog when server props update
  useEffect(() => {
    dialogRef.current?.close();
  }, [status, version]);

  const handleActionClick = (actionName: string) => {
    setActiveAction(actionName);
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    setActiveAction(null);
    dialogRef.current?.close();
  };

  return (
    <div className="space-y-4">
      {/* Trigger Buttons (Outside the form, type="button") */}
      {(status === 'DRAFT' || status === 'CHANGES_REQUESTED') && (
        <button type="button" onClick={() => handleActionClick('SUBMIT_FOR_REVIEW')} className="w-full p-2 bg-primary text-primary-foreground rounded hover:opacity-90 text-sm font-semibold">
          Submit for Review
        </button>
      )}

      {status === 'IN_REVIEW' && (
        <div className="grid grid-cols-1 gap-2">
          <button type="button" onClick={() => handleActionClick('REQUEST_CHANGES')} className="p-2 border rounded hover:bg-accent text-sm">Request Changes</button>
          <button type="button" onClick={() => handleActionClick('REJECT')} className="p-2 border border-destructive/50 text-destructive rounded hover:bg-destructive/10 text-sm">Reject</button>
          <button type="button" onClick={() => handleActionClick('APPROVE')} className="p-2 bg-primary text-primary-foreground rounded hover:opacity-90 text-sm font-semibold">Approve</button>
        </div>
      )}

      {status === 'APPROVED' && (
        <div className="grid grid-cols-1 gap-2">
          {canPublish && <button type="button" onClick={() => handleActionClick('PUBLISH_NOW')} className="p-2 bg-primary text-primary-foreground rounded text-sm font-semibold">Publish Now</button>}
          {canSchedule && <button type="button" onClick={() => handleActionClick('SCHEDULE')} className="p-2 border rounded hover:bg-accent text-sm">Schedule Publication</button>}
        </div>
      )}

      {status === 'SCHEDULED' && (
        <div className="grid grid-cols-1 gap-2">
          <button type="button" onClick={() => handleActionClick('CANCEL_SCHEDULE')} className="p-2 border rounded hover:bg-accent text-sm">Cancel Schedule</button>
          {canPublish && <button type="button" onClick={() => handleActionClick('PUBLISH_NOW')} className="p-2 bg-primary text-primary-foreground rounded text-sm font-semibold">Publish Immediately</button>}
        </div>
      )}

      {isAdmin && (
        <div className="mt-8 pt-4 border-t border-destructive/20">
          <button type="button" onClick={() => handleActionClick('ADMIN_OVERRIDE')} className="w-full p-2 bg-destructive text-destructive-foreground rounded hover:opacity-90 text-sm font-semibold">
            Admin Override
          </button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <dialog ref={dialogRef} className="p-6 rounded-lg backdrop:bg-black/50 shadow-xl border w-full max-w-md bg-background text-foreground open:flex flex-col">
        <form action={formAction} className="space-y-4 w-full">
          <h3 className="font-bold text-lg mb-2">Confirm Action</h3>
          
          <input type="hidden" name="articleId" value={articleId} />
          <input type="hidden" name="expectedVersion" value={version} />
          {activeAction && <input type="hidden" name="action" value={activeAction === 'ADMIN_OVERRIDE' ? '' : activeAction} />}

          {state?.error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded border border-destructive/20">
              {state.error}
            </div>
          )}

          {/* Dynamic Inputs Based on Action */}
          {(activeAction === 'REQUEST_CHANGES' || activeAction === 'REJECT' || activeAction === 'APPROVE') && (
            <textarea 
              name="reason" 
              className="w-full p-2 text-sm border rounded bg-background text-foreground" 
              placeholder={activeAction === 'APPROVE' ? "Optional internal note..." : "Reason (required, min 10 chars)..."}
              rows={3}
              required={activeAction !== 'APPROVE'}
            />
          )}

          {activeAction === 'SCHEDULE' && (
            <input type="datetime-local" name="scheduledAt" required className="w-full p-2 border rounded text-sm bg-background text-foreground" />
          )}

          {activeAction === 'ADMIN_OVERRIDE' && (
            <div className="space-y-2">
              <select name="action" className="w-full p-2 border rounded text-sm bg-background text-foreground">
                <option value="REJECT">Force Reject</option>
                <option value="ARCHIVE">Force Archive</option>
              </select>
              <textarea name="reason" placeholder="Override reason (required)" required className="w-full p-2 border rounded text-sm bg-background text-foreground" />
            </div>
          )}

          <div className="flex gap-2 pt-4 mt-4 border-t">
            <button type="submit" disabled={isPending} className="flex-1 p-2 bg-primary text-primary-foreground rounded text-sm font-bold disabled:opacity-50">
              {isPending ? 'Processing...' : (
                activeAction === 'APPROVE' ? 'Confirm Approval' :
                activeAction === 'PUBLISH_NOW' ? 'Confirm Publication' :
                activeAction === 'SUBMIT_FOR_REVIEW' ? 'Confirm Submission' :
                activeAction === 'ADMIN_OVERRIDE' ? 'EXECUTE OVERRIDE' :
                `Confirm ${activeAction?.replace('_', ' ')}`
              )}
            </button>
            <button type="button" disabled={isPending} onClick={closeDialog} className="p-2 border rounded text-sm hover:bg-accent">
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
