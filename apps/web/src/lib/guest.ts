import type { ParticipantIdentity, RoomRole } from '@pairly/contracts';

const ADJECTIVES = [
  'Swift',
  'Clever',
  'Brave',
  'Bright',
  'Calm',
  'Daring',
  'Eager',
  'Gentle',
  'Happy',
  'Jolly',
  'Keen',
  'Lively',
  'Noble',
  'Quick',
  'Radiant',
  'Silent',
  'Vibrant',
  'Warm',
  'Wild',
  'Zealous',
];

const ANIMALS = [
  'Fox',
  'Otter',
  'Falcon',
  'Panda',
  'Wolf',
  'Lynx',
  'Hawk',
  'Badger',
  'Dolphin',
  'Eagle',
  'Koala',
  'Leopard',
  'Raven',
  'Seal',
  'Tiger',
  'Owl',
  'Cheetah',
  'Jaguar',
  'Penguin',
  'Robin',
];

const CURATED_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f43f5e', // rose
  '#14b8a6', // teal
  '#6366f1', // indigo
];

/**
 * Creates a randomized guest identity per SRS FR-ROOM-03.
 * Guests receive a temporary identity with display name, avatar, and color.
 */
export function generateGuestIdentity(
  role: RoomRole = 'HOST',
  customName?: string
): ParticipantIdentity {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const color = CURATED_COLORS[Math.floor(Math.random() * CURATED_COLORS.length)]!;
  const id = `guest_${Math.random().toString(36).slice(2, 10)}`;
  const cleanName = customName?.trim();

  return {
    id,
    displayName: cleanName || `${adj} ${animal}`,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`,
    color,
    role,
    isGuest: true,
  };
}
