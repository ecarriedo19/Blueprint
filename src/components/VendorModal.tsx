import React, { useState, useEffect } from 'react';
import Button from './Button';
import { useVendors, Vendor } from '../contexts/VendorContext';

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string, type?: 'success' | 'error') => void;
  vendorToEdit?: Vendor | null;
}

const VendorModal: React.FC<VendorModalProps> = ({ isOpen, onClose, onSuccess, vendorToEdit }) => {
  const { addVendor, updateVendor } = useVendors();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    contactEmail: '',
    phone: '',
    rating: '' as string | number
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens - populate with edit data if available
  useEffect(() => {
    if (isOpen) {
      if (vendorToEdit) {
        setFormData({
          name: vendorToEdit.name || '',
          specialty: vendorToEdit.specialty || '',
          contactEmail: vendorToEdit.contactEmail || '',
          phone: vendorToEdit.phone || '',
          rating: vendorToEdit.rating || ''
        });
      } else {
        setFormData({
          name: '',
          specialty: '',
          contactEmail: '',
          phone: '',
          rating: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, vendorToEdit]);

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vendor name is required';
    }

    // Email validation if provided
    if (formData.contactEmail && formData.contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contactEmail.trim())) {
        newErrors.contactEmail = 'Please enter a valid email address';
      }
    }

    // Phone validation if provided
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    // Rating validation if provided
    if (formData.rating !== '' && formData.rating !== null) {
      const rating = Number(formData.rating);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        newErrors.rating = 'Rating must be between 1 and 5';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const vendorData = {
        name: formData.name.trim(),
        specialty: formData.specialty.trim(),
        contactEmail: formData.contactEmail.trim(),
        phone: formData.phone.trim(),
        rating: formData.rating ? Number(formData.rating) : null
      };

      if (vendorToEdit) {
        await updateVendor(vendorToEdit.id, vendorData);
        onSuccess('Vendor updated successfully!');
      } else {
        await addVendor(vendorData);
        onSuccess('Vendor created successfully!');
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save vendor:', error);
      onSuccess(
        error instanceof Error ? error.message : 'Failed to save vendor. Please try again.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {vendorToEdit ? 'Edit Vendor' : 'Add New Vendor'}
              </h2>
              <p className="text-muted-foreground">
                {vendorToEdit 
                  ? 'Update vendor information and contact details.' 
                  : 'Add a new vendor or subcontractor to your directory.'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 p-2 hover:bg-accent rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vendor Name - Required */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Vendor Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-4 bg-background border ${
                  errors.name ? 'border-red-500' : 'border-border'
                } rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200`}
                placeholder="e.g., ABC Plumbing Services"
                required
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-2">{errors.name}</p>
              )}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Specialty */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Specialty
                </label>
                <select
                  value={formData.specialty}
                  onChange={(e) => handleInputChange('specialty', e.target.value)}
                  className="w-full px-4 py-4 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select specialty...</option>
                  <option value="General Contractor">General Contractor</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="HVAC">HVAC</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Roofing">Roofing</option>
                  <option value="Flooring">Flooring</option>
                  <option value="Painting">Painting</option>
                  <option value="Drywall">Drywall</option>
                  <option value="Concrete">Concrete</option>
                  <option value="Landscaping">Landscaping</option>
                  <option value="Windows & Doors">Windows & Doors</option>
                  <option value="Insulation">Insulation</option>
                  <option value="Framing">Framing</option>
                  <option value="Masonry">Masonry</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Rating (1-5)
                </label>
                <select
                  value={formData.rating}
                  onChange={(e) => handleInputChange('rating', e.target.value)}
                  className={`w-full px-4 py-4 bg-background border ${
                    errors.rating ? 'border-red-500' : 'border-border'
                  } rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200`}
                >
                  <option value="">No rating</option>
                  <option value="1">⭐ 1 - Poor</option>
                  <option value="2">⭐⭐ 2 - Fair</option>
                  <option value="3">⭐⭐⭐ 3 - Good</option>
                  <option value="4">⭐⭐⭐⭐ 4 - Very Good</option>
                  <option value="5">⭐⭐⭐⭐⭐ 5 - Excellent</option>
                </select>
                {errors.rating && (
                  <p className="text-red-400 text-sm mt-2">{errors.rating}</p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  className={`w-full px-4 py-4 bg-background border ${
                    errors.contactEmail ? 'border-red-500' : 'border-border'
                  } rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200`}
                  placeholder="contact@vendor.com"
                />
                {errors.contactEmail && (
                  <p className="text-red-400 text-sm mt-2">{errors.contactEmail}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full px-4 py-4 bg-background border ${
                    errors.phone ? 'border-red-500' : 'border-border'
                  } rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200`}
                  placeholder="(555) 123-4567"
                />
                {errors.phone && (
                  <p className="text-red-400 text-sm mt-2">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
              <Button 
                type="button"
                variant="ghost" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                loading={isSubmitting}
                className="min-w-[120px]"
              >
                {vendorToEdit ? 'Update Vendor' : 'Add Vendor'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VendorModal;