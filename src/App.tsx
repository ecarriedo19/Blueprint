import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCurrentUser } from './utils/queries';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProjectProvider } from './contexts/ProjectState';
import { QuoteProvider } from './contexts/QuoteContext';
import { VendorProvider } from './contexts/VendorContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotificationMutationsProvider } from './contexts/NotificationMutations';
import { TeamMutationsProvider } from './contexts/TeamMutations';

import Toast from './components/Toast';
import ConfirmationModal from './components/ConfirmationModal';
import Navigation from './components/Navigation';
import AuthModal from './components/AuthModal';
import Hero from './components/Hero';
import TrustedBy from './components/TrustedBy';
import Features from './components/Features';
import AIWizard from './components/AIWizard';
import Integrations from './components/Integrations';
import Pricing from './components/Pricing';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import DashboardLayout from './components/DashboardLayout';
import AcceptInvitePage from './components/AcceptInvitePage';
import OnboardingPage from './components/OnboardingPage';
import PricingPage from './components/PricingPage';
import SubscriptionSuccessModal from './components/SubscriptionSuccessModal';
import SubscribeCancelPage from './components/SubscribeCancelPage';
import UpdatePaymentPage from './components/UpdatePaymentPage';
import ResubscribePage from './components/ResubscribePage';
import ComponentShowcase from './components/ComponentShowcase';



// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: 1,
    },
  },
});

// Separate component to access AppContext
function AppContent() {
  const { confirmationModal, hideConfirmationModal } = useApp();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState('Company Co');
  const [toast, setToast] = useState<{ message: string; isVisible: boolean; type: 'success' | 'error' }>({ 
    message: '', 
    isVisible: false, 
    type: 'success' 
  });
  const [subscriptionSuccessModal, setSubscriptionSuccessModal] = useState<{ isOpen: boolean; sessionId?: string }>({
    isOpen: false,
    sessionId: undefined
  });

  // Use TanStack Query for user authentication state
  const { data: currentUser } = useCurrentUser();
  const isLoggedIn = !!currentUser;

  // Check if user needs to be redirected based on subscription status
  const needsSubscriptionRedirect = () => {
    if (!currentUser) return null;
    
    const status = currentUser.subscriptionStatus;
    if (status === 'past_due') return '/update-payment';
    if (status === 'canceled') return '/resubscribe';
    
    return null;
  };

  const subscriptionRedirect = needsSubscriptionRedirect();

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, isVisible: true, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  // Auth is now handled by the useCurrentUser hook

  useEffect(() => {
    // Fetch company name when user is logged in
    if (isLoggedIn) {
      const fetchCompanyProfile = async () => {
        try {
          const res = await fetch('/api/company-profile', {
            credentials: 'include'
          });
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          const data = await res.json();
          if (data.company_name) {
            setCompanyName(data.company_name);
          } else {
            throw new Error('Company name not found in response');
          }
        } catch (err) {
          console.error('Error fetching company name:', err);
          showToast('Failed to load company profile', 'error');
        }
      };

      fetchCompanyProfile();
    }
  }, [isLoggedIn, showToast]);

  // Handle subscription success modal
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    // Check if we're on the subscribe-success route with a session_id
    if (window.location.pathname === '/subscribe-success' && sessionId && isLoggedIn) {
      setSubscriptionSuccessModal({
        isOpen: true,
        sessionId: sessionId
      });
      
      // Clear the URL parameters to prevent modal from showing on refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [isLoggedIn]);

  const handleCloseSuccessModal = () => {
    setSubscriptionSuccessModal({ isOpen: false, sessionId: undefined });
  };

  const updateCompanyName = async (newName: string) => {
    if (!newName.trim()) {
      showToast('Company name cannot be empty', 'error');
      return;
    }
    
    try {
      const response = await fetch('/api/company-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: newName.trim() }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setCompanyName(newName.trim());
        showToast('Company name updated successfully!');
      } else {
        showToast(data.error || 'Failed to update company name', 'error');
      }
    } catch (err) {
      console.error('Error updating company name:', err);
      showToast('Failed to update company name. Please try again.', 'error');
    }
  };

  const handleAuthClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleAuthClose = () => {
    setIsAuthModalOpen(false);
  };

  const handleLoginSuccess = () => {
    setIsAuthModalOpen(false);
    // Invalidate the current user query to refetch user data
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all cached data and refetch user (which will return null)
      queryClient.clear();
      setCompanyName('Company Co');
    }
  };

  const handleUserUpdated = useCallback(() => {
    // Invalidate current user query to trigger refetch with updated subscription status
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    // Also invalidate subscription details to get updated plan information
    queryClient.invalidateQueries({ queryKey: ['subscription-details'] });
    console.log('🔄 User data and subscription details invalidated due to WebSocket update');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
        type={toast.type}
      />
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.confirmText}
        cancelText={confirmationModal.cancelText}
        type={confirmationModal.type}
        onConfirm={confirmationModal.onConfirm}
        onCancel={hideConfirmationModal}
      />
      <SubscriptionSuccessModal
        isOpen={subscriptionSuccessModal.isOpen}
        onClose={handleCloseSuccessModal}
        sessionId={subscriptionSuccessModal.sessionId}
      />
      
      <Routes>
        {/* Public route for accepting invitations */}
        <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
        
        {/* Subscription lifecycle routes */}
        <Route path="/update-payment" element={<UpdatePaymentPage />} />
        <Route path="/resubscribe" element={<ResubscribePage />} />
        
        {/* Subscription routes - accessible to both logged in and logged out users */}
        <Route path="/pricing" element={<PricingPage />} />
        
        {/* Component Showcase - Phase 1 Testing */}
        <Route path="/showcase" element={<ComponentShowcase />} />
        
        <Route path="/subscribe-success" element={
          isLoggedIn ? (
            // Don't redirect to subscription pages when coming from successful payment
            // The presence of session_id means payment was successful, so proceed normally
            !currentUser?.hasCompletedOnboarding ? (
              <TeamMutationsProvider>
                <OnboardingPage 
                  companyName={companyName}
                  updateCompanyName={updateCompanyName}
                  currentUser={currentUser}
                  onComplete={() => {
                    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
                  }}
                />
              </TeamMutationsProvider>
            ) : (
              <NotificationMutationsProvider>
                <NotificationProvider userId={currentUser?.id || null} onUserUpdated={handleUserUpdated}>
                  <DashboardLayout 
                    companyName={companyName} 
                    updateCompanyName={updateCompanyName}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                  />
                </NotificationProvider>
              </NotificationMutationsProvider>
            )
          ) : (
            <>
              <Navigation onAuthClick={handleAuthClick} />
              <AuthModal isOpen={isAuthModalOpen} onClose={handleAuthClose} onLoginSuccess={handleLoginSuccess} />
              <Hero />
              <TrustedBy />
              <Features />
              <AIWizard />
              <Integrations />
              <Pricing />
              <FinalCTA />
              <Footer />
            </>
          )
        } />
        <Route path="/subscribe-cancel" element={<SubscribeCancelPage />} />
        
        {/* Onboarding route - accessible only to logged in users who haven't completed onboarding */}
        <Route path="/onboarding" element={
          isLoggedIn ? (
            // Check subscription redirect first
            subscriptionRedirect ? (
              subscriptionRedirect === '/update-payment' ? <UpdatePaymentPage /> : <ResubscribePage />
            ) : !currentUser?.hasCompletedOnboarding ? (
              <TeamMutationsProvider>
                <OnboardingPage 
                  companyName={companyName}
                  updateCompanyName={updateCompanyName}
                  currentUser={currentUser}
                  onComplete={() => {
                    // Invalidate current user query to refetch user data with updated onboarding status
                    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
                  }}
                />
              </TeamMutationsProvider>
            ) : (
              // If already completed onboarding, redirect to dashboard
              <DashboardLayout 
                companyName={companyName} 
                updateCompanyName={updateCompanyName}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            )
          ) : (
            // If not logged in, show marketing site
            <>
              <Navigation onAuthClick={handleAuthClick} />
              <AuthModal isOpen={isAuthModalOpen} onClose={handleAuthClose} onLoginSuccess={handleLoginSuccess} />
              <Hero />
              <TrustedBy />
              <Features />
              <AIWizard />
              <Integrations />
              <Pricing />
              <FinalCTA />
              <Footer />
            </>
          )
        } />
        
        {/* Main application routes */}
        <Route path="/*" element={
          isLoggedIn ? (
            // Check if user needs subscription redirect first
            subscriptionRedirect ? (
              subscriptionRedirect === '/update-payment' ? <UpdatePaymentPage /> : <ResubscribePage />
            ) : (
              // Check if user needs to complete onboarding
              !currentUser?.hasCompletedOnboarding ? (
                <TeamMutationsProvider>
                  <OnboardingPage 
                    companyName={companyName}
                    updateCompanyName={updateCompanyName}
                    currentUser={currentUser}
                    onComplete={() => {
                      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
                    }}
                  />
                </TeamMutationsProvider>
              ) : (
                <NotificationMutationsProvider>
                  <NotificationProvider userId={currentUser?.id || null} onUserUpdated={handleUserUpdated}>
                    <DashboardLayout 
                      companyName={companyName} 
                      updateCompanyName={updateCompanyName}
                      currentUser={currentUser}
                      onLogout={handleLogout}
                    />
                  </NotificationProvider>
                </NotificationMutationsProvider>
              )
            )
          ) : (
            <>
              <Navigation onAuthClick={handleAuthClick} />
              <AuthModal isOpen={isAuthModalOpen} onClose={handleAuthClose} onLoginSuccess={handleLoginSuccess} />
              <Hero />
              <TrustedBy />
              <Features />
              <AIWizard />
              <Integrations />
              <Pricing />
              <FinalCTA />
              <Footer />
            </>
          )
        } />
      </Routes>
    </div>
  );
}

// Main App component with providers
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <ThemeProvider>
          <ProjectProvider>
            <QuoteProvider>
              <VendorProvider>
                <Router>
                  <AppContent />
                </Router>
              </VendorProvider>
            </QuoteProvider>
          </ProjectProvider>
        </ThemeProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;