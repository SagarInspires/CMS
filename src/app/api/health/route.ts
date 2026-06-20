import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Perform a simple query to verify database connection
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', database: 'connected' }, { status: 200 });
  } catch (error) {
    // Do not leak internal error details or stack traces
    return NextResponse.json({ status: 'error', database: 'disconnected' }, { status: 503 });
  }
}
