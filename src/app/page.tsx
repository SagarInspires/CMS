import { getLatestPublishedArticles } from '@/lib/public-articles';
import { verifySession } from '@/lib/auth/session';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { CustomCursor } from '@/components/CustomCursor';

export const revalidate = 60; // Cache page for 60 seconds

export default async function Home() {
  const session = await verifySession();
  const articles = await getLatestPublishedArticles(4);

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
              {session?.isAuth ? (
                <Link href="/dashboard" className="ml-2 px-5 py-2 text-sm font-bold bg-black text-white rounded-full hover:bg-black/80 transition-colors flex items-center gap-2">
                  Dashboard <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                </Link>
              ) : (
                <Link href="/login" className="ml-2 px-5 py-2 text-sm font-bold bg-black text-white rounded-full hover:bg-black/80 transition-colors flex items-center gap-2">
                  Sign In <span className="w-2 h-2 rounded-full bg-white"></span>
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="w-full pt-40 md:pt-48 pb-32 px-6 md:px-12">
          
          {/* Hero Statement */}
          <section className="max-w-[90vw] mx-auto text-center mb-32 flex flex-col items-center">
            <h2 className="text-sm font-bold tracking-tight mb-8">editorial.flow</h2>
            <h1 className="text-[3rem] sm:text-[5rem] md:text-[6.5rem] lg:text-[8rem] font-sans font-bold tracking-tighter leading-[0.95] text-black">
              We shape <span className="font-serif italic font-normal tracking-tight">your stories</span><br/>
              into <span className="font-serif italic font-normal tracking-tight">digital legacies.</span>
            </h1>
            
            {/* Scroll indicator */}
            <div className="mt-24 animate-bounce">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4V20M12 20L6 14M12 20L18 14" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </section>

          {/* Asymmetrical Grid Showcase */}
          {articles.length > 0 ? (
            <section className="grid grid-cols-1 md:grid-cols-16 gap-6 w-full">
              
              {/* Feature Article (Spans 1-10) */}
              {articles[0] && (
                <div className="md:col-span-10 flex flex-col group cursor-pointer" data-cursor="read">
                  <Link href={`/articles/${articles[0].slug}`} className="block w-full">
                    <div className="bg-stone-900 rounded-squircle aspect-square md:aspect-[4/3] w-full overflow-hidden relative mb-6 transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl">
                      <div className="absolute inset-0 flex items-center justify-center p-12">
                         <h3 className="text-white text-4xl md:text-6xl font-serif italic text-center leading-tight">
                           "{articles[0].title}"
                         </h3>
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-4">
                      <h4 className="font-bold text-xl tracking-tight">{articles[0].title}</h4>
                      <span className="text-sm font-medium text-stone-500 bg-stone-200 px-3 py-1 rounded-full">{articles[0].category?.name || 'Uncategorized'}</span>
                    </div>
                  </Link>
                </div>
              )}

              {/* Sidebar Articles (Spans 11-16) */}
              <div className="md:col-span-6 flex flex-col gap-12 md:mt-32">
                {articles.slice(1, 3).map((article, i) => (
                  <div key={article.id} className="flex flex-col group cursor-pointer" data-cursor="read">
                    <Link href={`/articles/${article.slug}`} className="block w-full">
                      <div className="bg-stone-300 rounded-squircle aspect-square w-full overflow-hidden relative mb-6 transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-xl">
                        <div className="absolute inset-0 flex items-center justify-center p-8">
                           <h3 className="text-stone-900 text-2xl font-serif italic text-center leading-tight">
                             {article.title}
                           </h3>
                        </div>
                      </div>
                      <div className="flex justify-between items-center px-4">
                        <h4 className="font-bold text-lg tracking-tight truncate max-w-[70%]">{article.title}</h4>
                        <span className="text-xs font-bold text-stone-600 tracking-wider uppercase">{article.author.name.split(' ')[0]}</span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

            </section>
          ) : (
            <div className="py-32 text-center">
              <h3 className="text-3xl font-serif italic text-stone-400">The archive is currently empty.</h3>
            </div>
          )}

        </main>
      </div>
    </>
  );
}
