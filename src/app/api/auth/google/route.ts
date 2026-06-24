import { NextRequest, NextResponse } from 'next/server';
import { googleVerifier } from '@/lib/auth/google';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth/session';
import { logAuthEvent } from '@/lib/audit';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const credential = formData.get('credential');
    const csrfTokenBody = formData.get('g_csrf_token');
    const csrfTokenCookie = req.cookies.get('g_csrf_token')?.value;

    // 1. Double-Submit CSRF Verification
    if (!csrfTokenCookie) {
      return redirectWithError('No CSRF token in cookie.');
    }
    if (!csrfTokenBody) {
      return redirectWithError('No CSRF token in post body.');
    }
    
    // Timing-safe comparison
    if (csrfTokenCookie.length !== csrfTokenBody.toString().length || 
        !crypto.timingSafeEqual(Buffer.from(csrfTokenCookie), Buffer.from(csrfTokenBody.toString()))) {
      return redirectWithError('Failed to verify double submit cookie.');
    }

    if (!credential || typeof credential !== 'string') {
      return redirectWithError('Missing Google credential.');
    }

    // 2. Verify Google Token securely on the server
    const identity = await googleVerifier.verify(credential);
    
    // 3. Database operations
    // First check if this external identity already exists
    let user = await prisma.user.findFirst({
      where: {
        externalIdentities: {
          some: {
            provider: 'GOOGLE',
            providerAccountId: identity.sub
          }
        }
      }
    });

    if (user) {
      // Flow A: Existing Linked Identity
      if (user.status !== 'ACTIVE' && user.status !== 'PENDING_VERIFICATION') {
        await logAuthEvent({ action: 'GOOGLE_LOGIN_FAILED', entityId: user.id, actorId: user.id, metadata: { reason: 'deactivated' } });
        return redirectWithError('Account is deactivated or locked.');
      }

      await logAuthEvent({ action: 'GOOGLE_LOGIN_SUCCEEDED', entityId: user.id, actorId: user.id });
      await createSession(user.id, user.role);
      
    } else {
      // Flow B: New Google Identity or Email Collision
      
      // Check if email already exists
      const existingEmailUser = await prisma.user.findUnique({
        where: { email: identity.email }
      });

      if (existingEmailUser) {
        // Do NOT automatically link. This prevents hijack via unverified Google accounts if Google ever messed up, 
        // but more importantly prevents Admin account hijacking if they used the same email.
        await logAuthEvent({ 
          action: 'GOOGLE_LOGIN_FAILED', 
          entityId: existingEmailUser.id, 
          metadata: { reason: 'unlinked_email_collision' } 
        });
        
        return redirectWithError(
          'An account with this email already exists. Please log in with your password and link Google from your security settings.'
        );
      }

      // Safe to create new user and external identity transactionally
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name: identity.name || 'Author',
            email: identity.email,
            passwordHash: null,
            role: 'AUTHOR', // Strict assignment
            status: 'ACTIVE', // Google verified the email
          }
        });

        await tx.externalIdentity.create({
          data: {
            provider: 'GOOGLE',
            providerAccountId: identity.sub,
            userId: newUser.id
          }
        });

        return newUser;
      });

      await logAuthEvent({ action: 'GOOGLE_SIGNUP_SUCCEEDED', entityId: user.id, actorId: user.id });
      await createSession(user.id, user.role);
    }

    // Success, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', req.url), 303);

  } catch (error: any) {
    console.error('Google callback error:', error);
    return redirectWithError(error.message || 'Authentication failed.');
  }

  function redirectWithError(errorMsg: string) {
    const url = new URL('/login', req.url);
    url.searchParams.set('error', errorMsg);
    return NextResponse.redirect(url, 303);
  }
}
