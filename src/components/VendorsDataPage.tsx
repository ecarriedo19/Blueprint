import React, { useState, useCallback } from 'react';
import { useVendors, Vendor } from '../contexts/VendorContext';
import { useApp } from '../contexts/AppContext';
import PageHeader from './PageHeader';
import Card from './Card';
import Button from './Button';
import VendorModal from './VendorModal';
import Toast from './Toast';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  Star, 
  Building2,
  Search,
  Filter,
  Users
} from 'lucide-react';

const VendorsDataPage = () => {
  const { vendors, loading, error, deleteVendor } = useVendors();
  const { showConfirmationModal } = useApp();
  
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [toast, setToast] = useState<{ message: string; isVisible: boolean; type: 'success' | 'error' }>({ 
    message: '', 
    isVisible: false, 
    type: 'success' 
  });

  // Toast functions
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, isVisible: true, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  // Filter vendors based on search and filters
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = filterSpecialty === '' || vendor.specialty === filterSpecialty;
    const matchesRating = filterRating === '' || 
                         (filterRating === '4+' && vendor.rating && vendor.rating >= 4) ||
                         (filterRating === '3+' && vendor.rating && vendor.rating >= 3) ||
                         (filterRating === 'unrated' && !vendor.rating);
    
    return matchesSearch && matchesSpecialty && matchesRating;
  });

  // Get unique specialties for filter dropdown
  const specialties = Array.from(new Set(vendors.map(v => v.specialty).filter(Boolean))).sort();

  // Modal handlers
  const handleAddVendor = () => {
    setVendorToEdit(null);
    setIsVendorModalOpen(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setVendorToEdit(vendor);
    setIsVendorModalOpen(true);
  };

  const handleDeleteVendor = (vendor: Vendor) => {
    showConfirmationModal({
      title: 'Delete Vendor',
      message: `Are you sure you want to delete "${vendor.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteVendor(vendor.id);
          showToast(`${vendor.name} has been deleted successfully!`);
        } catch (error) {
          console.error('Failed to delete vendor:', error);
          showToast(
            error instanceof Error ? error.message : 'Failed to delete vendor',
            'error'
          );
        }
      }
    });
  };

  const handleCloseVendorModal = () => {
    setIsVendorModalOpen(false);
    setVendorToEdit(null);
  };

  const handleVendorSuccess = (message: string, type: 'success' | 'error' = 'success') => {
    showToast(message, type);
  };

  // Render star rating
  const renderStarRating = (rating: number | null) => {
    if (!rating) return <span className="text-slate-400 text-sm">No rating</span>;
    
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-slate-600'
            }`}
          />
        ))}
        <span className="text-sm text-slate-300 ml-1">{rating}/5</span>
      </div>
    );
  };

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Vendor & Subcontractor Hub" 
          subtitle="Manage and analyze your vendor relationships."
          size="lg"
        />
        
        <Card variant="glass" className="p-8 text-center">
          <div className="text-red-400 mb-4">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Failed to Load Vendors</h3>
            <p>{error}</p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Vendor & Subcontractor Hub" 
        subtitle="Manage and analyze your vendor relationships and performance."
        size="lg"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Vendors</p>
              <p className="text-3xl font-bold text-white">{vendors.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </Card>
        
        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Specialties</p>
              <p className="text-3xl font-bold text-white">{specialties.length}</p>
            </div>
            <Building2 className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        
        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">High Rated</p>
              <p className="text-3xl font-bold text-white">
                {vendors.filter(v => v.rating && v.rating >= 4).length}
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>
      </div>

      {/* Main Vendors Section */}
      <Card variant="glass">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Vendor Directory</h2>
              <p className="text-slate-400">Track vendor performance, contacts, and specialties</p>
            </div>
            <Button
              onClick={handleAddVendor}
              variant="primary"
              className="flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Vendor
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search vendors by name, specialty, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Specialty Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <select
                value={filterSpecialty}
                onChange={(e) => setFilterSpecialty(e.target.value)}
                className="pl-10 pr-8 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none min-w-[160px]"
              >
                <option value="">All Specialties</option>
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div className="relative">
              <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="pl-10 pr-8 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none min-w-[140px]"
              >
                <option value="">All Ratings</option>
                <option value="4+">4+ Stars</option>
                <option value="3+">3+ Stars</option>
                <option value="unrated">Unrated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vendors Grid */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="ml-3 text-slate-400">Loading vendors...</span>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300 mb-2">
                {vendors.length === 0 ? 'No Vendors Yet' : 'No Matching Vendors'}
              </h3>
              <p className="text-slate-400 mb-6">
                {vendors.length === 0 
                  ? 'Start building your vendor directory by adding your first vendor or subcontractor.'
                  : 'Try adjusting your search criteria or filters.'
                }
              </p>
              {vendors.length === 0 && (
                <Button
                  variant="outline"
                  onClick={handleAddVendor}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add First Vendor
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredVendors.map((vendor) => (
                <Card 
                  key={vendor.id} 
                  variant="glass" 
                  className="p-6 hover:bg-white/10 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {vendor.name}
                      </h3>
                      {vendor.specialty && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {vendor.specialty}
                        </span>
                      )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <button
                        onClick={() => handleEditVendor(vendor)}
                        className="p-2 text-slate-400 hover:text-blue-400 transition-colors rounded-lg hover:bg-white/5"
                        title="Edit vendor"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVendor(vendor)}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
                        title="Delete vendor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Rating */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Rating:</span>
                      {renderStarRating(vendor.rating)}
                    </div>

                    {/* Contact Info */}
                    {vendor.contactEmail && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <a 
                          href={`mailto:${vendor.contactEmail}`}
                          className="text-slate-300 hover:text-blue-400 transition-colors truncate"
                          title={vendor.contactEmail}
                        >
                          {vendor.contactEmail}
                        </a>
                      </div>
                    )}

                    {vendor.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <a 
                          href={`tel:${vendor.phone}`}
                          className="text-slate-300 hover:text-blue-400 transition-colors"
                        >
                          {vendor.phone}
                        </a>
                      </div>
                    )}

                    {/* Added Date */}
                    {vendor.created_at && (
                      <div className="text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                        Added {new Date(vendor.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Vendor Modal */}
      <VendorModal
        isOpen={isVendorModalOpen}
        onClose={handleCloseVendorModal}
        onSuccess={handleVendorSuccess}
        vendorToEdit={vendorToEdit}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default VendorsDataPage;
