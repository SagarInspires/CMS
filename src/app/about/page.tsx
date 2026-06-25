import Link from 'next/link';
import { CustomCursor } from '@/components/CustomCursor';
import { verifySession } from '@/lib/auth/session';
import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata = {
  title: 'About | EditorialFlow',
  description: 'The manifesto and architecture behind EditorialFlow CMS.',
};

export default async function AboutPage() {
  const session = await verifySession();

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

        <main className="relative z-10 w-full max-w-4xl mx-auto px-6 md:px-12 pt-48 pb-32">
          
          <div className="mb-24 animate-fade-in-up">
            <h1 className="text-[4rem] md:text-[6rem] font-sans font-bold tracking-tighter leading-[0.95] text-foreground mb-8">
              A return to <br/><span className="font-serif italic font-normal tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">focused</span> writing.
            </h1>
          </div>

          <article className="prose prose-stone prose-lg md:prose-xl max-w-none prose-headings:font-sans prose-headings:tracking-tighter prose-headings:text-foreground prose-p:font-sans prose-p:leading-relaxed prose-p:tracking-tight prose-p:text-foreground/80 prose-a:text-foreground prose-strong:text-foreground animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-2xl md:text-3xl font-medium leading-snug mb-16 text-foreground/90">
              In an era of endlessly bloated content management systems, clunky visual builders, and intrusive distractions, the pure act of writing has been lost. EditorialFlow was built from the ground up to restore that focus. 
            </p>
            
            <p>
              We believe that the tool you use to shape your thoughts should disappear into the background. Our editor provides a frictionless, block-based writing canvas that supports auto-saving, robust revision history, and seamless inline commenting.
            </p>

            <div className="my-20 py-12 border-y border-glass/[0.08]">
              <p className="text-3xl md:text-5xl font-serif italic text-foreground leading-tight text-center">
                &quot;A tool should not dictate how you write. It should simply hold the space for your ideas to breathe.&quot;
              </p>
            </div>

            <h2 className="text-4xl">Engineered for Production</h2>
            
            <p>
              Underneath the minimal aesthetic is a highly sophisticated, enterprise-ready architecture. We built EditorialFlow on top of modern, highly scalable technologies:
            </p>

            <ul className="space-y-6 list-none pl-0 my-12">
              <li className="flex gap-6 items-start">
                <span className="font-serif italic text-3xl text-foreground/30">01.</span>
                <span className="pt-2"><strong>Next.js & React Server Components:</strong> Delivering incredibly fast page loads with optimal SEO through static generation.</span>
              </li>
              <li className="flex gap-6 items-start">
                <span className="font-serif italic text-3xl text-foreground/30">02.</span>
                <span className="pt-2"><strong>PostgreSQL & Prisma:</strong> Ensuring absolute data integrity, strict relational schemas, and complex querying capabilities.</span>
              </li>
              <li className="flex gap-6 items-start">
                <span className="font-serif italic text-3xl text-foreground/30">03.</span>
                <span className="pt-2"><strong>Vercel Blob Storage:</strong> Globally distributed, highly available edge storage for rich media and photography.</span>
              </li>
              <li className="flex gap-6 items-start">
                <span className="font-serif italic text-3xl text-foreground/30">04.</span>
                <span className="pt-2"><strong>Docker:</strong> Containerized for ultimate portability, allowing deployment to Render, AWS, or any Linux server.</span>
              </li>
            </ul>

          </article>
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
