import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Briefcase, ChevronRight, ChevronLeft, Check, Upload } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import { useTeamMutations } from '../contexts/TeamMutations';

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  hasCompletedOnboarding?: boolean;
}

interface OnboardingPageProps {
  companyName: string;
  updateCompanyName: (name: string) => Promise<void>;
  currentUser: User;
  onComplete: () => void;
}

const OnboardingPage = ({ companyName, updateCompanyName, currentUser: _currentUser, onComplete }: OnboardingPageProps) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleting, setIsCompleting] = useState(false);
  
  // Step 1: Company Profile state
  const [newCompanyName, setNewCompanyName] = useState(companyName);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  
  // Step 2: Team Invitation state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  
  // Step 3: Project Creation state
  const [projectName, setProjectName] = useState('');
  const [projectBudget, setProjectBudget] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectError, setProjectError] = useState('');
  
  // Mutations
  const { inviteTeamMember } = useTeamMutations();

  const steps = [
    {
      id: 1,
      title: 'Set Up Company Profile',
      description: 'Tell us about your company',
      icon: Building2
    },
    {
      id: 2,
      title: 'Invite Your First Team Member',
      description: 'Collaborate with your team',
      icon: Users
    },
    {
      id: 3,
      title: 'Create Your First Project',
      description: 'Start managing your projects',
      icon: Briefcase
    }
  ];

  // Step 1: Company Profile handlers
  const handleCompanyNameSave = async () => {
    const trimmedName = newCompanyName.trim();
    if (!trimmedName || trimmedName === companyName) return;
    
    try {
      await updateCompanyName(trimmedName);
    } catch (error) {
      console.error('Error updating company name:', error);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Image file must be smaller than 5MB');
      return;
    }

    setIsUploadingLogo(true);
    setLogoError('');

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/company-profile/logo', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setLogoUrl(result.logo_url);
      } else {
        setLogoError(result.error || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setLogoError('Failed to upload logo. Please try again.');
    } finally {
      setIsUploadingLogo(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Step 2: Team Invitation handlers
  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      await inviteTeamMember(inviteEmail.trim(), inviteRole);
      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
    } catch (err: any) {
      console.error('Error sending invitation:', err);
      setInviteError(err.message || 'Failed to send invitation. Please try again.');
    } finally {
      setIsInviting(false);
    }
  };

  // Step 3: Project Creation handlers
  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setProjectError('Project name is required');
      return;
    }

    setIsCreatingProject(true);
    setProjectError('');

    try {
      const budget = projectBudget ? parseFloat(projectBudget) : undefined;
      
      // Call the API directly since the context doesn't support budget
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: projectName.trim(),
          budget,
          description: projectDescription.trim() || undefined,
          status: 'Planning'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create project');
      }
    } catch (err: any) {
      console.error('Error creating project:', err);
      setProjectError(err.message || 'Failed to create project. Please try again.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  // Navigation handlers
  const handleNext = async () => {
    if (currentStep === 1) {
      // Save company name if changed
      await handleCompanyNameSave();
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    
    try {
      const response = await fetch('/api/users/complete-onboarding', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        onComplete();
        navigate('/');
      } else {
        throw new Error('Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Building2 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Set Up Your Company Profile</h2>
              <p className="text-slate-400">Let's start by setting up your company information</p>
            </div>

            <div className="space-y-6">
              {/* Company Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Enter your company name"
                />
              </div>

              {/* Company Logo */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Company Logo (Optional)
                </label>
                <div className="flex items-center gap-4">
                  {logoUrl && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                      <img 
                        src={logoUrl} 
                        alt="Company Logo" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      loading={isUploadingLogo}
                      className="w-full sm:w-auto"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {logoUrl ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                  </div>
                </div>
                {logoError && (
                  <p className="text-red-400 text-sm">{logoError}</p>
                )}
                <p className="text-slate-500 text-sm">
                  Recommended: Square image, max 5MB (JPG, PNG, GIF, WebP)
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Users className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Invite Your First Team Member</h2>
              <p className="text-slate-400">Collaborate with your team by inviting someone to join</p>
            </div>

            {inviteSuccess && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-300 text-sm">{inviteSuccess}</p>
              </div>
            )}

            {inviteError && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">{inviteError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="teammate@company.com"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                >
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                </select>
                <p className="text-slate-500 text-sm">
                  Members can create and edit projects. Admins have full access.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={handleSendInvite}
                loading={isInviting}
                disabled={!inviteEmail.trim()}
                className="w-full"
              >
                Send Invitation
              </Button>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-sm">
                💡 This step is optional. You can always invite team members later from the Settings page.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Briefcase className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Create Your First Project</h2>
              <p className="text-slate-400">Start managing your construction projects</p>
            </div>

            {projectError && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">{projectError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Downtown Office Renovation"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Budget (Optional)
                </label>
                <input
                  type="number"
                  value={projectBudget}
                  onChange={(e) => setProjectBudget(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="25000"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Description (Optional)
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                  placeholder="Brief description of the project..."
                />
              </div>

              <Button
                variant="outline"
                onClick={handleCreateProject}
                loading={isCreatingProject}
                disabled={!projectName.trim()}
                className="w-full"
              >
                Create Project
              </Button>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-sm">
                💡 This step is optional. You can always create projects later from the Projects page.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Blueprint!</h1>
          <p className="text-slate-400">Let's get you set up in just a few steps</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                ${currentStep >= step.id 
                  ? 'bg-blue-500 border-blue-500 text-white' 
                  : 'border-slate-600 text-slate-400'
                }
              `}>
                {currentStep > step.id ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  w-16 h-0.5 mx-2 transition-colors
                  ${currentStep > step.id ? 'bg-blue-500' : 'bg-slate-600'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Step Names */}
        <div className="flex justify-between mb-8 text-center">
          {steps.map((step) => (
            <div key={step.id} className="flex-1">
              <p className={`
                text-sm font-medium transition-colors
                ${currentStep >= step.id ? 'text-white' : 'text-slate-500'}
              `}>
                {step.title}
              </p>
            </div>
          ))}
        </div>

        {/* Main Content Card */}
        <Card variant="glass" className="mb-8">
          <div className="p-8">
            {renderStep()}
          </div>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep < steps.length ? (
            <Button
              variant="primary"
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleComplete}
              loading={isCompleting}
              className="flex items-center gap-2"
            >
              Complete Setup
              <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;