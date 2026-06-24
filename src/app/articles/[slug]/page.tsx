import { getPublishedArticleBySlug } from '@/lib/public-articles';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  
  if (!article) {
    return { title: 'Article Not Found | EditorialFlow' };
  }

  return {
    title: `${article.seoTitle || article.title} | EditorialFlow`,
    description: article.seoDescription || article.excerpt,
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt,
      type: 'article',
      publishedTime: article.publishedAt?.toISOString(),
      authors: [article.author.name],
    }
  };
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const article = await getPublishedArticleBySlug(slug);
  
  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <header className="border-b border-border/60 bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-serif font-semibold tracking-tight hover:text-primary transition-colors">
            EditorialFlow.
          </Link>
          <div className="flex gap-6">
            <Link href="/articles" className="text-sm font-medium hover:text-primary transition-colors">Archive</Link>
          </div>
        </div>
      </header>

      <main className="max-w-[700px] mx-auto px-4 sm:px-6 py-16 md:py-24">
        <article>
          <header className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <time dateTime={article.publishedAt?.toISOString()} className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Draft'}
              </time>
              {article.category && (
                <>
                  <span className="text-muted-foreground/30">•</span>
                  <Link href={`/categories/${article.category.slug}`} className="text-xs font-bold text-primary uppercase tracking-[0.15em] hover:text-primary/80 transition-colors">
                    {article.category.name}
                  </Link>
                </>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight mb-8 leading-[1.1] text-foreground">
              {article.title}
            </h1>
            
            <div className="flex items-center gap-4 py-6 border-y border-border/50">
              <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center text-secondary-foreground font-serif text-lg">
                {article.author.name.charAt(0)}
              </div>
              <div>
                <Link href={`/authors/${article.author.id}`} className="font-medium text-foreground hover:underline underline-offset-4">
                  {article.author.name}
                </Link>
                <p className="text-sm text-muted-foreground">Editor</p>
              </div>
            </div>
          </header>

          {/* Prose body using Tailwind Typography, tweaked for editorial */}
          <div 
            className="prose prose-lg dark:prose-invert max-w-none 
                       prose-headings:font-serif prose-headings:font-bold prose-headings:tracking-tight
                       prose-p:font-serif prose-p:leading-relaxed prose-p:text-foreground/90
                       prose-a:text-primary prose-a:underline-offset-4 prose-a:decoration-primary/30 hover:prose-a:decoration-primary
                       prose-img:rounded-sm prose-img:border prose-img:border-border/50
                       prose-blockquote:font-serif prose-blockquote:font-style-italic prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: article.sanitizedHtml || '' }} 
          />

          {article.tags.length > 0 && (
            <div className="mt-20 pt-8 border-t border-border/50">
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map(({ tag }) => (
                  <Link key={tag.id} href={`/tags/${tag.slug}`} className="border border-border bg-secondary/30 px-3 py-1 text-sm font-medium hover:border-primary hover:text-primary transition-colors">
                    {tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
      
      <footer className="border-t border-border bg-background mt-auto py-12">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 text-center text-muted-foreground text-sm font-medium">
          © {new Date().getFullYear()} EditorialFlow. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
