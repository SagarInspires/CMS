'use client';

import { useEffect, useRef, useState } from 'react';

// Wait for the Google library to load
const useGoogleClient = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.google?.accounts?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.body.appendChild(script);

    return () => {
      // document.body.removeChild(script);
    };
  }, []);

  return isLoaded;
};

interface GoogleSignInButtonProps {
  loginUri?: string;
  context?: 'signin' | 'signup' | 'use';
}

export function GoogleSignInButton({ loginUri = '/api/auth/google', context = 'signin' }: GoogleSignInButtonProps) {
  const isLoaded = useGoogleClient();
  const buttonRef = useRef<HTMLDivElement>(null);
  
  // We need to inject NEXT_PUBLIC_GOOGLE_CLIENT_ID from env
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!isLoaded || !buttonRef.current || !clientId) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      login_uri: `${window.location.origin}${loginUri}`,
      ux_mode: 'redirect',
      context: context,
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      shape: 'rectangular',
      text: context === 'signup' ? 'signup_with' : 'signin_with',
      logo_alignment: 'left'
    });
  }, [isLoaded, clientId, loginUri, context]);

  if (!clientId) {
    return (
      <div className="p-3 text-sm text-yellow-800 bg-yellow-50 rounded-md border border-yellow-200">
        Google Sign-In is not configured.
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-center h-10" ref={buttonRef}>
      <span className="sr-only">Sign in with Google</span>
      {/* Loading placeholder while GIS script fetches */}
      {!isLoaded && (
        <div className="w-full h-full bg-gray-100 rounded border border-gray-300 animate-pulse" />
      )}
    </div>
  );
}

// Add the google namespace to Window for TypeScript
declare global {
  interface Window {
    google: any;
  }
}
