import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ArticleForm } from "@/components/articles/ArticleForm";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  
  if (!session) {
    redirect('/login');
  }

  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
    select: { id: true, authorId: true, title: true, contentJson: true, version: true },
  });

  if (!article) {
    notFound();
  }

  if (article.authorId !== session.userId && session.role !== 'ADMIN' && session.role !== 'EDITOR') {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-destructive mb-4">Unauthorized</h1>
        <p>You do not have permission to edit this article.</p>
      </div>
    );
  }

  return (
    <ArticleForm 
      id={article.id}
      initialTitle={article.title}
      initialContent={article.contentJson}
      initialVersion={article.version}
    />
  );
}
