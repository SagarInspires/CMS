import { getPublishedArticleBySlug } from '@/lib/public-articles';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CustomCursor } from '@/components/CustomCursor';

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
  
  if (!article) notFound();

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
              <Link href="/articles" className="px-4 py-2 text-sm font-semibold tracking-tight text-foreground/70 hover:text-foreground hover:bg-glass/[0.05] rounded-full transition-colors">
                Articles
              </Link>
              <Link href="/about" className="px-4 py-2 text-sm font-semibold tracking-tight text-foreground/70 hover:text-foreground hover:bg-glass/[0.05] rounded-full transition-colors">
                About
              </Link>
            </div>
          </div>
        </header>

        <main className="relative z-10 max-w-4xl mx-auto px-6 sm:px-12 pt-48 pb-32">
          <article>
            <header className="mb-24 animate-fade-in-up">
              <div className="flex items-center gap-4 mb-12">
                <time dateTime={article.publishedAt?.toISOString()} className="font-serif italic text-foreground/40 text-lg">
                  {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Draft'}
                </time>
                {article.category && (
                  <>
                    <span className="text-foreground/20">•</span>
                    <Link href={`/categories/${article.category.slug}`} className="text-sm font-bold text-foreground uppercase tracking-[0.2em] hover:text-foreground/60 transition-colors">
                      {article.category.name}
                    </Link>
                  </>
                )}
              </div>
              
              <h1 className="text-[3rem] md:text-[5rem] lg:text-[6rem] font-sans font-bold tracking-tighter leading-[0.95] text-foreground mb-12">
                {article.title}
              </h1>
              
              <div className="flex items-center gap-6 py-8 border-y border-glass/[0.08]">
                <div className="w-16 h-16 rounded-[1.2rem] bg-glass/[0.05] border border-glass/[0.08] flex items-center justify-center text-foreground font-serif italic text-3xl shadow-[0_0_20px_rgba(var(--glass-base),0.05)]">
                  {article.author.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-xl tracking-tight text-foreground/90">
                    {article.author.name}
                  </p>
                  <p className="text-sm font-serif italic text-foreground/40">Editor</p>
                </div>
              </div>
            </header>

            {/* Prose body using Tailwind Typography, tweaked for Fluid Dark Mode aesthetic */}
            <div 
              className="prose prose-stone prose-xl max-w-none animate-fade-in-up
                         prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tighter prose-headings:text-foreground
                         prose-p:font-sans prose-p:leading-relaxed prose-p:tracking-tight prose-p:text-foreground/80
                         prose-a:text-foreground prose-a:underline-offset-4 hover:prose-a:bg-glass/[0.1] hover:prose-a:text-foreground prose-a:transition-all
                         prose-img:rounded-[2rem] prose-img:shadow-[0_0_40px_rgba(var(--glass-base),0.05)] prose-img:border prose-img:border-glass/[0.08]
                         prose-blockquote:font-serif prose-blockquote:font-style-italic prose-blockquote:border-l-glass/[0.2] prose-blockquote:text-foreground/60 prose-blockquote:text-3xl prose-blockquote:leading-snug
                         prose-strong:text-foreground"
              style={{ animationDelay: '0.2s' }}
              dangerouslySetInnerHTML={{ __html: article.sanitizedHtml || '' }} 
            />

            {article.tags.length > 0 && (
              <div className="mt-32 pt-12 border-t border-glass/[0.08] animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex flex-wrap gap-3">
                  {article.tags.map(({ tag }) => (
                    <Link key={tag.id} href={`/tags/${tag.slug}`} className="px-5 py-2 rounded-full border border-glass/[0.08] text-foreground/60 text-sm font-bold tracking-tight hover:border-glass/[0.3] hover:bg-glass/[0.05] hover:text-foreground transition-colors backdrop-blur-md">
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        </main>
      </div>
    </>
  );
}
