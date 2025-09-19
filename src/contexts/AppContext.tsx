import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ConfirmationModalState {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
}

interface AppContextType {
  confirmationModal: ConfirmationModalState;
  showConfirmationModal: (options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }) => void;
  hideConfirmationModal: () => void;
}

interface AppProviderProps {
  children: ReactNode;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState>({
    isOpen: false,
    message: '',
    onConfirm: () => {}
  });

  const showConfirmationModal = useCallback((options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }) => {
    setConfirmationModal({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      type: options.type || 'warning',
      onConfirm: () => {
        options.onConfirm();
        hideConfirmationModal();
      }
    });
  }, []);

  const hideConfirmationModal = useCallback(() => {
    setConfirmationModal(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const value: AppContextType = {
    confirmationModal,
    showConfirmationModal,
    hideConfirmationModal
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;