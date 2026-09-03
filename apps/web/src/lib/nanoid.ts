import crypto from 'crypto';

const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

/**
 * Generates an unguessable, URL-safe, human-friendly short code.
 * Follows FR-ROOM-02 requirements.
 */
export function generateRoomCode(length = 8): string {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return `${result.slice(0, 4)}-${result.slice(4)}`;
}
