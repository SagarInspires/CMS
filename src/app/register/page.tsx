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
      <div className="relative min-h-screen bg-[#050505] flex items-center justify-center overflow-hidden font-sans selection:bg-white/20 selection:text-white p-4">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/20 rounded-full mix-blend-screen filter blur-[150px] animate-blob"></div>
        </div>
        <div className="relative z-10 max-w-md w-full bg-white/[0.03] backdrop-blur-3xl p-12 text-center border border-white/[0.08] rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-fade-in-up">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 mb-6 border border-emerald-500/20">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-sans font-bold tracking-tight text-white mb-4">Check your email</h1>
          <p className="text-white/60 mb-8 font-medium">{state.message}</p>
          <Link href="/login" className="inline-block px-8 py-4 bg-gradient-to-r from-white to-white/90 text-black font-bold tracking-tight rounded-2xl hover:scale-[1.02] transition-transform">
            Return to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050505] flex items-center justify-center overflow-hidden font-sans selection:bg-white/20 selection:text-white py-12">
      
      {/* --- Fluid Ethereal Background Blobs --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none fixed">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/30 rounded-full mix-blend-screen filter blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/20 rounded-full mix-blend-screen filter blur-[150px] animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[800px] h-[800px] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[150px] animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* --- Main Content Container --- */}
      <div className="relative z-10 w-full max-w-[480px] px-6 animate-fade-in-up">
        
        {/* Floating Glassmorphism Panel */}
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] p-8 md:p-10 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          
          <div className="mb-10 text-center">
            <Link href="/" className="inline-block text-3xl font-serif font-bold italic tracking-tighter text-white mb-2 hover:opacity-80 transition-opacity">
              e.
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white/90">Join the vanguard</h1>
            <p className="text-sm text-white/40 mt-2 font-medium">Create your editorial account</p>
          </div>

          <div className="mb-8">
            <GoogleSignInButton context="signup" />
          </div>

          <div className="relative mb-8 flex items-center justify-center">
            <div className="absolute w-full border-t border-white/[0.08]" />
            <span className="relative px-4 bg-transparent text-white/30 text-xs font-bold uppercase tracking-widest backdrop-blur-3xl rounded-full">Or register with email</span>
          </div>

          <form action={formAction} className="space-y-5">
            {'error' in (state || {}) && (state as any).error && (
              <div role="alert" className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl text-center backdrop-blur-md animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
                {(state as any).error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  name="name"
                  required
                  minLength={2}
                  maxLength={100}
                  defaultValue={(state as any)?.name || ''}
                  disabled={isPending}
                  className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all placeholder:text-white/20 text-sm font-medium"
                  placeholder="Full Name"
                />
              </div>

              <div>
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={(state as any)?.email || ''}
                  disabled={isPending}
                  className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all placeholder:text-white/20 text-sm font-medium"
                  placeholder="Email Address"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  minLength={12}
                  disabled={isPending}
                  className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all placeholder:text-white/20 text-sm font-medium pr-12"
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-white focus:outline-none transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  minLength={12}
                  disabled={isPending}
                  className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all placeholder:text-white/20 text-sm font-medium pr-12"
                  placeholder="Confirm Password"
                />
              </div>
            </div>

            <div className="text-xs text-white/30 font-medium text-center pt-2">
              By creating an account, you agree to our Terms of Service.
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 mt-2 bg-gradient-to-r from-white to-white/90 text-black font-bold tracking-tight rounded-2xl hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {isPending ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-white/40 font-medium">
            Already have an account?{' '}
            <Link href="/login" className="text-white hover:text-white/80 font-bold transition-colors">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
