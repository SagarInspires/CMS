import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { Role } from '@prisma/client';

let cachedJwtSecret: Uint8Array | undefined;

function getJwtSecret(): Uint8Array {
  if (cachedJwtSecret) {
    return cachedJwtSecret;
  }

  const value = process.env.JWT_SECRET;

  if (!value) {
    throw new Error('JWT_SECRET is required at runtime.');
  }

  if (process.env.NODE_ENV === 'production' && value.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters in production.');
  }

  cachedJwtSecret = new TextEncoder().encode(value);
  return cachedJwtSecret;
}

export type SessionPayload = {
  userId: string;
  role: Role;
  expiresAt: Date;
};

export async function encrypt(payload: any, expiresIn: string) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecret());
}

export async function decrypt(session: string | undefined) {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, getJwtSecret(), {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function createSession(userId: string, role: Role) {
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
  const session = await encrypt({ userId, role, expiresAt }, '15m');

  (await cookies()).set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteSession() {
  (await cookies()).delete('session');
}

export async function verifySession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  
  if (!sessionCookie) return null;

  const session = await decrypt(sessionCookie);

  if (!session?.userId) {
    return null;
  }

  return { isAuth: true, userId: session.userId, role: session.role };
}
