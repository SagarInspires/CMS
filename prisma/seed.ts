import { PrismaClient, Role, ArticleStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Skipping default seed data in production environment.');
    return;
  }

  const passwordHash = await argon2.hash('Password123!');

  // Create Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@editorialflow.local' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@editorialflow.local',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const editor = await prisma.user.upsert({
    where: { email: 'editor@editorialflow.local' },
    update: {},
    create: {
      name: 'Editor User',
      email: 'editor@editorialflow.local',
      passwordHash,
      role: Role.EDITOR,
    },
  });

  const author1 = await prisma.user.upsert({
    where: { email: 'author1@editorialflow.local' },
    update: {},
    create: {
      name: 'Author One',
      email: 'author1@editorialflow.local',
      passwordHash,
      role: Role.AUTHOR,
    },
  });

  // Create Categories & Tags
  const techCategory = await prisma.category.upsert({
    where: { slug: 'technology' },
    update: {},
    create: { name: 'Technology', slug: 'technology', description: 'Tech news and guides' },
  });

  const tagNext = await prisma.tag.upsert({
    where: { slug: 'nextjs' },
    update: {},
    create: { name: 'Next.js', slug: 'nextjs' },
  });

  // Create Articles in different states
  await prisma.article.create({
    data: {
      title: 'Getting Started with Next.js 15',
      slug: 'getting-started-with-nextjs-15',
      excerpt: 'Learn the new features of Next.js 15.',
      contentJson: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Next.js 15 brings many improvements." }] }] },
      sanitizedHtml: '<p>Next.js 15 brings many improvements.</p>',
      status: ArticleStatus.PUBLISHED,
      authorId: author1.id,
      categoryId: techCategory.id,
      publishedAt: new Date(),
      tags: { create: [{ tagId: tagNext.id }] }
    }
  });

  await prisma.article.create({
    data: {
      title: 'Draft Article on React 19',
      slug: 'draft-article-react-19',
      excerpt: 'Exploring React 19.',
      contentJson: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "React 19 compiler." }] }] },
      sanitizedHtml: '<p>React 19 compiler.</p>',
      status: ArticleStatus.DRAFT,
      authorId: author1.id,
      categoryId: techCategory.id,
    }
  });

  await prisma.article.create({
    data: {
      title: 'Article in Review',
      slug: 'article-in-review',
      contentJson: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Please review this." }] }] },
      sanitizedHtml: '<p>Please review this.</p>',
      status: ArticleStatus.IN_REVIEW,
      authorId: author1.id,
      categoryId: techCategory.id,
    }
  });

  console.log('Database seeded successfully with development accounts.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
