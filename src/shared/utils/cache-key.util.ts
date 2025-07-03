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

export async function deleteKeysByPattern(client: RedisClientType, pattern: string) {
  const keys: string[] = [];
  for await (const key of client.scanIterator({ MATCH: pattern })) {
    keys.push(String(key));
  }
  if (keys.length) {
    await client.del(keys);
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