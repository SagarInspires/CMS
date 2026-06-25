import { searchPublishedArticles } from '@/lib/public-articles';
import { ArticleCard } from '@/components/public/ArticleCard';
import Link from 'next/link';
import { CustomCursor } from '@/components/CustomCursor';

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
    16,
    safeSort
  );

  return (
    <>
      <CustomCursor />
      <div className="min-h-screen bg-stone-100 text-black selection:bg-black selection:text-white font-sans overflow-x-hidden relative">
        
        {/* Floating Header */}
        <header className="fixed top-6 left-0 right-0 z-50 pointer-events-none">
          <div className="px-6 md:px-12 flex justify-between items-center w-full">
            {/* Logo Squircle */}
            <Link 
              href="/" 
              className="pointer-events-auto flex items-center justify-center w-14 h-14 bg-black text-white rounded-[1.5rem] hover:scale-105 transition-transform duration-300"
            >
              <span className="font-serif font-bold italic text-2xl tracking-tighter">e.</span>
            </Link>

            {/* Nav Pill */}
            <div className="pointer-events-auto bg-white/60 backdrop-blur-md border border-white/20 rounded-full px-2 py-1.5 flex items-center gap-2 shadow-sm">
              <Link href="/articles" className="px-4 py-2 text-sm font-semibold tracking-tight bg-black/5 rounded-full transition-colors">
                Articles
              </Link>
              <Link href="/about" className="px-4 py-2 text-sm font-semibold tracking-tight hover:bg-black/5 rounded-full transition-colors">
                About
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-[90vw] mx-auto px-6 pt-48 pb-32">
          
          <div className="mb-24 flex flex-col md:flex-row justify-between items-end gap-12 border-b border-stone-300 pb-12">
            <div>
              <h1 className="text-[4rem] md:text-[6rem] font-sans font-bold tracking-tighter leading-[0.95] text-black">
                {q ? `Search: "${q}"` : 'The Archive'}
              </h1>
              <p className="text-xl text-stone-500 font-serif italic mt-6">
                {totalCount === 1 ? '1 story found.' : `${totalCount} stories found.`}
              </p>
            </div>

            <form className="flex w-full md:w-auto gap-2" method="GET" action="/articles">
              <input type="hidden" name="sort" value={safeSort} />
              {category && <input type="hidden" name="category" value={category} />}
              <input 
                type="search" 
                name="q" 
                defaultValue={q}
                placeholder="Search..." 
                className="px-6 py-4 rounded-full bg-white border border-stone-200 focus:border-black outline-none w-full md:w-64 transition-all"
              />
              <button type="submit" className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </button>
            </form>
          </div>

          {articles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
                {articles.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-4 items-center">
                  {page > 1 && (
                    <Link href={`?${new URLSearchParams({ ...params, page: (page - 1).toString() }).toString()}`} className="px-6 py-3 rounded-full border border-black hover:bg-black hover:text-white transition-colors font-bold tracking-tight">
                      Previous
                    </Link>
                  )}
                  <span className="font-serif italic text-stone-500">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link href={`?${new URLSearchParams({ ...params, page: (page + 1).toString() }).toString()}`} className="px-6 py-3 rounded-full border border-black hover:bg-black hover:text-white transition-colors font-bold tracking-tight">
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-32 text-center">
              <h3 className="text-3xl font-serif italic text-stone-400">No articles found matching your criteria.</h3>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
