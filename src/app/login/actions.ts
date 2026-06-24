'use server';

import { prisma } from '@/lib/prisma';
import * as argon2 from 'argon2';
import { createSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { logAuthEvent } from '@/lib/audit';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(prevState: any, formData: FormData) {
  const rawEmail = formData.get('email');
  const identifier = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : 'anonymous_login';

  // 1. Rate Limiting for Login
  const rateLimitResult = await rateLimit(`login_${identifier}`, 10, 15 * 60 * 1000); // 10 per 15 mins
  if (!rateLimitResult.success) {
    return { error: 'Too many login attempts. Please try again later.' };
  }

  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: 'Invalid input' };
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      await logAuthEvent({ action: 'LOGIN_FAILED', entityId: email, entityType: 'EMAIL', metadata: { reason: 'user_not_found' } });
      return { error: 'Invalid credentials' };
    }

    if (!user.passwordHash) {
      await logAuthEvent({ action: 'LOGIN_FAILED', entityId: user.id, actorId: user.id, metadata: { reason: 'google_only_account' } });
      return { error: 'Please sign in with Google.' };
    }

    const validPassword = await argon2.verify(user.passwordHash, password);
    if (!validPassword) {
      await logAuthEvent({ action: 'LOGIN_FAILED', entityId: user.id, actorId: user.id, metadata: { reason: 'invalid_password' } });
      return { error: 'Invalid credentials' };
    }

    if (user.status === 'PENDING_VERIFICATION') {
      await logAuthEvent({ action: 'LOGIN_FAILED', entityId: user.id, actorId: user.id, metadata: { reason: 'unverified' } });
      return { 
        error: 'Please verify your email address before logging in.',
        needsVerification: true // Signal UI to show resend link
      };
    }

    if (user.status !== 'ACTIVE') {
      await logAuthEvent({ action: 'LOGIN_FAILED', entityId: user.id, actorId: user.id, metadata: { reason: 'deactivated' } });
      return { error: 'Account is deactivated or locked' };
    }

    await logAuthEvent({ action: 'LOGIN_SUCCESS', entityId: user.id, actorId: user.id });
    await createSession(user.id, user.role);
    
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Something went wrong. Please try again.' };
  }

  redirect('/dashboard');
}

export async function logout() {
  const { deleteSession } = await import('@/lib/auth/session');
  await deleteSession();
  redirect('/login');
}
