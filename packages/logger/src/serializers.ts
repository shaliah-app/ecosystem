import safeStringify from 'fast-safe-stringify';

export function safeSerialize(obj: any, options?: { maxLength?: number }): string {
  const maxLength = options?.maxLength || 4096; // 4KB default
  try {
    const str = safeStringify(obj);
    if (str.length > maxLength) {
      return str.substring(0, maxLength) + '... (truncated)';
    }
    return str;
  } catch (err) {
    return '[SerializationError: ' + (err as Error).message + ']';
  }
}