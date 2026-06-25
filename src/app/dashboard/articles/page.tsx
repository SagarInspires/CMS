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
    <div className="p-12 md:p-16 h-full flex flex-col">
      <header className="flex justify-between items-end mb-16 pb-12 border-b border-stone-200">
        <div>
          <h1 className="text-[3rem] md:text-[4rem] font-sans font-bold tracking-tighter leading-[0.95] text-black">
            My Drafts
          </h1>
        </div>
        <Link href="/dashboard/articles/new" className="px-6 py-3 bg-black text-white rounded-full font-bold tracking-tight hover:scale-105 transition-transform">
          New Draft +
        </Link>
      </header>

      <div className="bg-white rounded-[2rem] border border-stone-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-500 uppercase tracking-widest text-xs">
            <tr>
              <th className="px-8 py-6 font-bold">Title</th>
              <th className="px-8 py-6 font-bold">Status</th>
              <th className="px-8 py-6 font-bold">Last Updated</th>
              <th className="px-8 py-6 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {articles.map(article => (
              <tr key={article.id} className="hover:bg-stone-50 transition-colors group cursor-pointer">
                <td className="px-8 py-6 font-bold text-lg tracking-tight text-black">
                  <Link href={`/dashboard/articles/${article.id}/edit`} className="block">
                    {article.title}
                  </Link>
                </td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1.5 bg-stone-200 text-stone-600 text-xs rounded-full font-bold uppercase tracking-wider">
                    {article.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-8 py-6 font-serif italic text-stone-500">
                  {new Date(article.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-8 py-6 text-right">
                  <Link href={`/dashboard/articles/${article.id}/edit`} className="text-black font-bold tracking-tight hover:underline">
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-24 text-center">
                  <h3 className="text-2xl font-serif italic text-stone-400 mb-4">No drafts found.</h3>
                  <Link href="/dashboard/articles/new" className="text-black font-bold tracking-tight underline underline-offset-4">
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
