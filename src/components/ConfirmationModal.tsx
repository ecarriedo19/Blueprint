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
        return 'text-destructive';
      case 'warning':
        return 'text-warning';
      case 'info':
        return 'text-primary';
      default:
        return 'text-warning';
    }
  };

  const getConfirmButtonVariant = () => {
    switch (type) {
      case 'danger':
        return 'destructive';
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
        <Card variant="default" padding="lg" className="relative">
          {/* Close button */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-muted/50"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex items-center justify-center mb-6">
            <div className={`flex items-center justify-center w-16 h-16 rounded-full bg-muted/20 ${getIconColor()}`}>
              <AlertTriangle className="w-8 h-8" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            {title && (
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {title}
              </h3>
            )}
            <p className="text-muted-foreground leading-relaxed">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              size="md"
              onClick={onCancel}
              className="min-w-[100px]"
            >
              {cancelText}
            </Button>
            <Button
              size="md"
              onClick={onConfirm}
              className="min-w-[100px]"
              variant={getConfirmButtonVariant()}
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