import React from 'react';
import { Formula } from '../../types';
import { ReportTemplate } from './ReportTemplate';

interface FormulaReportProps {
  formula: Formula;
}

export const FormulaReport: React.FC<FormulaReportProps> = ({ formula }) => {
  const custoTotal = formula.insumos.reduce((acc, insumo) => acc + (insumo.quantidade * insumo.valorUnitario), 0);
  const custoUnidade = custoTotal / (formula.rendimento || 1);
  const totalQuimico = formula.insumos.reduce((acc, insumo) => insumo.quimico ? acc + insumo.quantidade : acc, 0);

  return (
    <ReportTemplate title="Ficha Técnica de Produção">
      <div className="flex gap-8 items-start">
        
        {/* Coluna Esquerda: Resumo e Dados do Produto (35%) */}
        <div className="w-[35%] flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1 leading-tight">{formula.nome}</h2>
            <p className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-widest">{formula.codigo}</p>
            <div className="mt-3">
              <span className={`inline-flex px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border ${
                formula.status === 'finalizado' 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                {formula.status}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Rendimento Esperado</p>
              <p className="text-lg font-bold text-slate-700 font-mono">{formula.rendimento} <span className="text-xs font-medium text-slate-500">{formula.unidade}</span></p>
            </div>
            
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Custo Total (Lote)</p>
              <p className="text-lg font-bold text-slate-700 font-mono">R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            
            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/60 shadow-sm">
              <p className="text-[9px] uppercase tracking-widest text-indigo-500 font-bold mb-1">Custo Unitário</p>
              <p className="text-xl font-bold text-indigo-700 font-mono">R$ {custoUnidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {formula.observacoes && (
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Observações
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">{formula.observacoes}</p>
            </div>
          )}
        </div>

        {/* Coluna Direita: Tabela de Insumos (65%) */}
        <div className="w-[65%]">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            Composição da Fórmula
          </h3>
          
          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Insumo</th>
                  <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-center">Qtd</th>
                  <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-center">%</th>
                  <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-center">Custo Un.</th>
                  <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-center">Subtotal</th>
                  <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-center">Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formula.insumos.map(insumo => (
                  <tr key={insumo.id} className="bg-white">
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-slate-700">{insumo.nome}</p>
                      {insumo.quimico && <span className="inline-block mt-0.5 text-[8px] font-bold text-indigo-400 uppercase tracking-wider">Químico</span>}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-600 text-xs">
                      {insumo.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} <span className="text-[9px] text-slate-400">{insumo.unidade.toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-500 text-[10px]">
                      {insumo.quimico && totalQuimico > 0 
                        ? `${((insumo.quantidade / totalQuimico) * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-400 text-[10px]">
                      R$ {insumo.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-semibold text-slate-700 text-xs">
                      R$ {(insumo.quantidade * insumo.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="w-4 h-4 rounded border border-slate-300 mx-auto"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/80 border-t border-slate-200">
                  <td colSpan={4} className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Custo Total da Mistura</td>
                  <td colSpan={2} className="px-4 py-3 text-center font-mono font-bold text-slate-800 text-sm">
                    R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>
    </ReportTemplate>
  );
};
