import Link from 'next/link';
import { CustomCursor } from '@/components/CustomCursor';
import { verifySession } from '@/lib/auth/session';

export const metadata = {
  title: 'About | EditorialFlow',
  description: 'The manifesto and architecture behind EditorialFlow CMS.',
};

export default async function AboutPage() {
  const session = await verifySession();

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

        <main className="w-full max-w-4xl mx-auto px-6 md:px-12 pt-48 pb-32">
          
          <div className="mb-24">
            <h1 className="text-[4rem] md:text-[6rem] font-sans font-bold tracking-tighter leading-[0.95] text-black mb-8">
              A return to <br/><span className="font-serif italic font-normal tracking-tight">focused</span> writing.
            </h1>
          </div>

          <article className="prose prose-stone prose-lg md:prose-xl max-w-none prose-headings:font-sans prose-headings:tracking-tighter prose-p:font-sans prose-p:leading-relaxed prose-p:tracking-tight prose-a:text-black">
            <p className="text-2xl md:text-3xl font-medium leading-snug mb-16 text-stone-600">
              In an era of endlessly bloated content management systems, clunky visual builders, and intrusive distractions, the pure act of writing has been lost. EditorialFlow was built from the ground up to restore that focus. 
            </p>
            
            <p>
              We believe that the tool you use to shape your thoughts should disappear into the background. Our editor provides a frictionless, block-based writing canvas that supports auto-saving, robust revision history, and seamless inline commenting.
            </p>

            <div className="my-20 py-12 border-y border-stone-300">
              <p className="text-3xl md:text-5xl font-serif italic text-black leading-tight text-center">
                &quot;A tool should not dictate how you write. It should simply hold the space for your ideas to breathe.&quot;
              </p>
            </div>

            <h2 className="text-4xl">Engineered for Production</h2>
            
            <p>
              Underneath the minimal aesthetic is a highly sophisticated, enterprise-ready architecture. We built EditorialFlow on top of modern, highly scalable technologies:
            </p>

            <ul className="space-y-6 list-none pl-0 my-12">
              <li className="flex gap-6 items-start">
                <span className="font-serif italic text-3xl text-stone-400">01.</span>
                <span className="pt-2"><strong className="text-black">Next.js & React Server Components:</strong> Delivering incredibly fast page loads with optimal SEO through static generation.</span>
              </li>
              <li className="flex gap-6 items-start">
                <span className="font-serif italic text-3xl text-stone-400">02.</span>
                <span className="pt-2"><strong className="text-black">PostgreSQL & Prisma:</strong> Ensuring absolute data integrity, strict relational schemas, and complex querying capabilities.</span>
              </li>
              <li className="flex gap-6 items-start">
                <span className="font-serif italic text-3xl text-stone-400">03.</span>
                <span className="pt-2"><strong className="text-black">Vercel Blob Storage:</strong> Globally distributed, highly available edge storage for rich media and photography.</span>
              </li>
              <li className="flex gap-6 items-start">
                <span className="font-serif italic text-3xl text-stone-400">04.</span>
                <span className="pt-2"><strong className="text-black">Docker:</strong> Containerized for ultimate portability, allowing deployment to Render, AWS, or any Linux server.</span>
              </li>
            </ul>

          </article>
        </main>
      </div>
    </>
  );
}
