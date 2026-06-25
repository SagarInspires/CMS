import { searchPublishedArticles } from '@/lib/public-articles';
import { ArticleCard } from '@/components/public/ArticleCard';
import Link from 'next/link';
import { CustomCursor } from '@/components/CustomCursor';
import { ThemeToggle } from '@/components/ThemeToggle';

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
      <div className="min-h-screen bg-background text-foreground selection:bg-foreground/20 selection:text-foreground font-sans overflow-x-hidden relative">
        
        {/* --- Fluid Ethereal Background Blobs --- */}
        <div className="absolute top-0 left-0 w-full h-[150vh] overflow-hidden pointer-events-none fixed z-0">
          <div className="absolute top-[0%] left-[-10%] w-[600px] h-[600px] bg-violet-600/20 rounded-full mix-blend-screen filter blur-[150px] animate-blob"></div>
          <div className="absolute top-[40%] right-[-10%] w-[800px] h-[800px] bg-cyan-500/10 rounded-full mix-blend-screen filter blur-[180px] animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-blue-600/10 rounded-full mix-blend-screen filter blur-[150px] animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Floating Header */}
        <header className="fixed top-6 left-0 right-0 z-50 pointer-events-none">
          <div className="px-6 md:px-12 flex justify-between items-center w-full">
            {/* Logo Squircle */}
            <Link 
              href="/" 
              className="pointer-events-auto flex items-center justify-center w-14 h-14 bg-glass/[0.03] backdrop-blur-3xl border border-glass/[0.08] text-foreground rounded-[1.5rem] hover:scale-105 transition-transform duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            >
              <span className="font-serif font-bold italic text-2xl tracking-tighter">e.</span>
            </Link>

            {/* Nav Pill */}
            <div className="pointer-events-auto bg-glass/[0.03] backdrop-blur-3xl border border-glass/[0.08] rounded-full px-2 py-1.5 flex items-center gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <Link href="/articles" className="px-4 py-2 text-sm font-semibold tracking-tight text-foreground bg-glass/[0.1] rounded-full transition-colors">
                Articles
              </Link>
              <Link href="/about" className="px-4 py-2 text-sm font-semibold tracking-tight text-foreground/70 hover:text-foreground hover:bg-glass/[0.05] rounded-full transition-colors">
                About
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="relative z-10 max-w-[90vw] mx-auto px-6 pt-48 pb-32">
          
          <div className="mb-24 flex flex-col md:flex-row justify-between items-end gap-12 border-b border-glass/[0.08] pb-12 animate-fade-in-up">
            <div>
              <h1 className="text-[4rem] md:text-[6rem] font-sans font-bold tracking-tighter leading-[0.95] text-foreground">
                {q ? `Search: "${q}"` : 'The Archive'}
              </h1>
              <p className="text-xl text-foreground/40 font-serif italic mt-6">
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
                className="px-6 py-4 rounded-full bg-glass/[0.03] border border-glass/[0.08] text-foreground focus:border-glass/[0.3] focus:ring-1 focus:ring-glass/[0.3] outline-none w-full md:w-64 transition-all placeholder:text-foreground/20 backdrop-blur-3xl"
              />
              <button type="submit" className="w-14 h-14 bg-gradient-to-r from-foreground to-foreground/90 text-background rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </button>
            </form>
          </div>

          {articles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                {articles.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-4 items-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  {page > 1 && (
                    <Link href={`?${new URLSearchParams({ ...params, page: (page - 1).toString() }).toString()}`} className="px-6 py-3 rounded-full border border-glass/[0.08] hover:bg-glass/[0.05] hover:text-foreground text-foreground/70 transition-colors font-bold tracking-tight">
                      Previous
                    </Link>
                  )}
                  <span className="font-serif italic text-foreground/40">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link href={`?${new URLSearchParams({ ...params, page: (page + 1).toString() }).toString()}`} className="px-6 py-3 rounded-full border border-glass/[0.08] hover:bg-glass/[0.05] hover:text-foreground text-foreground/70 transition-colors font-bold tracking-tight">
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-32 text-center animate-fade-in-up">
              <h3 className="text-3xl font-serif italic text-foreground/30">No articles found matching your criteria.</h3>
            </div>
          )}
        </main>
        
        <footer className="relative z-10 w-full py-12 text-center border-t border-glass/[0.08] bg-background">
          <p className="text-foreground/60 font-medium tracking-tight">
            Made with ♥ by <span className="font-bold text-foreground">Sagar Kumar</span>
          </p>
        </footer>
      </div>
    </>
  );
}
