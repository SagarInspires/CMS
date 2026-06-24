import { verifySession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { unlinkGoogleAccount } from './actions';
import { LinkGoogleFlow } from './LinkGoogleFlow';
import { revalidatePath } from 'next/cache';

export default async function SecuritySettingsPage() {
  const session = await verifySession();
  if (!session?.isAuth) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { externalIdentities: true }
  });

  if (!user) {
    redirect('/login');
  }

  const hasPassword = user.passwordHash !== null;
  const googleIdentity = user.externalIdentities.find(e => e.provider === 'GOOGLE');
  const isGoogleLinked = !!googleIdentity;

  async function handleUnlink() {
    'use server';
    const result = await unlinkGoogleAccount();
    if (result.error) {
      throw new Error(result.error);
    }
    revalidatePath('/settings/security');
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Security Settings</h1>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Login Methods</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Password</h3>
              <p className="text-sm text-gray-500">
                {hasPassword 
                  ? 'You have a password set.' 
                  : 'You do not have a password set. You can only log in via Google.'}
              </p>
            </div>
            {hasPassword ? (
              <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                Active
              </span>
            ) : (
              <button disabled className="text-sm text-gray-400 cursor-not-allowed">
                Set Password (Coming Soon)
              </button>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4" />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Google Account</h3>
              <p className="text-sm text-gray-500">
                {isGoogleLinked 
                  ? 'Your Google account is connected.' 
                  : 'Connect your Google account to log in with one click.'}
              </p>
            </div>
            <div>
              {isGoogleLinked ? (
                <div className="flex flex-col items-end gap-2">
                  <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    Linked
                  </span>
                  {hasPassword && (
                    <form action={handleUnlink}>
                      <button 
                        type="submit"
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Unlink
                      </button>
                    </form>
                  )}
                  {!hasPassword && (
                    <p className="text-xs text-gray-400">Cannot unlink (only login method)</p>
                  )}
                </div>
              ) : (
                <div className="flex justify-end">
                  <LinkGoogleFlow hasPassword={hasPassword} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
