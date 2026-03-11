import React from 'react';
import { Formula, Precificacao } from '../../types';
import { ReportTemplate } from './ReportTemplate';

interface PricingReportProps {
  formula: Formula;
  precificacao: Precificacao & { unitVolume?: number; unitType?: string };
}

export const PricingReport: React.FC<PricingReportProps & { companyName?: string; companyLogo?: string; config?: any }> = ({ formula, precificacao, companyName, companyLogo, config }) => {
  const custoTotal = (formula.insumos || []).reduce((acc, insumo) => acc + (insumo.quantidade * insumo.valorUnitario), 0);
  const rendimento = formula.rendimento || 1;
  const custoPorLitro = custoTotal / rendimento;
  
  const volumeEmbalagem = (precificacao as any).unitVolume || ((precificacao as any).unitType === '5L' ? 5 : 2);
  const custoProdutoEmbalagem = custoPorLitro * volumeEmbalagem;
  const custoTotalUnidade = custoProdutoEmbalagem + (precificacao.custosFixos || 0);

  const calcularLucro = (preco: number, quantidade: number = 1) => preco - (custoTotalUnidade * quantidade);
  const calcularMarkup = (preco: number, quantidade: number = 1) => ((preco / (custoTotalUnidade * quantidade)) - 1) * 100;

  const margemVarejo = calcularMarkup(precificacao.precoVarejo);
  const margemAtacado = calcularMarkup(precificacao.precoAtacado);
  const margemFardo = calcularMarkup(precificacao.precoFardo, precificacao.quantidadeFardo || 6);

  return (
    <ReportTemplate title="Relatório de Precificação e Margens" companyName={companyName} companyLogo={companyLogo} config={config}>
      <div className="space-y-8">
        {/* Identificação do Produto */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">{formula.nome}</h2>
            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">{formula.codigo || 'Sem Código'}</p>
          </div>
          <div className="bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apresentação</p>
            <p className="text-sm font-bold text-slate-700">Embalagem de {volumeEmbalagem >= 1 ? `${volumeEmbalagem}L` : `${volumeEmbalagem * 1000}ml`}</p>
          </div>
        </div>

        {/* Estrutura de Custos */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 border-l-4 border-slate-400 pl-2">Estrutura de Custos Unitários</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Conteúdo Líquido ({volumeEmbalagem}L)</span>
                  <span className="text-sm font-bold text-slate-700">R$ {custoProdutoEmbalagem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-slate-400 h-full" style={{ width: `${(custoProdutoEmbalagem / custoTotalUnidade) * 100}%` }}></div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Custos Fixos / Insumos Secundários</span>
                  <span className="text-sm font-bold text-slate-700">R$ {(precificacao.custosFixos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-slate-400 h-full" style={{ width: `${((precificacao.custosFixos || 0) / custoTotalUnidade) * 100}%` }}></div>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex flex-col justify-center items-center text-center">
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Custo Total de Produção</p>
              <p className="text-3xl font-black text-blue-700">R$ {custoTotalUnidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-blue-400 mt-2 italic">Custo por unidade pronta para venda</p>
            </div>
          </div>
        </div>

        {/* Canais de Venda */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 border-l-4 border-blue-600 pl-2">Análise de Canais e Margens</h3>
          <div className="grid grid-cols-1 gap-4">
            {/* Varejo */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <div className="col-span-1 border-r border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Varejo</p>
                <p className="text-lg font-black text-emerald-700">R$ {(precificacao.precoVarejo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Lucro Bruto</p>
                <p className="text-sm font-bold text-slate-700">R$ {calcularLucro(precificacao.precoVarejo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Markup</p>
                <p className="text-sm font-bold text-slate-700">{margemVarejo.toFixed(1)}%</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">Margem Ideal</span>
              </div>
            </div>

            {/* Atacado */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="col-span-1 border-r border-blue-100">
                <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Atacado</p>
                <p className="text-lg font-black text-blue-700">R$ {(precificacao.precoAtacado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Lucro Bruto</p>
                <p className="text-sm font-bold text-slate-700">R$ {calcularLucro(precificacao.precoAtacado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Markup</p>
                <p className="text-sm font-bold text-slate-700">{margemAtacado.toFixed(1)}%</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">Volume</span>
              </div>
            </div>

            {/* Fardo */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
              <div className="col-span-1 border-r border-purple-100">
                <p className="text-[10px] font-bold text-purple-600 uppercase mb-1">Fardo ({precificacao.quantidadeFardo || 6} un)</p>
                <p className="text-lg font-black text-purple-700">R$ {(precificacao.precoFardo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Lucro Bruto</p>
                <p className="text-sm font-bold text-slate-700">R$ {calcularLucro(precificacao.precoFardo || 0, precificacao.quantidadeFardo || 6).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Markup</p>
                <p className="text-sm font-bold text-slate-700">{margemFardo.toFixed(1)}%</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded uppercase">Distribuição</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ReportTemplate>
  );
};
