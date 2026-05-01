import React, { useState } from 'react';
import Layout from '../../components/layout/Layout';
import Hero from '../../components/ui/Hero';
import { Features, ProblemSolution } from '../../components/ui/Features';
import MobilePreviewModal from '../../components/ui/MobilePreviewModal';
import AboutSection from './AboutSection';
import ContactSection from './ContactSection';

const Home = () => {
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);

  return (
    <Layout>
      <Hero onOpenMobilePreview={() => setIsMobilePreviewOpen(true)} />
      <ProblemSolution />
      <Features />
      <AboutSection />
      <ContactSection />

      <MobilePreviewModal 
        isOpen={isMobilePreviewOpen} 
        onClose={() => setIsMobilePreviewOpen(false)} 
      />
    </Layout>
  );
};

export default Home;
