import { verifySession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/rbac';
import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  const canReview = session ? hasPermission(session.role, 'article:review') : false;
  const canManageUsers = session ? hasPermission(session.role, 'user:manage') : false;

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-card border-r flex flex-col shadow-sm">
        <div className="p-6 border-b">
          <h2 className="font-extrabold text-2xl text-primary tracking-tight">EditorialFlow</h2>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/dashboard" className="block px-3 py-2 text-sm font-medium rounded-md hover:bg-accent text-foreground">Dashboard</Link>
          <Link href="/dashboard/articles" className="block px-3 py-2 text-sm font-medium rounded-md hover:bg-accent text-foreground">My Articles</Link>
          <Link href="/dashboard/articles/new" className="block px-3 py-2 text-sm font-semibold rounded-md hover:bg-primary/10 text-primary">Write New</Link>
          
          {canReview && (
            <div className="pt-6 mt-2">
              <p className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Editorial</p>
              <Link href="/dashboard/review" className="block px-3 py-2 text-sm font-medium rounded-md hover:bg-accent text-foreground">Review Queue</Link>
            </div>
          )}

          {canManageUsers && (
            <div className="pt-6 mt-2">
              <p className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Admin</p>
              <Link href="/dashboard/users" className="block px-3 py-2 text-sm font-medium rounded-md hover:bg-accent text-foreground">Manage Users</Link>
            </div>
          )}
        </nav>
      </aside>
      <main className="flex-1 bg-muted/20 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
