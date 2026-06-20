import { verifySession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { logout } from '@/app/login/actions';

export default async function DashboardPage() {
  const session = await verifySession();
  
  if (!session) return null; // Middleware handles redirect

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, role: true }
  });

  return (
    <div className="min-h-screen bg-background p-8">
      <header className="flex justify-between items-center mb-8 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name} ({user?.role})</p>
        </div>
        <form action={logout}>
          <button type="submit" className="px-4 py-2 bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20">
            Logout
          </button>
        </form>
      </header>
      
      <main className="grid gap-6 md:grid-cols-3">
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-2">My Drafts</h2>
          <p className="text-3xl font-bold text-primary">0</p>
        </div>
      </main>
    </div>
  );
}
