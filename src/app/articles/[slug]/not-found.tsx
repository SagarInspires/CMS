import Link from 'next/link';

export default function ArticleNotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-6xl font-black text-primary mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-6">Article Not Found</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        This article doesn&apos;t exist or hasn&apos;t been published yet.
      </p>
      <Link href="/" className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-md hover:bg-primary/90 transition-colors">
        Return Home
      </Link>
    </div>
  );
}
