import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

const variantConfig = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-error-500/10',
    iconBorder: 'border-error-500/30',
    iconColor: 'text-error-400',
    buttonVariant: 'secondary' as const,
    buttonClass: 'bg-error-500/20 hover:bg-error-500/30 border-error-500/40 text-error-400',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-warning-500/10',
    iconBorder: 'border-warning-500/30',
    iconColor: 'text-warning-400',
    buttonVariant: 'primary' as const,
    buttonClass: '',
  },
  info: {
    icon: Info,
    iconBg: 'bg-info-500/10',
    iconBorder: 'border-info-500/30',
    iconColor: 'text-info-400',
    buttonVariant: 'primary' as const,
    buttonClass: '',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-success-500/10',
    iconBorder: 'border-success-500/30',
    iconColor: 'text-success-400',
    buttonVariant: 'primary' as const,
    buttonClass: '',
  },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md mx-4 p-6 rounded-lg bg-card border border-default shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-50 transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${config.iconBg} border ${config.iconBorder} mb-4`}>
                <Icon className={`w-8 h-8 ${config.iconColor}`} />
              </div>
              
              {/* Title */}
              <h2 className="text-xl font-bold text-neutral-50 mb-2">{title}</h2>
              
              {/* Message */}
              <p className="text-sm text-neutral-400 leading-relaxed">{message}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={onClose}
                disabled={isLoading}
              >
                {cancelText}
              </Button>
              <Button
                variant={config.buttonVariant}
                size="md"
                className={`flex-1 ${config.buttonClass}`}
                onClick={handleConfirm}
                isLoading={isLoading}
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
