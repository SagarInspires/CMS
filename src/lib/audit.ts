import { prisma } from './prisma';

export type AuthAction = 
  | 'REGISTRATION_REQUESTED'
  | 'VERIFICATION_SUCCEEDED'
  | 'VERIFICATION_FAILED'
  | 'VERIFICATION_RESENT'
  | 'ACCOUNT_ACTIVATED'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'GOOGLE_SIGNUP_SUCCEEDED'
  | 'GOOGLE_LOGIN_SUCCEEDED'
  | 'GOOGLE_LOGIN_FAILED'
  | 'GOOGLE_LINK_SUCCEEDED'
  | 'GOOGLE_LINK_FAILED'
  | 'GOOGLE_UNLINK_SUCCEEDED';

interface LogAuthEventInput {
  action: AuthAction;
  entityId: string; // Typically the user ID or email
  entityType?: 'USER' | 'EMAIL';
  actorId?: string; // If known
  metadata?: Record<string, any>;
  ipAddress?: string;
}

/**
 * Creates an audit log entry for authentication events.
 * NEVER log passwords, raw tokens, or session cookies in the metadata.
 */
export async function logAuthEvent(input: LogAuthEventInput) {
  try {
    // Ensure we don't accidentally log sensitive data if passed in metadata
    const safeMetadata = { ...input.metadata };
    if ('password' in safeMetadata) delete safeMetadata.password;
    if ('token' in safeMetadata) delete safeMetadata.token;
    if ('rawToken' in safeMetadata) delete safeMetadata.rawToken;
    
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entityId: input.entityId,
        entityType: input.entityType || 'USER',
        actorId: input.actorId,
        metadata: Object.keys(safeMetadata).length > 0 ? safeMetadata : undefined,
        ipAddress: input.ipAddress,
      },
    });
  } catch (error) {
    // We swallow audit log errors so they don't break the main flow, 
    // but in production these should be sent to an error tracking service
    console.error('Failed to write audit log:', error);
  }
}
