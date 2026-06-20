import { verifySession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/auth/rbac';
import { notFound, redirect } from 'next/navigation';
import { ReviewActionsForm } from './ReviewActionsForm';

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  if (!session || (!hasPermission(session.role, 'article:review') && !hasPermission(session.role, 'article:publish'))) {
    notFound();
  }

  const { id } = await params;

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

  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: 'Article', entityId: article.id },
    include: { actor: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  const words = article.sanitizedHtml.replace(/<[^>]+>/g, '').split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(words / 200));

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
      {/* Main Column */}
      <div className="flex-1 space-y-8">
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-foreground">{article.title}</h1>
          <p className="text-muted-foreground mb-6">By {article.author.name} ({article.author.email})</p>
          
          <div className="flex gap-4 text-sm text-muted-foreground mb-8 border-b pb-4">
            {article.category && <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded">{article.category.name}</span>}
            <span>{readTime} min read</span>
            <span>Created: {new Date(article.createdAt).toLocaleString()}</span>
          </div>

          <div 
            className="prose prose-sm md:prose-base dark:prose-invert max-w-none focus:outline-none"
            dangerouslySetInnerHTML={{ __html: article.sanitizedHtml }}
          />
        </div>

        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-foreground">Revision History</h2>
          <div className="space-y-4">
            {article.revisions.map(rev => (
              <div key={rev.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                <div>
                  <p className="font-semibold text-foreground">Version {rev.version}</p>
                  <p className="text-xs text-muted-foreground">{new Date(rev.createdAt).toLocaleString()}</p>
                </div>
                <button className="text-sm text-muted-foreground" disabled>View (Coming Soon)</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className="w-full lg:w-96 space-y-6">
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4 text-foreground">Status & Actions</h2>
          <div className="mb-6">
            <span data-testid="article-status" className="px-3 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full border">
              {article.status.replace('_', ' ')}
            </span>
            {article.scheduledAt && <p className="text-xs text-muted-foreground mt-2">Scheduled for: {new Date(article.scheduledAt).toLocaleString()}</p>}
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

        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4 text-foreground">Editorial Comments</h2>
          {article.comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {article.comments.map(c => (
                <div key={c.id} className={`p-3 rounded-md text-sm ${c.visibility === 'INTERNAL' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-muted'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-foreground">{c.user.name}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-foreground/80">{c.content}</p>
                  <p className="text-[10px] mt-2 font-mono text-muted-foreground uppercase">{c.visibility.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4 text-foreground">Audit Log (Recent)</h2>
          <div className="space-y-3">
            {auditLogs.map(log => (
              <div key={log.id} className="text-xs">
                <span className="font-semibold text-foreground">{log.action}</span> by {log.actor?.name || 'System'}
                <br /><span className="text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
