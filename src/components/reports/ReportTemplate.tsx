import React from 'react';
import { ReportTemplateConfig } from '../../types';

interface ReportTemplateProps {
  children: React.ReactNode;
  title: string;
  companyName?: string;
  companyLogo?: string;
  config?: ReportTemplateConfig;
}

export const ReportTemplate: React.FC<ReportTemplateProps> = ({ children, title, companyName = 'Ohana Clean', companyLogo, config }) => {
  const logoSize = config?.logoSize || 64; // default 64px (w-16)
  const headerText = config?.headerText || '';
  const footerText = config?.footerText || `${companyName} - Gestão Operacional`;
  const showSeparator = config?.showSeparator ?? true;

  return (
    <div className="bg-white text-slate-800 font-sans leading-relaxed w-full max-w-[210mm] mx-auto p-4 sm:p-8 report-container">
      <header className={`flex justify-between items-start pb-4 sm:pb-6 mb-4 sm:mb-8 ${showSeparator ? 'border-b-2 border-slate-200' : ''}`}>
        <div className="flex items-center gap-4">
          {companyLogo ? (
            <img 
              src={companyLogo} 
              alt={companyName} 
              style={{ width: logoSize, height: logoSize }}
              className="object-contain rounded-lg" 
            />
          ) : (
            <div 
              style={{ width: logoSize, height: logoSize }}
              className="bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 font-bold text-2xl"
            >
              {companyName.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">{companyName}</h1>
            <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em]">{title}</p>
            {headerText && (
              <p className="text-xs text-slate-500 mt-1 max-w-md whitespace-pre-wrap">{headerText}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Data de Emissão</div>
          <p className="text-sm font-bold text-slate-700 font-mono">
            {new Date().toLocaleDateString('pt-BR')}
          </p>
          <p className="text-xs text-slate-400 font-mono">
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </header>
      
      <main className="min-h-[180mm]">
        {children}
      </main>
      
      <footer className={`pt-4 sm:pt-6 mt-6 sm:mt-10 ${showSeparator ? 'border-t border-slate-200' : ''} flex justify-between items-center text-[10px]`}>
        <div>
          <p className="uppercase tracking-widest text-slate-400 font-bold">Documento Oficial</p>
          <p className="text-slate-500 font-medium mt-0.5 whitespace-pre-wrap">{footerText}</p>
        </div>
        <div className="text-right text-slate-400 font-mono italic">
          Gerado automaticamente pelo sistema em {new Date().toLocaleString('pt-BR')}
        </div>
      </footer>
    </div>
  );
};
