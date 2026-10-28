import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Calm Backdrop */}
      <div 
        className="fixed inset-0 bg-[#1E2622]/20 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog box */}
      <div className="flex min-h-full items-center justify-center p-4 text-left sm:p-6">
        <div 
          className={`relative transform overflow-hidden rounded-[14px] bg-white border border-[#E8E6E0] text-left transition-all w-full ${maxWidth}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E6E0]">
            <h3 className="text-[18px] font-semibold text-[#1E2622]">{title}</h3>
            <button
              onClick={onClose}
              className="text-[#5C6862] hover:text-[#1E2622] p-1.5 rounded-[8px] hover:bg-[#F7F6F2] transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
