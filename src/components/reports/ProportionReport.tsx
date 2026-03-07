import React from 'react';
import { Formula } from '../../types';
import { ReportTemplate } from './ReportTemplate';

interface ProportionReportProps {
  formula: Formula;
  quantidade: number;
  unidade: string;
}

export const ProportionReport: React.FC<ProportionReportProps & { companyName?: string; companyLogo?: string; config?: any }> = ({ formula, quantidade, unidade, companyName, companyLogo, config }) => {
  const fator = quantidade / (formula.rendimento || 1);
  const getQuantidadeAjustada = (insumo: any) => insumo.quantidade * fator;
  
  const totalChemicalOriginal = (formula.insumos || []).reduce((acc, i) => i.quimico ? acc + i.quantidade : acc, 0);

  const calcularCustoTotal = () => {
    return (formula.insumos || []).reduce((sum, i) => {
      const qtd = getQuantidadeAjustada(i);
      return sum + qtd * i.valorUnitario;
    }, 0);
  };
  const custoTotal = calcularCustoTotal();

  return (
    <ReportTemplate title="Relatório de Proporção de Produção" companyName={companyName} companyLogo={companyLogo} config={config}>
      <div className="space-y-8">
        {/* Cabeçalho do Relatório */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">{formula.nome}</h2>
            <p className="text-xs text-slate-500 mb-4">Baseado na fórmula original (Rendimento: {formula.rendimento} {formula.unidade})</p>
          </div>
          <div className="bg-blue-600 text-white p-4 rounded-xl shadow-md text-center">
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-80 mb-1">Nova Quantidade Solicitada</p>
            <p className="text-2xl font-black">{quantidade} <span className="text-sm font-normal opacity-80">{unidade}</span></p>
          </div>
        </div>

        {/* Resumo de Custos Ajustados */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Custo Total Estimado</p>
            <p className="text-lg font-bold text-slate-700">R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Fator de Multiplicação</p>
            <p className="text-lg font-bold text-slate-700">{fator.toFixed(4)}x</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Custo Unitário (Base)</p>
            <p className="text-lg font-bold text-slate-700">R$ {(custoTotal / quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Tabela de Insumos Ajustados */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 border-l-4 border-blue-600 pl-2">Insumos Necessários (Ajustados)</h3>
          <table className="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="px-4 py-3 w-10 text-center">Check</th>
                <th className="px-4 py-3">Insumo</th>
                <th className="px-4 py-3 text-center">Qtd Original</th>
                <th className="px-4 py-3 text-center bg-blue-50 text-blue-700">Qtd Ajustada</th>
                <th className="px-4 py-3 text-center">% Composição</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(formula.insumos || []).map(insumo => {
                const qtdAjustada = getQuantidadeAjustada(insumo);
                const percOriginal = insumo.quimico && totalChemicalOriginal > 0 ? (insumo.quantidade / totalChemicalOriginal) * 100 : 0;

                return (
                  <tr key={insumo.id} className="text-xs">
                    <td className="px-4 py-3 text-center">
                      <div className="w-5 h-5 border-2 border-slate-300 rounded mx-auto"></div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">{insumo.nome}</p>
                      {insumo.quimico && <span className="text-[8px] font-bold text-blue-500 uppercase tracking-tighter">Químico</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-400 font-mono">{insumo.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} {insumo.unidade}</td>
                    <td className="px-4 py-3 text-center font-black text-blue-700 bg-blue-50/30 font-mono">{qtdAjustada.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} {insumo.unidade}</td>
                    <td className="px-4 py-3 text-center text-slate-500 font-mono">
                      {insumo.quimico ? `${percOriginal.toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700">R$ {(qtdAjustada * insumo.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                <td colSpan={5} className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-500">Total Estimado da Produção</td>
                <td className="px-4 py-3 text-right text-blue-700">R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Aviso */}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
          <div className="text-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">Atenção</h4>
            <p className="text-[11px] text-amber-700 leading-relaxed">Este relatório é uma projeção matemática baseada na fórmula original. Verifique a viabilidade técnica de escala antes de iniciar a produção em grandes volumes.</p>
          </div>
        </div>
      </div>
    </ReportTemplate>
  );
};
