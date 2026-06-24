'use client';

import { useActionState, useEffect, useState } from 'react';
import { login } from './actions';
import Link from 'next/link';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVerified(true);
    }
  }, []);

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex w-1/2 bg-secondary/30 border-r border-border items-center justify-center p-12">
        <div className="max-w-md">
          <Link href="/" className="inline-block text-2xl font-serif font-bold mb-8 hover:text-primary transition-colors">
            EditorialFlow.
          </Link>
          <h2 className="text-4xl font-serif font-bold leading-[1.2] mb-6">
            Welcome back to the studio.
          </h2>
          <p className="text-muted-foreground font-serif text-lg leading-relaxed">
            Continue where you left off. Access your drafts, manage your publications, and engage with your audience.
          </p>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[400px]">
          <h1 className="text-3xl font-serif font-bold mb-8 text-foreground lg:hidden">
            EditorialFlow.
          </h1>
          
          <div className="mb-10">
            <h2 className="text-2xl font-semibold mb-2">Sign In</h2>
            <p className="text-sm text-muted-foreground">Enter your credentials to access your account.</p>
          </div>
          
          {isVerified && (
            <div className="mb-6 p-4 bg-primary/10 text-primary text-sm border border-primary/20">
              Email verified successfully! You can now log in.
            </div>
          )}

          {state?.error && (
            <div role="alert" className="mb-6 p-4 bg-destructive/10 text-destructive text-sm border border-destructive/20">
              <p className="font-medium">{state.error}</p>
              {state.needsVerification && (
                <Link href="/resend-verification" className="inline-block mt-2 font-medium underline underline-offset-4 hover:text-destructive/80">
                  Resend verification email
                </Link>
              )}
            </div>
          )}

          <div className="mb-8">
            <GoogleSignInButton context="signin" />
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-semibold">
              <span className="bg-background px-4 text-muted-foreground">Or</span>
            </div>
          </div>

          <form action={formAction} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Email</label>
              <input 
                name="email" 
                type="email" 
                required 
                className="w-full p-3 border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/50"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Password</label>
              <input 
                name="password" 
                type="password" 
                required 
                className="w-full p-3 border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <button 
              type="submit" 
              disabled={isPending}
              className="w-full py-3 px-4 bg-foreground text-background font-medium hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 mt-2"
            >
              {isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-10 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-foreground hover:text-primary hover:underline underline-offset-4 font-semibold transition-colors">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
