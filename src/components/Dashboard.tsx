import { useState, useMemo, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  Package, Factory, Users, DollarSign, ShoppingCart, FileText, CheckCircle2,
  Plus, X, Settings2, BarChart2, PieChart as PieChartIcon, LineChart as LineChartIcon
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { Pedido } from './Vendas';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardProps {
  darkMode: boolean;
  formulas?: any[];
  insumos?: any[];
  pedidos?: Pedido[];
}

const AVAILABLE_BLOCKS = [
  { id: 'kpis', title: 'Indicadores Principais', defaultW: 12, defaultH: 2 },
  { id: 'revenue', title: 'Gráfico de Receita', defaultW: 8, defaultH: 6 },
  { id: 'sales_status', title: 'Status de Vendas', defaultW: 4, defaultH: 6 },
  { id: 'top_products', title: 'Produtos Mais Vendidos', defaultW: 12, defaultH: 6 }
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export function Dashboard({ darkMode, formulas = [], insumos = [], pedidos = [] }: DashboardProps) {
  // Layout State
  const [layouts, setLayouts] = useState<any>({
    lg: [
      { i: 'kpis', x: 0, y: 0, w: 12, h: 2 },
      { i: 'revenue', x: 0, y: 2, w: 8, h: 6 },
      { i: 'sales_status', x: 8, y: 2, w: 4, h: 6 },
      { i: 'top_products', x: 0, y: 8, w: 12, h: 6 }
    ],
    md: [
      { i: 'kpis', x: 0, y: 0, w: 10, h: 2 },
      { i: 'revenue', x: 0, y: 2, w: 10, h: 6 },
      { i: 'sales_status', x: 0, y: 8, w: 10, h: 4 },
      { i: 'top_products', x: 0, y: 12, w: 10, h: 6 }
    ],
    sm: [
      { i: 'kpis', x: 0, y: 0, w: 6, h: 4 },
      { i: 'revenue', x: 0, y: 4, w: 6, h: 6 },
      { i: 'sales_status', x: 0, y: 10, w: 6, h: 4 },
      { i: 'top_products', x: 0, y: 14, w: 6, h: 6 }
    ],
    xs: [
      { i: 'kpis', x: 0, y: 0, w: 4, h: 5 },
      { i: 'revenue', x: 0, y: 5, w: 4, h: 6 },
      { i: 'sales_status', x: 0, y: 11, w: 4, h: 4 },
      { i: 'top_products', x: 0, y: 15, w: 4, h: 6 }
    ],
    xxs: [
      { i: 'kpis', x: 0, y: 0, w: 2, h: 6 },
      { i: 'revenue', x: 0, y: 6, w: 2, h: 6 },
      { i: 'sales_status', x: 0, y: 12, w: 2, h: 4 },
      { i: 'top_products', x: 0, y: 16, w: 2, h: 6 }
    ]
  });
  const [visibleBlocks, setVisibleBlocks] = useState<string[]>(['kpis', 'revenue', 'sales_status', 'top_products']);
  const [isEditingLayout, setIsEditingLayout] = useState(false);

  // Load layout from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboard_layout');
    const savedBlocks = localStorage.getItem('dashboard_blocks');
    if (savedLayout) setLayouts(JSON.parse(savedLayout));
    if (savedBlocks) setVisibleBlocks(JSON.parse(savedBlocks));
  }, []);

  const handleLayoutChange = (_currentLayout: Layout, allLayouts: any) => {
    setLayouts(allLayouts);
    localStorage.setItem('dashboard_layout', JSON.stringify(allLayouts));
  };

  const toggleBlock = (blockId: string) => {
    let newBlocks;
    if (visibleBlocks.includes(blockId)) {
      newBlocks = visibleBlocks.filter(id => id !== blockId);
    } else {
      newBlocks = [...visibleBlocks, blockId];
      // Add to layout if not exists
      const blockDef = AVAILABLE_BLOCKS.find(b => b.id === blockId);
      if (blockDef) {
        const newLayoutItem = { i: blockId, x: 0, y: Infinity, w: blockDef.defaultW, h: blockDef.defaultH };
        setLayouts((prev: any) => {
          const updated = { ...prev };
          Object.keys(updated).forEach(key => {
            updated[key] = [...(updated[key] || []), newLayoutItem];
          });
          return updated;
        });
      }
    }
    setVisibleBlocks(newBlocks);
    localStorage.setItem('dashboard_blocks', JSON.stringify(newBlocks));
  };

  // Revenue State
  const [revenuePeriod, setRevenuePeriod] = useState<'7d' | '30d' | '12m'>('12m');

  // Top Products State
  const [topProductsChartType, setTopProductsChartType] = useState<'bar' | 'pie' | 'line'>('bar');

  // Data Calculations
  const {
    vendasHoje,
    orcamentosPendentes,
    receitaMensal,
    topProdutos,
    revenueData,
    totalVendas
  } = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let vendasHojeCount = 0;
    let orcamentosPendentesCount = 0;
    let receitaMensalSum = 0;
    let totalVendasCount = 0;
    const produtosMap = new Map<string, number>();

    // Revenue Data based on period
    let revData: any[] = [];
    if (revenuePeriod === '7d') {
      revData = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { date: d, label: d.toLocaleDateString('pt-BR', { weekday: 'short' }), receita: 0 };
      });
    } else if (revenuePeriod === '30d') {
      revData = Array.from({ length: 30 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return { date: d, label: d.getDate().toString(), receita: 0 };
      });
    } else {
      revData = Array.from({ length: 12 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (11 - i));
        return { 
          month: d.getMonth(), year: d.getFullYear(), 
          label: d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').charAt(0).toUpperCase() + d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').slice(1), 
          receita: 0 
        };
      });
    }

    pedidos.forEach(p => {
      const dataCriacao = new Date(p.createdAt);
      const isToday = new Date(dataCriacao).setHours(0, 0, 0, 0) === hoje.getTime();
      const isCurrentMonth = dataCriacao.getMonth() === hoje.getMonth() && dataCriacao.getFullYear() === hoje.getFullYear();

      if (p.tipo === 'venda') {
        totalVendasCount++;
        if (isToday) vendasHojeCount++;
        if (isCurrentMonth && (p.status === 'pago' || p.status === 'concluido' || p.status === 'pendente' || p.status === 'aprovado' || p.status === 'producao')) {
          receitaMensalSum += p.total;
        }

        // Add to revenue chart
        if (p.status === 'pago' || p.status === 'concluido' || p.status === 'pendente' || p.status === 'aprovado' || p.status === 'producao') {
          if (revenuePeriod === '12m') {
            const target = revData.find(m => m.month === dataCriacao.getMonth() && m.year === dataCriacao.getFullYear());
            if (target) target.receita += p.total;
          } else {
            const target = revData.find(d => d.date && d.date.getDate() === dataCriacao.getDate() && d.date.getMonth() === dataCriacao.getMonth() && d.date.getFullYear() === dataCriacao.getFullYear());
            if (target) target.receita += p.total;
          }
        }

        // Aggregate products
        p.items?.forEach(item => {
          produtosMap.set(item.nome, (produtosMap.get(item.nome) || 0) + item.quantidade);
        });
      } else if (p.tipo === 'orcamento') {
        if (p.status === 'pendente') {
          orcamentosPendentesCount++;
        }
      }
    });

    const topProdutosList = Array.from(produtosMap.entries())
      .map(([produto, quantidade], index) => ({ 
        produto, 
        quantidade,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 8);

    return {
      vendasHoje: vendasHojeCount,
      orcamentosPendentes: orcamentosPendentesCount,
      receitaMensal: receitaMensalSum,
      topProdutos: topProdutosList,
      revenueData: revData,
      totalVendas: totalVendasCount
    };
  }, [pedidos, revenuePeriod]);

  const kpis = [
    { title: 'Receita Mensal', value: `R$ ${receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, gradient: 'from-green-500 to-emerald-600' },
    { title: 'Fichas Técnicas', value: formulas.length.toString(), icon: Factory, gradient: 'from-blue-500 to-blue-600' },
    { title: 'Matérias-Primas', value: insumos.length.toString(), icon: Package, gradient: 'from-amber-500 to-orange-600' },
    { title: 'Total de Vendas', value: totalVendas.toString(), icon: Users, gradient: 'from-purple-500 to-purple-600' },
  ];

  const renderBlock = (blockId: string) => {
    switch (blockId) {
      case 'kpis':
        return (
          <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 drag-handle cursor-move">
              <h3 className="font-semibold text-gray-900 dark:text-white">Indicadores</h3>
              {isEditingLayout && <button onClick={() => toggleBlock('kpis')}><X className="w-4 h-4 text-gray-500 hover:text-red-500" /></button>}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
              {kpis.map((kpi, index) => {
                const Icon = kpi.icon;
                return (
                  <div key={index} className="relative bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center overflow-hidden group">
                    {/* Watermark */}
                    <Icon className="absolute -right-2 -bottom-2 w-16 h-16 text-gray-100 dark:text-gray-700/30 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
                    
                    <div className="relative z-10 flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{kpi.title}</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{kpi.value}</p>
                      </div>
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${kpi.gradient}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'revenue':
        return (
          <div className="relative w-full h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden group">
            {/* Watermark */}
            <DollarSign className="absolute -right-4 -bottom-4 w-32 h-32 text-gray-100 dark:text-gray-700/30 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between mb-4 drag-handle cursor-move">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                Receita
              </h3>
              <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
                <select 
                  value={revenuePeriod} 
                  onChange={(e) => setRevenuePeriod(e.target.value as any)}
                  className="text-sm border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1"
                >
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="12m">Últimos 12 meses</option>
                </select>
                {isEditingLayout && <button onClick={() => toggleBlock('revenue')}><X className="w-4 h-4 text-gray-500 hover:text-red-500" /></button>}
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} vertical={false} />
                  <XAxis dataKey="label" stroke={darkMode ? '#9CA3AF' : '#6B7280'} fontSize={12} tickMargin={10} />
                  <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} fontSize={12} tickFormatter={(val) => `R$${val/1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#FFF', border: 'none', borderRadius: '8px' }}
                    formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                  />
                  <Area type="monotone" dataKey="receita" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorReceita)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case 'sales_status':
        return (
          <div className="relative w-full h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden group">
            {/* Watermark */}
            <ShoppingCart className="absolute -right-4 -bottom-4 w-32 h-32 text-gray-100 dark:text-gray-700/30 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between mb-4 drag-handle cursor-move">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-500" />
                Status de Vendas
              </h3>
              {isEditingLayout && <button onClick={() => toggleBlock('sales_status')}><X className="w-4 h-4 text-gray-500 hover:text-red-500" /></button>}
            </div>
            <div className="flex-1 flex flex-col justify-center gap-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 dark:bg-amber-800/50 rounded-lg">
                    <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Orçamentos Pendentes</p>
                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{orcamentosPendentes}</p>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-800/50 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Vendas Hoje</p>
                    <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{vendasHoje}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'top_products':
        return (
          <div className="relative w-full h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden group">
            {/* Watermark */}
            <Package className="absolute -right-4 -bottom-4 w-32 h-32 text-gray-100 dark:text-gray-700/30 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between mb-4 drag-handle cursor-move">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-500" />
                Produtos Mais Vendidos
              </h3>
              <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button onClick={() => setTopProductsChartType('bar')} className={`p-1.5 rounded-md transition-colors ${topProductsChartType === 'bar' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}><BarChart2 className="w-4 h-4" /></button>
                  <button onClick={() => setTopProductsChartType('pie')} className={`p-1.5 rounded-md transition-colors ${topProductsChartType === 'pie' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}><PieChartIcon className="w-4 h-4" /></button>
                  <button onClick={() => setTopProductsChartType('line')} className={`p-1.5 rounded-md transition-colors ${topProductsChartType === 'line' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}><LineChartIcon className="w-4 h-4" /></button>
                </div>
                {isEditingLayout && <button onClick={() => toggleBlock('top_products')}><X className="w-4 h-4 text-gray-500 hover:text-red-500" /></button>}
              </div>
            </div>
            <div className="flex-1 min-h-0">
              {topProdutos.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  {topProductsChartType === 'bar' ? (
                    <BarChart data={topProdutos} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} horizontal={false} />
                      <XAxis type="number" stroke={darkMode ? '#9CA3AF' : '#6B7280'} fontSize={12} />
                      <YAxis dataKey="produto" type="category" stroke={darkMode ? '#9CA3AF' : '#6B7280'} fontSize={12} width={100} />
                      <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#FFF', border: 'none', borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="quantidade" name="Quantidade Vendida" radius={[0, 4, 4, 0]}>
                        {topProdutos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : topProductsChartType === 'pie' ? (
                    <PieChart>
                      <Pie data={topProdutos} dataKey="quantidade" nameKey="produto" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                        {topProdutos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#FFF', border: 'none', borderRadius: '8px' }} />
                      <Legend />
                    </PieChart>
                  ) : (
                    <LineChart data={topProdutos} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                      <XAxis dataKey="produto" stroke={darkMode ? '#9CA3AF' : '#6B7280'} fontSize={12} />
                      <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#FFF', border: 'none', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="quantidade" name="Quantidade Vendida" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 6, fill: '#8B5CF6' }} activeDot={{ r: 8 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  Nenhum dado disponível.
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-full pb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Visão geral e personalizável do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          {isEditingLayout && (
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                <Plus className="w-4 h-4" />
                Adicionar Bloco
              </button>
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-2 space-y-1">
                  {AVAILABLE_BLOCKS.map(block => {
                    const isVisible = visibleBlocks.includes(block.id);
                    return (
                      <button
                        key={block.id}
                        onClick={() => toggleBlock(block.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${isVisible ? 'bg-gray-50 dark:bg-gray-700/50 text-gray-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                      >
                        {block.title}
                        {isVisible && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsEditingLayout(!isEditingLayout)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isEditingLayout ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            <Settings2 className="w-4 h-4" />
            {isEditingLayout ? 'Concluir Edição' : 'Editar Layout'}
          </button>
        </div>
      </div>

      <div className={`transition-all ${isEditingLayout ? 'is-editing bg-gray-50/50 dark:bg-gray-800/20 rounded-2xl p-4 border-2 border-dashed border-gray-300 dark:border-gray-700' : ''}`}>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          onLayoutChange={handleLayoutChange}
          isDraggable={isEditingLayout}
          isResizable={isEditingLayout}
          draggableHandle=".drag-handle"
          margin={[16, 16]}
        >
          {visibleBlocks.map(blockId => (
            <div key={blockId} className={isEditingLayout ? 'ring-2 ring-blue-500/50 rounded-xl' : ''}>
              {renderBlock(blockId)}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}
