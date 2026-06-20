import { getLatestPublishedArticles } from '@/lib/public-articles';
import { verifySession } from '@/lib/auth/session';
import Link from 'next/link';
import { ArticleCard } from '@/components/public/ArticleCard';
import { prisma } from '@/lib/prisma';

export const revalidate = 60; // Cache page for 60 seconds

export default async function Home() {
  const session = await verifySession();
  
  // Fetch latest articles and popular categories simultaneously
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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tighter text-primary">EditorialFlow</Link>
          <div className="flex items-center gap-6">
            <Link href="/articles" className="text-sm font-medium hover:text-primary transition-colors">All Articles</Link>
            <form action="/search" method="GET" className="relative hidden md:block">
              <input 
                type="search" 
                name="q" 
                placeholder="Search articles..." 
                className="pl-4 pr-10 py-1.5 text-sm border rounded-full bg-muted/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary w-64 transition-all"
                aria-label="Search articles"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </button>
            </form>
            {session?.isAuth ? (
              <Link href="/dashboard" className="text-sm font-bold bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">Dashboard</Link>
            ) : (
              <Link href="/login" className="text-sm font-bold bg-secondary text-secondary-foreground border px-4 py-2 rounded-md hover:bg-accent transition-colors">Sign In</Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
        {featuredArticle && (
          <section className="mb-16">
            <div className="bg-card border rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row">
              <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-primary/5 to-transparent">
                {featuredArticle.category && (
                  <Link href={`/categories/${featuredArticle.category.slug}`} className="text-sm font-bold text-primary uppercase tracking-widest mb-4 hover:underline">
                    {featuredArticle.category.name}
                  </Link>
                )}
                <Link href={`/articles/${featuredArticle.slug}`} className="group">
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 group-hover:text-primary transition-colors leading-tight">
                    {featuredArticle.title}
                  </h1>
                  <p className="text-lg text-muted-foreground mb-8 line-clamp-3">
                    {featuredArticle.excerpt}
                  </p>
                </Link>
                <div className="flex items-center gap-4 text-sm font-medium text-foreground">
                  <Link href={`/authors/${featuredArticle.author.id}`} className="hover:underline">{featuredArticle.author.name}</Link>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{featuredArticle.publishedAt ? new Date(featuredArticle.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</span>
                </div>
              </div>
              <div className="md:w-1/2 bg-muted min-h-[300px] flex items-center justify-center text-muted-foreground">
                <span className="text-sm uppercase tracking-widest font-semibold opacity-50">Featured Article</span>
              </div>
            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-3/4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Latest Articles</h2>
              <Link href="/articles" className="text-sm font-semibold text-primary hover:underline">View all →</Link>
            </div>
            
            {remainingArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {remainingArticles.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/20 border rounded-lg border-dashed">
                <p className="text-muted-foreground">No articles published yet.</p>
              </div>
            )}
          </div>

          <aside className="lg:w-1/4 space-y-10">
            <div>
              <h3 className="text-lg font-bold mb-4 border-b pb-2">Categories</h3>
              <div className="flex flex-col gap-2">
                {categories.map(cat => (
                  <Link key={cat.id} href={`/categories/${cat.slug}`} className="flex items-center justify-between group">
                    <span className="text-muted-foreground group-hover:text-primary transition-colors">{cat.name}</span>
                    <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-medium text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {cat._count.articles}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="bg-muted/50 border-t py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} EditorialFlow CMS. Built with Next.js.</p>
        </div>
      </footer>
    </div>
  );
}
