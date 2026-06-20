import { searchPublishedArticles, getPublicTag } from '@/lib/public-articles';
import { ArticleCard } from '@/components/public/ArticleCard';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tag = await getPublicTag(slug);
  if (!tag) return { title: 'Tag Not Found' };
  return { title: `#${tag.name} | EditorialFlow` };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || '1', 10) || 1;

  const tag = await getPublicTag(slug);
  if (!tag) notFound();

  const { articles, totalCount, totalPages } = await searchPublishedArticles('', undefined, tag.id, undefined, page, 12, 'newest');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-muted py-12 border-b">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">#{tag.name}</h1>
          <p className="text-sm text-muted-foreground">{totalCount} articles with this tag</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 w-full flex-1">
        {articles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {articles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                {page > 1 && <Link href={`?page=${page - 1}`} className="px-4 py-2 border rounded-md hover:bg-muted">Previous</Link>}
                <span className="px-4 py-2 flex items-center text-muted-foreground text-sm">Page {page} of {totalPages}</span>
                {page < totalPages && <Link href={`?page=${page + 1}`} className="px-4 py-2 border rounded-md hover:bg-muted">Next</Link>}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-muted-foreground border border-dashed rounded-lg">
            No articles tagged with #{tag.name} yet.
          </div>
        )}
      </main>
    </div>
  );
}
