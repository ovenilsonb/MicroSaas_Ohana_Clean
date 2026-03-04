import React from 'react';
import { Printer } from 'lucide-react';
import { Modal } from '../Modal';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  title: string;
  children: React.ReactNode;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  onPrint,
  title,
  children
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xl"
    >
      <div className="flex flex-col h-full max-h-[85vh]">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 rounded-t-xl">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-bold uppercase tracking-wider">Pré-visualização</span>
            <span>Tamanho A4 (210mm x 297mm)</span>
          </div>
          <button
            onClick={onPrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm font-medium"
          >
            <Printer size={18} />
            Imprimir Agora
          </button>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-200 dark:bg-gray-900/50 flex justify-center">
          <div 
            id="print-preview-content"
            className="bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] p-[15mm] origin-top transform"
          >
            {children}
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-center rounded-b-xl">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
            O layout acima representa fielmente o documento final impresso
          </p>
        </div>
      </div>
    </Modal>
  );
};
