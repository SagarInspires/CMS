import { searchPublishedArticles, getPublicAuthor } from '@/lib/public-articles';
import { ArticleCard } from '@/components/public/ArticleCard';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const author = await getPublicAuthor(id);
  if (!author) return { title: 'Author Not Found' };
  return { title: `${author.name} | EditorialFlow` };
}

export default async function AuthorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || '1', 10) || 1;

  const author = await getPublicAuthor(id);
  if (!author) notFound();

  const { articles, totalCount, totalPages } = await searchPublishedArticles('', undefined, undefined, author.id, page, 12, 'newest');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary/5 py-12 border-b">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
            {author.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">{author.name}</h1>
          <p className="text-sm text-muted-foreground">{totalCount} published articles</p>
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
            No articles by this author yet.
          </div>
        )}
      </main>
    </div>
  );
}
