import { verifySession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/rbac';
import Link from 'next/link';
import { CustomCursor } from '@/components/CustomCursor';
import { ThemeToggle } from '@/components/ThemeToggle';

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
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground/20 selection:text-foreground flex p-4 md:p-6 gap-6 relative overflow-hidden">
        
        {/* --- Fluid Ethereal Background Blobs --- */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none fixed z-0">
          <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full mix-blend-screen filter blur-[150px] animate-blob"></div>
          <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full mix-blend-screen filter blur-[180px] animate-blob" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Floating Squircle Sidebar */}
        <aside className="relative z-10 w-64 bg-glass/[0.02] backdrop-blur-3xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden shrink-0 hidden md:flex border border-glass/[0.05]">
          <div className="p-8 pb-4">
            <Link href="/" className="inline-block">
              <div className="w-12 h-12 bg-glass/[0.05] border border-glass/[0.1] text-foreground rounded-[1rem] flex items-center justify-center hover:scale-105 transition-transform mb-8 shadow-[0_0_20px_rgba(var(--glass-base),0.05)]">
                <span className="font-serif font-bold italic text-xl tracking-tighter">e.</span>
              </div>
            </Link>
            <h2 className="font-bold text-lg tracking-tight mb-2 text-foreground/90">EditorialFlow</h2>
            <p className="text-sm font-serif italic text-foreground/40 uppercase tracking-widest">{session?.role}</p>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            <Link href="/dashboard" className="block px-4 py-3 text-sm font-bold tracking-tight rounded-[1rem] hover:bg-glass/[0.05] text-foreground/70 hover:text-foreground transition-colors">
              Overview
            </Link>
            <Link href="/dashboard/articles" className="block px-4 py-3 text-sm font-bold tracking-tight rounded-[1rem] hover:bg-glass/[0.05] text-foreground/70 hover:text-foreground transition-colors">
              My Articles
            </Link>
            <Link href="/dashboard/articles/new" className="block px-4 py-3 text-sm font-bold tracking-tight rounded-[1rem] bg-gradient-to-r from-foreground to-foreground/90 text-background hover:scale-[1.02] transition-transform mt-4 text-center shadow-[0_0_20px_rgba(var(--glass-base),0.2)]">
              New Draft +
            </Link>
            
            {canReview && (
              <div className="pt-8">
                <p className="px-4 text-xs font-bold text-foreground/30 uppercase tracking-widest mb-3">Editorial</p>
                <Link href="/dashboard/review" className="block px-4 py-3 text-sm font-bold tracking-tight rounded-[1rem] hover:bg-glass/[0.05] text-foreground/70 hover:text-foreground transition-colors">
                  Review Queue
                </Link>
              </div>
            )}

            {canManageUsers && (
              <div className="pt-8">
                <p className="px-4 text-xs font-bold text-foreground/30 uppercase tracking-widest mb-3">Admin</p>
                <Link href="/dashboard/users" className="block px-4 py-3 text-sm font-bold tracking-tight rounded-[1rem] hover:bg-glass/[0.05] text-foreground/70 hover:text-foreground transition-colors">
                  Manage Users
                </Link>
              </div>
            )}
          </nav>
          
          <div className="px-8 pb-4">
            <ThemeToggle />
          </div>

          {/* Footer Credit */}
          <div className="p-8 pt-4 border-t border-glass/[0.05] mt-auto">
            <p className="text-xs font-serif italic text-foreground/40 text-center">
              Made with <span className="text-red-500">♥</span> by Sagar Kumar
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="relative z-10 flex-1 bg-surface rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-y-auto border border-glass/[0.05]">
          {children}
        </main>
      </div>
    </>
  );
}
