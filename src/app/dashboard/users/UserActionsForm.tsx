'use client';

import { useActionState, useEffect, useState } from 'react';
import { updateUserAccessAction } from './actions';
import { Role, UserStatus } from '@prisma/client';

export function UserActionsForm({ userId, currentRole, currentStatus }: { userId: string, currentRole: Role, currentStatus: UserStatus }) {
  const [accessState, accessAction, isPending] = useActionState(updateUserAccessAction, null);
  
  const [role, setRole] = useState<Role>(currentRole);
  const [status, setStatus] = useState<UserStatus>(currentStatus);

  const [prevRole, setPrevRole] = useState(currentRole);
  const [prevStatus, setPrevStatus] = useState(currentStatus);

  // Synchronize state with server updates after revalidation during render
  if (currentRole !== prevRole || currentStatus !== prevStatus) {
    setPrevRole(currentRole);
    setPrevStatus(currentStatus);
    setRole(currentRole);
    setStatus(currentStatus);
  }

  return (
    <div className="flex flex-col gap-2 min-w-[300px]">
      {accessState?.error && (
        <div className="text-xs text-red-400 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-2 font-bold tracking-tight">
          {accessState.error}
        </div>
      )}

      <form action={accessAction} className="flex gap-3 items-center w-full">
        <input type="hidden" name="userId" value={userId} />
        
        <select 
          name="newRole" 
          value={role}
          onChange={e => setRole(e.target.value as Role)}
          disabled={isPending}
          className="text-sm p-2 bg-glass/[0.02] border border-glass/[0.08] rounded-xl text-foreground/80 focus:border-glass/[0.3] focus:bg-glass/[0.05] outline-none transition-all flex-1"
        >
          <option value="AUTHOR" className="bg-surface">Author</option>
          <option value="EDITOR" className="bg-surface">Editor</option>
          <option value="ADMIN" className="bg-surface">Admin</option>
        </select>

        <select 
          name="newStatus" 
          value={status}
          onChange={e => setStatus(e.target.value as UserStatus)}
          disabled={isPending}
          className={`text-sm p-2 border rounded-xl flex-1 outline-none transition-all ${status !== 'ACTIVE' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-glass/[0.02] text-foreground/80 border-glass/[0.08] focus:border-glass/[0.3] focus:bg-glass/[0.05]'}`}
        >
          <option value="ACTIVE" className="bg-surface">Active</option>
          <option value="INACTIVE" className="bg-surface">Inactive</option>
          <option value="LOCKED" className="bg-surface">Locked</option>
        </select>

        <button 
          type="submit" 
          disabled={isPending}
          className="text-sm px-4 py-2 bg-glass/[0.1] text-foreground border border-glass/[0.2] hover:bg-glass/[0.15] font-bold tracking-tight rounded-xl whitespace-nowrap disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving...' : 'Save Access'}
        </button>
      </form>
    </div>
  );
}
