import { useState, useEffect } from 'react';
import {
  Search,
  List,
  LayoutGrid,
  ArrowUpAZ,
  ArrowDownAZ,
  Minus,
  Plus,
  Eye,
  Tag,
  Edit2,
  Trash2,
  Save,
  DollarSign,
  Percent,
  Copy,
  Package,
  Layers,
  Calculator,
  Lock,
  ChevronDown,
  ChevronUp,
  Info,
  TrendingUp,
  ShoppingCart,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Formula, Precificacao as PrecificacaoType, Grupo } from '../types';
import { gruposData } from '../data/mockData';
import { dataService } from '../lib/dataService';
import { Modal } from './Modal';
import { CurrencyInput } from './ui/CurrencyInput';

type ViewMode = 'list' | 'grid';
type SortMode = 'az' | 'za' | 'asc' | 'desc';
type UnitType = '2L' | '5L';
type TabType = 'precos' | 'listas';

// Tipos para o novo sistema de Lista de Preços



type AplicarA = 'produto' | 'categoria';
type TipoPreco = 'formula' | 'fixo';

interface RegraPreco {
  id: string;
  produtoId?: string; // ID da fórmula
  produtoNome?: string;
  varianteId?: string;
  varianteNome?: string;
  categoriaId?: string; // ID do grupo
  categoriaNome?: string;
  tipoPreco: TipoPreco;
  custoBase?: number; // Custo da fórmula
  margemLucro?: number; // Markup em %
  precoFixo?: number;
  quantidadeMinima?: number;
  precoCalculado?: number;
}

interface ListaPrecoAvancada {
  id: string;
  nome: string;
  descricao: string;
  aplicarA: AplicarA;
  ativo: boolean;
  dataCriacao: string;
  regras: RegraPreco[];
}

interface ListaPrecoProps {
  formulas: Formula[];
  insumosData: any[];
  listasPreco: ListaPrecoAvancada[];
  setListasPreco: React.Dispatch<React.SetStateAction<ListaPrecoAvancada[]>>;
  precificacoes: Record<string, PrecificacaoType>;
  setPrecificacoes: React.Dispatch<React.SetStateAction<Record<string, PrecificacaoType>>>;
}

export function Precificacao({ 
  formulas = [], 
  insumosData = [], 
  listasPreco = [], 
  setListasPreco, 
  precificacoes = {}, 
  setPrecificacoes
}: ListaPrecoProps) {
  const [activeTab, setActiveTab] = useState<TabType>('precos');
  const [grupos, setGrupos] = useState<Grupo[]>(() => {
    const saved = localStorage.getItem('ohana_grupos');
    return saved ? JSON.parse(saved) : gruposData;
  });

  useEffect(() => {
    dataService.grupos.getAll().then(data => {
      if (data.length > 0) setGrupos(data);
    });
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('az');
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form state para Precificação
  const [custosFixos, setCustosFixos] = useState(0);
  const [precoVarejo, setPrecoVarejo] = useState(0);
  const [precoAtacado, setPrecoAtacado] = useState(0);
  const [quantidadeFardo, setQuantidadeFardo] = useState(6);
  const [precoFardo, setPrecoFardo] = useState(0);
  const [unitType, setUnitType] = useState<UnitType>('2L');

  const [showListaModal, setShowListaModal] = useState(false);
  const [editingLista, setEditingLista] = useState<ListaPrecoAvancada | null>(null);

  // Form state para Lista de Preços
  const [listaFormData, setListaFormData] = useState<{
    nome: string;
    descricao: string;
    aplicarA: AplicarA;
    ativo: boolean;
    regras: RegraPreco[];
  }>({
    nome: '',
    descricao: '',
    aplicarA: 'produto',
    ativo: true,
    regras: []
  });

  // Estado para adicionar regra
  const [showRegraModal, setShowRegraModal] = useState(false);
  const [editingRegra, setEditingRegra] = useState<RegraPreco | null>(null);
  const [regraFormData, setRegraFormData] = useState<{
    produtoId: string;
    varianteId: string;
    categoriaId: string;
    tipoPreco: TipoPreco;
    margemLucro: number;
    precoFixo: number;
    quantidadeMinima: number;
  }>({
    produtoId: '',
    varianteId: '',
    categoriaId: '',
    tipoPreco: 'formula',
    margemLucro: 50,
    precoFixo: 0,
    quantidadeMinima: 0
  });

  // Visualização da lista
  const [selectedListaView, setSelectedListaView] = useState<ListaPrecoAvancada | null>(null);
  const [showListaPreviewModal, setShowListaPreviewModal] = useState(false);
  const [expandedRegras, setExpandedRegras] = useState<Record<string, boolean>>({});

  // Funções de cálculo
  const calcularCustoTotal = (formula: Formula) => {
    if (!formula) return 0;
    return (formula.insumos || []).reduce((sum, i) => sum + (i.quantidade * i.valorUnitario), 0);
  };

  const calcularCustoUnidade = (formula: Formula) => {
    if (!formula) return 0;
    const custoTotal = calcularCustoTotal(formula);
    return formula.rendimento > 0 ? custoTotal / formula.rendimento : 0;
  };

  const calcularCustoUnidade5L = (formula: Formula) => {
    return calcularCustoUnidade(formula) * 2.5;
  };

  const getGrupo = (grupoId: string) => grupos.find(g => g.id === grupoId);

  const getFormulaVariantInfo = (formula: Formula) => {
    const insumosComVariantes = (formula.insumos || []).filter(fi => {
      const insumo = insumosData.find(i => i.id === fi.insumoId);
      return insumo?.variantes && insumo.variantes.length > 0;
    });
    
    if (insumosComVariantes.length === 0) return null;

    let custoMin = 0;
    let custoMax = 0;
    
    (formula.insumos || []).forEach(fi => {
      const insumo = insumosData.find(i => i.id === fi.insumoId);
      if (insumo?.variantes && insumo.variantes.length > 0) {
        const precos = insumo.variantes.map((v: any) => v.valorUnitario);
        custoMin += Math.min(...precos) * fi.quantidade;
        custoMax += Math.max(...precos) * fi.quantidade;
      } else {
        const total = fi.quantidade * fi.valorUnitario;
        custoMin += total;
        custoMax += total;
      }
    });

    const rendimento = formula.rendimento || 1;
    return {
      hasVariants: true,
      count: insumosComVariantes.length,
      custoMinUn: custoMin / rendimento,
      custoMaxUn: custoMax / rendimento,
    };
  };

  // Obter variantes de uma fórmula (com base nos insumos que têm variantes)
  const getFormulasVariantes = (formulaId: string) => {
    const formula = formulas.find(f => f.id === formulaId);
    if (!formula) return [];
    
    const variantes: { id: string; nome: string; custoUnitario: number }[] = [];
    
    (formula.insumos || []).forEach(fi => {
      const insumo = insumosData.find(i => i.id === fi.insumoId);
      if (insumo?.variantes && insumo.variantes.length > 0) {
        insumo.variantes.forEach((v: any) => {
          // Calcular custo da fórmula com esta variante
          let custoTotal = 0;
          (formula.insumos || []).forEach(fi2 => {
            if (fi2.insumoId === insumo.id) {
              custoTotal += fi.quantidade * v.valorUnitario;
            } else {
              custoTotal += fi2.quantidade * fi2.valorUnitario;
            }
          });
          
          variantes.push({
            id: v.id,
            nome: `${insumo.nome} - ${v.nome}`,
            custoUnitario: formula.rendimento > 0 ? custoTotal / formula.rendimento : 0
          });
        });
      }
    });
    
    return variantes;
  };

  const filteredFormulas = formulas
    .filter(f => 
      f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortMode) {
        case 'az': return a.nome.localeCompare(b.nome);
        case 'za': return b.nome.localeCompare(a.nome);
        case 'asc': return calcularCustoUnidade(a) - calcularCustoUnidade(b);
        case 'desc': return calcularCustoUnidade(b) - calcularCustoUnidade(a);
        default: return 0;
      }
    });

  // Funções de arredondamento
  const roundToVarejo = (value: number): number => {
    const base = Math.floor(value);
    return base + 0.95;
  };

  const roundToAtacado = (value: number): number => {
    const base = Math.floor(value);
    return base + 0.90;
  };

  const roundToFardo = (value: number): number => {
    const base = Math.floor(value);
    return base + 0.80;
  };

  const adjustVarejoUp = () => setPrecoVarejo(Math.floor(precoVarejo) + 1.95);
  const adjustVarejoDown = () => setPrecoVarejo(Math.max(0.95, Math.floor(precoVarejo) - 0.05));
  const adjustAtacadoUp = () => setPrecoAtacado(Math.floor(precoAtacado) + 1.90);
  const adjustAtacadoDown = () => setPrecoAtacado(Math.max(0.90, Math.floor(precoAtacado) - 0.10));
  const adjustFardoUp = () => setPrecoFardo(Math.floor(precoFardo) + 1.80);
  const adjustFardoDown = () => setPrecoFardo(Math.max(0.80, Math.floor(precoFardo) - 0.20));

  const handleOpenPricing = (formula: Formula) => {
    setSelectedFormula(formula);
    const existingPricing = precificacoes[formula.id];

    if (existingPricing) {
      setCustosFixos(existingPricing.custosFixos);
      setPrecoVarejo(existingPricing.precoVarejo);
      setPrecoAtacado(existingPricing.precoAtacado);
      setQuantidadeFardo(existingPricing.quantidadeFardo);
      setPrecoFardo(existingPricing.precoFardo);
      setUnitType((existingPricing as any).unitType || '2L');
    } else {
      const custoUn = unitType === '5L' ? calcularCustoUnidade5L(formula) : calcularCustoUnidade(formula);
      setCustosFixos(0);
      setPrecoVarejo(roundToVarejo(custoUn * 2));
      setPrecoAtacado(roundToAtacado(custoUn * 1.8));
      setQuantidadeFardo(6);
      setPrecoFardo(roundToFardo(custoUn * 6 * 1.5));
      setUnitType('2L');
    }
    setShowModal(true);
  };

  const handleUnitChange = (newUnit: UnitType) => {
    if (!selectedFormula) return;
    setUnitType(newUnit);
    const custoUn = newUnit === '5L' ? calcularCustoUnidade5L(selectedFormula) : calcularCustoUnidade(selectedFormula);
    const custoTotal = custoUn + custosFixos;
    setPrecoVarejo(roundToVarejo(custoTotal * 2));
    setPrecoAtacado(roundToAtacado(custoTotal * 1.8));
    setPrecoFardo(roundToFardo(custoTotal * quantidadeFardo * 1.5));
  };

  const handleSavePricing = () => {
    if (!selectedFormula) return;

    const pricing: PrecificacaoType & { unitType: UnitType } = {
      id: selectedFormula.id,
      formulaId: selectedFormula.id,
      custosFixos,
      precoVarejo,
      precoAtacado,
      quantidadeFardo,
      precoFardo,
      unitType,
      updatedAt: new Date().toISOString(),
    };

    setPrecificacoes((prev: Record<string, PrecificacaoType>) => ({
      ...prev,
      [selectedFormula.id]: pricing,
    }));

    setShowModal(false);
  };

  // Cálculos do modal de precificação
  const custoUnidadeBase = selectedFormula 
    ? (unitType === '5L' ? calcularCustoUnidade5L(selectedFormula) : calcularCustoUnidade(selectedFormula))
    : 0;
  const custoTotalUnidade = custoUnidadeBase + custosFixos;
  
  const markupVarejo = custoTotalUnidade > 0 ? ((precoVarejo - custoTotalUnidade) / custoTotalUnidade) * 100 : 0;
  const margemVarejo = precoVarejo > 0 ? ((precoVarejo - custoTotalUnidade) / precoVarejo) * 100 : 0;
  const lucroVarejo = precoVarejo - custoTotalUnidade;

  const markupAtacado = custoTotalUnidade > 0 ? ((precoAtacado - custoTotalUnidade) / custoTotalUnidade) * 100 : 0;
  const margemAtacado = precoAtacado > 0 ? ((precoAtacado - custoTotalUnidade) / precoAtacado) * 100 : 0;
  const lucroAtacado = precoAtacado - custoTotalUnidade;

  const custoFardo = custoTotalUnidade * quantidadeFardo;
  const markupFardo = custoFardo > 0 ? ((precoFardo - custoFardo) / custoFardo) * 100 : 0;
  const margemFardo = precoFardo > 0 ? ((precoFardo - custoFardo) / precoFardo) * 100 : 0;
  const lucroFardo = precoFardo - custoFardo;

  const economiaAtacado = precoVarejo > 0 ? ((precoVarejo - precoAtacado) / precoVarejo) * 100 : 0;

  const isPrecificado = (formulaId: string) => !!precificacoes[formulaId];

  const resetListaForm = () => {
    setListaFormData({
      nome: '',
      descricao: '',
      aplicarA: 'produto',
      ativo: true,
      regras: []
    });
    setEditingLista(null);
  };

  const resetRegraForm = () => {
    setRegraFormData({
      produtoId: '',
      varianteId: '',
      categoriaId: '',
      tipoPreco: 'formula',
      margemLucro: 50,
      precoFixo: 0,
      quantidadeMinima: 0
    });
    setEditingRegra(null);
  };

  const handleOpenListaModal = (lista?: ListaPrecoAvancada) => {
    if (lista) {
      setEditingLista(lista);
      setListaFormData({
        nome: lista.nome,
        descricao: lista.descricao,
        aplicarA: lista.aplicarA,
        ativo: lista.ativo,
        regras: [...(lista.regras || [])]
      });
    } else {
      resetListaForm();
    }
    setShowListaModal(true);
  };

  const handleOpenRegraModal = (regra?: RegraPreco) => {
    if (regra) {
      setEditingRegra(regra);
      setRegraFormData({
        produtoId: regra.produtoId || '',
        varianteId: regra.varianteId || '',
        categoriaId: regra.categoriaId || '',
        tipoPreco: regra.tipoPreco,
        margemLucro: regra.margemLucro || 50,
        precoFixo: regra.precoFixo || 0,
        quantidadeMinima: regra.quantidadeMinima || 0
      });
    } else {
      resetRegraForm();
    }
    setShowRegraModal(true);
  };

  // Calcular preço baseado em custo + margem
  const calcularPrecoComMargem = (custo: number, margem: number) => {
    return custo * (1 + margem / 100);
  };

  // Obter custo de um produto
  const getCustoProduto = (produtoId: string, varianteId?: string) => {
    const formula = formulas.find(f => f.id === produtoId);
    if (!formula) return 0;
    
    if (varianteId) {
      const variantes = getFormulasVariantes(produtoId);
      const variante = variantes.find(v => v.id === varianteId);
      return variante?.custoUnitario || calcularCustoUnidade(formula);
    }
    
    return calcularCustoUnidade(formula);
  };

  const handleSaveRegra = () => {
    let novaRegra: RegraPreco;
    
    if (listaFormData.aplicarA === 'produto') {
      const formula = formulas.find(f => f.id === regraFormData.produtoId);
      if (!formula) {
        alert('Selecione um produto!');
        return;
      }
      
      const variantes = getFormulasVariantes(regraFormData.produtoId);
      const variante = variantes.find(v => v.id === regraFormData.varianteId);
      const custoBase = getCustoProduto(regraFormData.produtoId, regraFormData.varianteId);
      
      novaRegra = {
        id: editingRegra?.id || `RG-${Date.now()}`,
        produtoId: regraFormData.produtoId,
        produtoNome: formula.nome,
        varianteId: regraFormData.varianteId || undefined,
        varianteNome: variante?.nome,
        tipoPreco: regraFormData.tipoPreco,
        custoBase,
        margemLucro: regraFormData.tipoPreco === 'formula' ? regraFormData.margemLucro : undefined,
        precoFixo: regraFormData.tipoPreco === 'fixo' ? regraFormData.precoFixo : undefined,
        quantidadeMinima: regraFormData.quantidadeMinima > 0 ? regraFormData.quantidadeMinima : undefined,
        precoCalculado: regraFormData.tipoPreco === 'formula' 
          ? calcularPrecoComMargem(custoBase, regraFormData.margemLucro)
          : regraFormData.precoFixo
      };
    } else {
      const grupo = grupos.find(g => g.id === regraFormData.categoriaId);
      if (!grupo) {
        alert('Selecione uma categoria!');
        return;
      }
      
      novaRegra = {
        id: editingRegra?.id || `RG-${Date.now()}`,
        categoriaId: regraFormData.categoriaId,
        categoriaNome: grupo.nome,
        tipoPreco: regraFormData.tipoPreco,
        margemLucro: regraFormData.tipoPreco === 'formula' ? regraFormData.margemLucro : undefined,
        precoFixo: regraFormData.tipoPreco === 'fixo' ? regraFormData.precoFixo : undefined,
        quantidadeMinima: regraFormData.quantidadeMinima > 0 ? regraFormData.quantidadeMinima : undefined,
      };
    }
    
    if (editingRegra) {
      setListaFormData(prev => ({
        ...prev,
        regras: prev.regras.map(r => r.id === editingRegra.id ? novaRegra : r)
      }));
    } else {
      setListaFormData(prev => ({
        ...prev,
        regras: [...prev.regras, novaRegra]
      }));
    }
    
    setShowRegraModal(false);
    resetRegraForm();
  };

  const handleRemoveRegra = (regraId: string) => {
    setListaFormData(prev => ({
      ...prev,
      regras: prev.regras.filter(r => r.id !== regraId)
    }));
  };

  const handleSaveLista = () => {
    if (!listaFormData.nome.trim()) {
      alert('Nome é obrigatório!');
      return;
    }

    if (listaFormData.regras.length === 0) {
      alert('Adicione pelo menos uma regra de preço!');
      return;
    }

    const novaLista: ListaPrecoAvancada = {
      id: editingLista?.id || `LP-${Date.now()}`,
      nome: listaFormData.nome,
      descricao: listaFormData.descricao,
      aplicarA: listaFormData.aplicarA,
      ativo: listaFormData.ativo,
      dataCriacao: editingLista?.dataCriacao || new Date().toISOString(),
      regras: listaFormData.regras
    };

    if (editingLista) {
      setListasPreco((prev: ListaPrecoAvancada[]) => prev.map((l: ListaPrecoAvancada) => l.id === editingLista.id ? novaLista : l));
    } else {
      setListasPreco((prev: ListaPrecoAvancada[]) => [...prev, novaLista]);
    }

    setShowListaModal(false);
    resetListaForm();
  };

  const handleDeleteLista = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta lista de preços?')) {
      setListasPreco((prev: ListaPrecoAvancada[]) => prev.filter((l: ListaPrecoAvancada) => l.id !== id));
    }
  };

  const handleDuplicateLista = (lista: ListaPrecoAvancada) => {
    const novaLista: ListaPrecoAvancada = {
      ...lista,
      id: `LP-${Date.now()}`,
      nome: `${lista.nome} (Cópia)`,
      dataCriacao: new Date().toISOString(),
      regras: (lista.regras || []).map(r => ({ ...r, id: `RG-${Date.now()}-${Math.random()}` }))
    };
    setListasPreco((prev: ListaPrecoAvancada[]) => [...prev, novaLista]);
  };

  const handleToggleListaAtivo = (id: string) => {
    setListasPreco((prev: ListaPrecoAvancada[]) => prev.map((l: ListaPrecoAvancada) => l.id === id ? { ...l, ativo: !l.ativo } : l));
  };

  const handleViewListaPrecos = (lista: ListaPrecoAvancada) => {
    setSelectedListaView(lista);
    setShowListaPreviewModal(true);
  };

  const toggleExpandRegra = (regraId: string) => {
    setExpandedRegras(prev => ({ ...prev, [regraId]: !prev[regraId] }));
  };



  return (
    <div className="space-y-6">
      {/* Header com Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Precificação</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Defina preços e crie listas de preços personalizadas</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white dark:bg-gray-800/50 rounded-xl w-fit border border-gray-200 dark:border-gray-700/50 shadow-sm">
        <button
          onClick={() => setActiveTab('precos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'precos'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50'
          }`}
        >
          <motion.div
            animate={activeTab === 'precos' ? { 
              scale: [1, 1.2, 1],
              rotate: [0, -10, 10, 0]
            } : { 
              scale: 1, 
              rotate: 0 
            }}
            transition={activeTab === 'precos' ? { 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            } : { 
              duration: 0.3 
            }}
          >
            <DollarSign size={18} />
          </motion.div>
          Preços
        </button>
        <button
          onClick={() => setActiveTab('listas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'listas'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50'
          }`}
        >
          <motion.div
            animate={activeTab === 'listas' ? { 
              scale: [1, 1.2, 1],
              rotate: [0, -10, 10, 0]
            } : { 
              scale: 1, 
              rotate: 0 
            }}
            transition={activeTab === 'listas' ? { 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            } : { 
              duration: 0.3 
            }}
          >
            <Tag size={18} />
          </motion.div>
          Lista de Preços
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'precos' ? (
        <>
          {/* Filters */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-700 shadow-sm' : ''}`}
                >
                  <List className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-700 shadow-sm' : ''}`}
                >
                  <LayoutGrid className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="flex bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setSortMode('az')}
                  className={`p-2 rounded-lg transition-colors ${sortMode === 'az' ? 'bg-gray-100 dark:bg-gray-700 shadow-sm' : ''}`}
                >
                  <ArrowUpAZ className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setSortMode('za')}
                  className={`p-2 rounded-lg transition-colors ${sortMode === 'za' ? 'bg-gray-100 dark:bg-gray-700 shadow-sm' : ''}`}
                >
                  <ArrowDownAZ className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFormulas.map((formula) => {
                const grupo = getGrupo(formula.grupoId);
                const custoUn = calcularCustoUnidade(formula);
                const pricing = precificacoes[formula.id];
                const variantInfo = getFormulaVariantInfo(formula);

                return (
                  <div
                    key={formula.id}
                    onClick={() => handleOpenPricing(formula)}
                    className="bg-white dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-200 dark:border-gray-700/50 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: grupo?.cor || '#6B7280' }}
                      >
                        {grupo?.nome}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isPrecificado(formula.id)
                          ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400'
                      }`}>
                        {isPrecificado(formula.id) ? 'Precificado' : 'Pendente'}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{formula.nome}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-2">{formula.codigo}</p>

                    {variantInfo && (
                      <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-100 dark:border-blue-500/20">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">🔀 Variantes</span>
                        <div className="mt-1 space-y-0.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-green-600 dark:text-green-400">Menor:</span>
                            <span className="font-medium text-green-700 dark:text-green-300">R$ {variantInfo.custoMinUn.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-blue-600 dark:text-blue-400">Maior:</span>
                            <span className="font-medium text-blue-700 dark:text-blue-300">R$ {variantInfo.custoMaxUn.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Custo/Un:</span>
                        <span className="font-medium text-gray-900 dark:text-white">R$ {custoUn.toFixed(2)}</span>
                      </div>
                      {pricing && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Varejo:</span>
                            <span className="font-medium text-green-600 dark:text-green-400">R$ {pricing.precoVarejo.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Atacado:</span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">R$ {pricing.precoAtacado.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Fardo ({pricing.quantidadeFardo}un):</span>
                            <span className="font-medium text-purple-600 dark:text-purple-400">R$ {pricing.precoFardo.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Produto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Custo/Un</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Varejo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Atacado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Fardo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700/30">
                  {filteredFormulas.map((formula) => {
                    const custoUn = calcularCustoUnidade(formula);
                    const pricing = precificacoes[formula.id];
                    const variantInfo = getFormulaVariantInfo(formula);

                    return (
                      <tr
                        key={formula.id}
                        onClick={() => handleOpenPricing(formula)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">{formula.nome}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic">{formula.codigo}</p>
                          {variantInfo && (
                            <span className="inline-flex items-center gap-1 mt-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-0.5 rounded-full">
                              🔀 R$ {variantInfo.custoMinUn.toFixed(2)} ~ R$ {variantInfo.custoMaxUn.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">R$ {custoUn.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600 dark:text-green-400">
                          {pricing ? `R$ ${pricing.precoVarejo.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                          {pricing ? `R$ ${pricing.precoAtacado.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-purple-600 dark:text-purple-400">
                          {pricing ? `R$ ${pricing.precoFardo.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isPrecificado(formula.id)
                              ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400'
                          }`}>
                            {isPrecificado(formula.id) ? 'Precificado' : 'Pendente'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        /* Tab Lista de Preços */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-400">Crie listas de preços com regras personalizadas baseadas em custo + margem ou preço fixo</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <Info size={14} />
                <span>Baseado no módulo de Vendas do ODOO</span>
              </div>
            </div>
            <button
              onClick={() => handleOpenListaModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 
                text-white rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/25"
            >
              <Plus size={20} />
              <span>Nova Lista</span>
            </button>
          </div>

          {/* Cards de Listas */}
          {listasPreco.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-sm">
              <Tag size={48} className="text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-400 mb-2">Nenhuma lista de preços</h3>
              <p className="text-sm text-gray-500 mb-4">Crie sua primeira lista de preços personalizada</p>
              <button
                onClick={() => handleOpenListaModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                Criar Lista
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listasPreco.map((lista) => (
                <div
                  key={lista.id}
                  className={`relative bg-white dark:bg-gray-800/50 rounded-2xl p-5 border shadow-sm transition-all group overflow-hidden ${
                    lista.ativo 
                      ? 'border-gray-200 dark:border-gray-700/50 hover:border-blue-500/50 dark:hover:border-blue-500/50' 
                      : 'border-red-200 dark:border-red-500/30 opacity-60'
                  }`}
                >
                  {/* Watermark */}
                  <DollarSign className="absolute -right-4 -bottom-4 w-24 h-24 text-gray-100 dark:text-gray-700/30 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
                  
                  <div className="relative z-10 flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {lista.aplicarA === 'produto' ? (
                        <Package size={16} className="text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Layers size={16} className="text-purple-600 dark:text-purple-400" />
                      )}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        lista.aplicarA === 'produto' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400' 
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400'
                      }`}>
                        {lista.aplicarA === 'produto' ? 'Por Produto' : 'Por Categoria'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleListaAtivo(lista.id)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        lista.ativo ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span 
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          lista.ativo ? 'left-5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">{lista.nome}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{lista.descricao || 'Sem descrição'}</p>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                      <Calculator size={14} className="text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{(lista.regras || []).length}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">regras</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                    <button
                      onClick={() => handleViewListaPrecos(lista)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-400 
                        hover:bg-blue-500/10 rounded-lg transition-colors text-sm"
                    >
                      <Eye size={16} />
                      Ver Preços
                    </button>
                    <button
                      onClick={() => handleDuplicateLista(lista)}
                      className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => handleOpenListaModal(lista)}
                      className="p-2 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteLista(lista.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Pricing */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Precificação - ${selectedFormula?.nome || ''}`}
        size="xl"
      >
        {selectedFormula && (
          <div className="space-y-6">
            {/* Unit Type Selector */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Unidade:</span>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                  <button
                    onClick={() => handleUnitChange('2L')}
                    className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${
                      unitType === '2L'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    2 Litros
                  </button>
                  <button
                    onClick={() => handleUnitChange('5L')}
                    className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${
                      unitType === '5L'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    5 Litros
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <TrendingUp size={14} className="text-emerald-500" />
                <span>Margens calculadas automaticamente</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna da Esquerda: Inputs e Cálculos */}
              <div className="lg:col-span-2 space-y-6">
                {/* Custo Base */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Calculator size={18} className="text-blue-500" />
                    Composição de Custos ({unitType})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">Custo Fórmula</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        R$ {calcularCustoTotal(selectedFormula).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">Rendimento</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {selectedFormula.rendimento} un
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400 mb-1">Custo/Un ({unitType})</p>
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                        R$ {custoUnidadeBase.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">Custos Fixos/Un</p>
                      <CurrencyInput
                        value={custosFixos}
                        onChange={(val) => setCustosFixos(val)}
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <DollarSign size={20} className="text-white" />
                        </div>
                        <span className="font-medium text-blue-50">Custo Total por Unidade</span>
                      </div>
                      <span className="text-2xl font-bold text-white">
                        R$ {custoTotalUnidade.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preços de Venda */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Varejo */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <ShoppingCart size={64} className="text-emerald-500" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <ShoppingCart size={18} className="text-emerald-500" />
                      Preço Varejo (x,95)
                    </h3>
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <button onClick={adjustVarejoDown} className="w-10 h-10 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg flex items-center justify-center transition-colors">
                        <Minus className="w-5 h-5 text-red-500" />
                      </button>
                      <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                        <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                          R$ {precoVarejo.toFixed(2)}
                        </span>
                      </div>
                      <button onClick={adjustVarejoUp} className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg flex items-center justify-center transition-colors">
                        <Plus className="w-5 h-5 text-emerald-500" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Markup</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{markupVarejo.toFixed(1)}%</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Margem</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{margemVarejo.toFixed(1)}%</p>
                      </div>
                      <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                        <p className="text-[10px] text-emerald-600 uppercase font-bold">Lucro</p>
                        <p className="text-sm font-bold text-emerald-600">R${lucroVarejo.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Atacado */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Package size={64} className="text-blue-500" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Package size={18} className="text-blue-500" />
                      Preço Atacado (x,90)
                    </h3>
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <button onClick={adjustAtacadoDown} className="w-10 h-10 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg flex items-center justify-center transition-colors">
                        <Minus className="w-5 h-5 text-red-500" />
                      </button>
                      <div className="px-6 py-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                        <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          R$ {precoAtacado.toFixed(2)}
                        </span>
                      </div>
                      <button onClick={adjustAtacadoUp} className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg flex items-center justify-center transition-colors">
                        <Plus className="w-5 h-5 text-blue-500" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Markup</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{markupAtacado.toFixed(1)}%</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Margem</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{margemAtacado.toFixed(1)}%</p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                        <p className="text-[10px] text-blue-600 uppercase font-bold">Lucro</p>
                        <p className="text-sm font-bold text-blue-600">R${lucroAtacado.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fardo */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Layers size={18} className="text-purple-500" />
                      Preço Fardo (x,80)
                    </h3>
                    <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                      <button onClick={() => setQuantidadeFardo(Math.max(1, quantidadeFardo - 1))} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded transition-colors">
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{quantidadeFardo} un</span>
                      <button onClick={() => setQuantidadeFardo(quantidadeFardo + 1)} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="flex items-center gap-4">
                      <button onClick={adjustFardoDown} className="w-12 h-12 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl flex items-center justify-center transition-colors">
                        <Minus className="w-6 h-6 text-red-500" />
                      </button>
                      <div className="px-8 py-4 bg-purple-50 dark:bg-purple-500/10 rounded-2xl border border-purple-100 dark:border-purple-500/20">
                        <span className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                          R$ {precoFardo.toFixed(2)}
                        </span>
                      </div>
                      <button onClick={adjustFardoUp} className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-xl flex items-center justify-center transition-colors">
                        <Plus className="w-6 h-6 text-purple-500" />
                      </button>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-3 gap-4 w-full">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Custo Fardo</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">R$ {custoFardo.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Markup</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{markupFardo.toFixed(1)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-purple-600 uppercase font-bold">Lucro Total</p>
                        <p className="text-sm font-bold text-purple-600">R$ {lucroFardo.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna da Direita: Gráficos e Resumo */}
              <div className="space-y-6">
                {/* Gráfico de Composição */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <PieChartIcon size={18} className="text-blue-500" />
                    Composição do Preço (Varejo)
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Custo Base', value: custoUnidadeBase, color: '#3B82F6' },
                            { name: 'Custos Fixos', value: custosFixos, color: '#8B5CF6' },
                            { name: 'Lucro Bruto', value: lucroVarejo, color: '#10B981' },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#3B82F6" />
                          <Cell fill="#8B5CF6" />
                          <Cell fill="#10B981" />
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: any) => `R$ ${Number(value).toFixed(2)}`}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-gray-500 dark:text-gray-400">Custo Base</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">R$ {custoUnidadeBase.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="text-gray-500 dark:text-gray-400">Custos Fixos</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">R$ {custosFixos.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-gray-500 dark:text-gray-400">Lucro Bruto</span>
                      </div>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">R$ {lucroVarejo.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Comparativo de Margens */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BarChartIcon size={18} className="text-blue-500" />
                    Comparativo de Margens (%)
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={[
                        { name: 'Varejo', margem: margemVarejo },
                        { name: 'Atacado', margem: margemAtacado },
                        { name: 'Fardo', margem: margemFardo },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <RechartsTooltip 
                          formatter={(value: any) => `${Number(value).toFixed(1)}%`}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="margem" radius={[4, 4, 0, 0]}>
                          <Cell fill="#10B981" />
                          <Cell fill="#3B82F6" />
                          <Cell fill="#8B5CF6" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Resumo Final */}
                <div className="bg-gray-900 rounded-2xl p-5 text-white shadow-xl shadow-gray-900/20">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Resumo Executivo</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-800">
                      <span className="text-gray-400 text-sm">Ponto de Equilíbrio</span>
                      <span className="font-bold">R$ {custoTotalUnidade.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-800">
                      <span className="text-gray-400 text-sm">Margem Média</span>
                      <span className="font-bold text-emerald-400">{((margemVarejo + margemAtacado + margemFardo) / 3).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Atratividade Atacado</span>
                      <span className="font-bold text-amber-400">{economiaAtacado.toFixed(0)}% desc.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end items-center pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium"
                >
                  Descartar
                </button>
                <button
                  onClick={handleSavePricing}
                  className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/25 font-bold"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>





      {/* Modal: Nova/Editar Lista de Preços */}
      <Modal
        isOpen={showListaModal}
        onClose={() => { setShowListaModal(false); resetListaForm(); }}
        title={editingLista ? 'Editar Lista de Preços' : 'Nova Lista de Preços'}
        size="xl"
      >
        <div className="space-y-6">
          {/* Info básica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome da Lista <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                value={listaFormData.nome}
                onChange={(e) => setListaFormData(prev => ({ ...prev, nome: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600/50 rounded-xl 
                  text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500/50 shadow-sm"
                placeholder="Ex: Lista Revendedores Premium"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
              <textarea
                value={listaFormData.descricao}
                onChange={(e) => setListaFormData(prev => ({ ...prev, descricao: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600/50 rounded-xl 
                  text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none shadow-sm"
                placeholder="Descrição da lista de preços..."
              />
            </div>
          </div>

          {/* Aplicar a */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Aplicar a <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setListaFormData(prev => ({ ...prev, aplicarA: 'produto', regras: [] }))}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  listaFormData.aplicarA === 'produto'
                    ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600/50 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Package size={20} />
                <span className="font-medium">Produto</span>
              </button>
              <button
                type="button"
                onClick={() => setListaFormData(prev => ({ ...prev, aplicarA: 'categoria', regras: [] }))}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  listaFormData.aplicarA === 'categoria'
                    ? 'bg-purple-50 dark:bg-purple-500/20 border-purple-500 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600/50 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Layers size={20} />
                <span className="font-medium">Categoria</span>
              </button>
            </div>
          </div>

          {/* Regras de Preço */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Regras de Preço <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <button
                onClick={() => handleOpenRegraModal()}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
              >
                <Plus size={16} />
                Adicionar Regra
              </button>
            </div>

            {listaFormData.regras.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 bg-gray-50 dark:bg-gray-700/20 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                <Calculator size={32} className="text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma regra adicionada</p>
                <button
                  onClick={() => handleOpenRegraModal()}
                  className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Adicionar primeira regra
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {listaFormData.regras.map((regra) => (
                  <div
                    key={regra.id}
                    className="bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600/50 overflow-hidden shadow-sm"
                  >
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                      onClick={() => toggleExpandRegra(regra.id)}
                    >
                      <div className="flex items-center gap-3">
                        {listaFormData.aplicarA === 'produto' ? (
                          <Package size={16} className="text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Layers size={16} className="text-purple-600 dark:text-purple-400" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {regra.produtoNome || regra.categoriaNome}
                            {regra.varianteNome && (
                              <span className="text-gray-500 dark:text-gray-400 ml-2">({regra.varianteNome})</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {regra.tipoPreco === 'formula' 
                              ? `Custo + ${regra.margemLucro}% = R$ ${regra.precoCalculado?.toFixed(2) || '-'}`
                              : `Preço Fixo: R$ ${regra.precoFixo?.toFixed(2)}`
                            }
                            {regra.quantidadeMinima && regra.quantidadeMinima > 0 && (
                              <span className="ml-2 text-amber-600 dark:text-amber-400">• Mín: {regra.quantidadeMinima} un</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenRegraModal(regra); }}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveRegra(regra.id); }}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                        {expandedRegras[regra.id] ? (
                          <ChevronUp size={16} className="text-gray-500 dark:text-gray-400" />
                        ) : (
                          <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    {expandedRegras[regra.id] && (
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-600/30 text-sm">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Tipo de Preço:</span>
                            <p className="text-gray-900 dark:text-white font-medium">
                              {regra.tipoPreco === 'formula' ? 'Fórmula (Custo + Margem)' : 'Preço Fixo'}
                            </p>
                          </div>
                          {regra.tipoPreco === 'formula' && (
                            <>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Custo Base:</span>
                                <p className="text-gray-900 dark:text-white font-medium">R$ {regra.custoBase?.toFixed(2) || '-'}</p>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Margem de Lucro:</span>
                                <p className="text-emerald-600 dark:text-emerald-400 font-medium">{regra.margemLucro}%</p>
                              </div>
                            </>
                          )}
                          {regra.tipoPreco === 'fixo' && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Preço:</span>
                              <p className="text-gray-900 dark:text-white font-medium">R$ {regra.precoFixo?.toFixed(2)}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Quant. Mínima:</span>
                            <p className="text-gray-900 dark:text-white font-medium">
                              {regra.quantidadeMinima && regra.quantidadeMinima > 0 
                                ? `${regra.quantidadeMinima} un` 
                                : 'Sem mínimo'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setListaFormData(prev => ({ ...prev, ativo: !prev.ativo }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                listaFormData.ativo ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span 
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                  listaFormData.ativo ? 'left-7' : 'left-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">Lista Ativa</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700/50">
            <button
              onClick={() => { setShowListaModal(false); resetListaForm(); }}
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveLista}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 
                bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl 
                hover:from-blue-500 hover:to-blue-600 transition-all shadow-sm"
            >
              <Save size={18} />
              Salvar Lista
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Adicionar/Editar Regra */}
      <Modal
        isOpen={showRegraModal}
        onClose={() => { setShowRegraModal(false); resetRegraForm(); }}
        title={editingRegra ? 'Editar Regra de Preço' : 'Adicionar Regra de Preço'}
      >
        <div className="space-y-4">
          {listaFormData.aplicarA === 'produto' ? (
            <>
              {/* Seleção de Produto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Produto <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <select
                  value={regraFormData.produtoId}
                  onChange={(e) => setRegraFormData(prev => ({ 
                    ...prev, 
                    produtoId: e.target.value,
                    varianteId: '' 
                  }))}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600/50 rounded-xl 
                    text-gray-900 dark:text-white focus:outline-none focus:border-blue-500/50 shadow-sm"
                >
                  <option value="">Selecione um produto...</option>
                  {formulas.filter(f => f.status === 'finalizado').map(f => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>

              {/* Seleção de Variante (se houver) */}
              {regraFormData.produtoId && getFormulasVariantes(regraFormData.produtoId).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Variante
                  </label>
                  <select
                    value={regraFormData.varianteId}
                    onChange={(e) => setRegraFormData(prev => ({ ...prev, varianteId: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600/50 rounded-xl 
                      text-gray-900 dark:text-white focus:outline-none focus:border-blue-500/50 shadow-sm"
                  >
                    <option value="">Todas as variantes (preço base)</option>
                    {getFormulasVariantes(regraFormData.produtoId).map(v => (
                      <option key={v.id} value={v.id}>
                        {v.nome} - Custo: R$ {v.custoUnitario.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Info de Custo */}
              {regraFormData.produtoId && (
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-300">Custo Base Unitário:</span>
                    <span className="font-bold text-blue-400">
                      R$ {getCustoProduto(regraFormData.produtoId, regraFormData.varianteId).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Seleção de Categoria */
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoria (Grupo) <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <select
                value={regraFormData.categoriaId}
                onChange={(e) => setRegraFormData(prev => ({ ...prev, categoriaId: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600/50 rounded-xl 
                  text-gray-900 dark:text-white focus:outline-none focus:border-blue-500/50 shadow-sm"
              >
                <option value="">Selecione uma categoria...</option>
                {grupos.map(g => (
                  <option key={g.id} value={g.id}>{g.nome}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tipo de Preço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Preço <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRegraFormData(prev => ({ ...prev, tipoPreco: 'formula' }))}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  regraFormData.tipoPreco === 'formula'
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600/50 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Calculator size={18} />
                <span className="font-medium">Fórmula</span>
              </button>
              <button
                type="button"
                onClick={() => setRegraFormData(prev => ({ ...prev, tipoPreco: 'fixo' }))}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  regraFormData.tipoPreco === 'fixo'
                    ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600/50 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Lock size={18} />
                <span className="font-medium">Preço Fixo</span>
              </button>
            </div>
          </div>

          {/* Campos baseados no tipo de preço */}
          {regraFormData.tipoPreco === 'formula' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Margem de Lucro (%) <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <div className="relative">
                <CurrencyInput
                  value={regraFormData.margemLucro}
                  onChange={(val) => setRegraFormData(prev => ({ 
                    ...prev, 
                    margemLucro: val 
                  }))}
                  placeholder="50.00"
                />
                <Percent size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Ex: Custo R$ 5,00 + 50% = Preço R$ 7,50
              </p>
              
              {/* Preview do preço calculado */}
              {regraFormData.produtoId && listaFormData.aplicarA === 'produto' && (
                <div className="mt-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-emerald-300">Preço Calculado:</span>
                    <span className="font-bold text-emerald-400">
                      R$ {calcularPrecoComMargem(
                        getCustoProduto(regraFormData.produtoId, regraFormData.varianteId),
                        regraFormData.margemLucro
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Preço Fixo (R$) <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <div className="relative">
                <CurrencyInput
                  value={regraFormData.precoFixo}
                  onChange={(val) => setRegraFormData(prev => ({ 
                    ...prev, 
                    precoFixo: val 
                  }))}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {/* Quantidade Mínima */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantidade Mínima
            </label>
            <input
              type="number"
              min="0"
              value={regraFormData.quantidadeMinima}
              onChange={(e) => setRegraFormData(prev => ({ 
                ...prev, 
                quantidadeMinima: parseInt(e.target.value) || 0 
              }))}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600/50 rounded-xl 
                text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500/50 shadow-sm"
              placeholder="0 (sem mínimo)"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Deixe 0 para aplicar em qualquer quantidade. Se preenchido, o desconto só será aplicado a partir dessa quantidade.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700/50">
            <button
              onClick={() => { setShowRegraModal(false); resetRegraForm(); }}
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveRegra}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 
                bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl 
                hover:from-blue-500 hover:to-blue-600 transition-all shadow-sm"
            >
              <Plus size={18} />
              {editingRegra ? 'Atualizar' : 'Adicionar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Ver Preços da Lista */}
      <Modal
        isOpen={showListaPreviewModal}
        onClose={() => setShowListaPreviewModal(false)}
        title={`Preços - ${selectedListaView?.nome || ''}`}
        size="lg"
      >
        {selectedListaView && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-transparent shadow-sm">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tipo de aplicação</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {selectedListaView.aplicarA === 'produto' ? (
                    <>
                      <Package size={18} className="text-blue-600 dark:text-blue-400" />
                      Por Produto
                    </>
                  ) : (
                    <>
                      <Layers size={18} className="text-purple-600 dark:text-purple-400" />
                      Por Categoria
                    </>
                  )}
                </p>
              </div>
              <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                selectedListaView.ativo
                  ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-transparent'
                  : 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-transparent'
              }`}>
                {selectedListaView.ativo ? 'Ativa' : 'Inativa'}
              </span>
            </div>

            <div className="bg-white dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      {selectedListaView.aplicarA === 'produto' ? 'Produto' : 'Categoria'}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Custo</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Margem/Preço</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Preço Final</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Qtd. Mín</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700/30">
                  {(selectedListaView.regras || []).map((regra) => (
                    <tr key={regra.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {regra.produtoNome || regra.categoriaNome}
                        </p>
                        {regra.varianteNome && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{regra.varianteNome}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          regra.tipoPreco === 'formula'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400'
                        }`}>
                          {regra.tipoPreco === 'formula' ? 'Fórmula' : 'Fixo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                        {regra.custoBase ? `R$ ${regra.custoBase.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {regra.tipoPreco === 'formula' ? (
                          <span className="text-emerald-600 dark:text-emerald-400">+{regra.margemLucro}%</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">R$ {regra.precoFixo?.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          R$ {regra.precoCalculado?.toFixed(2) || regra.precoFixo?.toFixed(2) || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                        {regra.quantidadeMinima && regra.quantidadeMinima > 0 
                          ? `${regra.quantidadeMinima} un` 
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(selectedListaView.regras || []).length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Calculator size={40} className="mx-auto mb-2 opacity-50" />
                  <p>Nenhuma regra de preço cadastrada</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
