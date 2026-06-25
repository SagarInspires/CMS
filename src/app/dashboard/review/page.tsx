import { verifySession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/auth/rbac';
import { redirect } from 'next/navigation';
import Link from 'next/link';

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
    <div className="p-12 md:p-16 h-full flex flex-col relative z-10 animate-fade-in-up">
      <header className="flex justify-between items-end mb-16 pb-12 border-b border-white/[0.08]">
        <div>
          <h1 className="text-[3rem] md:text-[4rem] font-sans font-bold tracking-tighter leading-[0.95] text-white">
            Review Queue
          </h1>
          <p className="text-xl text-white/40 font-serif italic mt-4">
            {articles.length} drafts awaiting editorial approval.
          </p>
        </div>
      </header>

      <div className="bg-white/[0.02] backdrop-blur-xl rounded-[2rem] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.02] text-white/40 uppercase tracking-widest text-xs border-b border-white/[0.05]">
            <tr>
              <th className="px-8 py-6 font-bold">Title</th>
              <th className="px-8 py-6 font-bold">Author</th>
              <th className="px-8 py-6 font-bold">Submitted Date</th>
              <th className="px-8 py-6 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {articles.map(article => (
              <tr key={article.id} className="hover:bg-white/[0.04] transition-colors group cursor-pointer">
                <td className="px-8 py-6 font-bold text-lg tracking-tight text-white/90 group-hover:text-white transition-colors">
                  <Link href={`/dashboard/review/${article.id}`} className="block">
                    {article.title}
                  </Link>
                </td>
                <td className="px-8 py-6 font-bold text-white/60 group-hover:text-white/80 transition-colors">
                  {article.author.name}
                </td>
                <td className="px-8 py-6 font-serif italic text-white/40 group-hover:text-white/60 transition-colors">
                  {new Date(article.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-8 py-6 text-right">
                  <Link href={`/dashboard/review/${article.id}`} className="text-white/70 font-bold tracking-tight hover:text-white hover:underline transition-colors">
                    Review →
                  </Link>
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-24 text-center">
                  <h3 className="text-2xl font-serif italic text-white/30 mb-4">The queue is currently empty.</h3>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
