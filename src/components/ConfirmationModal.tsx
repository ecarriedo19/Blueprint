import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';
import Card from './Card';

interface ConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning'
}) => {
  if (!isOpen) return null;

  const getIconColor = () => {
    switch (type) {
      case 'danger':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getConfirmButtonVariant = () => {
    switch (type) {
      case 'danger':
        return 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105';
      default:
        return 'primary';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md transform transition-all duration-300 scale-100">
        <Card variant="glass" padding="lg" className="relative">
          {/* Close button */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex items-center justify-center mb-6">
            <div className={`flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm ${getIconColor()}`}>
              <AlertTriangle className="w-8 h-8" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            {title && (
              <h3 className="text-xl font-semibold text-white mb-3">
                {title}
              </h3>
            )}
            <p className="text-slate-300 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              size="md"
              onClick={onCancel}
              className="min-w-[100px]"
            >
              {cancelText}
            </Button>
            <Button
              size="md"
              onClick={onConfirm}
              className={`min-w-[100px] ${type === 'danger' ? getConfirmButtonVariant() : ''}`}
              variant={type === 'danger' ? undefined : 'primary'}
            >
              {confirmText}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ConfirmationModal;