import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth/session';
import { sanitizeHtml } from '@/lib/sanitizer';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; revisionId: string }> }) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, revisionId } = await params;

    const article = await prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Only Author of article, Editor, or Admin can restore
    if (article.authorId !== session.userId && session.role !== 'ADMIN' && session.role !== 'EDITOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const revision = await prisma.articleRevision.findUnique({
      where: { id: revisionId },
    });

    if (!revision || revision.articleId !== id) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
    }

    // Generate HTML from the restored contentJson in the client, but here we only have json.
    // However, the restore request body might send the generated HTML to save processing here, 
    // or we just clear sanitizedHtml and let the client resave on load.
    // For safety, we will let the client pass in the sanitized HTML they generated from the JSON.
    const body = await req.json();
    const { htmlContent } = body;
    
    if (!htmlContent) {
      return NextResponse.json({ error: 'htmlContent is required for restoration' }, { status: 400 });
    }

    const sanitizedHtml = sanitizeHtml(htmlContent);

    // Perform restoration transactionally
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create a snapshot of the *current* state before overwriting
      await tx.articleRevision.create({
        data: {
          articleId: id,
          version: article.version,
          title: article.title,
          contentJson: article.contentJson as any,
          authorId: session.userId,
        }
      });

      // 2. Update the article with the revision's content
      const updatedArticle = await tx.article.update({
        where: { id },
        data: {
          title: revision.title,
          contentJson: revision.contentJson as any,
          sanitizedHtml: sanitizedHtml,
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      // 3. Log the restoration audit
      await tx.auditLog.create({
        data: {
          action: 'ARTICLE_RESTORED',
          entityType: 'Article',
          entityId: id,
          actorId: session.userId,
          metadata: {
            restoredFromRevisionId: revision.id,
            restoredFromVersion: revision.version,
            newVersion: updatedArticle.version
          }
        }
      });

      return updatedArticle;
    });

    return NextResponse.json({ success: true, article: result });

  } catch (error) {
    console.error('Restore Revision Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
