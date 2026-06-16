// src/api/services/utils.ts
export function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj['hydra:member'])) return obj['hydra:member'] as T[]
    if (Array.isArray(obj['data']))         return obj['data'] as T[]
    if (Array.isArray(obj['items']))        return obj['items'] as T[]
    if (Array.isArray(obj['results']))      return obj['results'] as T[]
    if (Array.isArray(obj['member']))       return obj['member'] as T[]
  }
  return []
}