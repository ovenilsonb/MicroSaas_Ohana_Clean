import { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Search,
  FlaskConical,
  Package,
  ShoppingCart,
  Users,
  ChevronRight,
  DollarSign,
  Tag,
  Plus
} from 'lucide-react';
import { Formula, Insumo, Precificacao, ReportTemplateConfig, ReportAssignments } from '../types';
import { Pedido } from './Vendas';
import { FormulaReport } from './reports/FormulaReport';
import { ProportionReport } from './reports/ProportionReport';
import { PricingReport } from './reports/PricingReport';
import { VendaReport } from './reports/VendaReport';
import { Modal } from './Modal';
import { printComponent } from '../utils/printUtils';

interface RelatoriosProps {
  formulas: Formula[];
  insumos: Insumo[];
  pedidos: Pedido[];
  clientes: any[];
  precificacoes: Record<string, Precificacao>;
  companyName: string;
  companyLogo: string;
  reportTemplates?: ReportTemplateConfig[];
  reportAssignments?: ReportAssignments;
  onNavigateTo?: (module: string) => void;
}

export function Relatorios({ formulas, insumos, pedidos, clientes, precificacoes, companyName, companyLogo, reportTemplates = [], reportAssignments, onNavigateTo }: RelatoriosProps) {
  const getTemplateConfig = (type: keyof ReportAssignments) => {
    if (!reportAssignments || !reportAssignments[type]) return undefined;
    return reportTemplates.find(t => t.id === reportAssignments[type]);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [showFormulaReport, setShowFormulaReport] = useState(false);
  const [showProportionReport, setShowProportionReport] = useState(false);
  const [showPricingReport, setShowPricingReport] = useState(false);
  const [selectedPricingVolume, setSelectedPricingVolume] = useState<number>(2);
  const [proportionQuantidade, setProportionQuantidade] = useState(1);
  const [proportionUnidade, setProportionUnidade] = useState('UN');
  const [proportionEmbalagemVolume, setProportionEmbalagemVolume] = useState(2);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [showPedidoReport, setShowPedidoReport] = useState(false);

  const filteredFormulas = formulas.filter(f => 
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Fórmulas', value: formulas.length, icon: FlaskConical, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Insumos', value: insumos.length, icon: Package, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Vendas', value: pedidos.filter(p => p.tipo === 'venda').length, icon: ShoppingCart, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Precificações', value: Object.keys(precificacoes).length, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ];

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    // Tenta encontrar o container de impressão mais próximo do botão clicado
    const modalContent = (e.currentTarget as HTMLElement).closest('.modal-print-wrapper');
    const container = modalContent?.querySelector('.print-container');
    
    if (container) {
      printComponent(container.innerHTML);
    } else {
      // Fallback para o comportamento padrão se não encontrar o container específico
      window.print();
    }
  };

  const exportToCSV = (data: any[], fileName: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
          <p className="text-gray-500 dark:text-gray-400">Central de impressões e documentos do sistema</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg} dark:bg-opacity-10`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-500" />
                Documentos e Fichas Técnicas
              </h3>
              <div className="relative w-48 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar fórmula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
              {filteredFormulas.map((formula) => (
                <div key={formula.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                      <FlaskConical className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{formula.nome}</p>
                      <p className="text-xs text-gray-500">{formula.codigo || 'Sem código'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedFormula(formula);
                        setShowFormulaReport(true);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-[10px] font-bold uppercase tracking-wider"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Ficha Técnica
                    </button>
                    <button
                      onClick={() => {
                        setSelectedFormula(formula);
                        setShowProportionReport(true);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors text-[10px] font-bold uppercase tracking-wider"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Proporção
                    </button>
                    {precificacoes[formula.id] && (
                      <button
                        onClick={() => {
                          setSelectedFormula(formula);
                          const saved = precificacoes[formula.id] as any;
                          setSelectedPricingVolume(saved?.unitVolume || (saved?.unitType === '5L' ? 5 : 2));
                          setShowPricingReport(true);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors text-[10px] font-bold uppercase tracking-wider"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Preços ({((precificacoes[formula.id] as any)?.unitVolume || ((precificacoes[formula.id] as any)?.unitType === '5L' ? 5 : 2))}L)
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredFormulas.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  Nenhuma fórmula encontrada.
                </div>
              )}
            </div>
          </div>

          {/* Dedicated Pricing Reports Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                Relatórios de Precificação Disponíveis
              </h3>
              {onNavigateTo && (
                <button
                  onClick={() => onNavigateTo('precificacao')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-[10px] font-bold uppercase tracking-wider"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova Precificação
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-[300px] overflow-y-auto">
              {formulas.filter(f => precificacoes[f.id]).map((formula) => (
                <div key={`price-${formula.id}`} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                      <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{formula.nome}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedFormula(formula);
                        const saved = precificacoes[formula.id] as any;
                        setSelectedPricingVolume(saved?.unitVolume || (saved?.unitType === '5L' ? 5 : 2));
                        setShowPricingReport(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-[10px] font-bold uppercase tracking-wider"
                    >
                      Ver Preços ({((precificacoes[formula.id] as any)?.unitVolume || ((precificacoes[formula.id] as any)?.unitType === '5L' ? 5 : 2))}L)
                    </button>
                  </div>
                </div>
              ))}
              {formulas.filter(f => precificacoes[f.id]).length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-gray-500 text-sm italic mb-3">Nenhuma precificação encontrada.</p>
                  {onNavigateTo && (
                    <button
                      onClick={() => onNavigateTo('precificacao')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs font-bold"
                    >
                      <Plus className="w-4 h-4" />
                      Criar Precificação
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pedidos e Orçamentos Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-500" />
                Relatórios de Vendas e Orçamentos
              </h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-[300px] overflow-y-auto">
              {pedidos.map((pedido) => (
                <div key={`pedido-${pedido.id}`} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pedido.tipo === 'venda' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {pedido.tipo === 'venda' ? 'Venda' : 'Orçamento'} {pedido.numero}
                      </p>
                      <p className="text-xs text-gray-500">{pedido.cliente}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPedido(pedido);
                      setShowPedidoReport(true);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors text-[10px] font-bold uppercase tracking-wider"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimir
                  </button>
                </div>
              ))}
              {pedidos.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm italic">
                  Nenhum pedido ou orçamento encontrado.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions / Other Reports */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-green-500" />
              Exportar Dados
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => exportToCSV(insumos, 'lista_insumos')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lista de Insumos</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => exportToCSV(formulas, 'lista_formulas')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <FlaskConical className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lista de Fórmulas</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => exportToCSV(clientes, 'lista_clientes')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lista de Clientes</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-500" />
              Relatórios de Preços
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Os relatórios de precificação estão disponíveis para fórmulas que possuem dados de custos e margens configurados.
            </p>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Dica</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">Use os botões "Preços" na lista de fórmulas ou na seção de precificação para visualizar as margens de cada canal.</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/20">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Dica de Impressão
            </h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-4">
              Para melhores resultados, utilize o navegador Google Chrome e certifique-se de que a opção "Gráficos de segundo plano" esteja marcada.
            </p>
            <div className="p-3 bg-white/10 rounded-xl border border-white/20">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Aviso de Sandbox</p>
              <p className="text-[11px] text-blue-100">Se o botão de imprimir não funcionar, abra o aplicativo em uma nova aba usando o botão no canto superior direito.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modals */}
      {selectedFormula && (
        <>
          <Modal
            isOpen={showFormulaReport}
            onClose={() => setShowFormulaReport(false)}
            title={`Ficha Técnica - ${selectedFormula.nome}`}
            size="xl"
          >
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl modal-print-wrapper">
              <div className="flex justify-end mb-4 no-print">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold uppercase text-xs tracking-widest"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Documento
                </button>
              </div>
              <div className="print-container">
                <FormulaReport 
                  formula={selectedFormula}
                  companyName={companyName}
                  companyLogo={companyLogo}
                  config={getTemplateConfig('formula')}
                />
              </div>
            </div>
          </Modal>

          <Modal
            isOpen={showProportionReport}
            onClose={() => setShowProportionReport(false)}
            title={`Relatório de Proporção - ${selectedFormula.nome}`}
            size="xl"
          >
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl modal-print-wrapper">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 no-print bg-gray-50 dark:bg-gray-700/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-600">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Quantidade (Unidades)</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min={1}
                        value={proportionQuantidade}
                        onChange={(e) => setProportionQuantidade(Math.max(1, Number(e.target.value) || 1))}
                        className="w-32 px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-gray-600 rounded-xl text-lg font-black text-blue-600 focus:border-blue-500 outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="hidden sm:block h-12 w-px bg-gray-200 dark:bg-gray-600"></div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Volume Embalagem</label>
                    <div className="flex gap-1">
                      {[0.5, 1, 2, 5, 10, 20].map(v => (
                        <button
                          key={v}
                          onClick={() => setProportionEmbalagemVolume(v)}
                          className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                            proportionEmbalagemVolume === v
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-600 hover:bg-indigo-50'
                          }`}
                        >
                          {v}L
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="hidden sm:block h-12 w-px bg-gray-200 dark:bg-gray-600"></div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rendimento Original</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{selectedFormula.rendimento} {selectedFormula.unidade}</p>
                  </div>
                </div>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-black uppercase text-xs tracking-[0.15em] shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  <Printer className="w-5 h-5" />
                  Imprimir Documento
                </button>
              </div>
              <div className="print-container">
                <ProportionReport 
                  formula={selectedFormula}
                  quantidade={proportionQuantidade}
                  unidade={proportionUnidade}
                  embalagemVolume={proportionEmbalagemVolume}
                  insumosData={insumos}
                  companyName={companyName}
                  companyLogo={companyLogo}
                  config={getTemplateConfig('proportion')}
                />
              </div>
            </div>
          </Modal>

          {precificacoes[selectedFormula.id] && (
            <Modal
              isOpen={showPricingReport}
              onClose={() => setShowPricingReport(false)}
              title={`Relatório de Precificação - ${selectedFormula.nome}`}
              size="xl"
            >
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl modal-print-wrapper">
                <div className="flex justify-end mb-4 no-print">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold uppercase text-xs tracking-widest"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir Documento
                  </button>
                </div>
                <div className="print-container">
                  <PricingReport 
                    formula={selectedFormula}
                    precificacao={{ ...precificacoes[selectedFormula.id], unitVolume: selectedPricingVolume }}
                    companyName={companyName}
                    companyLogo={companyLogo}
                    config={getTemplateConfig('pricing')}
                  />
                </div>
              </div>
            </Modal>
          )}
        </>
      )}
      <Modal
        isOpen={showPedidoReport}
        onClose={() => setShowPedidoReport(false)}
        title={`Pré-visualização - ${selectedPedido?.tipo === 'venda' ? 'Venda' : 'Orçamento'} ${selectedPedido?.numero || ''}`}
        size="xl"
      >
        <div className="space-y-4 modal-print-wrapper">
          <div className="flex justify-end gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setShowPedidoReport(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
          </div>
          <div className="bg-gray-100 dark:bg-gray-900 p-4 sm:p-8 rounded-xl overflow-x-auto">
            <div className="print-container">
              {selectedPedido && (
                <VendaReport 
                  pedido={selectedPedido} 
                  companyName={companyName}
                  companyLogo={companyLogo}
                  config={getTemplateConfig('venda')}
                />
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
