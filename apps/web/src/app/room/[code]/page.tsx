import type { Metadata } from 'next';
import { RoomClient } from '../../../components/room/RoomClient';

interface RoomPageProps {
  params: {
    code: string;
  };
}

export function generateMetadata({ params }: RoomPageProps): Metadata {
  return {
    title: `Room ${params.code} - Pairly Collaborative IDE`,
    description: `Pair-programming and real-time collaboration session in room ${params.code}.`,
  };
}

export default function RoomPage({ params }: RoomPageProps) {
  return <RoomClient roomCode={params.code} />;
}
