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
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
      </div>

      <div className="bg-card border rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-muted text-muted-foreground uppercase tracking-wider text-xs">
            <tr>
              <th className="p-4 font-semibold">User</th>
              <th className="p-4 font-semibold">Email</th>
              <th className="p-4 font-semibold">Joined</th>
              <th className="p-4 font-semibold">Manage Access</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                <td className="p-4 font-medium text-foreground">
                  {user.name}
                  {session.userId === user.id && <span className="ml-2 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">You</span>}
                </td>
                <td className="p-4 text-muted-foreground">{user.email}</td>
                <td className="p-4 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
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
