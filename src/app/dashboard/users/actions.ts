'use server';

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/rbac';
import { Role, UserStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const UpdateAccessSchema = z.object({
  userId: z.string().uuid(),
  newRole: z.nativeEnum(Role),
  newStatus: z.nativeEnum(UserStatus)
});

export async function updateUserAccessAction(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (!session || !hasPermission(session.role, 'user:manage')) {
    return { success: false, error: 'Unauthorized', status: 403 };
  }

  const parsed = UpdateAccessSchema.safeParse({
    userId: formData.get('userId'),
    newRole: formData.get('newRole'),
    newStatus: formData.get('newStatus')
  });

  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message, status: 400 };
  const { userId, newRole, newStatus } = parsed.data;

  try {
    return await prisma.$transaction(async (tx) => {
      const targetUser = await tx.user.findUnique({ where: { id: userId } });
      if (!targetUser) return { success: false, error: 'User not found', status: 404 };

      // Prevent Admin lockout
      if (targetUser.role === Role.ADMIN && newRole !== Role.ADMIN) {
        const adminCount = await tx.user.count({ where: { role: Role.ADMIN, status: UserStatus.ACTIVE } });
        if (adminCount <= 1) {
          return { success: false, error: 'Cannot demote the last active Admin', status: 400 };
        }
      }

      // Prevent locking oneself
      if (userId === session.userId && newStatus !== UserStatus.ACTIVE) {
        return { success: false, error: 'You cannot deactivate your own account', status: 400 };
      }

      await tx.user.update({
        where: { id: userId },
        data: { role: newRole, status: newStatus }
      });

      await tx.auditLog.create({
        data: {
          actorId: session.userId,
          action: 'USER_ACCESS_UPDATED',
          entityType: 'User',
          entityId: userId,
          metadata: { 
            previousRole: targetUser.role, 
            newRole,
            previousStatus: targetUser.status,
            newStatus
          }
        }
      });

      revalidatePath('/dashboard/users');
      return { success: true };
    });
  } catch (err: any) {
    return { success: false, error: err.message, status: 500 };
  }
}
