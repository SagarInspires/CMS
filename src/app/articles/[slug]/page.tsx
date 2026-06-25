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
              <Link href="/articles" className="px-4 py-2 text-sm font-semibold tracking-tight hover:bg-black/5 rounded-full transition-colors">
                Articles
              </Link>
              <Link href="/about" className="px-4 py-2 text-sm font-semibold tracking-tight hover:bg-black/5 rounded-full transition-colors">
                About
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 sm:px-12 pt-48 pb-32">
          <article>
            <header className="mb-24">
              <div className="flex items-center gap-4 mb-12">
                <time dateTime={article.publishedAt?.toISOString()} className="font-serif italic text-stone-500 text-lg">
                  {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Draft'}
                </time>
                {article.category && (
                  <>
                    <span className="text-stone-300">•</span>
                    <Link href={`/categories/${article.category.slug}`} className="text-sm font-bold text-black uppercase tracking-[0.2em] hover:text-stone-500 transition-colors">
                      {article.category.name}
                    </Link>
                  </>
                )}
              </div>
              
              <h1 className="text-[3rem] md:text-[5rem] lg:text-[6rem] font-sans font-bold tracking-tighter leading-[0.95] text-black mb-12">
                {article.title}
              </h1>
              
              <div className="flex items-center gap-6 py-8 border-y border-stone-300">
                <div className="w-16 h-16 rounded-[1.2rem] bg-stone-300 flex items-center justify-center text-black font-serif italic text-3xl">
                  {article.author.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-xl tracking-tight text-black">
                    {article.author.name}
                  </p>
                  <p className="text-sm font-serif italic text-stone-500">Editor</p>
                </div>
              </div>
            </header>

            {/* Prose body using Tailwind Typography, tweaked for Noteworthy aesthetic */}
            <div 
              className="prose prose-stone prose-xl max-w-none 
                         prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tighter prose-headings:text-black
                         prose-p:font-sans prose-p:leading-relaxed prose-p:tracking-tight prose-p:text-stone-800
                         prose-a:text-black prose-a:underline-offset-4 hover:prose-a:bg-black hover:prose-a:text-white prose-a:transition-all
                         prose-img:rounded-[2rem] prose-img:shadow-2xl
                         prose-blockquote:font-serif prose-blockquote:font-style-italic prose-blockquote:border-l-black prose-blockquote:text-stone-600 prose-blockquote:text-3xl prose-blockquote:leading-snug"
              dangerouslySetInnerHTML={{ __html: article.sanitizedHtml || '' }} 
            />

            {article.tags.length > 0 && (
              <div className="mt-32 pt-12 border-t border-stone-300">
                <div className="flex flex-wrap gap-3">
                  {article.tags.map(({ tag }) => (
                    <Link key={tag.id} href={`/tags/${tag.slug}`} className="px-5 py-2 rounded-full border border-stone-300 text-sm font-bold tracking-tight hover:border-black hover:bg-black hover:text-white transition-colors">
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
