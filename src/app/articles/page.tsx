import { searchPublishedArticles } from '@/lib/public-articles';
import { ArticleCard } from '@/components/public/ArticleCard';
import Link from 'next/link';

export const metadata = {
  title: 'All Articles | EditorialFlow',
  description: 'Browse all published articles.',
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const q = params.q;
  const category = params.category;
  const sort = params.sort;
  const page = parseInt(params.page || '1', 10) || 1;
  const safeSort = ['newest', 'oldest', 'updated'].includes(sort || '') ? sort as any : 'newest';

  const { articles, totalCount, totalPages } = await searchPublishedArticles(
    q || '',
    category,
    undefined,
    undefined,
    page,
    12,
    safeSort
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-muted py-12 border-b">
        <div className="max-w-5xl mx-auto px-6">
          <Link href="/" className="text-sm font-semibold text-primary hover:underline mb-4 inline-block">← Back Home</Link>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            {q ? `Search results for "${q}"` : 'All Articles'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {totalCount === 1 ? '1 article found' : `${totalCount} articles found`}
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <form className="flex w-full md:w-auto gap-2" method="GET" action="/articles">
            <input type="hidden" name="sort" value={safeSort} />
            {category && <input type="hidden" name="category" value={category} />}
            <input 
              type="search" 
              name="q" 
              defaultValue={q}
              placeholder="Search..." 
              className="px-4 py-2 border rounded-md bg-card focus:ring-2 focus:ring-primary outline-none"
            />
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-semibold">Search</button>
            {q && <Link href="/articles" className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted flex items-center">Clear</Link>}
          </form>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Sort by:</span>
            <div className="flex border rounded-md overflow-hidden">
              <Link href={`?${new URLSearchParams({ ...params, sort: 'newest' }).toString()}`} className={`px-3 py-1.5 ${safeSort === 'newest' ? 'bg-primary/10 text-primary font-semibold' : 'bg-card hover:bg-muted'}`}>Newest</Link>
              <Link href={`?${new URLSearchParams({ ...params, sort: 'oldest' }).toString()}`} className={`px-3 py-1.5 border-l border-r ${safeSort === 'oldest' ? 'bg-primary/10 text-primary font-semibold' : 'bg-card hover:bg-muted'}`}>Oldest</Link>
              <Link href={`?${new URLSearchParams({ ...params, sort: 'updated' }).toString()}`} className={`px-3 py-1.5 ${safeSort === 'updated' ? 'bg-primary/10 text-primary font-semibold' : 'bg-card hover:bg-muted'}`}>Recently Updated</Link>
            </div>
          </div>
        </div>

        {articles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {articles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                {page > 1 && (
                  <Link href={`?${new URLSearchParams({ ...params, page: (page - 1).toString() }).toString()}`} className="px-4 py-2 border rounded-md hover:bg-muted">
                    Previous
                  </Link>
                )}
                <span className="px-4 py-2 flex items-center text-muted-foreground text-sm">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link href={`?${new URLSearchParams({ ...params, page: (page + 1).toString() }).toString()}`} className="px-4 py-2 border rounded-md hover:bg-muted">
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="py-24 text-center border rounded-lg border-dashed bg-muted/10">
            <h2 className="text-xl font-bold mb-2">No articles found</h2>
            <p className="text-muted-foreground mb-6">Try adjusting your search or filters.</p>
            <Link href="/articles" className="text-primary font-semibold hover:underline">Clear all filters</Link>
          </div>
        )}
      </main>
    </div>
  );
}
