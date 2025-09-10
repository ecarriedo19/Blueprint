import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { checkRedirectResult } from './utils/googleAuth';
import Toast from './components/Toast';
import Navigation from './components/Navigation';
import AuthModal from './components/AuthModal';
import Hero from './components/Hero';
import TrustedBy from './components/TrustedBy';
import Features from './components/Features';
import AIWizard from './components/AIWizard';
import Dashboard from './components/Dashboard';
import Integrations from './components/Integrations';
import Pricing from './components/Pricing';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import DashboardLayout from './components/DashboardLayout';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [companyName, setCompanyName] = useState('Company Co');
  const [toast, setToast] = useState<{ message: string; isVisible: boolean; type: 'success' | 'error' }>({ 
    message: '', 
    isVisible: false, 
    type: 'success' 
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, isVisible: true, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  // Check for existing session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First check for redirect result from Google OAuth
        const redirectUser = await checkRedirectResult();
        if (redirectUser) {
          console.log('Processing redirect result:', redirectUser);
          // Handle the redirect result by calling our backend
          const response = await fetch('http://localhost:4000/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(redirectUser),
            credentials: 'include'
          });

          if (response.ok) {
            const responseData = await response.json();
            setCurrentUser(responseData.user);
            setIsLoggedIn(true);
            return;
          }
        }

        // If no redirect result, check for existing session
        const response = await fetch('http://localhost:4000/api/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.log('No existing session found:', error);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    // Fetch company name when user is logged in
    if (isLoggedIn) {
      const fetchCompanyProfile = async () => {
        try {
          const res = await fetch('http://localhost:4000/api/company-profile', {
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
      const response = await fetch('http://localhost:4000/api/company-profile', {
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

  const handleLoginSuccess = (userData?: any) => {
    setIsLoggedIn(true);
    setIsAuthModalOpen(false);
    if (userData) {
      setCurrentUser(userData);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:4000/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggedIn(false);
      setCurrentUser(null);
      setCompanyName('Company Co');
    }
  };

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
          <Toast
            message={toast.message}
            isVisible={toast.isVisible}
            onClose={hideToast}
            type={toast.type}
          />
          {isLoggedIn ? (
          <DashboardLayout 
            companyName={companyName} 
            updateCompanyName={updateCompanyName}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
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
      </Router>
    </ThemeProvider>
  );
}

export default App;