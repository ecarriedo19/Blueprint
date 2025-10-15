import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Upload, Trash2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Button from '../Button';

// Helper function to construct absolute URLs for images
const getAbsoluteImageUrl = (relativePath: string | null): string | null => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http')) return relativePath; // Already absolute
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  return `${apiBaseUrl}${relativePath}`;
};

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  subscriptionStatus?: string;
}

interface CompanyProfilePageProps {
  companyName: string;
  updateCompanyName: (name: string) => Promise<void>;
  currentUser: User;
}

const CompanyProfilePage = ({ companyName, updateCompanyName, currentUser }: CompanyProfilePageProps) => {
  const [newCompanyName, setNewCompanyName] = useState(companyName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [logoSuccess, setLogoSuccess] = useState('');

  // Fetch company profile data (including logo) on component mount
  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        const response = await fetch('/api/company-profile', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setLogoUrl(getAbsoluteImageUrl(data.logo_url));
        }
      } catch (error) {
        console.error('Error fetching company profile:', error);
      }
    };
    
    fetchCompanyProfile();
  }, []);

  // Handle logo file upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setLogoError('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Image file must be smaller than 5MB');
      return;
    }

    setIsUploadingLogo(true);
    setLogoError('');
    setLogoSuccess('');

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
        setLogoUrl(getAbsoluteImageUrl(result.logo_url));
        setLogoSuccess('Logo uploaded successfully!');
        setLogoError('');
      } else {
        setLogoError(result.error || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setLogoError('Failed to upload logo. Please try again.');
    } finally {
      setIsUploadingLogo(false);
      // Reset the file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Handle logo removal
  const handleLogoRemove = async () => {
    setIsUploadingLogo(true);
    setLogoError('');
    setLogoSuccess('');

    try {
      const response = await fetch('/api/company-profile/logo', {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setLogoUrl(null);
        setLogoSuccess('Logo removed successfully!');
        setLogoError('');
      } else {
        setLogoError(result.error || 'Failed to remove logo');
      }
    } catch (error) {
      console.error('Error removing logo:', error);
      setLogoError('Failed to remove logo. Please try again.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Role-based permission check
  const isAdmin = () => {
    const userRole = currentUser?.role || 'Member';
    return userRole === 'Admin';
  };

  // Handle save company name
  const handleSave = useCallback(async () => {
    const trimmedName = newCompanyName.trim();
    if (!trimmedName || trimmedName === companyName) return;
    
    try {
      setIsSaving(true);
      await updateCompanyName(trimmedName);
      // Reset error state if successful
      setError('');
    } catch (error) {
      console.error('Error saving company name:', error);
      setError('Failed to update company name. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [newCompanyName, updateCompanyName, companyName]);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Link 
          to="/settings" 
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Settings</span>
        </Link>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Company Profile</h1>
      </div>

      <div className="space-y-6">
        {isAdmin() ? (
          <>
            {/* Company Logo Section */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt="Company Logo" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Company Logo</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your company logo. This will appear in your quotes and throughout the application.
                  </p>
                  
                  {/* Logo Status Messages */}
                  {logoError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-700">{logoError}</span>
                    </div>
                  )}
                  
                  {logoSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">{logoSuccess}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isUploadingLogo}
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <Upload className="w-4 h-4" />
                      {logoUrl ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    
                    {logoUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isUploadingLogo}
                        onClick={handleLogoRemove}
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </Button>
                    )}
                    
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    Supported formats: PNG, JPG, GIF. Max size: 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Company Name Section */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Company Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="Enter your company name"
                  />
                  {error && (
                    <p className="mt-2 text-sm text-destructive">{error}</p>
                  )}
                </div>
                
                <Button
                  onClick={handleSave}
                  disabled={!newCompanyName.trim() || newCompanyName.trim() === companyName || isSaving}
                  loading={isSaving}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Company Profile Settings
              </h3>
              <p className="text-muted-foreground">
                Only administrators can modify company profile settings. Contact your team admin to make changes.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyProfilePage;