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
        <div className="text-xs text-destructive p-2 bg-destructive/10 rounded mb-2">
          {accessState.error}
        </div>
      )}

      <form action={accessAction} className="flex gap-2 items-center w-full">
        <input type="hidden" name="userId" value={userId} />
        
        <select 
          name="newRole" 
          value={role}
          onChange={e => setRole(e.target.value as Role)}
          disabled={isPending}
          className="text-sm p-1.5 border rounded bg-background flex-1"
        >
          <option value="AUTHOR">Author</option>
          <option value="EDITOR">Editor</option>
          <option value="ADMIN">Admin</option>
        </select>

        <select 
          name="newStatus" 
          value={status}
          onChange={e => setStatus(e.target.value as UserStatus)}
          disabled={isPending}
          className={`text-sm p-1.5 border rounded flex-1 ${status !== 'ACTIVE' ? 'bg-destructive/10 text-destructive' : 'bg-background'}`}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="LOCKED">Locked</option>
        </select>

        <button 
          type="submit" 
          disabled={isPending}
          className="text-sm p-1.5 bg-primary text-primary-foreground rounded whitespace-nowrap disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save Access'}
        </button>
      </form>
    </div>
  );
}
