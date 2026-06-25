'use server';

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/rbac';
import { sanitizeHtml } from '@/lib/sanitizer';
import { ArticleStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createArticle(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (!session || !hasPermission(session.role, 'article:create')) throw new Error('Unauthorized');

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  
  if (!title || !content) {
    return { error: 'Title and content are required' };
  }

  let contentJson;
  try {
    contentJson = JSON.parse(content);
  } catch {
    return { error: 'Invalid content format' };
  }

  const htmlContent = formData.get('htmlContent') as string || '';
  const sanitized = sanitizeHtml(htmlContent);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

  const article = await prisma.article.create({
    data: {
      title,
      slug,
      contentJson,
      sanitizedHtml: sanitized,
      status: ArticleStatus.DRAFT,
      authorId: session.userId,
    }
  });

  await prisma.articleRevision.create({
    data: {
      articleId: article.id,
      version: 1,
      title,
      contentJson,
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: 'ARTICLE_CREATED',
      entityType: 'Article',
      entityId: article.id,
    }
  });

  revalidatePath('/dashboard/articles');
  redirect(`/dashboard/articles`); // Redirect to articles list to see drafts
}

export async function createBlankDraft() {
  const session = await verifySession();
  if (!session || !hasPermission(session.role, 'article:create')) throw new Error('Unauthorized');

  const title = 'Untitled Draft';
  const slug = `untitled-draft-${Date.now()}`;
  
  const article = await prisma.article.create({
    data: {
      title,
      slug,
      contentJson: { type: 'doc', content: [{ type: 'paragraph' }] },
      sanitizedHtml: '<p></p>',
      status: ArticleStatus.DRAFT,
      authorId: session.userId,
      version: 1,
    }
  });

  return redirect(`/dashboard/articles/${article.id}/edit`);
}

export async function deleteArticle(articleId: string) {
  const session = await verifySession();
  if (!session) throw new Error('Unauthorized');

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { authorId: true, status: true }
  });

  if (!article) throw new Error('Article not found');

  if (article.authorId !== session.userId && session.role !== 'ADMIN') {
    throw new Error('Unauthorized to delete this article');
  }

  // Only allow deleting DRAFTs
  if (article.status !== ArticleStatus.DRAFT && session.role !== 'ADMIN') {
    throw new Error('Can only delete drafts');
  }

  await prisma.article.delete({
    where: { id: articleId }
  });

  revalidatePath('/dashboard/articles');
}
