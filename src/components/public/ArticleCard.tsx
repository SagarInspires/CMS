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
        <div className="bg-stone-300 rounded-squircle aspect-[4/5] w-full overflow-hidden relative mb-6 transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl">
          <div className="absolute inset-0 flex items-center justify-center p-8 bg-stone-800">
             <h3 className="text-white text-3xl font-serif italic text-center leading-tight">
               "{article.title}"
             </h3>
          </div>
          <div className="absolute top-6 left-6 flex gap-2">
            {article.category && (
              <span className="bg-white/90 backdrop-blur text-black text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                {article.category.name}
              </span>
            )}
          </div>
        </div>
        <div className="px-2">
          <h2 className="text-2xl font-bold tracking-tight text-black mb-2 leading-tight">
            {article.title}
          </h2>
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm font-bold text-stone-500 tracking-wider uppercase">
              By {article.author.name}
            </span>
            <span className="font-serif italic text-stone-400">
              {article.publishedAt ? new Date(article.publishedAt).getFullYear() : 'Draft'}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
