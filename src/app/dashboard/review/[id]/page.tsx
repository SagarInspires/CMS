import { verifySession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/auth/rbac';
import { notFound, redirect } from 'next/navigation';
import { ReviewActionsForm } from './ReviewActionsForm';
import Link from 'next/link';
import { sanitizeHtml } from '@/lib/sanitizer';
import { generateHTML } from '@tiptap/html';
import { sharedEditorExtensions } from '@/lib/editor/extensions';

export default async function ReviewDetailPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ rev?: string }>;
}) {
  const session = await verifySession();
  if (!session) {
    redirect('/login');
  }

  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const revisionId = resolvedSearchParams?.rev;

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      author: { select: { name: true, email: true } },
      category: true,
      tags: { include: { tag: true } },
      comments: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
      revisions: { orderBy: { version: 'desc' } }
    }
  });

  if (!article) notFound();

  // Access Control: Must be the author, or have review/publish permissions
  const isAuthor = article.authorId === session.userId;
  const canReview = hasPermission(session.role, 'article:review');
  const canPublish = hasPermission(session.role, 'article:publish');

  if (!isAuthor && !canReview && !canPublish) {
    notFound(); // or redirect
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: 'Article', entityId: article.id },
    include: { actor: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  let displayTitle = article.title;
  let displayHtml = article.sanitizedHtml;
  let isPreview = false;

  if (revisionId) {
    const revision = article.revisions.find(r => r.id === revisionId);
    if (revision) {
      displayTitle = `${revision.title} (Revision v${revision.version})`;
      isPreview = true;
      // Convert TipTap JSON to HTML for preview since revisions only store JSON
      try {
        const rawHtml = generateHTML(revision.contentJson as any, sharedEditorExtensions);
        displayHtml = sanitizeHtml(rawHtml);
      } catch (err) {
        displayHtml = '<p class="text-destructive">Failed to render revision preview.</p>';
      }
    }
  }

  const words = displayHtml.replace(/<[^>]+>/g, '').split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(words / 200));

  return (
    <div className="max-w-7xl mx-auto p-8 lg:p-12 flex flex-col lg:flex-row gap-12">
      {/* Main Column */}
      <div className="flex-1 space-y-12">
        {isPreview && (
          <div className="bg-amber-100 border border-amber-200 text-amber-800 p-6 rounded-[2rem] flex items-center justify-between">
            <span className="font-bold tracking-tight">You are viewing a historical revision.</span>
            <Link href={`/dashboard/review/${article.id}`} className="text-sm font-bold underline hover:no-underline">Return to Current</Link>
          </div>
        )}
        <div className="bg-white border border-stone-200 rounded-[2.5rem] p-10 md:p-16 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h1 className="text-[3rem] md:text-[4rem] font-sans font-bold tracking-tighter leading-[0.95] text-black mb-6">{displayTitle}</h1>
          <p className="text-stone-500 font-serif italic text-xl mb-12">By {article.author.name}</p>
          
          <div className="flex gap-6 text-sm text-stone-500 mb-12 border-b border-stone-200 pb-8">
            {article.category && <span className="bg-black text-white px-4 py-1.5 rounded-full font-bold uppercase tracking-wider">{article.category.name}</span>}
            <span className="flex items-center font-bold tracking-tight">{readTime} min read</span>
            <span className="flex items-center font-serif italic">Created: {new Date(article.createdAt).toLocaleString()}</span>
          </div>

          <div 
            className="prose prose-stone prose-xl max-w-none 
                       prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tighter prose-headings:text-black
                       prose-p:font-sans prose-p:leading-relaxed prose-p:tracking-tight prose-p:text-stone-800
                       prose-a:text-black prose-a:underline-offset-4 hover:prose-a:bg-black hover:prose-a:text-white prose-a:transition-all
                       prose-img:rounded-[2rem] prose-img:shadow-2xl
                       prose-blockquote:font-serif prose-blockquote:font-style-italic prose-blockquote:border-l-black prose-blockquote:text-stone-600 prose-blockquote:text-3xl prose-blockquote:leading-snug"
            dangerouslySetInnerHTML={{ __html: displayHtml }}
          />
        </div>

        <div className="bg-white border border-stone-200 rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h2 className="text-2xl font-bold tracking-tight mb-8 text-black">Revision History</h2>
          <div className="space-y-6">
            {article.revisions.map(rev => (
              <div key={rev.id} className="flex justify-between items-center border-b border-stone-100 pb-4 last:border-0">
                <div>
                  <p className="font-bold text-black text-lg">Version {rev.version}</p>
                  <p className="text-sm font-serif italic text-stone-500">{new Date(rev.createdAt).toLocaleString()}</p>
                </div>
                {revisionId === rev.id ? (
                  <span className="text-sm font-bold bg-stone-200 text-stone-600 px-4 py-2 rounded-full">Viewing</span>
                ) : (
                  <Link href={`/dashboard/review/${article.id}?rev=${rev.id}`} className="text-sm font-bold border border-stone-300 px-4 py-2 rounded-full hover:bg-black hover:text-white transition-colors">View →</Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className="w-full lg:w-96 space-y-8">
        <div className="bg-white border border-stone-200 rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h2 className="font-bold text-xl tracking-tight mb-6 text-black">Status & Actions</h2>
          <div className="mb-8">
            <span data-testid="article-status" className="px-4 py-2 bg-black text-white text-sm font-bold uppercase tracking-widest rounded-full">
              {article.status.replace('_', ' ')}
            </span>
            {article.scheduledAt && <p className="text-sm font-serif italic text-stone-500 mt-4">Scheduled for: {new Date(article.scheduledAt).toLocaleString()}</p>}
          </div>

          <ReviewActionsForm 
            articleId={article.id} 
            version={article.version} 
            status={article.status} 
            isAdmin={session.role === 'ADMIN'}
            canPublish={hasPermission(session.role, 'article:publish')}
            canSchedule={hasPermission(session.role, 'article:schedule')}
          />
        </div>

        <div className="bg-white border border-stone-200 rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h2 className="font-bold text-xl tracking-tight mb-6 text-black">Editorial Comments</h2>
          {article.comments.length === 0 ? (
            <p className="text-stone-500 font-serif italic">No comments yet.</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {article.comments.map(c => (
                <div key={c.id} className={`p-5 rounded-[1.5rem] ${c.visibility === 'INTERNAL' ? 'bg-amber-50 border border-amber-200' : 'bg-stone-50 border border-stone-100'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-black">{c.user.name}</span>
                    <span className="text-xs font-serif italic text-stone-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-stone-700 leading-relaxed">{c.content}</p>
                  <p className="text-[10px] mt-4 font-bold text-stone-400 uppercase tracking-widest">{c.visibility.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-stone-200 rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h2 className="font-bold text-xl tracking-tight mb-6 text-black">Audit Log (Recent)</h2>
          <div className="space-y-4">
            {auditLogs.map(log => (
              <div key={log.id} className="text-sm border-l-2 border-stone-200 pl-4 py-1">
                <span className="font-bold text-black">{log.action}</span> by <span className="font-serif italic text-stone-600">{log.actor?.name || 'System'}</span>
                <br /><span className="text-xs text-stone-400 mt-1 block">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
