'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import * as argon2 from 'argon2';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rate-limit';
import { emailProvider } from '@/lib/email';
import { logAuthEvent } from '@/lib/audit';

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().toLowerCase().email("Invalid email address").max(255),
  password: z.string()
    .min(12, "Password must be at least 12 characters")
    .max(100, "Password is too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function registerUser(prevState: any, formData: FormData) {
  // 1. Rate Limiting based on IP (In a real app, use headers().get('x-forwarded-for'))
  // Since we don't have access to the real IP easily in a Server Action without headers(), 
  // we'll rate limit based on a generic 'signup_ip' bucket or the normalized email if provided.
  const rawName = formData.get('name') as string || '';
  const rawEmail = formData.get('email') as string || '';
  const identifier = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : 'anonymous_signup';
  
  const safeFields = { name: rawName, email: rawEmail };

  const rateLimitResult = await rateLimit(`signup_${identifier}`, 5, 15 * 60 * 1000); // 5 attempts per 15 mins
  if (!rateLimitResult.success) {
    return { ...safeFields, error: 'Too many registration attempts. Please try again later.' };
  }

  // 2. Input Validation
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    // Return the first error for simplicity, or handle a map in the UI
    const firstError = Object.values(errors).flat()[0];
    return { ...safeFields, error: firstError || 'Invalid input parameters' };
  }

  const { name, email, password } = parsed.data;

  try {
    // 3. Duplicate Email Check
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, status: true }
    });

    if (existingUser) {
      // Security: Do not reveal if email is taken. Return generic success message.
      await logAuthEvent({
        action: 'REGISTRATION_REQUESTED',
        entityId: email,
        entityType: 'EMAIL',
        metadata: { outcome: 'duplicate_silently_ignored' }
      });
      return { success: true, message: 'If this email can be registered, verification instructions have been sent.' };
    }

    // 4. Hash Password
    const passwordHash = await argon2.hash(password);

    // 5. Generate secure verification token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // 6. Transactionally create user and token
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'AUTHOR', // ALWAYS enforce AUTHOR role for public signup
          status: 'PENDING_VERIFICATION', // NEVER verify automatically
        },
      });

      await tx.emailVerificationToken.create({
        data: {
          userId: newUser.id,
          tokenHash,
          expiresAt,
        },
      });

      return newUser;
    });

    // 7. Audit Logging
    await logAuthEvent({
      action: 'REGISTRATION_REQUESTED',
      entityId: user.id,
      entityType: 'USER',
      actorId: user.id,
      metadata: { role: 'AUTHOR' }
    });

    // 8. Send Verification Email
    let appUrl = process.env.APP_URL;
    if (!appUrl) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('CRITICAL: APP_URL must be configured in production for secure email links.');
      }
      appUrl = 'http://localhost:3000';
    }
    const verificationUrl = `${appUrl}/verify-email?token=${rawToken}`;
    
    await emailProvider.sendVerificationEmail({
      recipient: email,
      verificationUrl,
    });

    return { success: true, message: 'If this email can be registered, verification instructions have been sent.' };
    
  } catch (error) {
    console.error('Registration error:', error);
    return { ...safeFields, error: 'An unexpected error occurred during registration. Please try again.' };
  }
}
