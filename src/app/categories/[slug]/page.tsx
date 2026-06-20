import { searchPublishedArticles, getPublicCategory } from '@/lib/public-articles';
import { ArticleCard } from '@/components/public/ArticleCard';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getPublicCategory(slug);
  if (!category) return { title: 'Category Not Found' };
  return { title: `${category.name} | EditorialFlow`, description: category.description || `Articles about ${category.name}` };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || '1', 10) || 1;

  const category = await getPublicCategory(slug);
  if (!category) notFound();

  const { articles, totalCount, totalPages } = await searchPublishedArticles('', category.id, undefined, undefined, page, 12, 'newest');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary/5 py-12 border-b">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Category</p>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">{category.name}</h1>
          {category.description && <p className="text-muted-foreground text-lg mb-6">{category.description}</p>}
          <p className="text-sm text-muted-foreground">{totalCount} articles</p>
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
            No articles in this category yet.
          </div>
        )}
      </main>
    </div>
  );
}
