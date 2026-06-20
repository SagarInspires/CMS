'use server';

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/rbac';
import { ArticleStatus, Role, CommentVisibility } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const TransitionSchema = z.object({
  articleId: z.string().uuid(),
  action: z.enum(['SUBMIT_FOR_REVIEW', 'REQUEST_CHANGES', 'REJECT', 'APPROVE', 'APPROVE_AND_PUBLISH', 'PUBLISH_NOW', 'SCHEDULE', 'CANCEL_SCHEDULE', 'ARCHIVE']),
  expectedVersion: z.number().int().positive(),
  reason: z.string().min(10, "Must be at least 10 characters").max(2000).optional().or(z.literal('')),
  scheduledAt: z.string().datetime().optional(),
  override: z.boolean().optional(),
});

export async function transitionArticle(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (!session) return { success: false, error: 'Unauthorized', status: 401 };

  const payload = {
    articleId: formData.get('articleId'),
    action: formData.get('action'),
    expectedVersion: Number(formData.get('expectedVersion')),
    reason: formData.get('reason') || '',
    scheduledAt: formData.get('scheduledAt') || undefined,
    override: formData.get('override') === 'true',
  };

  const parsed = TransitionSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message, status: 400 };
  }

  const data = parsed.data;

  if (!hasPermission(session.role, 'article:review')) {
    return { success: false, error: 'Forbidden', status: 403 };
  }

  if (data.override && session.role !== Role.ADMIN) {
    return { success: false, error: 'Only Admins can perform overrides', status: 403 };
  }
  if (data.override && !data.reason) {
    return { success: false, error: 'Override requires a reason', status: 400 };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const article = await tx.article.findUnique({ where: { id: data.articleId } });
      if (!article) return { success: false, error: 'Article not found', status: 404 };

      if (article.version !== data.expectedVersion) {
        return { success: false, error: 'Conflict: The article was modified by another user. Please refresh.', status: 409 };
      }

      let newStatus: ArticleStatus = article.status;
      let newPublishedAt = article.publishedAt;
      let newScheduledAt = article.scheduledAt;
      let commentVisibility: CommentVisibility = CommentVisibility.INTERNAL;

      if (!data.override) {
        switch (data.action) {
          case 'SUBMIT_FOR_REVIEW':
            if (!['DRAFT', 'CHANGES_REQUESTED'].includes(article.status)) throw new Error('Invalid state for SUBMIT_FOR_REVIEW');
            newStatus = ArticleStatus.IN_REVIEW;
            break;
          case 'REQUEST_CHANGES':
            if (article.status !== ArticleStatus.IN_REVIEW) throw new Error('Invalid state for REQUEST_CHANGES');
            if (!data.reason) throw new Error('Reason required for requesting changes');
            newStatus = ArticleStatus.CHANGES_REQUESTED;
            commentVisibility = CommentVisibility.PUBLIC_TO_AUTHOR;
            break;
          case 'REJECT':
            if (!['IN_REVIEW', 'DRAFT', 'CHANGES_REQUESTED'].includes(article.status)) throw new Error('Invalid state for REJECT');
            if (!data.reason) throw new Error('Reason required for rejection');
            newStatus = ArticleStatus.REJECTED;
            commentVisibility = CommentVisibility.PUBLIC_TO_AUTHOR;
            break;
          case 'APPROVE':
            if (article.status !== ArticleStatus.IN_REVIEW) throw new Error('Invalid state for APPROVE');
            newStatus = ArticleStatus.APPROVED;
            commentVisibility = CommentVisibility.INTERNAL;
            break;
          case 'APPROVE_AND_PUBLISH':
            if (article.status !== ArticleStatus.IN_REVIEW) throw new Error('Invalid state for APPROVE_AND_PUBLISH');
            if (!hasPermission(session.role, 'article:publish')) throw new Error('Forbidden');
            newStatus = ArticleStatus.PUBLISHED;
            newPublishedAt = new Date();
            newScheduledAt = null;
            break;
          case 'PUBLISH_NOW':
            if (!['APPROVED', 'SCHEDULED'].includes(article.status)) throw new Error('Invalid state for PUBLISH_NOW');
            if (!hasPermission(session.role, 'article:publish')) throw new Error('Forbidden');
            newStatus = ArticleStatus.PUBLISHED;
            newPublishedAt = new Date();
            newScheduledAt = null;
            break;
          case 'SCHEDULE':
            if (article.status !== ArticleStatus.APPROVED) throw new Error('Invalid state for SCHEDULE');
            if (!hasPermission(session.role, 'article:schedule')) throw new Error('Forbidden');
            if (!data.scheduledAt || new Date(data.scheduledAt) <= new Date()) throw new Error('Valid future date required');
            newStatus = ArticleStatus.SCHEDULED;
            newScheduledAt = new Date(data.scheduledAt);
            break;
          case 'CANCEL_SCHEDULE':
            if (article.status !== ArticleStatus.SCHEDULED) throw new Error('Invalid state for CANCEL_SCHEDULE');
            newStatus = ArticleStatus.APPROVED;
            newScheduledAt = null;
            break;
          case 'ARCHIVE':
            if (article.status !== ArticleStatus.PUBLISHED) throw new Error('Invalid state for ARCHIVE');
            newStatus = ArticleStatus.ARCHIVED;
            break;
          default:
            throw new Error('Unknown action');
        }
      }

      await tx.article.update({
        where: { id: article.id },
        data: {
          status: newStatus,
          version: article.version + 1,
          publishedAt: newPublishedAt,
          scheduledAt: newScheduledAt,
        }
      });

      if (data.reason) {
        await tx.editorialComment.create({
          data: {
            articleId: article.id,
            userId: session.userId,
            content: data.reason,
            visibility: commentVisibility,
          }
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: session.userId,
          action: data.override ? `ADMIN_OVERRIDE_${data.action}` : data.action,
          entityType: 'Article',
          entityId: article.id,
          metadata: { previousStatus: article.status, newStatus, reason: data.reason }
        }
      });

      revalidatePath(`/dashboard/review/${article.id}`);
      revalidatePath(`/dashboard/review`);
      if (newStatus === ArticleStatus.PUBLISHED) {
        revalidatePath(`/articles/${article.slug}`);
        revalidatePath('/articles');
        revalidatePath('/');
      }

      return { success: true };
    });
  } catch (err: any) {
    return { success: false, error: err.message, status: 400 };
  }
}
