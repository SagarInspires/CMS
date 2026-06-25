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
    <div className="relative min-h-screen bg-[#050505] flex items-center justify-center overflow-hidden font-sans selection:bg-white/20 selection:text-white">
      
      {/* --- Fluid Ethereal Background Blobs --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/30 rounded-full mix-blend-screen filter blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/20 rounded-full mix-blend-screen filter blur-[150px] animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[800px] h-[800px] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[150px] animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* --- Main Content Container --- */}
      <div className="relative z-10 w-full max-w-[440px] px-6 animate-fade-in-up">
        
        {/* Floating Glassmorphism Panel */}
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] p-10 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          
          <div className="mb-12 text-center">
            <Link href="/" className="inline-block text-3xl font-serif font-bold italic tracking-tighter text-white mb-2 hover:opacity-80 transition-opacity">
              e.
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white/90">Welcome back</h1>
            <p className="text-sm text-white/40 mt-2 font-medium">Authenticate to access the studio</p>
          </div>
          
          {isVerified && (
            <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-2xl text-center backdrop-blur-md">
              Email verified! You can now log in.
            </div>
          )}

          {state?.error && (
            <div role="alert" className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl text-center backdrop-blur-md animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
              <p className="font-medium">{state.error}</p>
              {state.needsVerification && (
                <Link href="/resend-verification" className="inline-block mt-2 font-bold underline underline-offset-4 hover:text-red-300">
                  Resend verification email
                </Link>
              )}
            </div>
          )}

          <div className="mb-8">
            <GoogleSignInButton context="signin" />
          </div>

          <div className="relative mb-8 flex items-center justify-center">
            <div className="absolute w-full border-t border-white/[0.08]" />
            <span className="relative px-4 bg-transparent text-white/30 text-xs font-bold uppercase tracking-widest backdrop-blur-3xl rounded-full">Or continue with email</span>
          </div>

          <form action={formAction} className="space-y-6">
            <div className="space-y-4">
              <div>
                <input 
                  name="email" 
                  type="email" 
                  required 
                  className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all placeholder:text-white/20 text-sm font-medium"
                  placeholder="Email address"
                />
              </div>
              <div>
                <input 
                  name="password" 
                  type="password" 
                  required 
                  className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all placeholder:text-white/20 text-sm font-medium"
                  placeholder="Password"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isPending}
              className="w-full py-4 mt-4 bg-gradient-to-r from-white to-white/90 text-black font-bold tracking-tight rounded-2xl hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {isPending ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-10 text-center text-sm text-white/40 font-medium">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-white hover:text-white/80 font-bold transition-colors">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
