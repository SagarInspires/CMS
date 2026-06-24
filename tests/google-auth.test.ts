import { describe, it, expect } from 'vitest';
import { googleVerifier } from '../src/lib/auth/google';

describe('Google Identity Verifier (Test Mock)', () => {
  it('Valid Google identity returns normalized mock payload', async () => {
    const result = await googleVerifier.verify('test-e2e-google-token');
    
    expect(result.sub).toBe('mock-google-sub-12345');
    expect(result.email).toBe('test-google@editorialflow.local');
    expect(result.name).toBe('Test Google User');
  });

  it('Unverified Google email is rejected', async () => {
    await expect(googleVerifier.verify('test-e2e-google-token-unverified'))
      .rejects.toThrow('Google email is not verified');
  });

  it('Invalid Google credential throws generic invalid error', async () => {
    await expect(googleVerifier.verify('completely-invalid-token'))
      .rejects.toThrow('Invalid Google credential');
  });

  it('Duplicate Google token returns predefined duplicate email for testing linking logic', async () => {
    const result = await googleVerifier.verify('test-e2e-google-token-duplicate');
    
    expect(result.sub).toBe('mock-google-sub-duplicate');
    expect(result.email).toBe('admin@editorialflow.local');
  });
});
