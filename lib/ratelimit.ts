import { NextRequest } from 'next/server';

const localStore = new Map<string, number[]>();
const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 60 * 1000;

function localRateLimit(ip: string): { success: boolean; remaining: number } {
  const now = Date.now();
  const timestamps = (localStore.get(ip) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) {
    return { success: false, remaining: 0 };
  }

  timestamps.push(now);
  localStore.set(ip, timestamps);

  return {
    success: true,
    remaining: MAX_REQUESTS - timestamps.length,
  };
}

async function upstashRateLimit(ip: string): Promise<{ success: boolean; remaining: number }> {
  const { Redis } = await import('@upstash/redis');
  const { Ratelimit } = await import('@upstash/ratelimit');

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(MAX_REQUESTS, '1 h'),
    analytics: false,
  });

  const result = await ratelimit.limit(ip);
  return { success: result.success, remaining: result.remaining };
}

export async function checkRateLimit(req: NextRequest): Promise<{ success: boolean; remaining: number }> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? '127.0.0.1';

  const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!hasUpstash) {
    return localRateLimit(ip);
  }

  try {
    return await upstashRateLimit(ip);
  } catch (error) {
    console.warn('Upstash rate limit failed, using local fallback:', error);
    return localRateLimit(ip);
  }
}
