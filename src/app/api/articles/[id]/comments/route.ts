import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth/session';
import { sanitizeHtml } from '@/lib/sanitizer';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the article to check RBAC
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

    // Fetch all comments for this article, ordered by creation
    const comments = await prisma.editorialComment.findMany({
      where: { articleId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { name: true } },
      },
    });

    // Format threads: root comments and their replies
    const threads: any = {};
    const replies: any[] = [];

    for (const comment of comments) {
      if (comment.parentId) {
        replies.push(comment);
      } else {
        threads[comment.nodeId || comment.id] = {
          id: comment.nodeId || comment.id,
          dbId: comment.id,
          text: typeof comment.textRange === 'string' ? comment.textRange : (comment.textRange ? JSON.stringify(comment.textRange) : ''),
          replies: [
            {
              id: comment.id,
              author: comment.user.name,
              content: comment.content,
              createdAt: comment.createdAt.toISOString(),
              resolved: !!comment.resolvedAt
            }
          ],
          resolved: !!comment.resolvedAt
        };
      }
    }

    for (const reply of replies) {
      const parentNodeId = comments.find(c => c.id === reply.parentId)?.nodeId || reply.parentId;
      if (threads[parentNodeId]) {
        threads[parentNodeId].replies.push({
          id: reply.id,
          author: reply.user.name,
          content: reply.content,
          createdAt: reply.createdAt.toISOString(),
          resolved: !!reply.resolvedAt
        });
      }
    }

    return NextResponse.json({ threads });
  } catch (error) {
    console.error('Fetch Comments Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { content, nodeId, textRange, parentId } = body;

    if (!content) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

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

    // Sanitize comment content as plain text
    const sanitizedContent = sanitizeHtml(content).replace(/<[^>]*>?/gm, '');

    const comment = await prisma.editorialComment.create({
      data: {
        articleId: id,
        userId: session.userId,
        content: sanitizedContent,
        nodeId: parentId ? null : nodeId,
        textRange: parentId ? null : textRange,
        parentId: parentId || null,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      comment: {
        id: comment.id,
        author: comment.user.name,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        nodeId: comment.nodeId,
        parentId: comment.parentId,
      }
    });

  } catch (error) {
    console.error('Create Comment Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
