import { verifySession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { logout } from '@/app/login/actions';
import { ArticleStatus } from '@prisma/client';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await verifySession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, role: true }
  });

  const draftsCount = await prisma.article.count({
    where: { authorId: session.userId, status: ArticleStatus.DRAFT }
  });

  const publishedCount = await prisma.article.count({
    where: { authorId: session.userId, status: ArticleStatus.PUBLISHED }
  });

  return (
    <div className="p-12 md:p-16 h-full flex flex-col">
      <header className="flex justify-between items-end mb-16 pb-12 border-b border-stone-200">
        <div>
          <h1 className="text-[3rem] md:text-[4rem] font-sans font-bold tracking-tighter leading-[0.95] text-black">
            Overview
          </h1>
          <p className="text-xl text-stone-500 font-serif italic mt-4">
            Welcome back, {user?.name}.
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="px-6 py-3 rounded-full border border-stone-300 font-bold tracking-tight hover:bg-black hover:text-white hover:border-black transition-colors">
            Sign Out
          </button>
        </form>
      </header>
      
      <main className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Stat Card */}
        <div className="p-8 bg-stone-100 rounded-[2rem] border border-stone-200 shadow-sm flex flex-col justify-between aspect-square group hover:-translate-y-2 transition-transform duration-500">
          <h2 className="text-xl font-bold tracking-tight text-stone-600">Active Drafts</h2>
          <div className="flex justify-between items-end">
             <p className="text-[6rem] font-sans font-bold tracking-tighter leading-none text-black">
               {draftsCount}
             </p>
             <Link href="/dashboard/articles" className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               →
             </Link>
          </div>
        </div>

        {/* Stat Card */}
        <div className="p-8 bg-stone-100 rounded-[2rem] border border-stone-200 shadow-sm flex flex-col justify-between aspect-square group hover:-translate-y-2 transition-transform duration-500">
          <h2 className="text-xl font-bold tracking-tight text-stone-600">Published</h2>
          <div className="flex justify-between items-end">
             <p className="text-[6rem] font-sans font-bold tracking-tighter leading-none text-black">
               {publishedCount}
             </p>
             <Link href={`/authors/${session.userId}`} className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               →
             </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
