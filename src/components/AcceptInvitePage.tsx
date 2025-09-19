import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, XCircle, AlertCircle, Mail, Users } from 'lucide-react';
import { signInWithGoogle, checkRedirectResult } from '../utils/googleAuth';
import Button from './Button';
import Card from './Card';

interface InvitationData {
  email: string;
  role: string;
  inviterName: string;
  inviterEmail: string;
  createdAt: string;
  expiresAt: string;
}

interface AcceptInvitePageState {
  loading: boolean;
  invitation: InvitationData | null;
  error: string;
  step: 'verifying' | 'invalid' | 'valid' | 'accepting' | 'success' | 'error' | 'testing-duplicate';
}

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [state, setState] = useState<AcceptInvitePageState>({
    loading: true,
    invitation: null,
    error: '',
    step: 'verifying'
  });

  // Verify invitation token on page load
  useEffect(() => {
    const verifyInvitation = async () => {
      if (!token) {
        setState(prev => ({
          ...prev,
          loading: false,
          step: 'invalid',
          error: 'No invitation token provided'
        }));
        return;
      }

      try {
        const response = await fetch(`http://localhost:4000/api/invitations/${token}`);
        const data = await response.json();

        if (data.success && data.data) {
          setState(prev => ({
            ...prev,
            loading: false,
            step: 'valid',
            invitation: data.data,
            error: ''
          }));
        } else {
          setState(prev => ({
            ...prev,
            loading: false,
            step: 'invalid',
            error: data.error || 'Invalid or expired invitation'
          }));
        }
      } catch (error) {
        console.error('Error verifying invitation:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          step: 'invalid',
          error: 'Failed to verify invitation. Please try again.'
        }));
      }
    };

    verifyInvitation();
  }, [token]);

  // Separate function to handle the invitation acceptance
  const handleInvitationAcceptance = useCallback(async (authResult: any) => {
    try {
      const response = await fetch('http://localhost:4000/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          token,
          userData: authResult
        })
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          step: 'success',
          loading: false
        }));

        // Redirect to dashboard after a brief success message
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      } else {
        // Handle testing mode duplicate specially
        if (data.error === 'TESTING_MODE_DUPLICATE') {
          setState(prev => ({
            ...prev,
            step: 'testing-duplicate',
            loading: false,
            error: 'This email already has an account. In testing mode, you can experience the invitation flow, but account creation is prevented to avoid duplicates.'
          }));
        } else {
          setState(prev => ({
            ...prev,
            step: 'error',
            loading: false,
            error: data.error || 'Failed to accept invitation'
          }));
        }
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setState(prev => ({
        ...prev,
        step: 'error',
        loading: false,
        error: 'Failed to accept invitation. Please try again.'
      }));
    }
  }, [token, navigate]);

  // Check for redirect result from Google OAuth
  useEffect(() => {
    const handleAuthRedirect = async () => {
      if (state.step !== 'accepting') return;

      try {
        const authResult = await checkRedirectResult();
        if (authResult && token) {
          await handleInvitationAcceptance(authResult);
        }
      } catch (error) {
        console.error('Error handling auth redirect:', error);
        setState(prev => ({
          ...prev,
          step: 'error',
          loading: false,
          error: 'Authentication failed. Please try again.'
        }));
      }
    };

    handleAuthRedirect();
  }, [state.step, token, navigate, handleInvitationAcceptance]);

  const handleAcceptInvitation = async () => {
    setState(prev => ({ ...prev, step: 'accepting', loading: true }));
    
    try {
      // Initiate Google OAuth sign-in
      const authResult = await signInWithGoogle();
      
      // If we get a result immediately (popup worked), handle it
      if (authResult && token) {
        await handleInvitationAcceptance(authResult);
      }
    } catch (error: any) {
      console.error('Error during Google sign-in:', error);
      
      // If it's a redirect scenario, don't show error
      if (error.message === 'REDIRECT_INITIATED') {
        // The redirect is happening, keep the accepting state
        return;
      }
      
      setState(prev => ({
        ...prev,
        step: 'error',
        loading: false,
        error: 'Failed to start authentication. Please try again.'
      }));
    }
  };

  const getRoleBadge = (role: string) => {
    const badgeStyles = {
      'Admin': 'bg-red-500/20 text-red-300 border-red-500/30',
      'Member': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'View-Only': 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${badgeStyles[role] || badgeStyles['Member']}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card variant="glass" className="text-center">
          {/* Header */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Team Invitation</h1>
          </div>

          {/* Loading State */}
          {state.step === 'verifying' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 text-slate-300">
                <div className="w-5 h-5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></div>
                Verifying invitation...
              </div>
            </div>
          )}

          {/* Invalid Invitation */}
          {state.step === 'invalid' && (
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <XCircle className="w-16 h-16 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Invalid Invitation</h2>
                <p className="text-slate-400 mb-4">{state.error}</p>
                <p className="text-sm text-slate-500">
                  This invitation may have expired or already been used. Please contact your team administrator for a new invitation.
                </p>
              </div>
            </div>
          )}

          {/* Valid Invitation */}
          {state.step === 'valid' && state.invitation && (
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <Users className="w-16 h-16 text-green-400" />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">
                  You've been invited to join the team!
                </h2>
                
                <div className="bg-slate-800/50 rounded-lg p-4 mb-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Invited by:</span>
                    <span className="text-white font-medium">{state.invitation.inviterName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-white">{state.invitation.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Role:</span>
                    {getRoleBadge(state.invitation.role)}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Expires:</span>
                    <span className="text-slate-300 text-sm">
                      {new Date(state.invitation.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p className="text-slate-400 text-sm mb-6">
                  Click below to create your account and join the team using Google authentication.
                </p>
                
                <Button
                  onClick={handleAcceptInvitation}
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Accept Invitation & Sign Up with Google
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Accepting State */}
          {state.step === 'accepting' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Creating Your Account</h2>
                <p className="text-slate-400">Please complete the Google authentication process...</p>
              </div>
            </div>
          )}

          {/* Success State */}
          {state.step === 'success' && (
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <CheckCircle className="w-16 h-16 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Welcome to the Team!</h2>
                <p className="text-slate-400 mb-4">
                  Your account has been created successfully. You're now part of the team!
                </p>
                <p className="text-sm text-slate-500">
                  Redirecting you to the dashboard...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {state.step === 'error' && (
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <AlertCircle className="w-16 h-16 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Something Went Wrong</h2>
                <p className="text-slate-400 mb-4">{state.error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="md"
                  fullWidth
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Testing Mode - Duplicate User */}
          {state.step === 'testing-duplicate' && (
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <CheckCircle className="w-16 h-16 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Testing Mode Complete!</h2>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                  <p className="text-yellow-300 text-sm">
                    🧪 <strong>Testing Mode:</strong> The invitation flow worked perfectly! 
                    Your email already has an account, so we prevented creating a duplicate.
                  </p>
                </div>
                <p className="text-slate-400 mb-4 text-sm">
                  In a real scenario, a new user would be created and logged in automatically. 
                  The invitation system is working correctly!
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => navigate('/', { replace: true })}
                    variant="primary"
                    size="md"
                    fullWidth
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="md"
                    fullWidth
                  >
                    Test Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">B</span>
              </div>
              Blueprint - Construction Project Management
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}