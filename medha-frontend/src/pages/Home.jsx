import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Hero from '../components/ui/Hero';
import { Features, ProblemSolution } from '../components/ui/Features';
import { HowItWorks, Testimonials, FinalCTA } from '../components/ui/HowItWorks';
import MobileShowcase from '../components/ui/MobileShowcase';
import MobilePreviewModal from '../components/ui/MobilePreviewModal';
import LoginModal from '../components/layout/LoginModal';



const Home = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [initialRole, setInitialRole] = useState('admin');


  const openLogin = (role) => {
    setInitialRole(role);
    setIsLoginOpen(true);
  };

  return (
    <Layout>
      <Hero onOpenMobilePreview={() => setIsMobilePreviewOpen(true)} />

      
      <ProblemSolution />
      
      <Features />
      
      <MobileShowcase onOpenMobilePreview={() => setIsMobilePreviewOpen(true)} />
      
      <HowItWorks />

      
      <Testimonials />
      
      <FinalCTA />

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        initialRole={initialRole}
      />

      <MobilePreviewModal 
        isOpen={isMobilePreviewOpen} 
        onClose={() => setIsMobilePreviewOpen(false)} 
      />
    </Layout>

  );
};

export default Home;