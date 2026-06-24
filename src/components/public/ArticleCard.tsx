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
    <article className="group flex flex-col md:flex-row gap-6 md:gap-8 border-b border-border/40 pb-12 last:border-0 last:pb-0">
      {/* Date & Category (Left Column on Desktop) */}
      <div className="md:w-48 shrink-0 pt-1">
        <div className="flex flex-col gap-2">
          <time className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Draft'}
          </time>
          {article.category && (
            <Link href={`/categories/${article.category.slug}`} className="text-xs font-bold text-primary uppercase tracking-[0.15em] hover:text-primary/80 transition-colors">
              {article.category.name}
            </Link>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Link href={`/articles/${article.slug}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background rounded-sm">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-200 leading-snug">
            {article.title}
          </h2>
          <p className="text-muted-foreground font-serif leading-relaxed line-clamp-3 mb-6">
            {article.excerpt || 'Read this article...'}
          </p>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">By</span>
          <Link href={`/authors/${article.author.name}`} className="text-sm font-medium hover:underline focus-visible:ring-2 focus-visible:ring-primary outline-none">
            {article.author.name}
          </Link>
        </div>
      </div>
    </article>
  );
}
