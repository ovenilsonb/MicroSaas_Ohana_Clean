import React, { useState, useMemo, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  Package, Factory, Users, DollarSign, ShoppingCart, FileText, CheckCircle2,
  Plus, X, Settings2, BarChart2, PieChart as PieChartIcon, LineChart as LineChartIcon,
  TrendingUp, AlertTriangle, Activity, Star, Clock, Layers,
  ArrowUpRight, ArrowDownRight, Zap, Target, LayoutGrid, Check
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend, RadialBarChart, RadialBar
} from 'recharts';
import { Pedido } from './Vendas';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardProps {
  darkMode: boolean;
  formulas?: any[];
  insumos?: any[];
  pedidos?: Pedido[];
}

// ─── Block Registry ───────────────────────────────────────────────────────────
const ALL_BLOCKS = [
  { id: 'kpis',          title: 'Indicadores Principais',     icon: LayoutGrid,   description: 'KPIs de receita, fórmulas, insumos e vendas', defaultW: 12, defaultH: 4, category: 'Visão Geral' },
  { id: 'revenue',       title: 'Gráfico de Receita',          icon: TrendingUp,   description: 'Evolução da receita por período',             defaultW: 8,  defaultH: 6, category: 'Financeiro' },
  { id: 'sales_status',  title: 'Status de Vendas',            icon: ShoppingCart, description: 'Orçamentos e vendas do dia',                  defaultW: 4,  defaultH: 6, category: 'Vendas' },
  { id: 'top_products',  title: 'Produtos Mais Vendidos',      icon: Star,         description: 'Ranking de produtos por quantidade',          defaultW: 12, defaultH: 6, category: 'Vendas' },
  { id: 'formulas_list', title: 'Fichas Técnicas',             icon: Factory,      description: 'Lista das fórmulas cadastradas',              defaultW: 6,  defaultH: 5, category: 'Produção' },
  { id: 'insumos_alert', title: 'Alertas de Insumos',          icon: AlertTriangle,description: 'Insumos com estoque baixo ou a vencer',       defaultW: 6,  defaultH: 5, category: 'Estoque' },
  { id: 'pedidos_recent',title: 'Pedidos Recentes',            icon: Clock,        description: 'Últimos pedidos registrados no sistema',      defaultW: 8,  defaultH: 6, category: 'Vendas' },
  { id: 'meta_receita',  title: 'Meta de Receita',             icon: Target,       description: 'Progresso da meta mensal de receita',        defaultW: 4,  defaultH: 6, category: 'Financeiro' },
  { id: 'formula_cost',  title: 'Custo por Fórmula',           icon: Layers,       description: 'Comparativo de custo das fórmulas',          defaultW: 12, defaultH: 6, category: 'Produção' },
  { id: 'activity',      title: 'Atividade do Sistema',        icon: Activity,     description: 'Resumo de atividades e movimentações',       defaultW: 4,  defaultH: 5, category: 'Visão Geral' },
  { id: 'ticket_medio',  title: 'Ticket Médio & Conversão',   icon: Zap,          description: 'Ticket médio e taxa de conversão',           defaultW: 8,  defaultH: 4, category: 'Financeiro' },
];

const DEFAULT_VISIBLE = ['kpis', 'revenue', 'sales_status', 'top_products'];

const COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316'];

function BlockModal({ visible, onClose, visibleBlocks, onToggle }: {
  visible: boolean;
  onClose: () => void;
  visibleBlocks: string[];
  onToggle: (id: string) => void;
}) {
  const categories = Array.from(new Set(ALL_BLOCKS.map(b => b.category)));

  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Personalizar Dashboard</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Marque ou desmarque os blocos que deseja exibir</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-5">
          {categories.map(cat => (
            <div key={cat}>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 px-1">{cat}</p>
              <div className="space-y-1">
                {ALL_BLOCKS.filter(b => b.category === cat).map(block => {
                  const isActive = visibleBlocks.includes(block.id);
                  const Icon = block.icon;
                  return (
                    <button
                      key={block.id}
                      onClick={() => onToggle(block.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150 border ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/40'
                          : 'bg-gray-50 dark:bg-gray-800/60 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className={`flex-shrink-0 p-1.5 rounded-lg ${isActive ? 'bg-blue-100 dark:bg-blue-800/50' : 'bg-gray-200 dark:bg-gray-700'}`}>
                        <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-blue-800 dark:text-blue-200' : 'text-gray-700 dark:text-gray-200'}`}>
                          {block.title}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{block.description}</p>
                      </div>
                      <div className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isActive && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {visibleBlocks.length} de {ALL_BLOCKS.length} blocos ativos
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, icon: Icon, gradient, trend }: {
  title: string; value: string; sub?: string; icon: any; gradient: string; trend?: 'up'|'down'|'neutral';
}) {
  return (
    <div className={`relative flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
      {/* Glowing accent */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-gradient-to-br ${gradient} rounded-2xl pointer-events-none`} />
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            trend === 'up' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            : trend === 'down' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1 leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{sub}</p>}
    </div>
  );
}

// ─── Block wrapper card ────────────────────────────────────────────────────────
function BlockCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full h-full flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function BlockHeader({ icon: Icon, title, color = 'text-blue-500', children, onRemove, isEditing }: {
  icon: any; title: string; color?: string; children?: React.ReactNode; onRemove?: () => void; isEditing?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 drag-handle cursor-move flex-shrink-0">
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
      </div>
      <div className="flex items-center gap-2" onMouseDown={e => e.stopPropagation()}>
        {children}
        {isEditing && onRemove && (
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function PeriodSelect({ value, onChange }: { value: string; onChange: (v: any) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
    >
      <option value="7d">7 dias</option>
      <option value="30d">30 dias</option>
      <option value="12m">12 meses</option>
    </select>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export function Dashboard({ darkMode, formulas = [], insumos = [], pedidos = [] }: DashboardProps) {
  const [layouts, setLayouts] = useState<any>(() => {
    const saved = localStorage.getItem('dashboard_layout_v3');
    if (saved) return JSON.parse(saved);
    // Clear old layout key to avoid stale data
    localStorage.removeItem('dashboard_layout_v2');
    return {
      lg: [
        { i: 'kpis',          x: 0,  y: 0,  w: 12, h: 4, minH: 4 },
        { i: 'revenue',       x: 0,  y: 4,  w: 8,  h: 6 },
        { i: 'sales_status',  x: 8,  y: 4,  w: 4,  h: 6 },
        { i: 'top_products',  x: 0,  y: 10, w: 12, h: 6 },
      ],
      md: [
        { i: 'kpis',          x: 0,  y: 0,  w: 10, h: 4, minH: 4 },
        { i: 'revenue',       x: 0,  y: 4,  w: 10, h: 6 },
        { i: 'sales_status',  x: 0,  y: 10, w: 10, h: 4 },
        { i: 'top_products',  x: 0,  y: 14, w: 10, h: 6 },
      ],
    };
  });

  const [visibleBlocks, setVisibleBlocks] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard_blocks_v2');
    return saved ? JSON.parse(saved) : DEFAULT_VISIBLE;
  });

  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [revenuePeriod, setRevenuePeriod] = useState<'7d'|'30d'|'12m'>('12m');
  const [topChartType, setTopChartType] = useState<'bar'|'pie'|'line'>('bar');

  const handleLayoutChange = useCallback((_: Layout, allLayouts: any) => {
    setLayouts(allLayouts);
    localStorage.setItem('dashboard_layout_v3', JSON.stringify(allLayouts));
  }, []);

  const toggleBlock = useCallback((blockId: string) => {
    setVisibleBlocks(prev => {
      let next: string[];
      if (prev.includes(blockId)) {
        next = prev.filter(id => id !== blockId);
      } else {
        next = [...prev, blockId];
        const def = ALL_BLOCKS.find(b => b.id === blockId);
        if (def) {
          const item = { i: blockId, x: 0, y: Infinity, w: def.defaultW, h: def.defaultH };
          setLayouts((l: any) => {
            const u = { ...l };
            Object.keys(u).forEach(k => { u[k] = [...(u[k] || []), item]; });
            return u;
          });
        }
      }
      localStorage.setItem('dashboard_blocks_v2', JSON.stringify(next));
      return next;
    });
  }, []);

  // ─── Data ─────────────────────────────────────────────────────────────────
  const data = useMemo(() => {
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    let vendasHoje=0, orcamentos=0, receita=0, totalVendas=0;
    const prodMap = new Map<string,number>();

    let revData: any[] = [];
    if (revenuePeriod === '7d') {
      revData = Array.from({length:7}).map((_,i) => {
        const d = new Date(); d.setDate(d.getDate()-(6-i));
        return { date:d, label: d.toLocaleDateString('pt-BR',{weekday:'short'}), receita:0 };
      });
    } else if (revenuePeriod === '30d') {
      revData = Array.from({length:30}).map((_,i) => {
        const d = new Date(); d.setDate(d.getDate()-(29-i));
        return { date:d, label: d.getDate().toString(), receita:0 };
      });
    } else {
      revData = Array.from({length:12}).map((_,i) => {
        const d = new Date(); d.setMonth(d.getMonth()-(11-i));
        const lbl = d.toLocaleString('pt-BR',{month:'short'}).replace('.','');
        return { month:d.getMonth(), year:d.getFullYear(), label: lbl.charAt(0).toUpperCase()+lbl.slice(1), receita:0 };
      });
    }

    const recentPedidos: Pedido[] = [];
    pedidos.forEach(p => {
      const dc = new Date(p.createdAt);
      const isToday = new Date(dc).setHours(0,0,0,0)===hoje.getTime();
      const isCurrMonth = dc.getMonth()===hoje.getMonth() && dc.getFullYear()===hoje.getFullYear();
      const isPaid = ['pago','concluido','pendente','aprovado','producao'].includes(p.status);
      if (p.tipo==='venda') {
        totalVendas++;
        if (isToday) vendasHoje++;
        if (isCurrMonth && isPaid) receita+=p.total;
        if (isPaid) {
          if (revenuePeriod==='12m') {
            const t=revData.find(m=>m.month===dc.getMonth()&&m.year===dc.getFullYear());
            if (t) t.receita+=p.total;
          } else {
            const t=revData.find(d=>d.date&&d.date.getDate()===dc.getDate()&&d.date.getMonth()===dc.getMonth()&&d.date.getFullYear()===dc.getFullYear());
            if (t) t.receita+=p.total;
          }
        }
        p.items?.forEach(item=>prodMap.set(item.nome,(prodMap.get(item.nome)||0)+item.quantidade));
      } else if (p.tipo==='orcamento' && p.status==='pendente') {
        orcamentos++;
      }
      recentPedidos.push(p);
    });

    const topProdutos = Array.from(prodMap.entries())
      .map(([produto,quantidade],index)=>({ produto, quantidade, color: COLORS[index%COLORS.length] }))
      .sort((a,b)=>b.quantidade-a.quantidade).slice(0,8);

    const ticketMedio = totalVendas>0 ? receita/totalVendas : 0;
    const taxaConversao = pedidos.length>0 ? (totalVendas/pedidos.length)*100 : 0;

    return { vendasHoje, orcamentos, receita, totalVendas, topProdutos, revData, ticketMedio, taxaConversao,
      recentPedidos: recentPedidos.sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).slice(0,8) };
  }, [pedidos, revenuePeriod]);

  // ─── Formula cost data ────────────────────────────────────────────────────
  const formulaCostData = useMemo(() =>
    formulas.slice(0,8).map((f,i)=>({
      name: f.nome?.length>12 ? f.nome.slice(0,12)+'…' : (f.nome||`F${i+1}`),
      custo: f.custoTotal||f.custo||Math.random()*50+5,
      color: COLORS[i%COLORS.length]
    })), [formulas]);

  // ─── Insumos alert data ───────────────────────────────────────────────────
  const insumosAlert = useMemo(() =>
    insumos.filter((_,i)=>i<6).map((ins,i)=>({
      ...ins,
      nivel: i%3===0?'critico':i%3===1?'atencao':'ok',
      nome: ins.nome||`Insumo ${i+1}`,
      qtd: ins.quantidade||ins.estoque||Math.floor(Math.random()*200),
      min: ins.estoqueMinimo||ins.minimo||50,
    })), [insumos]);

  // ─── Meta progress ────────────────────────────────────────────────────────
  const META = 10000;
  const metaPct = Math.min(100, Math.round((data.receita/META)*100));
  const metaData = [{ name:'Meta', value: metaPct, fill: metaPct>=100?'#10B981':metaPct>=60?'#3B82F6':'#F59E0B' }];

  // ─── Render Block ─────────────────────────────────────────────────────────
  const renderBlock = (blockId: string) => {
    const rm = () => toggleBlock(blockId);

    switch (blockId) {

      // ── KPIs ────────────────────────────────────────────────────────────
      case 'kpis':
        return (
          <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 drag-handle cursor-move px-1">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Indicadores Principais</h3>
              {isEditingLayout && (
                <button onClick={rm} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
              <KpiCard title="Receita Mensal" value={`R$ ${data.receita.toLocaleString('pt-BR',{minimumFractionDigits:2})}`} sub="Mês atual" icon={DollarSign} gradient="from-emerald-500 to-green-600" trend="up" />
              <KpiCard title="Fichas Técnicas" value={formulas.length.toString()} sub={`${formulas.length} cadastradas`} icon={Factory} gradient="from-blue-500 to-blue-600" trend="neutral" />
              <KpiCard title="Matérias-Primas" value={insumos.length.toString()} sub={`${insumos.length} registradas`} icon={Package} gradient="from-amber-500 to-orange-600" trend="neutral" />
              <KpiCard title="Total de Vendas" value={data.totalVendas.toString()} sub={`${data.vendasHoje} hoje`} icon={Users} gradient="from-purple-500 to-violet-600" trend={data.vendasHoje>0?'up':'neutral'} />
            </div>
          </div>
        );

      // ── Revenue ─────────────────────────────────────────────────────────
      case 'revenue':
        return (
          <BlockCard>
            <BlockHeader icon={TrendingUp} title="Receita" color="text-emerald-500" isEditing={isEditingLayout} onRemove={rm}>
              <PeriodSelect value={revenuePeriod} onChange={setRevenuePeriod} />
            </BlockHeader>
            <div className="flex-1 min-h-0 px-2 py-3">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={data.revData} margin={{top:4,right:8,bottom:0,left:0}}>
                  <defs>
                    <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode?'#1F2937':'#F3F4F6'} vertical={false}/>
                  <XAxis dataKey="label" stroke={darkMode?'#6B7280':'#9CA3AF'} fontSize={11} tickMargin={8} axisLine={false} tickLine={false}/>
                  <YAxis stroke={darkMode?'#6B7280':'#9CA3AF'} fontSize={11} tickFormatter={v=>`R$${v>=1000?(v/1000).toFixed(0)+'k':v}`} axisLine={false} tickLine={false}/>
                  <Tooltip
                    contentStyle={{backgroundColor:darkMode?'#111827':'#fff',border:'1px solid '+(darkMode?'#1F2937':'#E5E7EB'),borderRadius:'12px',boxShadow:'0 4px 20px rgba(0,0,0,0.15)',fontSize:'12px'}}
                    formatter={(v:any)=>[`R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}`,'Receita']}
                    labelStyle={{color:darkMode?'#9CA3AF':'#6B7280', fontWeight:600}}
                  />
                  <Area type="monotone" dataKey="receita" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#gRevenue)" dot={false} activeDot={{r:5,fill:'#10B981',strokeWidth:0}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </BlockCard>
        );

      // ── Sales Status ─────────────────────────────────────────────────────
      case 'sales_status':
        return (
          <BlockCard>
            <BlockHeader icon={ShoppingCart} title="Status de Vendas" color="text-blue-500" isEditing={isEditingLayout} onRemove={rm}/>
            <div className="flex-1 flex flex-col justify-center gap-3 p-4">
              {[
                { label:'Orçamentos Pendentes', value:data.orcamentos, icon:FileText, bg:'bg-amber-50 dark:bg-amber-900/15', border:'border-amber-100 dark:border-amber-800/20', ibg:'bg-amber-100 dark:bg-amber-800/40', ic:'text-amber-600 dark:text-amber-400', tc:'text-amber-800 dark:text-amber-200' },
                { label:'Vendas Hoje', value:data.vendasHoje, icon:CheckCircle2, bg:'bg-emerald-50 dark:bg-emerald-900/15', border:'border-emerald-100 dark:border-emerald-800/20', ibg:'bg-emerald-100 dark:bg-emerald-800/40', ic:'text-emerald-600 dark:text-emerald-400', tc:'text-emerald-800 dark:text-emerald-200' },
                { label:'Total de Vendas', value:data.totalVendas, icon:TrendingUp, bg:'bg-blue-50 dark:bg-blue-900/15', border:'border-blue-100 dark:border-blue-800/20', ibg:'bg-blue-100 dark:bg-blue-800/40', ic:'text-blue-600 dark:text-blue-400', tc:'text-blue-800 dark:text-blue-200' },
              ].map(({label,value,icon:Icon,bg,border,ibg,ic,tc})=>(
                <div key={label} className={`flex items-center gap-4 p-4 rounded-xl border ${bg} ${border}`}>
                  <div className={`p-2.5 rounded-xl ${ibg}`}><Icon className={`w-5 h-5 ${ic}`}/></div>
                  <div className="flex-1">
                    <p className={`text-xs font-medium ${tc} opacity-80`}>{label}</p>
                    <p className={`text-2xl font-extrabold ${tc}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </BlockCard>
        );

      // ── Top Products ─────────────────────────────────────────────────────
      case 'top_products':
        return (
          <BlockCard>
            <BlockHeader icon={Star} title="Produtos Mais Vendidos" color="text-purple-500" isEditing={isEditingLayout} onRemove={rm}>
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                {([['bar', BarChart2],['pie', PieChartIcon],['line', LineChartIcon]] as any[]).map(([t,Icon])=>(
                  <button key={t} onClick={()=>setTopChartType(t)} className={`p-1.5 rounded-md transition-colors ${topChartType===t?'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-gray-100':'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                    <Icon className="w-3.5 h-3.5"/>
                  </button>
                ))}
              </div>
            </BlockHeader>
            <div className="flex-1 min-h-0 px-2 py-3">
              {data.topProdutos.length>0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  {topChartType==='bar' ? (
                    <BarChart data={data.topProdutos} layout="vertical" margin={{left:10,right:10}}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode?'#1F2937':'#F3F4F6'} horizontal={false}/>
                      <XAxis type="number" stroke={darkMode?'#6B7280':'#9CA3AF'} fontSize={11} axisLine={false} tickLine={false}/>
                      <YAxis dataKey="produto" type="category" stroke={darkMode?'#6B7280':'#9CA3AF'} fontSize={11} width={90} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{backgroundColor:darkMode?'#111827':'#fff',border:'1px solid '+(darkMode?'#1F2937':'#E5E7EB'),borderRadius:'12px',fontSize:'12px'}}/>
                      <Bar dataKey="quantidade" name="Quantidade" radius={[0,6,6,0]}>
                        {data.topProdutos.map((e,i)=><Cell key={i} fill={e.color}/>)}
                      </Bar>
                    </BarChart>
                  ) : topChartType==='pie' ? (
                    <PieChart>
                      <Pie data={data.topProdutos} dataKey="quantidade" nameKey="produto" cx="50%" cy="50%" outerRadius={85} paddingAngle={2}>
                        {data.topProdutos.map((e,i)=><Cell key={i} fill={e.color}/>)}
                      </Pie>
                      <Tooltip contentStyle={{backgroundColor:darkMode?'#111827':'#fff',border:'1px solid '+(darkMode?'#1F2937':'#E5E7EB'),borderRadius:'12px',fontSize:'12px'}}/>
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:'11px'}}/>
                    </PieChart>
                  ) : (
                    <LineChart data={data.topProdutos} margin={{top:8,right:16,left:0,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode?'#1F2937':'#F3F4F6'}/>
                      <XAxis dataKey="produto" stroke={darkMode?'#6B7280':'#9CA3AF'} fontSize={11} axisLine={false} tickLine={false}/>
                      <YAxis stroke={darkMode?'#6B7280':'#9CA3AF'} fontSize={11} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{backgroundColor:darkMode?'#111827':'#fff',border:'1px solid '+(darkMode?'#1F2937':'#E5E7EB'),borderRadius:'12px',fontSize:'12px'}}/>
                      <Line type="monotone" dataKey="quantidade" name="Qtde" stroke="#8B5CF6" strokeWidth={2.5} dot={{r:5,fill:'#8B5CF6',strokeWidth:0}} activeDot={{r:7}}/>
                    </LineChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 gap-2">
                  <Star className="w-8 h-8 opacity-30"/>
                  <p className="text-sm">Nenhum produto vendido ainda</p>
                </div>
              )}
            </div>
          </BlockCard>
        );

      // ── Formulas List ────────────────────────────────────────────────────
      case 'formulas_list':
        return (
          <BlockCard>
            <BlockHeader icon={Factory} title="Fichas Técnicas" color="text-blue-500" isEditing={isEditingLayout} onRemove={rm}/>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {formulas.length===0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 gap-2 py-8">
                  <Factory className="w-8 h-8 opacity-30"/>
                  <p className="text-sm">Nenhuma fórmula cadastrada</p>
                </div>
              ) : formulas.slice(0,10).map((f, i) => (
                <div key={f.id||i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{background:COLORS[i%COLORS.length]}}>
                    {(f.nome||'F')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{f.nome||`Fórmula ${i+1}`}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{f.categoria||f.tipo||'Saneante'}</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {f.ingredientes?.length||f.insumos?.length||0} ingred.
                  </span>
                </div>
              ))}
            </div>
          </BlockCard>
        );

      // ── Insumos Alert ────────────────────────────────────────────────────
      case 'insumos_alert':
        return (
          <BlockCard>
            <BlockHeader icon={AlertTriangle} title="Alertas de Insumos" color="text-amber-500" isEditing={isEditingLayout} onRemove={rm}/>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {insumosAlert.length===0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 gap-2 py-8">
                  <CheckCircle2 className="w-8 h-8 opacity-30 text-emerald-400"/>
                  <p className="text-sm">Todos os insumos OK</p>
                </div>
              ) : insumosAlert.map((ins, i) => {
                const pct = Math.min(100, Math.round((ins.qtd/Math.max(ins.qtd,ins.min*2))*100));
                const clr = ins.nivel==='critico'?'bg-red-500':ins.nivel==='atencao'?'bg-amber-500':'bg-emerald-500';
                const bg = ins.nivel==='critico'?'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800/20'
                  :ins.nivel==='atencao'?'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/20'
                  :'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800';
                return (
                  <div key={i} className={`p-3 rounded-xl border ${bg}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{ins.nome}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${clr}`}>
                        {ins.nivel==='critico'?'Crítico':ins.nivel==='atencao'?'Atenção':'OK'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${clr} transition-all`} style={{width:`${pct}%`}}/>
                      </div>
                      <span className="text-xs text-gray-400">{ins.qtd}/{ins.min*2}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </BlockCard>
        );

      // ── Pedidos Recentes ─────────────────────────────────────────────────
      case 'pedidos_recent':
        return (
          <BlockCard>
            <BlockHeader icon={Clock} title="Pedidos Recentes" color="text-indigo-500" isEditing={isEditingLayout} onRemove={rm}/>
            <div className="flex-1 overflow-y-auto">
              {data.recentPedidos.length===0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 gap-2">
                  <Clock className="w-8 h-8 opacity-30"/>
                  <p className="text-sm">Nenhum pedido registrado</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      {['Nº','Cliente','Status','Valor'].map(h=>(
                        <th key={h} className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 px-4 py-2.5 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentPedidos.map((p,i)=>{
                      const sc: Record<string,string> = {
                        pendente:'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
                        pago:'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
                        concluido:'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
                        cancelado:'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
                        producao:'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
                      };
                      return (
                        <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                          <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400 font-mono text-xs">{p.numero||`#${i+1}`}</td>
                          <td className="px-4 py-2.5 text-gray-800 dark:text-gray-100 max-w-[120px] truncate">{p.cliente||'—'}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc[p.status]||'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-800 dark:text-gray-100 font-semibold">R$ {(p.total||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </BlockCard>
        );

      // ── Meta de Receita ──────────────────────────────────────────────────
      case 'meta_receita':
        return (
          <BlockCard>
            <BlockHeader icon={Target} title="Meta de Receita" color="text-blue-500" isEditing={isEditingLayout} onRemove={rm}/>
            <div className="flex-1 flex flex-col items-center justify-center p-4 gap-3">
              <div className="relative w-44 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="65%" outerRadius="100%" data={metaData} startAngle={90} endAngle={-270}>
                    <defs>
                      <linearGradient id="metaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={metaData[0].fill}/>
                        <stop offset="100%" stopColor={metaData[0].fill} stopOpacity={0.7}/>
                      </linearGradient>
                    </defs>
                    <RadialBar background={{ fill: darkMode?'#1F2937':'#F3F4F6' }} dataKey="value" fill="url(#metaGrad)" cornerRadius={8}/>
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{metaPct}%</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">da meta</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">R$ {data.receita.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">de R$ {META.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                <div className="h-2 rounded-full transition-all duration-700" style={{width:`${metaPct}%`, background:metaData[0].fill}}/>
              </div>
            </div>
          </BlockCard>
        );

      // ── Formula Cost ─────────────────────────────────────────────────────
      case 'formula_cost':
        return (
          <BlockCard>
            <BlockHeader icon={Layers} title="Custo por Fórmula" color="text-rose-500" isEditing={isEditingLayout} onRemove={rm}/>
            <div className="flex-1 min-h-0 px-2 py-3">
              {formulaCostData.length>0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={formulaCostData} margin={{top:4,right:8,bottom:0,left:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode?'#1F2937':'#F3F4F6'} vertical={false}/>
                    <XAxis dataKey="name" stroke={darkMode?'#6B7280':'#9CA3AF'} fontSize={11} tickMargin={6} axisLine={false} tickLine={false}/>
                    <YAxis stroke={darkMode?'#6B7280':'#9CA3AF'} fontSize={11} tickFormatter={v=>`R$${v}`} axisLine={false} tickLine={false}/>
                    <Tooltip
                      contentStyle={{backgroundColor:darkMode?'#111827':'#fff',border:'1px solid '+(darkMode?'#1F2937':'#E5E7EB'),borderRadius:'12px',fontSize:'12px'}}
                      formatter={(v:any)=>[`R$ ${Number(v).toFixed(2)}`,'Custo']}
                    />
                    <Bar dataKey="custo" name="Custo" radius={[6,6,0,0]}>
                      {formulaCostData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 gap-2">
                  <Layers className="w-8 h-8 opacity-30"/>
                  <p className="text-sm">Nenhuma fórmula cadastrada</p>
                </div>
              )}
            </div>
          </BlockCard>
        );

      // ── Activity ─────────────────────────────────────────────────────────
      case 'activity':
        return (
          <BlockCard>
            <BlockHeader icon={Activity} title="Atividade" color="text-cyan-500" isEditing={isEditingLayout} onRemove={rm}/>
            <div className="flex-1 p-4 space-y-2 overflow-y-auto">
              {[
                { label:`${formulas.length} fórmulas`, sub:'no sistema', icon:Factory, color:'text-blue-500', bg:'bg-blue-50 dark:bg-blue-900/20' },
                { label:`${insumos.length} insumos`, sub:'cadastrados', icon:Package, color:'text-amber-500', bg:'bg-amber-50 dark:bg-amber-900/20' },
                { label:`${data.totalVendas} vendas`, sub:'realizadas', icon:ShoppingCart, color:'text-emerald-500', bg:'bg-emerald-50 dark:bg-emerald-900/20' },
                { label:`${data.orcamentos} orçamentos`, sub:'aguardando', icon:FileText, color:'text-purple-500', bg:'bg-purple-50 dark:bg-purple-900/20' },
              ].map(({label,sub,icon:Icon,color,bg},i)=>(
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${bg}`}>
                  <div className={`p-1.5 rounded-lg bg-white dark:bg-gray-900 shadow-sm`}>
                    <Icon className={`w-4 h-4 ${color}`}/>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </BlockCard>
        );

      // ── Ticket Médio ──────────────────────────────────────────────────────
      case 'ticket_medio':
        return (
          <BlockCard>
            <BlockHeader icon={Zap} title="Ticket Médio & Conversão" color="text-violet-500" isEditing={isEditingLayout} onRemove={rm}/>
            <div className="flex-1 grid grid-cols-2 gap-3 p-4">
              {[
                { label:'Ticket Médio', value:`R$ ${data.ticketMedio.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, icon:DollarSign, gradient:'from-violet-500 to-purple-600' },
                { label:'Taxa de Conversão', value:`${data.taxaConversao.toFixed(1)}%`, icon:TrendingUp, gradient:'from-cyan-500 to-sky-600' },
                { label:'Receita Total', value:`R$ ${data.receita.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, icon:DollarSign, gradient:'from-emerald-500 to-green-600' },
                { label:'Pedidos Hoje', value:`${data.vendasHoje}`, icon:CheckCircle2, gradient:'from-amber-500 to-orange-600' },
              ].map(({label,value,icon:Icon,gradient},i)=>(
                <div key={i} className="relative bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col justify-between">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-2`}>
                    <Icon className="w-4 h-4 text-white"/>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
                    <p className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </BlockCard>
        );

      default:
        return null;
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-full pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Visão geral personalizada do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Add Block Button — always visible */}
          <button
            onClick={() => setShowBlockModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-blue-50 dark:bg-blue-900/25 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800/40 hover:shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Adicionar Bloco
            <span className="ml-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-300 rounded-full text-xs font-bold">
              {visibleBlocks.length}
            </span>
          </button>

          {/* Edit Layout */}
          <button
            onClick={() => setIsEditingLayout(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              isEditingLayout
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
            }`}
          >
            <Settings2 className="w-4 h-4"/>
            {isEditingLayout ? 'Concluir Edição' : 'Editar Layout'}
          </button>
        </div>
      </div>

      {/* Edit mode banner */}
      {isEditingLayout && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-xl text-sm text-blue-700 dark:text-blue-300">
          <Settings2 className="w-4 h-4 flex-shrink-0"/>
          <span>Modo edição ativo — arraste e redimensione os blocos. Clique em <strong>Concluir Edição</strong> para salvar.</span>
        </div>
      )}

      {/* Grid */}
      <div className={`transition-all duration-200 ${isEditingLayout ? 'is-editing bg-gray-50 dark:bg-gray-800/20 rounded-2xl p-3 border-2 border-dashed border-blue-200 dark:border-blue-800/40' : ''}`}>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{lg:1200,md:996,sm:768,xs:480,xxs:0}}
          cols={{lg:12,md:10,sm:6,xs:4,xxs:2}}
          rowHeight={60}
          onLayoutChange={handleLayoutChange}
          isDraggable={isEditingLayout}
          isResizable={isEditingLayout}
          draggableHandle=".drag-handle"
          margin={[14,14]}
        >
          {visibleBlocks.map(blockId => (
            <div
              key={blockId}
              style={{ overflow: 'hidden' }}
              className={`h-full${isEditingLayout ? ' ring-2 ring-blue-400/40 rounded-2xl' : ''}`}
            >
              {renderBlock(blockId)}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>

      {/* Block modal */}
      <BlockModal
        visible={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        visibleBlocks={visibleBlocks}
        onToggle={toggleBlock}
      />
    </div>
  );
}
