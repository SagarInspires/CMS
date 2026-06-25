import { verifySession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/auth/rbac';
import { redirect } from 'next/navigation';
import { UserActionsForm } from './UserActionsForm';

export default async function UsersManagementPage() {
  const session = await verifySession();
  
  if (!session) redirect('/login');
  if (!hasPermission(session.role, 'user:manage')) {
    return (
      <div className="p-8 text-center text-destructive">
        <h1 className="text-2xl font-bold">403 Forbidden</h1>
        <p>You do not have permission to manage users.</p>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    }
  });

  return (
    <div className="p-12 md:p-16 h-full flex flex-col relative z-10 animate-fade-in-up">
      <header className="flex justify-between items-end mb-16 pb-12 border-b border-glass/[0.08]">
        <div>
          <h1 className="text-[3rem] md:text-[4rem] font-sans font-bold tracking-tighter leading-[0.95] text-foreground">
            User Management
          </h1>
        </div>
      </header>

      <div className="bg-glass/[0.02] backdrop-blur-xl rounded-[2rem] border border-glass/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-glass/[0.02] text-foreground/40 uppercase tracking-widest text-xs border-b border-glass/[0.05]">
            <tr>
              <th className="px-8 py-6 font-bold">User</th>
              <th className="px-8 py-6 font-bold">Email</th>
              <th className="px-8 py-6 font-bold">Joined</th>
              <th className="px-8 py-6 font-bold">Manage Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-glass/[0.05]">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-glass/[0.04] transition-colors group">
                <td className="px-8 py-6 font-bold text-lg tracking-tight text-foreground/90 group-hover:text-foreground transition-colors">
                  {user.name}
                  {session.userId === user.id && <span className="ml-3 text-[10px] bg-glass/[0.1] text-foreground px-3 py-1 rounded-full border border-glass/[0.2] uppercase tracking-widest font-bold">You</span>}
                </td>
                <td className="px-8 py-6 font-bold text-foreground/60 group-hover:text-foreground/80 transition-colors">{user.email}</td>
                <td className="px-8 py-6 font-serif italic text-foreground/40 group-hover:text-foreground/60 transition-colors">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-8 py-6">
                  <UserActionsForm userId={user.id} currentRole={user.role} currentStatus={user.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
