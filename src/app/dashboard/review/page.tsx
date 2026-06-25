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
    <div className="p-12 md:p-16 h-full flex flex-col">
      <header className="flex justify-between items-end mb-16 pb-12 border-b border-stone-200">
        <div>
          <h1 className="text-[3rem] md:text-[4rem] font-sans font-bold tracking-tighter leading-[0.95] text-black">
            Review Queue
          </h1>
          <p className="text-xl text-stone-500 font-serif italic mt-4">
            {articles.length} drafts awaiting editorial approval.
          </p>
        </div>
      </header>

      <div className="bg-white rounded-[2rem] border border-stone-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-500 uppercase tracking-widest text-xs">
            <tr>
              <th className="px-8 py-6 font-bold">Title</th>
              <th className="px-8 py-6 font-bold">Author</th>
              <th className="px-8 py-6 font-bold">Submitted Date</th>
              <th className="px-8 py-6 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {articles.map(article => (
              <tr key={article.id} className="hover:bg-stone-50 transition-colors group cursor-pointer">
                <td className="px-8 py-6 font-bold text-lg tracking-tight text-black">
                  <Link href={`/dashboard/review/${article.id}`} className="block">
                    {article.title}
                  </Link>
                </td>
                <td className="px-8 py-6 font-bold text-stone-600">
                  {article.author.name}
                </td>
                <td className="px-8 py-6 font-serif italic text-stone-500">
                  {new Date(article.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-8 py-6 text-right">
                  <Link href={`/dashboard/review/${article.id}`} className="text-black font-bold tracking-tight hover:underline">
                    Review →
                  </Link>
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-24 text-center">
                  <h3 className="text-2xl font-serif italic text-stone-400 mb-4">The queue is currently empty.</h3>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
