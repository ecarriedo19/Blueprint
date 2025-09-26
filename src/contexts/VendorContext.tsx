import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Vendor interface
export interface Vendor {
  id: number;
  name: string;
  specialty: string;
  contactEmail: string;
  phone: string;
  rating: number | null;
  user_id: number;
  created_at?: string;
  updated_at?: string;
}

// Context state interface
interface VendorContextState {
  vendors: Vendor[];
  loading: boolean;
  error: string | null;
  fetchVendors: () => Promise<void>;
  addVendor: (vendorData: Omit<Vendor, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Vendor>;
  updateVendor: (id: number, vendorData: Omit<Vendor, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Vendor>;
  deleteVendor: (id: number) => Promise<void>;
}

// Create the context
const VendorContext = createContext<VendorContextState | undefined>(undefined);

// Provider component
export const VendorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all vendors for the current user
  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/vendors', {
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch vendors');
      }

      if (result.success) {
        setVendors(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch vendors');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load vendors';
      setError(errorMessage);
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new vendor
  const addVendor = useCallback(async (vendorData: Omit<Vendor, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Vendor> => {
    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(vendorData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create vendor');
      }

      if (result.success && result.data) {
        const newVendor = result.data;
        setVendors(prev => [...prev, newVendor]);
        return newVendor;
      } else {
        throw new Error(result.error || 'Failed to create vendor');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create vendor';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Update an existing vendor
  const updateVendor = useCallback(async (id: number, vendorData: Omit<Vendor, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Vendor> => {
    try {
      const response = await fetch(`/api/vendors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(vendorData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update vendor');
      }

      if (result.success && result.data) {
        const updatedVendor = result.data;
        setVendors(prev => 
          prev.map(vendor => 
            vendor.id === id 
              ? { ...vendor, ...updatedVendor }
              : vendor
          )
        );
        return updatedVendor;
      } else {
        throw new Error(result.error || 'Failed to update vendor');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update vendor';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Delete a vendor
  const deleteVendor = useCallback(async (id: number): Promise<void> => {
    try {
      const response = await fetch(`/api/vendors/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete vendor');
      }

      if (result.success) {
        setVendors(prev => prev.filter(vendor => vendor.id !== id));
      } else {
        throw new Error(result.error || 'Failed to delete vendor');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete vendor';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Load vendors on mount
  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const contextValue: VendorContextState = {
    vendors,
    loading,
    error,
    fetchVendors,
    addVendor,
    updateVendor,
    deleteVendor,
  };

  return (
    <VendorContext.Provider value={contextValue}>
      {children}
    </VendorContext.Provider>
  );
};

// Custom hook to use the VendorContext
export const useVendors = (): VendorContextState => {
  const context = useContext(VendorContext);
  if (context === undefined) {
    throw new Error('useVendors must be used within a VendorProvider');
  }
  return context;
};

export default VendorContext;