'use client';

import { useActionState } from 'react';
import { createArticle } from '@/app/dashboard/articles/actions';
import dynamic from 'next/dynamic';

const TiptapEditor = dynamic(
  () => import('../editor/TiptapEditor').then(mod => mod.TiptapEditor),
  {
    ssr: false,
    loading: () => <p role="status">Loading editor…</p>
  }
);

export function ArticleForm() {
  const [state, formAction, isPending] = useActionState(createArticle, null);
  
  return (
    <>
      {state?.error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input 
            name="title" 
            type="text" 
            required 
            className="w-full p-2 border rounded-md bg-background text-foreground"
            placeholder="Enter article title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Content</label>
          <TiptapEditor onUpdate={() => {}} />
        </div>

        <div className="flex justify-end gap-4">
          <button type="submit" disabled={isPending} className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50">
            {isPending ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </form>
    </>
  );
}
