import { verifySession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/rbac';
import Link from 'next/link';
import { CustomCursor } from '@/components/CustomCursor';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  const canReview = session ? hasPermission(session.role, 'article:review') : false;
  const canManageUsers = session ? hasPermission(session.role, 'user:manage') : false;

  return (
    <>
      <CustomCursor />
      <div className="min-h-screen bg-stone-100 text-black font-sans selection:bg-black selection:text-white flex p-4 md:p-6 gap-6">
        
        {/* Floating Squircle Sidebar */}
        <aside className="w-64 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col overflow-hidden shrink-0 hidden md:flex border border-stone-200">
          <div className="p-8 pb-4">
            <Link href="/" className="inline-block">
              <div className="w-12 h-12 bg-black text-white rounded-[1rem] flex items-center justify-center hover:scale-105 transition-transform mb-8">
                <span className="font-serif font-bold italic text-xl tracking-tighter">e.</span>
              </div>
            </Link>
            <h2 className="font-bold text-lg tracking-tight mb-2">EditorialFlow</h2>
            <p className="text-sm font-serif italic text-stone-500">{session?.role}</p>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            <Link href="/dashboard" className="block px-4 py-3 text-sm font-bold tracking-tight rounded-[1rem] hover:bg-stone-100 transition-colors">
              Overview
            </Link>
            <Link href="/dashboard/articles" className="block px-4 py-3 text-sm font-bold tracking-tight rounded-[1rem] hover:bg-stone-100 transition-colors">
              My Articles
            </Link>
            <Link href="/dashboard/articles/new" className="block px-4 py-3 text-sm font-bold tracking-tight rounded-[1rem] bg-black text-white hover:bg-stone-800 transition-colors mt-4 text-center">
              New Draft +
            </Link>
            
            {canReview && (
              <div className="pt-8">
                <p className="px-4 text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Editorial</p>
                <Link href="/dashboard/review" className="block px-4 py-3 text-sm font-bold tracking-tight rounded-[1rem] hover:bg-stone-100 transition-colors">
                  Review Queue
                </Link>
              </div>
            )}

            {canManageUsers && (
              <div className="pt-8">
                <p className="px-4 text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Admin</p>
                <Link href="/dashboard/users" className="block px-4 py-3 text-sm font-bold tracking-tight rounded-[1rem] hover:bg-stone-100 transition-colors">
                  Manage Users
                </Link>
              </div>
            )}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-y-auto border border-stone-200 relative">
          {children}
        </main>
      </div>
    </>
  );
}
