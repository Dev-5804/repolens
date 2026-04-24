import { RepoAnalysisData } from './types';

// Simple in-memory fallback cache to allow app to run without Redis setup
const memoryCache = new Map<string, { data: RepoAnalysisData; expiresAt: number }>();

export async function getCachedAnalysis(repoKey: string): Promise<RepoAnalysisData | null> {
  // In a real implementation with Upstash Redis, you would do:
  // const redis = new Redis(process.env.REDIS_URL);
  // const cached = await redis.get(`repo:${repoKey}`);
  // return cached ? JSON.parse(cached) : null;

  const cached = memoryCache.get(repoKey);
  if (cached) {
    if (Date.now() < cached.expiresAt) {
      return cached.data;
    } else {
      memoryCache.delete(repoKey);
    }
  }
  return null;
}

export async function setCachedAnalysis(repoKey: string, data: RepoAnalysisData): Promise<void> {
  // In a real implementation with Upstash Redis, you would do:
  // const redis = new Redis(process.env.REDIS_URL);
  // await redis.set(`repo:${repoKey}`, JSON.stringify(data), 'EX', ttl);

  const ttl = parseInt(process.env.CACHE_TTL || '86400', 10);
  memoryCache.set(repoKey, {
    data,
    expiresAt: Date.now() + (ttl * 1000),
  });
}
