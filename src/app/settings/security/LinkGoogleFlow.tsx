'use client';

import { useState } from 'react';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { verifyPasswordForLink } from './actions';

interface LinkGoogleFlowProps {
  hasPassword: boolean;
}

export function LinkGoogleFlow({ hasPassword }: LinkGoogleFlowProps) {
  const [isUnlocked, setIsUnlocked] = useState(!hasPassword);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsPending(true);

    try {
      const result = await verifyPasswordForLink(password);
      if (result.success) {
        setIsUnlocked(true);
      } else {
        setError(result.error || 'Incorrect password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsPending(false);
    }
  }

  if (isUnlocked) {
    return (
      <div className="w-64">
        <GoogleSignInButton 
          loginUri="/api/auth/google/link" 
          context="use"
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded border border-gray-200 w-full max-w-sm">
      <p className="text-sm text-gray-700 mb-3 font-medium">Verify your password to link Google</p>
      <form onSubmit={handleUnlock} className="flex gap-2">
        <input 
          type="password" 
          required 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Current Password" 
          className="flex-1 min-w-0 p-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button 
          type="submit" 
          disabled={isPending}
          className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
        >
          {isPending ? 'Verifying...' : 'Verify'}
        </button>
      </form>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
