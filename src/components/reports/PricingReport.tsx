import React from 'react';
import { Formula, Precificacao } from '../../types';
import { ReportTemplate } from './ReportTemplate';

interface PricingReportProps {
  formula: Formula;
  precificacao: Precificacao & { unitType: '2L' | '5L' };
}

export const PricingReport: React.FC<PricingReportProps> = ({ formula, precificacao }) => {
  const custoTotal = formula.insumos.reduce((acc, insumo) => acc + (insumo.quantidade * insumo.valorUnitario), 0);
  const rendimento = formula.rendimento || 1;
  const custoPorLitro = custoTotal / rendimento;
  
  const volumeEmbalagem = precificacao.unitType === '2L' ? 2 : 5;
  const custoProdutoEmbalagem = custoPorLitro * volumeEmbalagem;
  const custoTotalUnidade = custoProdutoEmbalagem + (precificacao.custosFixos || 0);

  const calcularLucro = (preco: number, quantidade: number = 1) => preco - (custoTotalUnidade * quantidade);
  const calcularMarkup = (preco: number, quantidade: number = 1) => ((preco / (custoTotalUnidade * quantidade)) - 1) * 100;

  const margemVarejo = calcularMarkup(precificacao.precoVarejo);
  const margemAtacado = calcularMarkup(precificacao.precoAtacado);
  const margemFardo = calcularMarkup(precificacao.precoFardo, precificacao.quantidadeFardo || 6);

  return (
    <ReportTemplate title="Relatório de Precificação e Margens">
      <div className="flex gap-8 items-start">
        
        {/* Coluna Esquerda: Produto e Estrutura de Custos (35%) */}
        <div className="w-[35%] flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1 leading-tight">{formula.nome}</h2>
            <p className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-widest">{formula.codigo}</p>
            <div className="mt-3">
              <span className="inline-flex px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border bg-indigo-50 text-indigo-600 border-indigo-100">
                Embalagem de {precificacao.unitType}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              Estrutura de Custos
            </h3>

            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100">
              <div className="flex justify-between items-end mb-1">
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Líquido ({volumeEmbalagem}L)</p>
                <p className="text-sm font-bold text-slate-700 font-mono">R$ {custoProdutoEmbalagem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                <div className="bg-slate-400 h-1.5 rounded-full" style={{ width: `${(custoProdutoEmbalagem / custoTotalUnidade) * 100}%` }}></div>
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100">
              <div className="flex justify-between items-end mb-1">
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Custos Fixos (Embalagem, Rótulo, etc)</p>
                <p className="text-sm font-bold text-slate-700 font-mono">R$ {(precificacao.custosFixos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                <div className="bg-slate-400 h-1.5 rounded-full" style={{ width: `${((precificacao.custosFixos || 0) / custoTotalUnidade) * 100}%` }}></div>
              </div>
            </div>
            
            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/60 shadow-sm mt-4">
              <p className="text-[9px] uppercase tracking-widest text-indigo-500 font-bold mb-1">Custo Total Unitário</p>
              <p className="text-xl font-bold text-indigo-700 font-mono">R$ {custoTotalUnidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Canais de Venda e Margens (65%) */}
        <div className="w-[65%]">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            Canais de Venda e Margens
          </h3>
          
          <div className="space-y-4">
            
            {/* Varejo */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 overflow-hidden shadow-sm">
              <div className="bg-emerald-50/80 px-4 py-3 border-b border-emerald-100 flex justify-between items-center">
                <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Varejo</h4>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded uppercase tracking-wider">Margem: {margemVarejo.toFixed(1)}%</span>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-emerald-600/70 font-bold mb-1">Preço Final</p>
                  <p className="text-xl font-bold text-emerald-700 font-mono">R$ {(precificacao.precoVarejo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Lucro Bruto</p>
                  <p className="text-sm font-bold text-slate-700 font-mono mt-1">R$ {calcularLucro(precificacao.precoVarejo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Markup</p>
                  <p className="text-sm font-bold text-slate-700 font-mono mt-1">{margemVarejo.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Atacado */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/30 overflow-hidden shadow-sm">
              <div className="bg-blue-50/80 px-4 py-3 border-b border-blue-100 flex justify-between items-center">
                <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest">Atacado</h4>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded uppercase tracking-wider">Margem: {margemAtacado.toFixed(1)}%</span>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-blue-600/70 font-bold mb-1">Preço Final</p>
                  <p className="text-xl font-bold text-blue-700 font-mono">R$ {(precificacao.precoAtacado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Lucro Bruto</p>
                  <p className="text-sm font-bold text-slate-700 font-mono mt-1">R$ {calcularLucro(precificacao.precoAtacado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Markup</p>
                  <p className="text-sm font-bold text-slate-700 font-mono mt-1">{margemAtacado.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Fardo */}
            <div className="rounded-xl border border-purple-100 bg-purple-50/30 overflow-hidden shadow-sm">
              <div className="bg-purple-50/80 px-4 py-3 border-b border-purple-100 flex justify-between items-center">
                <h4 className="text-xs font-bold text-purple-700 uppercase tracking-widest">Fardo ({precificacao.quantidadeFardo || 6} un)</h4>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-100/50 px-2 py-0.5 rounded uppercase tracking-wider">Margem: {margemFardo.toFixed(1)}%</span>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-purple-600/70 font-bold mb-1">Preço Final</p>
                  <p className="text-xl font-bold text-purple-700 font-mono">R$ {(precificacao.precoFardo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Lucro Bruto</p>
                  <p className="text-sm font-bold text-slate-700 font-mono mt-1">R$ {calcularLucro(precificacao.precoFardo || 0, precificacao.quantidadeFardo || 6).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Markup</p>
                  <p className="text-sm font-bold text-slate-700 font-mono mt-1">{margemFardo.toFixed(1)}%</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </ReportTemplate>
  );
};
