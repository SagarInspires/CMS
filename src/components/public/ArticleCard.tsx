import Link from 'next/link';

type ArticleCardProps = {
  article: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    publishedAt: Date | null;
    author: { name: string };
    category?: { name: string; slug: string } | null;
  };
};

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="bg-card border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="p-6 flex-1 flex flex-col">
        {article.category && (
          <Link href={`/categories/${article.category.slug}`} className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 hover:underline">
            {article.category.name}
          </Link>
        )}
        <Link href={`/articles/${article.slug}`} className="block group flex-1">
          <h2 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-tight">
            {article.title}
          </h2>
          <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
            {article.excerpt || 'Read this article...'}
          </p>
        </Link>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t mt-auto">
          <span>By {article.author.name}</span>
          <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ''}</span>
        </div>
      </div>
    </article>
  );
}
