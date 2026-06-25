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
    <div className="group cursor-pointer flex flex-col" data-cursor="read">
      <Link href={`/articles/${article.slug}`} className="block w-full">
        <div className="bg-glass/[0.02] backdrop-blur-xl border border-glass/[0.05] rounded-[2.5rem] aspect-[4/5] w-full overflow-hidden relative mb-6 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_0_30px_rgba(var(--glass-base),0.03)] group-hover:bg-glass/[0.04]">
          <div className="absolute inset-0 flex items-center justify-center p-8">
             <h3 className="text-foreground/80 group-hover:text-foreground text-3xl font-serif italic text-center leading-tight transition-colors">
               &quot;{article.title}&quot;
             </h3>
          </div>
          <div className="absolute top-6 left-6 flex gap-2">
            {article.category && (
              <span className="bg-glass/[0.1] backdrop-blur border border-glass/[0.1] text-foreground text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider">
                {article.category.name}
              </span>
            )}
          </div>
        </div>
        <div className="px-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground/90 mb-2 leading-tight">
            {article.title}
          </h2>
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm font-bold text-foreground/40 tracking-wider uppercase">
              By {article.author.name}
            </span>
            <span className="font-serif italic text-foreground/30">
              {article.publishedAt ? new Date(article.publishedAt).getFullYear() : 'Draft'}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
