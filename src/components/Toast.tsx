import { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'success' | 'error';
}

const Toast = ({ message, isVisible, onClose, type = 'success' }: ToastProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl p-4 flex items-center gap-3 min-w-[320px]">
        {type === 'success' ? (
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        ) : (
          <X className="w-5 h-5 text-red-400" />
        )}
        <p className="text-white flex-1">{message}</p>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
