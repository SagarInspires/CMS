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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tighter text-primary">EditorialFlow</Link>
          <Link href="/articles" className="text-sm font-medium hover:text-primary transition-colors">All Articles</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <article>
          <header className="mb-12 text-center">
            {article.category && (
              <Link href={`/categories/${article.category.slug}`} className="text-xs font-bold text-primary uppercase tracking-widest mb-6 inline-block hover:underline">
                {article.category.name}
              </Link>
            )}
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
              {article.title}
            </h1>
            
            <div className="flex items-center justify-center gap-4 text-sm font-medium text-muted-foreground border-t border-b py-4 my-8">
              <Link href={`/authors/${article.author.id}`} className="hover:text-primary transition-colors">
                By {article.author.name}
              </Link>
              <span>•</span>
              <time dateTime={article.publishedAt?.toISOString()}>
                {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
              </time>
            </div>
          </header>

          <div 
            className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: article.sanitizedHtml || '' }} 
          />

          {article.tags.length > 0 && (
            <div className="mt-16 pt-8 border-t">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map(({ tag }) => (
                  <Link key={tag.id} href={`/tags/${tag.slug}`} className="bg-muted px-3 py-1 rounded-full text-sm hover:bg-primary/10 hover:text-primary transition-colors">
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
      
      <footer className="bg-muted/30 border-t py-12 mt-12 text-center">
        <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} EditorialFlow</p>
      </footer>
    </div>
  );
}
