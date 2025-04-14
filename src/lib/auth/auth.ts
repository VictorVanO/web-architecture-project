import { createHash } from 'crypto';

export function extractSalt(stored: string): string {
  return stored.slice(0, 16); // or however your salt is stored
}

export function hash(str: string): string {
  return createHash('sha256').update(str).digest('hex');
}

export function compare(password: string, stored: string): boolean {
  const salt = extractSalt(stored);
  return salt + hash(salt + password) === stored;
}
