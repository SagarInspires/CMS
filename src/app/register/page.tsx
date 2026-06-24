'use client';

import { useActionState, useState } from 'react';
import { registerUser } from './actions';
import Link from 'next/link';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerUser, null);
  const [showPassword, setShowPassword] = useState(false);

  if (state?.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card p-12 text-center border border-border shadow-elegant">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-4">Check your email</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed font-serif">{state.message}</p>
          <Link href="/login" className="inline-block px-6 py-3 bg-foreground text-background font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
            Return to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex w-1/2 bg-secondary/30 border-r border-border items-center justify-center p-12">
        <div className="max-w-md">
          <Link href="/" className="inline-block text-2xl font-serif font-bold mb-8 hover:text-primary transition-colors">
            EditorialFlow.
          </Link>
          <h2 className="text-4xl font-serif font-bold leading-[1.2] mb-6">
            Join the editorial vanguard.
          </h2>
          <p className="text-muted-foreground font-serif text-lg leading-relaxed">
            Create an account to start drafting, collaborating, and publishing with our production-grade API-first CMS.
          </p>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[400px]">
          <div className="text-3xl font-serif font-bold mb-8 text-foreground lg:hidden">
            EditorialFlow.
          </div>
          
          <div className="mb-10">
            <h1 className="text-2xl font-semibold mb-2">Create an Account</h1>
            <p className="text-sm text-muted-foreground">Join as an Author to start publishing.</p>
          </div>

          <div className="mb-8">
            <GoogleSignInButton context="signup" />
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-semibold">
              <span className="bg-background px-4 text-muted-foreground">Or</span>
            </div>
          </div>

          <form action={formAction} className="space-y-5">
            {'error' in (state || {}) && (state as any).error && (
              <div role="alert" className="p-4 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20">
                {(state as any).error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2" htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                minLength={2}
                maxLength={100}
                defaultValue={(state as any)?.name || ''}
                disabled={isPending}
                className="w-full p-3 border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all disabled:opacity-50 placeholder:text-muted-foreground/50"
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2" htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                defaultValue={(state as any)?.email || ''}
                disabled={isPending}
                className="w-full p-3 border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all disabled:opacity-50 placeholder:text-muted-foreground/50"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  required
                  minLength={12}
                  disabled={isPending}
                  className="w-full p-3 border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all disabled:opacity-50 pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Min 12 chars. Must include uppercase, lowercase, number, and special character.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2" htmlFor="confirmPassword">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  minLength={12}
                  disabled={isPending}
                  className="w-full p-3 border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all disabled:opacity-50 pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground pt-2">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 px-4 bg-foreground text-background font-medium hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 mt-4"
            >
              {isPending ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-10 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-foreground hover:text-primary hover:underline underline-offset-4 font-semibold transition-colors">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
