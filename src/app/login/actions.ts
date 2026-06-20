'use server';

import { prisma } from '@/lib/prisma';
import * as argon2 from 'argon2';
import { createSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(prevState: any, formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: 'Invalid input' };
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { error: 'Invalid credentials' };
    }

    const validPassword = await argon2.verify(user.passwordHash, password);
    if (!validPassword) {
      return { error: 'Invalid credentials' };
    }

    if (user.status !== 'ACTIVE') {
      return { error: 'Account is deactivated' };
    }

    await createSession(user.id, user.role);
    
  } catch (error) {
    return { error: 'Something went wrong. Please try again.' };
  }

  redirect('/dashboard');
}

export async function logout() {
  const { deleteSession } = await import('@/lib/auth/session');
  await deleteSession();
  redirect('/login');
}
