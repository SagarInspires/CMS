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
    <div className="p-12 md:p-16 h-full flex flex-col relative z-10 animate-fade-in-up">
      <header className="flex justify-between items-end mb-16 pb-12 border-b border-white/[0.08]">
        <div>
          <h1 className="text-[3rem] md:text-[4rem] font-sans font-bold tracking-tighter leading-[0.95] text-white">
            Overview
          </h1>
          <p className="text-xl text-white/40 font-serif italic mt-4">
            Welcome back, {user?.name}.
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="px-6 py-3 rounded-full border border-white/[0.08] text-white/70 font-bold tracking-tight hover:bg-white/[0.05] hover:text-white transition-colors">
            Sign Out
          </button>
        </form>
      </header>
      
      <main className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Stat Card */}
        <div className="p-8 bg-white/[0.02] backdrop-blur-xl rounded-[2rem] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between aspect-square group hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(255,255,255,0.03)] hover:bg-white/[0.04] transition-all duration-500">
          <h2 className="text-xl font-bold tracking-tight text-white/60 group-hover:text-white/90 transition-colors">Active Drafts</h2>
          <div className="flex justify-between items-end">
             <p className="text-[6rem] font-sans font-bold tracking-tighter leading-none text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover:scale-105 transition-transform duration-500 origin-bottom-left">
               {draftsCount}
             </p>
             <Link href="/dashboard/articles" className="w-12 h-12 rounded-full bg-white/[0.1] border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               →
             </Link>
          </div>
        </div>

        {/* Stat Card */}
        <div className="p-8 bg-white/[0.02] backdrop-blur-xl rounded-[2rem] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between aspect-square group hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(255,255,255,0.03)] hover:bg-white/[0.04] transition-all duration-500" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-bold tracking-tight text-white/60 group-hover:text-white/90 transition-colors">Published</h2>
          <div className="flex justify-between items-end">
             <p className="text-[6rem] font-sans font-bold tracking-tighter leading-none text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover:scale-105 transition-transform duration-500 origin-bottom-left">
               {publishedCount}
             </p>
             <Link href={`/authors/${session.userId}`} className="w-12 h-12 rounded-full bg-white/[0.1] border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               →
             </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
