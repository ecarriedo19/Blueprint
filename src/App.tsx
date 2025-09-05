import React from 'react';
import { useState } from 'react';
import Navigation from './components/Navigation';
import AuthModal from './components/AuthModal';
import StripeCheckout from './components/StripeCheckout';
import Hero from './components/Hero';
import TrustedBy from './components/TrustedBy';
import Features from './components/Features';
import AIWizard from './components/AIWizard';
import Dashboard from './components/Dashboard';
import Integrations from './components/Integrations';
import Pricing from './components/Pricing';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import DashboardMain from './components/DashboardMain';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleAuthClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleAuthClose = () => {
    setIsAuthModalOpen(false);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setIsAuthModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {isLoggedIn ? (
        <DashboardMain />
      ) : (
        <>
          <Navigation onAuthClick={handleAuthClick} />
          <AuthModal isOpen={isAuthModalOpen} onClose={handleAuthClose} onLoginSuccess={handleLoginSuccess} />
          <Hero onAuthClick={handleAuthClick} />
          <TrustedBy />
          <Features />
          <AIWizard />
          <Dashboard />
          <Integrations />
          <Pricing />
          <FinalCTA onAuthClick={handleAuthClick} />
          <Footer />
        </>
      )}
    </div>
  );
}

export default App;