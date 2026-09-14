import React from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { InteractiveProductDemo } from '../components/landing/InteractiveProductDemo';
import { FeatureGrid } from '../components/landing/FeatureGrid';
import { ArchitectureSection } from '../components/landing/ArchitectureSection';
import { FAQSection } from '../components/landing/FAQSection';
import { FinalCTASection } from '../components/landing/FinalCTASection';

interface HomePageProps {
  searchParams?: {
    room?: string;
  };
}

export default function HomePage({ searchParams }: HomePageProps) {
  return (
    <div className="flex flex-col w-full">
      <HeroSection initialRoomId={searchParams?.room} />
      <InteractiveProductDemo />
      <FeatureGrid />
      <ArchitectureSection />
      <FAQSection />
      <FinalCTASection />
    </div>
  );
}
