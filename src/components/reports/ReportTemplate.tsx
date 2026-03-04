import React from 'react';

interface ReportTemplateProps {
  children: React.ReactNode;
  title: string;
}

export const ReportTemplate: React.FC<ReportTemplateProps> = ({ children, title }) => {
  return (
    <div className="bg-white text-slate-800 font-sans leading-relaxed w-full max-w-[210mm] mx-auto">
      <header className="flex justify-between items-start pb-6 mb-8 border-b border-slate-200/60">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xl shadow-sm">
            O
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 uppercase">Ohana Clean</h1>
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-[0.15em]">{title}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Emissão</div>
          <p className="text-xs font-semibold text-slate-600 font-mono">
            {new Date().toLocaleDateString('pt-BR')} <span className="text-slate-400 font-normal">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </p>
        </div>
      </header>
      
      <main className="min-h-[200mm]">
        {children}
      </main>
      
      <footer className="pt-6 mt-10 border-t border-slate-100 flex justify-between items-center">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Sistema de Gestão</p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Ohana Clean Operations</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-slate-400 font-mono italic">Documento de uso interno</p>
        </div>
      </footer>
    </div>
  );
};
