import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const getPublicVisibilityCondition = (): Prisma.ArticleWhereInput => ({
  status: 'PUBLISHED',
  publishedAt: { lte: new Date() },
  deletedAt: null,
  author: { status: 'ACTIVE' }
});

export const publicArticleSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  featuredImageUrl: true,
  publishedAt: true,
  author: {
    select: {
      id: true,
      name: true,
    }
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    }
  },
  tags: {
    select: {
      tag: {
        select: {
          id: true,
          name: true,
          slug: true,
        }
      }
    }
  }
} satisfies Prisma.ArticleSelect;

export async function getLatestPublishedArticles(limit: number = 6) {
  return prisma.article.findMany({
    where: getPublicVisibilityCondition(),
    select: publicArticleSelect,
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });
}

export async function getPublishedArticleBySlug(slug: string) {
  const article = await prisma.article.findFirst({
    where: {
      ...getPublicVisibilityCondition(),
      slug,
    },
    select: {
      ...publicArticleSelect,
      sanitizedHtml: true, // We need HTML for the detail page
      seoTitle: true,
      seoDescription: true,
    }
  });
  
  if (article && !article.seoTitle) article.seoTitle = article.title;
  if (article && !article.seoDescription) article.seoDescription = article.excerpt || '';
  
  return article;
}

export async function searchPublishedArticles(
  query: string,
  categoryId?: string,
  tagId?: string,
  authorId?: string,
  page: number = 1,
  limit: number = 10,
  sortBy: 'newest' | 'oldest' | 'updated' = 'newest'
) {
  const skip = (page - 1) * limit;
  const safeLimit = Math.min(limit, 50);

  const whereClause: Prisma.ArticleWhereInput = {
    ...getPublicVisibilityCondition(),
    ...(categoryId && { categoryId }),
    ...(authorId && { authorId }),
    ...(tagId && { tags: { some: { tagId } } }),
  };

  if (query) {
    const safeQuery = query.trim().substring(0, 100);
    // Use PostgreSQL full-text search syntax via Prisma textSearch/contains
    whereClause.OR = [
      { title: { contains: safeQuery, mode: 'insensitive' } },
      { excerpt: { contains: safeQuery, mode: 'insensitive' } },
    ];
  }

  let orderBy: Prisma.ArticleOrderByWithRelationInput = { publishedAt: 'desc' };
  if (sortBy === 'oldest') orderBy = { publishedAt: 'asc' };
  if (sortBy === 'updated') orderBy = { updatedAt: 'desc' };

  const [articles, totalCount] = await Promise.all([
    prisma.article.findMany({
      where: whereClause,
      select: publicArticleSelect,
      orderBy,
      skip,
      take: safeLimit,
    }),
    prisma.article.count({ where: whereClause })
  ]);

  return { articles, totalCount, totalPages: Math.ceil(totalCount / safeLimit) };
}

export async function getPublicCategory(slug: string) {
  return prisma.category.findUnique({
    where: { slug }
  });
}

export async function getPublicTag(slug: string) {
  return prisma.tag.findUnique({
    where: { slug }
  });
}

export async function getPublicAuthor(id: string) {
  return prisma.user.findFirst({
    where: { id, status: 'ACTIVE' },
    select: { id: true, name: true }
  });
}
