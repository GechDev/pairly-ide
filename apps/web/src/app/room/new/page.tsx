import { redirect } from 'next/navigation';
import { generateRoomCode } from '../../../lib/nanoid';

/**
 * Route handler for /room/new:
 * Automatically generates an unguessable room code and redirects
 * to the collaborative workspace (FR-ROOM-01..03).
 */
export default function NewRoomRedirectPage() {
  const code = generateRoomCode();
  redirect(`/room/${code}`);
}
