import { useState, useCallback } from 'react';
import { useVendors, Vendor } from '../contexts/VendorContext';
import { useApp } from '../contexts/AppContext';
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
    if (!rating) return <span className="text-muted-foreground text-sm">No rating</span>;
    
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating 
                ? 'text-warning fill-current' 
                : 'text-muted-foreground/30'
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">{rating}/5</span>
      </div>
    );
  };

  // Error state
  if (error) {
    return (
      <div className="space-y-6">        
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <div className="text-destructive mb-4">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Failed to Load Vendors</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
      </div>

      {/* KPI Row */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Vendors</p>
              <p className="text-2xl font-bold text-foreground">{vendors.length}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success/10 text-success rounded-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Specialties</p>
              <p className="text-2xl font-bold text-foreground">{specialties.length}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning/10 text-warning rounded-lg">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High Rated</p>
              <p className="text-2xl font-bold text-foreground">
                {vendors.filter(v => v.rating && v.rating >= 4).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Vendors Section */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Vendor Directory</h2>
              <p className="text-muted-foreground">Track vendor performance, contacts, and specialties</p>
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search vendors by name, specialty, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              />
            </div>

            {/* Specialty Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <select
                value={filterSpecialty}
                onChange={(e) => setFilterSpecialty(e.target.value)}
                className="pl-10 pr-8 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring appearance-none min-w-[160px]"
              >
                <option value="">All Specialties</option>
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div className="relative">
              <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="pl-10 pr-8 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring appearance-none min-w-[140px]"
              >
                <option value="">All Ratings</option>
                <option value="4+">4+ Stars</option>
                <option value="3+">3+ Stars</option>
                <option value="unrated">Unrated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vendors List */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <span className="ml-3 text-muted-foreground">Loading vendors...</span>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {vendors.length === 0 ? 'No Vendors Yet' : 'No Matching Vendors'}
              </h3>
              <p className="text-muted-foreground mb-6">
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
            <div className="space-y-1">
              {filteredVendors.map((vendor) => (
                <div 
                  key={vendor.id} 
                  className="p-4 border-b border-border hover:bg-muted/30 transition-colors duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Vendor Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-foreground">
                            {vendor.name}
                          </h3>
                          {vendor.specialty && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                              {vendor.specialty}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {/* Rating */}
                          <div className="flex items-center gap-1">
                            {renderStarRating(vendor.rating)}
                          </div>
                          
                          {/* Contact Info */}
                          {vendor.contactEmail && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              <a 
                                href={`mailto:${vendor.contactEmail}`}
                                className="hover:text-primary transition-colors truncate"
                              >
                                {vendor.contactEmail}
                              </a>
                            </div>
                          )}
                          
                          {vendor.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              <a 
                                href={`tel:${vendor.phone}`}
                                className="hover:text-primary transition-colors"
                              >
                                {vendor.phone}
                              </a>
                            </div>
                          )}
                          
                          {/* Added Date */}
                          {vendor.created_at && (
                            <span className="text-xs">
                              Added {new Date(vendor.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <button
                        onClick={() => handleEditVendor(vendor)}
                        className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted/50"
                        title="Edit vendor"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVendor(vendor)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-muted/50"
                        title="Delete vendor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
