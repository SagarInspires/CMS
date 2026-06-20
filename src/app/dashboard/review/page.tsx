import { verifySession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/auth/rbac';
import { redirect } from 'next/navigation';

export default async function ReviewQueuePage() {
  const session = await verifySession();
  if (!session || !hasPermission(session.role, 'article:review')) {
    redirect('/dashboard');
  }

  const articles = await prisma.article.findMany({
    where: { status: 'IN_REVIEW' },
    include: { author: true },
    orderBy: { updatedAt: 'asc' }
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Editorial Review Queue</h1>

      <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground uppercase tracking-wider text-xs">
            <tr>
              <th className="p-4 font-semibold">Title</th>
              <th className="p-4 font-semibold">Author</th>
              <th className="p-4 font-semibold">Submitted Date</th>
              <th className="p-4 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {articles.map(article => (
              <tr key={article.id} className="hover:bg-muted/50 transition-colors">
                <td className="p-4 font-medium text-foreground">{article.title}</td>
                <td className="p-4 text-muted-foreground">{article.author.name}</td>
                <td className="p-4 text-muted-foreground">{new Date(article.updatedAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <a href={`/dashboard/review/${article.id}`} className="text-primary hover:underline font-medium">
                    Review
                  </a>
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-muted-foreground">
                  The review queue is currently empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
