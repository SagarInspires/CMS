import { OAuth2Client } from 'google-auth-library';

export interface VerifiedGoogleIdentity {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface GoogleIdentityVerifier {
  verify(credential: string): Promise<VerifiedGoogleIdentity>;
}

class ProductionGoogleVerifier implements GoogleIdentityVerifier {
  private client: OAuth2Client;
  private clientId: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || '';
    if (process.env.NODE_ENV === 'production' && !this.clientId) {
      console.warn('GOOGLE_CLIENT_ID is not set in production');
    }
    this.client = new OAuth2Client(this.clientId);
  }

  async verify(credential: string): Promise<VerifiedGoogleIdentity> {
    if (!this.clientId) {
      throw new Error('Server misconfiguration: missing GOOGLE_CLIENT_ID');
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken: credential,
        audience: this.clientId,
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      if (!payload.email_verified) {
        throw new Error('Google email is not verified');
      }

      if (!payload.sub || !payload.email) {
        throw new Error('Missing required claims from Google');
      }

      return {
        sub: payload.sub,
        email: payload.email.toLowerCase(),
        name: payload.name,
        picture: payload.picture,
      };
    } catch (error) {
      console.error('Google token verification failed:', error);
      throw new Error('Invalid Google credential');
    }
  }
}

class TestGoogleVerifier implements GoogleIdentityVerifier {
  async verify(credential: string): Promise<VerifiedGoogleIdentity> {
    // In tests, if the token is "test-e2e-google-token", we return a mock identity
    if (credential === 'test-e2e-google-token') {
      return {
        sub: 'mock-google-sub-12345',
        email: 'test-google@editorialflow.local',
        name: 'Test Google User',
      };
    }
    
    if (credential === 'test-e2e-google-token-unverified') {
      throw new Error('Google email is not verified');
    }
    
    if (credential === 'test-e2e-google-token-duplicate') {
       return {
        sub: 'mock-google-sub-duplicate',
        email: 'admin@editorialflow.local', // To test duplicate email linking prevention
        name: 'Malicious Google User',
      };
    }

    throw new Error('Invalid Google credential');
  }
}

if (
  process.env.NODE_ENV === "production" &&
  (process.env.GOOGLE_AUTH_TEST_MODE === "true" || process.env.USE_MOCK_GOOGLE_AUTH === "true")
) {
  throw new Error(
    "Google authentication test mode cannot be enabled in production."
  );
}

export const googleVerifier: GoogleIdentityVerifier =
  process.env.NODE_ENV === 'test'
    ? new TestGoogleVerifier()
    : new ProductionGoogleVerifier();
