import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-6xl font-black text-primary mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-6">Page Not Found</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        We couldn&apos;t find the page you were looking for. It might have been moved, deleted, or never existed in the first place.
      </p>
      <Link href="/" className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-md hover:bg-primary/90 transition-colors">
        Return Home
      </Link>
    </div>
  );
}
