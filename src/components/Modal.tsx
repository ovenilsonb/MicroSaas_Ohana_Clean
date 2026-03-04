import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Modal({ isOpen, onClose, title, children, size = 'lg' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Scroll para o topo quando abrir
  useEffect(() => {
    if (isOpen && overlayRef.current) {
      overlayRef.current.scrollTop = 0;
    }
    
    // Bloquear scroll do body quando modal aberto
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-7xl',
  };

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Container para centralizar e permitir scroll */}
      <div className="min-h-full flex items-start justify-center px-4 py-8">
        {/* Conteúdo do Modal */}
        <div 
          className={`${sizeClasses[size]} w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl my-auto`}
          onClick={(e) => e.stopPropagation()}
          style={{ marginTop: '2rem', marginBottom: '2rem' }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-t-2xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Body */}
          <div className="p-6 text-gray-900 dark:text-white">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
