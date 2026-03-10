import React from 'react';
import { ReportTemplateConfig, ReportElement } from '../../types';

const EDITOR_WIDTH = 794;

interface ReportTemplateProps {
  children: React.ReactNode;
  title: string;
  companyName?: string;
  companyLogo?: string;
  config?: ReportTemplateConfig;
}

const renderElements = (elements: ReportElement[], canvasHeight: number) => (
  <>
    {elements.map(el => {
      const leftPct = (el.x / EDITOR_WIDTH) * 100;
      const topPct = (el.y / canvasHeight) * 100;
      const widthPct = (el.width / EDITOR_WIDTH) * 100;
      const heightPct = (el.height / canvasHeight) * 100;
      return (
        <div
          key={el.id}
          style={{
            position: 'absolute',
            left: `${leftPct}%`,
            top: `${topPct}%`,
            width: `${widthPct}%`,
            height: `${heightPct}%`,
          }}
        >
          {el.type === 'text' ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                fontFamily: el.style.fontFamily,
                fontSize: el.style.fontSize,
                color: el.style.color,
                fontWeight: el.style.bold ? 'bold' : 'normal',
                fontStyle: el.style.italic ? 'italic' : 'normal',
                textDecoration: el.style.underline ? 'underline' : 'none',
                textAlign: el.style.align,
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.3,
                padding: '2px 4px',
              }}
            >
              {el.content}
            </div>
          ) : (
            <img
              src={el.content}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}
        </div>
      );
    })}
  </>
);

export const ReportTemplate: React.FC<ReportTemplateProps> = ({ children, title, companyName = 'Ohana Clean', companyLogo, config }) => {
  const logoSize = config?.logoSize || 64;
  const headerText = config?.headerText || '';
  const footerText = config?.footerText || `${companyName} - Gestão Operacional`;
  const showSeparator = config?.showSeparator ?? true;
  const hasCustomHeader = config?.headerElements && config.headerElements.length > 0;
  const hasCustomFooter = config?.footerElements && config.footerElements.length > 0;

  return (
    <div className="bg-white text-slate-800 font-sans leading-relaxed w-full max-w-[210mm] mx-auto p-4 sm:p-8 report-container">
      {hasCustomHeader ? (
        <header
          style={{
            position: 'relative',
            width: '100%',
            height: config!.headerHeight || 120,
            marginBottom: showSeparator ? 0 : 16,
          }}
        >
          {renderElements(config!.headerElements!, config!.headerHeight || 120)}
          {showSeparator && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderBottom: '2px solid #e2e8f0' }} />
          )}
        </header>
      ) : (
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
      )}
      
      <main className="min-h-[180mm]">
        {children}
      </main>
      
      {hasCustomFooter ? (
        <footer
          style={{
            position: 'relative',
            width: '100%',
            height: config!.footerHeight || 80,
            marginTop: 16,
          }}
        >
          {showSeparator && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, borderTop: '1px solid #e2e8f0' }} />
          )}
          {renderElements(config!.footerElements!, config!.footerHeight || 80)}
        </footer>
      ) : (
        <footer className={`pt-4 sm:pt-6 mt-6 sm:mt-10 ${showSeparator ? 'border-t border-slate-200' : ''} flex justify-between items-center text-[10px]`}>
          <div>
            <p className="uppercase tracking-widest text-slate-400 font-bold">Documento Oficial</p>
            <p className="text-slate-500 font-medium mt-0.5 whitespace-pre-wrap">{footerText}</p>
          </div>
          <div className="text-right text-slate-400 font-mono italic">
            Gerado automaticamente pelo sistema em {new Date().toLocaleString('pt-BR')}
          </div>
        </footer>
      )}
    </div>
  );
};
