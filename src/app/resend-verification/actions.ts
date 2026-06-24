'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rate-limit';
import { emailProvider } from '@/lib/email';
import { logAuthEvent } from '@/lib/audit';

const resendSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

export async function resendVerification(prevState: any, formData: FormData) {
  const rawEmail = formData.get('email');
  const identifier = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : 'anonymous_resend';

  // 1. Strict rate limiting for resends
  const rateLimitResult = await rateLimit(`resend_${identifier}`, 3, 60 * 60 * 1000); // 3 per hour
  if (!rateLimitResult.success) {
    return { error: 'Too many resend requests. Please try again later.' };
  }

  const parsed = resendSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: 'Invalid email address' };
  }

  const { email } = parsed.data;
  const genericSuccessMessage = 'If an unverified account exists for this email, a new verification link has been sent.';

  try {
    // 2. Look up user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, status: true },
    });

    // 3. Security: generic success even if user missing or already active
    if (!user || user.status !== 'PENDING_VERIFICATION') {
      return { success: true, message: genericSuccessMessage };
    }

    // 4. Invalidate old active tokens (consume them)
    await prisma.emailVerificationToken.updateMany({
      where: { 
        userId: user.id,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      }
    });

    // 5. Issue new token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // 6. Audit Logging
    await logAuthEvent({
      action: 'VERIFICATION_RESENT',
      entityId: user.id,
      entityType: 'USER',
      actorId: user.id,
    });

    // 5. Send Verification Email
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

    return { success: true, message: genericSuccessMessage };

  } catch (error) {
    console.error('Resend verification error:', error);
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}
