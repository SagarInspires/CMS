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
    <div className="max-w-7xl mx-auto p-8 lg:p-12 flex flex-col lg:flex-row gap-12 relative z-10 animate-fade-in-up">
      {/* Main Column */}
      <div className="flex-1 space-y-12">
        {isPreview && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-6 rounded-[2rem] flex items-center justify-between backdrop-blur-md">
            <span className="font-bold tracking-tight">You are viewing a historical revision.</span>
            <Link href={`/dashboard/review/${article.id}`} className="text-sm font-bold hover:text-amber-300 underline hover:no-underline transition-colors">Return to Current</Link>
          </div>
        )}
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[2.5rem] p-10 md:p-16 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <h1 className="text-[3rem] md:text-[4rem] font-sans font-bold tracking-tighter leading-[0.95] text-white mb-6">{displayTitle}</h1>
          <p className="text-white/40 font-serif italic text-xl mb-12">By {article.author.name}</p>
          
          <div className="flex gap-6 text-sm text-white/40 mb-12 border-b border-white/[0.08] pb-8">
            {article.category && <span className="bg-white/[0.1] border border-white/10 text-white px-4 py-1.5 rounded-full font-bold uppercase tracking-wider">{article.category.name}</span>}
            <span className="flex items-center font-bold tracking-tight text-white/60">{readTime} min read</span>
            <span className="flex items-center font-serif italic">Created: {new Date(article.createdAt).toLocaleString()}</span>
          </div>

          <div 
            className="prose prose-stone prose-xl max-w-none 
                       prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tighter prose-headings:text-white
                       prose-p:font-sans prose-p:leading-relaxed prose-p:tracking-tight prose-p:text-white/80
                       prose-a:text-white prose-a:underline-offset-4 hover:prose-a:bg-white/10 hover:prose-a:text-white prose-a:transition-all
                       prose-img:rounded-[2rem] prose-img:shadow-[0_0_40px_rgba(255,255,255,0.05)] prose-img:border prose-img:border-white/[0.08]
                       prose-blockquote:font-serif prose-blockquote:font-style-italic prose-blockquote:border-l-white/20 prose-blockquote:text-white/60 prose-blockquote:text-3xl prose-blockquote:leading-snug
                       prose-strong:text-white"
            dangerouslySetInnerHTML={{ __html: displayHtml }}
          />
        </div>

        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[2.5rem] p-10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <h2 className="text-2xl font-bold tracking-tight mb-8 text-white">Revision History</h2>
          <div className="space-y-6">
            {article.revisions.map(rev => (
              <div key={rev.id} className="flex justify-between items-center border-b border-white/[0.05] pb-4 last:border-0 group">
                <div>
                  <p className="font-bold text-white/90 text-lg group-hover:text-white transition-colors">Version {rev.version}</p>
                  <p className="text-sm font-serif italic text-white/40">{new Date(rev.createdAt).toLocaleString()}</p>
                </div>
                {revisionId === rev.id ? (
                  <span className="text-sm font-bold bg-white/[0.1] text-white px-4 py-2 rounded-full border border-white/20">Viewing</span>
                ) : (
                  <Link href={`/dashboard/review/${article.id}?rev=${rev.id}`} className="text-sm font-bold border border-white/[0.08] text-white/70 px-4 py-2 rounded-full hover:bg-white/[0.1] hover:text-white transition-colors">View →</Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className="w-full lg:w-96 space-y-8">
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[2.5rem] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <h2 className="font-bold text-xl tracking-tight mb-6 text-white">Status & Actions</h2>
          <div className="mb-8">
            <span data-testid="article-status" className="px-4 py-2 bg-gradient-to-r from-white to-white/90 text-black text-sm font-bold uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              {article.status.replace('_', ' ')}
            </span>
            {article.scheduledAt && <p className="text-sm font-serif italic text-white/40 mt-6">Scheduled for: {new Date(article.scheduledAt).toLocaleString()}</p>}
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

        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[2.5rem] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <h2 className="font-bold text-xl tracking-tight mb-6 text-white">Editorial Comments</h2>
          {article.comments.length === 0 ? (
            <p className="text-white/40 font-serif italic">No comments yet.</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {article.comments.map(c => (
                <div key={c.id} className={`p-5 rounded-[1.5rem] ${c.visibility === 'INTERNAL' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/[0.03] border border-white/[0.08]'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-bold ${c.visibility === 'INTERNAL' ? 'text-amber-400' : 'text-white/90'}`}>{c.user.name}</span>
                    <span className="text-xs font-serif italic text-white/40">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-white/70 leading-relaxed">{c.content}</p>
                  <p className={`text-[10px] mt-4 font-bold uppercase tracking-widest ${c.visibility === 'INTERNAL' ? 'text-amber-500/50' : 'text-white/30'}`}>{c.visibility.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[2.5rem] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <h2 className="font-bold text-xl tracking-tight mb-6 text-white">Audit Log (Recent)</h2>
          <div className="space-y-4">
            {auditLogs.map(log => (
              <div key={log.id} className="text-sm border-l-2 border-white/[0.08] pl-4 py-1">
                <span className="font-bold text-white/90">{log.action}</span> by <span className="font-serif italic text-white/60">{log.actor?.name || 'System'}</span>
                <br /><span className="text-xs text-white/30 mt-1 block">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
