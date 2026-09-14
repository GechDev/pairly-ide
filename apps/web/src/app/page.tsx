import { HeroSection } from '../components/landing/HeroSection';
import { FeatureGrid } from '../components/landing/FeatureGrid';

interface HomePageProps {
  searchParams?: {
    room?: string;
  };
}

export default function HomePage({ searchParams }: HomePageProps) {
  return (
    <div className="flex flex-col w-full">
      <HeroSection initialRoomId={searchParams?.room} />
      <FeatureGrid />
    </div>
  );
}
