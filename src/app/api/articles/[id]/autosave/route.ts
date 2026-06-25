import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth/session';
import { sanitizeHtml } from '@/lib/sanitizer';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, contentJson, htmlContent, version, categoryName } = body;

    if (!title || !contentJson || version === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch current article
    const article = await prisma.article.findUnique({
      where: { id },
      select: { authorId: true, version: true, status: true },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    if (article.authorId !== session.userId && session.role !== 'ADMIN' && session.role !== 'EDITOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Optimistic Concurrency Check
    if (version < article.version) {
      return NextResponse.json({ 
        error: 'Conflict: Server has a newer version.', 
        serverVersion: article.version 
      }, { status: 409 });
    }

    // Sanitize HTML server-side
    const sanitized = htmlContent ? sanitizeHtml(htmlContent) : '';

    // Handle Category Upsert
    let categoryId = undefined;
    if (categoryName && categoryName.trim() !== '') {
      const slug = categoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const category = await prisma.category.upsert({
        where: { slug },
        update: {},
        create: { name: categoryName.trim(), slug }
      });
      categoryId = category.id;
    }

    // Update article and increment version
    const updated = await prisma.article.update({
      where: { id },
      data: {
        title,
        contentJson,
        sanitizedHtml: sanitized,
        ...(categoryId && { categoryId }),
        version: { increment: 1 },
        updatedAt: new Date(),
      },
      select: { id: true, version: true, updatedAt: true },
    });

    // Optionally create a revision if it's been a while (e.g. every 10 versions)
    if (updated.version % 10 === 0) {
      await prisma.articleRevision.create({
        data: {
          articleId: updated.id,
          version: updated.version,
          title,
          contentJson,
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      version: updated.version, 
      updatedAt: updated.updatedAt 
    });

  } catch (error: any) {
    console.error('Autosave Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
