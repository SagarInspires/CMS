import Link from 'next/link';

export const metadata = {
  title: 'About | EditorialFlow',
  description: 'The manifesto and architecture behind EditorialFlow CMS.',
};

export default function AboutPage() {
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
            <Link href="/dashboard" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">Dashboard →</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-8 py-20 md:py-32">
        <article className="prose prose-neutral dark:prose-invert prose-lg lg:prose-xl mx-auto">
          <div className="mb-16 text-center">
            <h4 className="text-sm font-bold tracking-[0.2em] uppercase text-primary mb-4">Our Manifesto</h4>
            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-foreground leading-[1.1] mb-6">
              A return to focused, beautiful writing.
            </h1>
            <p className="text-xl text-muted-foreground font-serif italic">
              EditorialFlow is a production-grade, API-first CMS engineered for performance, security, and the ultimate editorial experience.
            </p>
          </div>

          <div className="space-y-12 text-lg text-muted-foreground leading-relaxed font-serif">
            <p>
              In an era of endlessly bloated content management systems, clunky visual builders, and intrusive distractions, the pure act of writing has been lost. EditorialFlow was built from the ground up to restore that focus. 
            </p>
            
            <p>
              We believe that the tool you use to shape your thoughts should disappear into the background. Our editor provides a frictionless, block-based writing canvas that supports auto-saving, robust revision history, and seamless inline commenting.
            </p>

            <div className="my-16 pl-6 border-l-4 border-primary">
              <p className="text-2xl font-medium text-foreground italic">
                "A tool should not dictate how you write. It should simply hold the space for your ideas to breathe."
              </p>
            </div>

            <h2 className="text-3xl font-bold font-sans tracking-tight text-foreground mt-16 mb-6">
              Engineered for Production
            </h2>
            
            <p>
              Underneath the minimal aesthetic is a highly sophisticated, enterprise-ready architecture. We built EditorialFlow on top of modern, highly scalable technologies:
            </p>

            <ul className="space-y-4 font-sans text-base">
              <li className="flex items-start">
                <span className="font-bold text-foreground mr-3">01.</span>
                <span><strong className="text-foreground">Next.js & React Server Components:</strong> Delivering incredibly fast page loads with optimal SEO through static generation.</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-foreground mr-3">02.</span>
                <span><strong className="text-foreground">PostgreSQL & Prisma:</strong> Ensuring absolute data integrity, strict relational schemas, and complex querying capabilities.</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-foreground mr-3">03.</span>
                <span><strong className="text-foreground">Vercel Blob Storage:</strong> Globally distributed, highly available edge storage for rich media and photography.</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-foreground mr-3">04.</span>
                <span><strong className="text-foreground">Docker:</strong> Containerized for ultimate portability, allowing deployment to Render, AWS, or any Linux server.</span>
              </li>
            </ul>

            <h2 className="text-3xl font-bold font-sans tracking-tight text-foreground mt-16 mb-6">
              Uncompromising Security
            </h2>

            <p>
              An editorial system must be secure. Our architecture includes stateless JWT session management, robust role-based access control, Google OAuth integration, comprehensive input sanitization to prevent XSS, and Upstash Redis-backed rate limiting to defend against brute force attacks.
            </p>

            <div className="mt-20 pt-10 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
              <p className="font-sans text-sm text-muted-foreground">Ready to start publishing?</p>
              <Link href="/register" className="inline-flex h-12 items-center justify-center rounded-md bg-foreground px-8 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                Join the platform
              </Link>
            </div>
          </div>
        </article>
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
