import { getLatestPublishedArticles } from '@/lib/public-articles';
import { verifySession } from '@/lib/auth/session';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { CustomCursor } from '@/components/CustomCursor';
import { ThemeToggle } from '@/components/ThemeToggle';

export const revalidate = 60; // Cache page for 60 seconds

export default async function Home() {
  const session = await verifySession();
  const articles = await getLatestPublishedArticles(4);

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
              <ThemeToggle />
              {session?.isAuth ? (
                <Link href="/dashboard" className="ml-2 px-5 py-2 text-sm font-bold bg-gradient-to-r from-foreground to-foreground/90 text-background rounded-full hover:scale-[1.02] transition-transform flex items-center gap-2">
                  Dashboard <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </Link>
              ) : (
                <Link href="/login" className="ml-2 px-5 py-2 text-sm font-bold bg-gradient-to-r from-foreground to-foreground/90 text-background rounded-full hover:scale-[1.02] transition-transform flex items-center gap-2">
                  Sign In <span className="w-2 h-2 rounded-full bg-background"></span>
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="relative z-10 w-full pt-40 md:pt-48 pb-32 px-6 md:px-12">
          
          {/* Hero Statement */}
          <section className="max-w-[90vw] mx-auto text-center mb-32 flex flex-col items-center animate-fade-in-up">
            <h2 className="text-sm font-bold tracking-tight mb-8 text-foreground/40 uppercase tracking-widest">editorial.flow</h2>
            <h1 className="text-[3rem] sm:text-[5rem] md:text-[6.5rem] lg:text-[8rem] font-sans font-bold tracking-tighter leading-[0.95] text-foreground">
              We shape <span className="font-serif italic font-normal tracking-tight text-foreground/80">your stories</span><br/>
              into <span className="font-serif italic font-normal tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">digital legacies.</span>
            </h1>
            
            {/* Scroll indicator */}
            <div className="mt-24 animate-bounce opacity-50">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4V20M12 20L6 14M12 20L18 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </section>

          {/* Asymmetrical Grid Showcase */}
          {articles.length > 0 ? (
            <section className="grid grid-cols-1 md:grid-cols-16 gap-6 w-full animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              
              {/* Feature Article (Spans 1-10) */}
              {articles[0] && (
                <div className="md:col-span-10 flex flex-col group cursor-pointer" data-cursor="read">
                  <Link href={`/articles/${articles[0].slug}`} className="block w-full">
                    <div className="bg-glass/[0.03] backdrop-blur-3xl border border-glass/[0.08] rounded-squircle aspect-square md:aspect-[4/3] w-full overflow-hidden relative mb-6 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_0_40px_rgba(var(--glass-base),0.05)]">
                      <div className="absolute inset-0 flex items-center justify-center p-12">
                         <h3 className="text-foreground text-4xl md:text-6xl font-serif italic text-center leading-tight">
                           &quot;{articles[0].title}&quot;
                         </h3>
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-4">
                      <h4 className="font-bold text-xl tracking-tight text-foreground/90">{articles[0].title}</h4>
                      <span className="text-sm font-bold tracking-widest text-foreground/40 uppercase bg-glass/[0.05] border border-glass/[0.1] px-4 py-1.5 rounded-full">{articles[0].category?.name || 'Uncategorized'}</span>
                    </div>
                  </Link>
                </div>
              )}

              {/* Sidebar Articles (Spans 11-16) */}
              <div className="md:col-span-6 flex flex-col gap-12 md:mt-32">
                {articles.slice(1, 3).map((article, i) => (
                  <div key={article.id} className="flex flex-col group cursor-pointer" data-cursor="read">
                    <Link href={`/articles/${article.slug}`} className="block w-full">
                      <div className="bg-glass/[0.02] backdrop-blur-xl border border-glass/[0.05] rounded-[2.5rem] aspect-square w-full overflow-hidden relative mb-6 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_0_30px_rgba(var(--glass-base),0.03)] group-hover:bg-glass/[0.04]">
                        <div className="absolute inset-0 flex items-center justify-center p-8">
                           <h3 className="text-foreground/80 text-2xl font-serif italic text-center leading-tight group-hover:text-foreground transition-colors">
                             {article.title}
                           </h3>
                        </div>
                      </div>
                      <div className="flex justify-between items-center px-4">
                        <h4 className="font-bold text-lg tracking-tight text-foreground/80 truncate max-w-[70%]">{article.title}</h4>
                        <span className="text-xs font-bold text-foreground/30 tracking-wider uppercase">{article.author.name.split(' ')[0]}</span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

            </section>
          ) : (
            <div className="py-32 text-center animate-fade-in-up">
              <h3 className="text-3xl font-serif italic text-foreground/30">The archive is currently empty.</h3>
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
