import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCurrentUser } from './utils/queries';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProjectProvider } from './contexts/ProjectState';
import { QuoteProvider } from './contexts/QuoteContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotificationMutationsProvider } from './contexts/NotificationMutations';

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
import PricingPage from './components/PricingPage';
import SubscribeSuccessPage from './components/SubscribeSuccessPage';
import SubscribeCancelPage from './components/SubscribeCancelPage';

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

  // Use TanStack Query for user authentication state
  const { data: currentUser } = useCurrentUser();
  const isLoggedIn = !!currentUser;

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
      
      <Routes>
        {/* Public route for accepting invitations */}
        <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
        
        {/* Subscription routes - accessible to both logged in and logged out users */}
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/subscribe-success" element={<SubscribeSuccessPage />} />
        <Route path="/subscribe-cancel" element={<SubscribeCancelPage />} />
        
        {/* Main application routes */}
        <Route path="/*" element={
          isLoggedIn ? (
            <NotificationMutationsProvider>
              <NotificationProvider userId={currentUser?.id || null}>
                <DashboardLayout 
                  companyName={companyName} 
                  updateCompanyName={updateCompanyName}
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />
              </NotificationProvider>
            </NotificationMutationsProvider>
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
              <Router>
                <AppContent />
              </Router>
            </QuoteProvider>
          </ProjectProvider>
        </ThemeProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;