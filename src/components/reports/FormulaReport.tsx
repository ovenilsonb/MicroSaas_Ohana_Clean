import React from 'react';
import { Formula } from '../../types';
import { ReportTemplate } from './ReportTemplate';

interface FormulaReportProps {
  formula: Formula;
}

export const FormulaReport: React.FC<FormulaReportProps & { companyName?: string; companyLogo?: string; config?: any }> = ({ formula, companyName, companyLogo, config }) => {
  const custoTotal = (formula.insumos || []).reduce((acc, insumo) => acc + (insumo.quantidade * insumo.valorUnitario), 0);
  const custoUnidade = custoTotal / (formula.rendimento || 1);
  const totalChemicalOriginal = (formula.insumos || []).reduce((acc, i) => i.quimico ? acc + i.quantidade : acc, 0);

  return (
    <ReportTemplate title="Ficha Técnica de Produção" companyName={companyName} companyLogo={companyLogo} config={config}>
      <div className="space-y-8">
        {/* Informações Básicas */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <h2 className="text-xl font-bold text-slate-900 mb-2">{formula.nome}</h2>
            <div className="flex gap-4 text-xs">
              <p><span className="font-bold text-slate-400 uppercase tracking-wider">Código:</span> {formula.codigo || 'N/A'}</p>
              <p><span className="font-bold text-slate-400 uppercase tracking-wider">Status:</span> {formula.status.toUpperCase()}</p>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Rendimento do Lote</p>
            <p className="text-xl font-black text-slate-900">{formula.rendimento} <span className="text-sm font-normal text-slate-500">{formula.unidade}</span></p>
          </div>
        </div>

        {/* Resumo de Custos */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Custo Total (Lote)</p>
            <p className="text-lg font-bold text-slate-700">R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-[9px] uppercase tracking-widest text-blue-500 font-bold mb-1">Custo Unitário</p>
            <p className="text-lg font-bold text-blue-700">R$ {custoUnidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Total de Insumos</p>
            <p className="text-lg font-bold text-slate-700">{(formula.insumos || []).length} itens</p>
          </div>
        </div>

        {/* Tabela de Composição */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 border-l-4 border-blue-600 pl-2">Composição da Fórmula</h3>
          <table className="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="px-4 py-3">Insumo</th>
                <th className="px-4 py-3 text-center">Quantidade</th>
                <th className="px-4 py-3 text-center">Unidade</th>
                <th className="px-4 py-3 text-center">% Composição</th>
                <th className="px-4 py-3 text-center">Custo Unit.</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(formula.insumos || []).map(insumo => {
                const percOriginal = insumo.quimico && totalChemicalOriginal > 0 ? (insumo.quantidade / totalChemicalOriginal) * 100 : 0;

                return (
                  <tr key={insumo.id} className="text-xs">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">{insumo.nome}</p>
                      {insumo.quimico && <span className="text-[8px] font-bold text-blue-500 uppercase tracking-tighter">Componente Químico</span>}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">{insumo.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                    <td className="px-4 py-3 text-center text-slate-500">{insumo.unidade.toUpperCase()}</td>
                    <td className="px-4 py-3 text-center text-slate-500 font-mono">
                      {insumo.quimico ? `${percOriginal.toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-400">R$ {insumo.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700">R$ {(insumo.quantidade * insumo.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                <td colSpan={5} className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-500">Total da Mistura</td>
                <td className="px-4 py-3 text-right text-blue-700">R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Observações */}
        {formula.observacoes && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Observações Técnicas</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{formula.observacoes}</p>
          </div>
        )}
      </div>
    </ReportTemplate>
  );
};
