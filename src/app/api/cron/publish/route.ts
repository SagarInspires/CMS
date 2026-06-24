import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ArticleStatus } from '@prisma/client';

import crypto from 'crypto';

function getCronSecret(): string {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw new Error('CRON_SECRET is required at runtime.');
  }
  return secret;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  
  let expectedSecret: string;
  try {
    expectedSecret = getCronSecret();
  } catch (error) {
    // Return a safe server error without exposing the secret
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  
  if (
    token.length !== expectedSecret.length ||
    !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedSecret))
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const scheduledArticles = await prisma.article.findMany({
      where: {
        status: ArticleStatus.SCHEDULED,
        scheduledAt: { lte: new Date() }
      }
    });

    for (const article of scheduledArticles) {
      await prisma.$transaction(async (tx) => {
        await tx.article.update({
          where: { id: article.id },
          data: { 
            status: ArticleStatus.PUBLISHED,
            publishedAt: new Date(),
          }
        });

        await tx.auditLog.create({
          data: {
            action: 'ARTICLE_PUBLISHED_CRON',
            entityType: 'Article',
            entityId: article.id,
          }
        });
      });
    }

    return NextResponse.json({ publishedCount: scheduledArticles.length });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to run cron job' }, { status: 500 });
  }
}
