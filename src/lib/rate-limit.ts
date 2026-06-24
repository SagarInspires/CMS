import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// ------------------------------------------------------------------
// In-Memory Fallback (Development & Testing ONLY)
// ------------------------------------------------------------------
const memoryStore = new Map<string, { count: number; resetAt: number }>();

// Cleanup expired entries periodically to prevent memory leaks in dev
if (process.env.NODE_ENV !== 'production') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      if (now > entry.resetAt) {
        memoryStore.delete(key);
      }
    }
  }, 60000);
}

async function memoryRateLimit(identifier: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL SECURITY ERROR: In-memory rate limiting cannot be used in production.');
  }

  const now = Date.now();
  const entry = memoryStore.get(identifier);

  if (!entry) {
    memoryStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
  }

  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + windowMs;
    return { success: true, limit, remaining: limit - 1, reset: entry.resetAt };
  }

  entry.count += 1;
  const success = entry.count <= limit;
  const remaining = Math.max(0, limit - entry.count);
  return { success, limit, remaining, reset: entry.resetAt };
}

// ------------------------------------------------------------------
// Upstash Redis Distributed Limiter (Production)
// ------------------------------------------------------------------
let redisClient: Redis | null = null;
let upstashRatelimiters = new Map<string, Ratelimit>();

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else if (process.env.NODE_ENV === 'production') {
  throw new Error('CRITICAL SECURITY ERROR: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production for rate limiting.');
}

/**
 * Distributed sliding window rate limiter
 * @param identifier Unique identifier for the client (e.g., IP address or email)
 * @param limit Maximum number of requests allowed in the window
 * @param windowMs Time window in milliseconds
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  // Use in-memory if Redis is not configured (ONLY allowed in dev/test)
  if (!redisClient) {
    return memoryRateLimit(identifier, limit, windowMs);
  }

  // To prevent creating too many Ratelimit instances, we cache them by configuration
  const windowSeconds = Math.max(1, Math.floor(windowMs / 1000));
  const configKey = `${limit}:${windowSeconds}s`;
  
  let limiter = upstashRatelimiters.get(configKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      analytics: true,
      prefix: '@upstash/ratelimit',
    });
    upstashRatelimiters.set(configKey, limiter);
  }

  try {
    const { success, limit: max, remaining, reset } = await limiter.limit(identifier);
    return { success, limit: max, remaining, reset };
  } catch (error) {
    console.error('Rate limit error, failing open for availability:', error);
    // In a real high-security system you might fail CLOSED here. 
    // We fail open to prevent Redis outages from locking out all users.
    return { success: true, limit, remaining: 1, reset: Date.now() };
  }
}
