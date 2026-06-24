import { NextRequest, NextResponse } from 'next/server';
import { linkGoogleAccount } from '@/app/settings/security/actions';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const result = await linkGoogleAccount(formData);

    const url = new URL('/settings/security', req.url);
    if (result.error) {
      // In a real app we'd pass this via query params or a flash session
      url.searchParams.set('error', result.error);
    } else {
      url.searchParams.set('success', 'linked');
    }
    
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const url = new URL('/settings/security', req.url);
    url.searchParams.set('error', 'Server error during linking');
    return NextResponse.redirect(url, 303);
  }
}
