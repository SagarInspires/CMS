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
    <div className="p-12 md:p-16 h-full flex flex-col relative z-10 animate-fade-in-up">
      <header className="flex justify-between items-end mb-16 pb-12 border-b border-glass/[0.08]">
        <div>
          <h1 className="text-[3rem] md:text-[4rem] font-sans font-bold tracking-tighter leading-[0.95] text-foreground">
            My Drafts
          </h1>
        </div>
        <Link href="/dashboard/articles/new" className="px-6 py-3 bg-gradient-to-r from-foreground to-foreground/90 text-background rounded-full font-bold tracking-tight hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(var(--glass-base),0.2)]">
          New Draft +
        </Link>
      </header>

      <div className="bg-glass/[0.02] backdrop-blur-xl rounded-[2rem] border border-glass/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-glass/[0.02] text-foreground/40 uppercase tracking-widest text-xs border-b border-glass/[0.05]">
            <tr>
              <th className="px-8 py-6 font-bold">Title</th>
              <th className="px-8 py-6 font-bold">Status</th>
              <th className="px-8 py-6 font-bold">Last Updated</th>
              <th className="px-8 py-6 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-glass/[0.05]">
            {articles.map(article => (
              <tr key={article.id} className="hover:bg-glass/[0.04] transition-colors group cursor-pointer">
                <td className="px-8 py-6 font-bold text-lg tracking-tight text-foreground/90 group-hover:text-foreground transition-colors">
                  <Link href={`/dashboard/articles/${article.id}/edit`} className="block">
                    {article.title}
                  </Link>
                </td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1.5 bg-glass/[0.08] text-foreground text-xs rounded-full font-bold uppercase tracking-wider border border-glass/[0.05]">
                    {article.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-8 py-6 font-serif italic text-foreground/40 group-hover:text-foreground/60 transition-colors">
                  {new Date(article.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-8 py-6 text-right">
                  <Link href={`/dashboard/articles/${article.id}/edit`} className="text-foreground/70 font-bold tracking-tight hover:text-foreground hover:underline transition-colors">
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-24 text-center">
                  <h3 className="text-2xl font-serif italic text-foreground/30 mb-4">No drafts found.</h3>
                  <Link href="/dashboard/articles/new" className="text-foreground font-bold tracking-tight hover:underline underline-offset-4 transition-colors">
                    Start writing
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
