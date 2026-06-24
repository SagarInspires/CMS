import { getLatestPublishedArticles } from '@/lib/public-articles';
import { verifySession } from '@/lib/auth/session';
import Link from 'next/link';
import { ArticleCard } from '@/components/public/ArticleCard';
import { prisma } from '@/lib/prisma';

export const revalidate = 60; // Cache page for 60 seconds

export default async function Home() {
  const session = await verifySession();
  
  const [articles, categories] = await Promise.all([
    getLatestPublishedArticles(7),
    prisma.category.findMany({
      take: 5,
      include: {
        _count: {
          select: { articles: { where: { status: 'PUBLISHED' } } }
        }
      },
      orderBy: { articles: { _count: 'desc' } }
    })
  ]);

  const featuredArticle = articles[0];
  const remainingArticles = articles.slice(1);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Minimal Editorial Navigation */}
      <header className="border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-serif font-semibold tracking-tight hover:text-primary transition-colors duration-200">
            EditorialFlow.
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/articles" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200">Articles</Link>
            <form action="/search" method="GET" className="relative hidden sm:block">
              <input 
                type="search" 
                name="q" 
                placeholder="Search..." 
                className="pl-3 pr-8 py-1 text-sm bg-transparent border-b border-border focus:border-primary outline-none w-48 transition-colors duration-200 placeholder:text-muted-foreground"
                aria-label="Search articles"
              />
              <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary p-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </button>
            </form>
            {session?.isAuth ? (
              <Link href="/dashboard" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">Dashboard →</Link>
            ) : (
              <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Sign In</Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 py-12 md:py-20">
        {/* Featured Story */}
        {featuredArticle && (
          <section className="mb-24 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            <div className="lg:col-span-7 order-2 lg:order-1 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-6">
                {featuredArticle.category && (
                  <Link href={`/categories/${featuredArticle.category.slug}`} className="text-xs font-bold text-primary uppercase tracking-[0.15em] hover:text-primary/80 transition-colors">
                    {featuredArticle.category.name}
                  </Link>
                )}
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                  {featuredArticle.publishedAt ? new Date(featuredArticle.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Draft'}
                </span>
              </div>
              <Link href={`/articles/${featuredArticle.slug}`} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background rounded-sm">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight mb-6 text-foreground group-hover:text-primary transition-colors duration-300 leading-[1.1]">
                  {featuredArticle.title}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed line-clamp-3 font-serif max-w-3xl">
                  {featuredArticle.excerpt}
                </p>
              </Link>
              <div className="mt-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary border flex items-center justify-center text-secondary-foreground font-medium text-sm">
                  {featuredArticle.author.name.charAt(0)}
                </div>
                <div>
                  <Link href={`/authors/${featuredArticle.author.id}`} className="text-sm font-medium hover:underline focus-visible:ring-2 focus-visible:ring-primary outline-none">
                    {featuredArticle.author.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">Editor</p>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-5 order-1 lg:order-2">
              <Link href={`/articles/${featuredArticle.slug}`} tabIndex={-1} className="block group overflow-hidden bg-muted aspect-[4/3] relative">
                {/* Image Placeholder - In production this would be next/image */}
                <div className="absolute inset-0 bg-secondary group-hover:scale-105 transition-transform duration-700 ease-out flex items-center justify-center">
                   <span className="font-serif text-muted-foreground italic">Featured Photograph</span>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* Latest and Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-8 lg:pr-8 border-t border-border pt-12">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-sm font-bold tracking-[0.15em] uppercase text-foreground">Latest Dispatches</h2>
            </div>
            
            {remainingArticles.length > 0 ? (
              <div className="flex flex-col gap-12">
                {remainingArticles.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="py-12 border-t border-b border-border/50 text-center">
                <p className="text-muted-foreground font-serif italic">The archive is currently empty.</p>
              </div>
            )}
          </div>

          <aside className="lg:col-span-4 border-t border-border pt-12">
            <div className="sticky top-24 space-y-12">
              <div>
                <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-foreground mb-6">Topics</h3>
                <div className="flex flex-col gap-3">
                  {categories.map(cat => (
                    <Link key={cat.id} href={`/categories/${cat.slug}`} className="flex items-center justify-between group py-2 border-b border-border/40 hover:border-primary transition-colors">
                      <span className="font-serif text-lg text-foreground group-hover:text-primary transition-colors">{cat.name}</span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {cat._count.articles}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="bg-secondary/50 p-8 border border-border/50">
                <h3 className="font-serif text-2xl font-bold mb-3 text-foreground">EditorialFlow.</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  A production-grade, API-first editorial CMS engineered for performance, security, and the ultimate writing experience.
                </p>
                <Link href="/about" className="text-sm font-medium text-primary hover:underline underline-offset-4">Read our manifesto →</Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-border bg-background mt-auto py-12">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-xl font-serif font-semibold tracking-tight text-foreground">EditorialFlow.</span>
          <p className="text-sm text-muted-foreground font-medium">© {new Date().getFullYear()} Published with Next.js & Prisma.</p>
        </div>
      </footer>
    </div>
  );
}
