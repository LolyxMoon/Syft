import toast, { Toaster as HotToaster } from 'react-hot-toast';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// Custom toast functions with themed styling
export const showToast = {
  success: (message: string) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-fade-in' : 'opacity-0'
        } max-w-md w-full bg-card border border-success-500/30 shadow-lg rounded-lg pointer-events-auto flex items-start gap-3 p-4`}
      >
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-success-500/10 border border-success-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-success-400" />
          </div>
        </div>
        <div className="flex-1 pt-0.5">
          <p className="text-sm font-medium text-neutral-50">{message}</p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 text-neutral-400 hover:text-neutral-50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ), {
      duration: 4000,
    });
  },

  error: (message: string) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-fade-in' : 'opacity-0'
        } max-w-md w-full bg-card border border-error-500/30 shadow-lg rounded-lg pointer-events-auto flex items-start gap-3 p-4`}
      >
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-error-500/10 border border-error-500/30 flex items-center justify-center">
            <XCircle className="w-4 h-4 text-error-400" />
          </div>
        </div>
        <div className="flex-1 pt-0.5">
          <p className="text-sm font-medium text-neutral-50">{message}</p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 text-neutral-400 hover:text-neutral-50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ), {
      duration: 5000,
    });
  },

  warning: (message: string) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-fade-in' : 'opacity-0'
        } max-w-md w-full bg-card border border-warning-500/30 shadow-lg rounded-lg pointer-events-auto flex items-start gap-3 p-4`}
      >
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-warning-500/10 border border-warning-500/30 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-warning-400" />
          </div>
        </div>
        <div className="flex-1 pt-0.5">
          <p className="text-sm font-medium text-neutral-50">{message}</p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 text-neutral-400 hover:text-neutral-50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ), {
      duration: 4500,
    });
  },

  info: (message: string) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-fade-in' : 'opacity-0'
        } max-w-md w-full bg-card border border-info-500/30 shadow-lg rounded-lg pointer-events-auto flex items-start gap-3 p-4`}
      >
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-info-500/10 border border-info-500/30 flex items-center justify-center">
            <Info className="w-4 h-4 text-info-400" />
          </div>
        </div>
        <div className="flex-1 pt-0.5">
          <p className="text-sm font-medium text-neutral-50">{message}</p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 text-neutral-400 hover:text-neutral-50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ), {
      duration: 4000,
    });
  },

  loading: (message: string) => {
    return toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-fade-in' : 'opacity-0'
        } max-w-md w-full bg-card border border-primary-500/30 shadow-lg rounded-lg pointer-events-auto flex items-start gap-3 p-4`}
      >
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/30 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
        <div className="flex-1 pt-0.5">
          <p className="text-sm font-medium text-neutral-50">{message}</p>
        </div>
      </div>
    ), {
      duration: Infinity,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    const toastId = showToast.loading(messages.loading);

    promise
      .then((data) => {
        toast.dismiss(toastId);
        const successMsg = typeof messages.success === 'function' 
          ? messages.success(data) 
          : messages.success;
        showToast.success(successMsg);
      })
      .catch((error) => {
        toast.dismiss(toastId);
        const errorMsg = typeof messages.error === 'function' 
          ? messages.error(error) 
          : messages.error;
        showToast.error(errorMsg);
      });

    return promise;
  },
};

// Toaster component to be added to App.tsx
export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      }}
      containerStyle={{
        top: 80,
        right: 20,
      }}
    />
  );
}
