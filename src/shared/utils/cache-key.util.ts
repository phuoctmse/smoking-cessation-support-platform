import { RedisClientType } from 'redis'

export function buildCacheKey(prefix: string, ...args: any[]): string {
  return [
    prefix,
    ...args.map((arg) =>
      typeof arg === 'object' && arg !== null
        ? JSON.stringify(arg)
        : String(arg ?? '')
    ),
  ].join(':');
}

export function buildOneCacheKey(prefix: string, id: string): string {
  return `${prefix}:one:${id}`;
}

export function buildTrackerKey(prefix: string, entityId: string): string {
  return `${prefix}:tracker:${entityId}`;
}

export async function trackCacheKey(client: RedisClientType, trackerKey: string, keyToTrack: string) {
  await client.sAdd(trackerKey, keyToTrack);
}

export async function invalidateCacheForId(client: RedisClientType, prefix: string, entityId: string) {
  const trackerKey = buildTrackerKey(prefix, entityId);
  const listCacheKey = buildCacheKey(prefix, 'byPlan', entityId);

  const keysToDelete = await client.sMembers(trackerKey);

  // Add the list key and the tracker key itself to the deletion list
  keysToDelete.push(listCacheKey, trackerKey);

  if (keysToDelete.length > 0) {
    await client.del(keysToDelete);
  }
}

export function reviveDates<T>(obj: T, dateKeys: string[]): T {
  if (Array.isArray(obj)) {
    return obj.map(item => reviveDates(item, dateKeys)) as any;
  }
  if (obj && typeof obj === 'object') {
    for (const key of dateKeys) {
      if (obj[key] && typeof obj[key] === 'string') {
        obj[key] = new Date(obj[key]);
      }
    }
    if (Array.isArray(obj['data'])) {
      obj['data'] = obj['data'].map((item: any) => reviveDates(item, dateKeys));
    }
  }
  return obj;
}