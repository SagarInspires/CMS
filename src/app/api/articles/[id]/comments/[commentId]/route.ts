import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth/session';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, commentId } = await params;
    const body = await req.json();
    const { action } = body; // action can be 'resolve' or 'reopen'

    const article = await prisma.article.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    if (article.authorId !== session.userId && session.role !== 'ADMIN' && session.role !== 'EDITOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const comment = await prisma.editorialComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (action === 'resolve') {
      await prisma.editorialComment.updateMany({
        where: {
          OR: [
            { id: commentId },
            { parentId: commentId }
          ]
        },
        data: {
          resolvedAt: new Date(),
          resolverId: session.userId,
        }
      });
    } else if (action === 'reopen') {
      await prisma.editorialComment.updateMany({
        where: {
          OR: [
            { id: commentId },
            { parentId: commentId }
          ]
        },
        data: {
          resolvedAt: null,
          resolverId: null,
        }
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update Comment Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
