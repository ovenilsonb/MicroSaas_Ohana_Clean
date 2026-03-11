import React from 'react';
import { Formula, Insumo } from '../../types';
import { ReportTemplate } from './ReportTemplate';

function extractVolumeFromName(name: string): number | null {
  const mlMatch = name.match(/(\d+)\s*ml/i);
  if (mlMatch) return parseInt(mlMatch[1]) / 1000;
  const lMatch = name.match(/(\d+(?:[.,]\d+)?)\s*(?:L|LT|litro)/i);
  if (lMatch) return parseFloat(lMatch[1].replace(',', '.'));
  return null;
}

interface ProportionReportProps {
  formula: Formula;
  quantidade: number;
  unidade: string;
  embalagemVolume?: number;
  insumosData?: Insumo[];
}

export const ProportionReport: React.FC<ProportionReportProps & { companyName?: string; companyLogo?: string; config?: any }> = ({ formula, quantidade, unidade, embalagemVolume = 1, insumosData = [], companyName, companyLogo, config }) => {
  const totalVolume = quantidade * embalagemVolume;
  const fatorQuimico = totalVolume / (formula.rendimento || 1);
  
  const chemicals = (formula.insumos || []).filter(i => i.quimico);
  const totalChemicalOriginal = chemicals.reduce((acc, i) => acc + i.quantidade, 0);

  const formulaNonChem = (formula.insumos || []).filter(i => !i.quimico);
  const formulaInsumoIds = new Set(formulaNonChem.map(i => i.insumoId));
  const catalogNonChem = insumosData
    .filter(ins => !ins.quimico && !formulaInsumoIds.has(ins.id))
    .map(ins => ({
      id: `auto_${ins.id}`,
      insumoId: ins.id,
      nome: ins.nome,
      unidade: ins.unidade,
      quantidade: 1,
      valorUnitario: ins.valorUnitario,
      quimico: false,
    }));
  const nonChemicals = [...formulaNonChem, ...catalogNonChem];

  const getEffectivePrice = (fi: typeof nonChemicals[0]) => {
    const fullInsumo = insumosData.find(ins => ins.id === fi.insumoId);
    if (fullInsumo?.variantes?.length) {
      const matched = fullInsumo.variantes.find(v => {
        const vol = extractVolumeFromName(v.nome);
        return vol !== null && Math.abs(vol - embalagemVolume) < 0.01;
      });
      if (matched) return { price: matched.valorUnitario, variantName: matched.nome };
    }
    return { price: fi.valorUnitario, variantName: null };
  };

  const getQuantidadeAjustada = (insumo: any) => {
    if (insumo.quimico) return insumo.quantidade * fatorQuimico;
    return quantidade * insumo.quantidade;
  };

  const fmt2 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const calcularCustoTotal = () => {
    let total = 0;
    chemicals.forEach(i => { total += getQuantidadeAjustada(i) * i.valorUnitario; });
    nonChemicals.forEach(i => { total += getQuantidadeAjustada(i) * getEffectivePrice(i).price; });
    return total;
  };
  const custoTotal = calcularCustoTotal();

  return (
    <ReportTemplate title="Relatório de Proporção de Produção" companyName={companyName} companyLogo={companyLogo} config={config}>
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">{formula.nome}</h2>
            <p className="text-xs text-slate-500 mb-4">Baseado na fórmula original (Rendimento: {formula.rendimento} {formula.unidade})</p>
          </div>
          <div className="bg-blue-600 text-white p-4 rounded-xl shadow-md text-center">
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-80 mb-1">Produção Solicitada</p>
            <p className="text-2xl font-black">{quantidade} <span className="text-sm font-normal opacity-80">un de {embalagemVolume}L</span></p>
            <p className="text-xs opacity-70 mt-1">Volume total: {fmt2(totalVolume)}L</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Custo Total Estimado</p>
            <p className="text-lg font-bold text-slate-700">R$ {fmt2(custoTotal)}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Fator Químicos</p>
            <p className="text-lg font-bold text-slate-700">{fatorQuimico.toFixed(4)}x</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Custo por Unidade</p>
            <p className="text-lg font-bold text-slate-700">R$ {fmt2(quantidade > 0 ? custoTotal / quantidade : 0)}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-[9px] uppercase tracking-widest text-blue-400 font-bold mb-1">Embalagem</p>
            <p className="text-lg font-bold text-blue-700">{embalagemVolume}L</p>
          </div>
        </div>

        {chemicals.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 border-l-4 border-amber-500 pl-2">Insumos Químicos (Fator {fatorQuimico.toFixed(2)}x)</h3>
            <table className="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-amber-50 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <th className="px-4 py-3 w-10 text-center">Check</th>
                  <th className="px-4 py-3">Insumo</th>
                  <th className="px-4 py-3 text-center">Qtd Original</th>
                  <th className="px-4 py-3 text-center bg-amber-100 text-amber-700">Qtd Ajustada</th>
                  <th className="px-4 py-3 text-center">% Composição</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {chemicals.map(insumo => {
                  const qtdAjustada = getQuantidadeAjustada(insumo);
                  const percOriginal = totalChemicalOriginal > 0 ? (insumo.quantidade / totalChemicalOriginal) * 100 : 0;
                  return (
                    <tr key={insumo.id} className="text-xs">
                      <td className="px-4 py-3 text-center"><div className="w-5 h-5 border-2 border-slate-300 rounded mx-auto"></div></td>
                      <td className="px-4 py-3"><p className="font-bold text-slate-800">{insumo.nome}</p></td>
                      <td className="px-4 py-3 text-center text-slate-400 font-mono">{fmt2(insumo.quantidade)} {insumo.unidade}</td>
                      <td className="px-4 py-3 text-center font-black text-amber-700 bg-amber-50/30 font-mono">{fmt2(qtdAjustada)} {insumo.unidade}</td>
                      <td className="px-4 py-3 text-center text-slate-500 font-mono">{percOriginal.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-700">R$ {fmt2(qtdAjustada * insumo.valorUnitario)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-amber-50 font-bold border-t-2 border-slate-200">
                  <td colSpan={5} className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-500">Subtotal Químicos</td>
                  <td className="px-4 py-3 text-right text-amber-700">R$ {fmt2(chemicals.reduce((s, i) => s + getQuantidadeAjustada(i) * i.valorUnitario, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {nonChemicals.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 border-l-4 border-blue-600 pl-2">Embalagem e Materiais ({quantidade} unidades de {embalagemVolume}L)</h3>
            <table className="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-blue-50 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <th className="px-4 py-3 w-10 text-center">Check</th>
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3 text-center">Variante</th>
                  <th className="px-4 py-3 text-center">Preço Unit.</th>
                  <th className="px-4 py-3 text-center bg-blue-100 text-blue-700">Quantidade</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {nonChemicals.map(insumo => {
                  const qtdAjustada = getQuantidadeAjustada(insumo);
                  const { price, variantName } = getEffectivePrice(insumo);
                  return (
                    <tr key={insumo.id} className="text-xs">
                      <td className="px-4 py-3 text-center"><div className="w-5 h-5 border-2 border-slate-300 rounded mx-auto"></div></td>
                      <td className="px-4 py-3"><p className="font-bold text-slate-800">{insumo.nome}</p></td>
                      <td className="px-4 py-3 text-center text-blue-600 font-semibold">{variantName || '-'}</td>
                      <td className="px-4 py-3 text-center text-slate-500 font-mono">R$ {fmt2(price)}</td>
                      <td className="px-4 py-3 text-center font-black text-blue-700 bg-blue-50/30 font-mono">{Math.round(qtdAjustada)} {insumo.unidade}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-700">R$ {fmt2(qtdAjustada * price)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 font-bold border-t-2 border-slate-200">
                  <td colSpan={5} className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-500">Subtotal Materiais</td>
                  <td className="px-4 py-3 text-right text-blue-700">R$ {fmt2(nonChemicals.reduce((s, i) => s + getQuantidadeAjustada(i) * getEffectivePrice(i).price, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="bg-slate-800 text-white p-5 rounded-xl">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-widest opacity-60 mb-1">Custo Total</p>
              <p className="text-xl font-black">R$ {fmt2(custoTotal)}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-widest opacity-60 mb-1">Custo por Unidade ({embalagemVolume}L)</p>
              <p className="text-xl font-black">R$ {fmt2(quantidade > 0 ? custoTotal / quantidade : 0)}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-widest opacity-60 mb-1">Custo por Litro</p>
              <p className="text-xl font-black">R$ {fmt2(totalVolume > 0 ? custoTotal / totalVolume : 0)}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
          <div className="text-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">Atenção</h4>
            <p className="text-[11px] text-amber-700 leading-relaxed">Este relatório é uma projeção matemática baseada na fórmula original. Inclui custos de insumos químicos e materiais de embalagem para o volume selecionado ({embalagemVolume}L).</p>
          </div>
        </div>
      </div>
    </ReportTemplate>
  );
};
