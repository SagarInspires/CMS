import { verifySession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function ArticlesPage() {
  const session = await verifySession();
  if (!session) return null;

  const articles = await prisma.article.findMany({
    where: { authorId: session.userId },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Articles</h1>
        <Link href="/dashboard/articles/new" className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium shadow-sm hover:opacity-90">
          Write New
        </Link>
      </div>

      <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground uppercase tracking-wider text-xs">
            <tr>
              <th className="p-4 font-semibold">Title</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Last Updated</th>
              <th className="p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {articles.map(article => (
              <tr key={article.id} className="hover:bg-muted/50 transition-colors">
                <td className="p-4 font-medium text-foreground">{article.title}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full font-medium border">
                    {article.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">{new Date(article.updatedAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <Link href={`/dashboard/articles/${article.id}/edit`} className="text-primary hover:underline font-medium">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-muted-foreground">
                  No articles found. Click &quot;Write New&quot; to get started!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
