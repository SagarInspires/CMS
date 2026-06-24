import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { logAuthEvent } from '@/lib/audit';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Verification Link</h1>
          <p className="text-gray-600 mb-6">This verification link is missing or malformed.</p>
          <Link href="/resend-verification" className="text-blue-600 hover:underline">
            Request a new verification link
          </Link>
        </div>
      </div>
    );
  }

  // Hash the incoming token
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    // Look up the token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!verificationToken) {
      return renderErrorState('This verification link is invalid or has already been used.');
    }

    if (verificationToken.consumedAt) {
      return renderErrorState('This verification link has already been used.');
    }

    if (verificationToken.expiresAt < new Date()) {
      await logAuthEvent({
        action: 'VERIFICATION_FAILED',
        entityId: verificationToken.userId,
        entityType: 'USER',
        metadata: { reason: 'token_expired' }
      });
      return renderErrorState('This verification link has expired.');
    }

    // Transactionally consume token and activate user
    await prisma.$transaction(async (tx) => {
      await tx.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { consumedAt: new Date() },
      });

      await tx.user.update({
        where: { id: verificationToken.userId },
        data: { status: 'ACTIVE' },
      });
    });

    await logAuthEvent({
      action: 'ACCOUNT_ACTIVATED',
      entityId: verificationToken.userId,
      entityType: 'USER',
      actorId: verificationToken.userId,
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return renderErrorState('An unexpected error occurred during verification. Please try again.');
  }

  // Success: Redirect to login with a success message query param
  redirect('/login?verified=true');
}

function renderErrorState(message: string) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <Link href="/resend-verification" className="text-blue-600 hover:underline">
          Request a new verification link
        </Link>
      </div>
    </div>
  );
}
