import React from 'react';
import { Formula } from '../../types';
import { ReportTemplate } from './ReportTemplate';

interface ProportionReportProps {
  formula: Formula;
  quantidade: number;
  unidade: string;
}

export const ProportionReport: React.FC<ProportionReportProps> = ({ formula, quantidade, unidade }) => {
  const fator = quantidade / (formula.rendimento || 1);
  const getQuantidadeAjustada = (insumo: any) => insumo.quantidade * fator;
  const calcularCustoTotal = () => {
    return formula.insumos.reduce((sum, i) => {
      const qtd = getQuantidadeAjustada(i);
      return sum + qtd * i.valorUnitario;
    }, 0);
  };
  const custoTotal = calcularCustoTotal();
  const totalQuimico = formula.insumos.reduce((acc, insumo) => insumo.quimico ? acc + insumo.quantidade : acc, 0);

  return (
    <ReportTemplate title="Ficha de Produção Ajustada">
      <div className="flex gap-8 items-start">
        
        {/* Coluna Esquerda: Resumo e Dados do Produto (35%) */}
        <div className="w-[35%] flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1 leading-tight">{formula.nome}</h2>
            <p className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-widest">{formula.codigo}</p>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/60 shadow-sm">
              <p className="text-[9px] uppercase tracking-widest text-indigo-500 font-bold mb-1">Volume de Produção</p>
              <p className="text-xl font-bold text-indigo-700 font-mono">{quantidade.toLocaleString('pt-BR')} <span className="text-sm font-medium text-indigo-500/70">{unidade}</span></p>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Fator de Escala</p>
              <p className="text-lg font-bold text-slate-700 font-mono">{fator.toFixed(4)}x <span className="text-[10px] font-medium text-slate-400">(Base: {formula.rendimento}{formula.unidade})</span></p>
            </div>
            
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Custo Total Estimado</p>
              <p className="text-lg font-bold text-slate-700 font-mono">R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Custo Unitário Alvo</p>
              <p className="text-lg font-bold text-slate-700 font-mono">R$ {(custoTotal / quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100/50">
            <h4 className="text-[9px] font-bold text-amber-600/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Nota de Produção
            </h4>
            <p className="text-xs text-amber-900/80 leading-relaxed">
              As quantidades foram calculadas proporcionalmente com base no rendimento padrão de {formula.rendimento} {formula.unidade}. Siga rigorosamente as medidas.
            </p>
          </div>
        </div>

        {/* Coluna Direita: Tabela de Insumos Ajustados (65%) */}
        <div className="w-[65%]">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            Quantidades Ajustadas
          </h3>
          
          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Insumo</th>
                  <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-center">Qtd. Original</th>
                  <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-center">Qtd. Ajustada</th>
                  <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-center">%</th>
                  <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-center">Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formula.insumos.map(insumo => {
                  const qtdAjustada = getQuantidadeAjustada(insumo);
                  return (
                    <tr key={insumo.id} className="bg-white">
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-slate-700">{insumo.nome}</p>
                        {insumo.quimico && <span className="inline-block mt-0.5 text-[8px] font-bold text-indigo-400 uppercase tracking-wider">Químico</span>}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-400 text-[10px]">
                        {insumo.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} {insumo.unidade.toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-indigo-600 text-sm bg-indigo-50/30">
                        {qtdAjustada.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} <span className="text-[10px] text-indigo-400 font-medium">{insumo.unidade.toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-500 text-[10px]">
                        {insumo.quimico && totalQuimico > 0 
                          ? `${((insumo.quantidade / totalQuimico) * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="w-4 h-4 rounded border border-slate-300 mx-auto"></div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/80 border-t border-slate-200">
                  <td colSpan={4} className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Total Previsto para o Lote</td>
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
