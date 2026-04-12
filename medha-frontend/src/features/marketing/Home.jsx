import React, { useState } from 'react';
import Layout from '../../components/layout/Layout';
import Hero from '../../components/ui/Hero';
import { Features, ProblemSolution } from '../../components/ui/Features';
import { Testimonials, DownloadCTA } from '../../components/ui/HowItWorks';
import MobilePreviewModal from '../../components/ui/MobilePreviewModal';

const Home = () => {
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);

  return (
    <Layout>
      <Hero onOpenMobilePreview={() => setIsMobilePreviewOpen(true)} />
      <ProblemSolution />
      <Features />
      <Testimonials />
      <DownloadCTA />

      <MobilePreviewModal 
        isOpen={isMobilePreviewOpen} 
        onClose={() => setIsMobilePreviewOpen(false)} 
      />
    </Layout>
  );
};

export default Home;
