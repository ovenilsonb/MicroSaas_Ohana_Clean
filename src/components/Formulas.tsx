import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  List,
  LayoutGrid,
  ArrowUpAZ,
  ArrowDownAZ,
  Eye,
  Edit2,
  Copy,
  Trash2,
  FlaskConical,
  Flag,
  GripVertical,
  X,
  ChevronDown,
  Save,
  FolderTree,
  Calculator
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Formula, FormulaInsumo, FormulaHistorico, Grupo, Insumo } from '../types';
import { gruposData as initialGrupos } from '../data/mockData';
import { Modal } from './Modal';
import { CurrencyInput } from './ui/CurrencyInput';
import { dataService } from '../lib/dataService';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

// Props interface - recebe dados do App.tsx



interface FormulasProps {
  formulas: Formula[];
  setFormulas: React.Dispatch<React.SetStateAction<Formula[]>>;
  insumos: Insumo[];
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

type ViewMode = 'list' | 'grid';
type SortMode = 'az' | 'za' | 'asc' | 'desc';
type TabType = 'formulas' | 'grupos' | 'proporcao';

export function Formulas({ formulas, setFormulas, insumos, canAdd = true, canEdit = true, canDelete = true }: FormulasProps) {
  // Grupos ainda usa estado interno (pode ser movido depois)
  const [grupos, setGrupos] = useState<Grupo[]>(initialGrupos);
  const [activeTab, setActiveTab] = useState<TabType>('formulas');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('az');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formulaToDelete, setFormulaToDelete] = useState<string | null>(null);
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [proportionQuantidade, setProportionQuantidade] = useState(1);
  const [proportionUnidade, setProportionUnidade] = useState<'un' | 'kg' | 'L' | 'ml'>('un');

  // Grupos Modal
  const [showGrupoModal, setShowGrupoModal] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);
  const [grupoForm, setGrupoForm] = useState({ nome: '', cor: '#3B82F6' });

  // Form state
  const [form, setForm] = useState<Partial<Formula>>({
    nome: '',
    codigo: '',
    descricao: '',
    grupoId: '1',
    pesoVolume: '',
    unidade: 'ml',
    rendimento: 1,
    insumos: [],
    observacoes: '',
    status: 'rascunho',
    listaInsumo: '',
    prefixoLote: '',
  });

  // Insumo selection states
  const [selectedInsumoId, setSelectedInsumoId] = useState('');
  const [selectedVarianteId, setSelectedVarianteId] = useState('');
  const [insumoQuantidade, setInsumoQuantidade] = useState(0);
  const [insumoSearch, setInsumoSearch] = useState('');

  const normalizeString = (str: string) => 
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredInsumosParaAdicao = useMemo(() => {
    const sorted = [...insumos].sort((a, b) => a.nome.localeCompare(b.nome));
    
    if (insumoSearch.length < 4) return sorted;
    
    const search = normalizeString(insumoSearch);
    return sorted.filter(i => 
      normalizeString(i.nome).includes(search) || 
      (i.apelido && normalizeString(i.apelido).includes(search))
    );
  }, [insumos, insumoSearch]);



  const calcularCustoTotal = (insumos: FormulaInsumo[]) => {
    return (insumos || []).reduce((sum, i) => sum + (i.quantidade * i.valorUnitario), 0);
  };

  const calcularCustoUnidade = (formula: Formula) => {
    const custoTotal = calcularCustoTotal(formula.insumos);
    return formula.rendimento > 0 ? custoTotal / formula.rendimento : 0;
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
        case 'asc': return calcularCustoTotal(a.insumos) - calcularCustoTotal(b.insumos);
        case 'desc': return calcularCustoTotal(b.insumos) - calcularCustoTotal(a.insumos);
        default: return 0;
      }
    });

  const getGrupo = (grupoId: string) => grupos.find(g => g.id === grupoId);

  const getSelectedInsumo = () => {
    return insumos.find(i => i.id === selectedInsumoId);
  };

  const handleOpenNew = () => {
    if (!canAdd) {
      alert('Limite de fórmulas atingido para o seu plano.');
      return;
    }
    setEditingFormula(null);
    setForm({
      nome: '',
      codigo: '',
      descricao: '',
      grupoId: '1',
      pesoVolume: '',
      unidade: 'ml',
      rendimento: 1,
      insumos: [],
      observacoes: '',
      status: 'rascunho',
      listaInsumo: '',
      prefixoLote: '',
    });
    setSelectedInsumoId('');
    setSelectedVarianteId('');
    setInsumoQuantidade(0);
    setShowModal(true);
  };

  const handleOpenEdit = (formula: Formula) => {
    setEditingFormula(formula);
    setForm({ ...formula });
    setSelectedInsumoId('');
    setSelectedVarianteId('');
    setInsumoQuantidade(0);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.nome) return;

    const now = new Date().toISOString().split('T')[0];
    
    if (editingFormula) {
      setFormulas(prev => prev.map(f => f.id === editingFormula.id ? { 
        ...f, 
        ...form,
        updatedAt: now,
      } as Formula : f));
    } else {
      const newFormula: Formula = {
        ...form as Formula,
        id: Date.now().toString(),
        codigo: form.codigo || `FRM-${Date.now()}`,
        historico: [],
        createdAt: now,
        updatedAt: now,
      };
      setFormulas(prev => [...prev, newFormula]);
    }
    setShowModal(false);
  };

  const handleDuplicate = (formula: Formula) => {
    const duplicate: Formula = {
      ...formula,
      id: Date.now().toString(),
      nome: `${formula.nome} (Cópia)`,
      codigo: `${formula.codigo}-CPY`,
      status: 'rascunho',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setFormulas(prev => [...prev, duplicate]);
  };

  const handleDelete = (id: string) => {
    setFormulaToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteFormula = async () => {
    if (!formulaToDelete) return;
    const id = formulaToDelete;
    
    setFormulas(prev => prev.filter(f => f.id !== id));
    try {
      await dataService.formulas.delete(id);
    } catch (error) {
      console.error('Erro ao deletar fórmula:', error);
    } finally {
      setShowDeleteConfirm(false);
      setFormulaToDelete(null);
    }
  };

  // Verificar se insumo já está na fórmula
  const isInsumoDuplicado = () => {
    if (!selectedInsumoId || !form.insumos) return false;
    
    return form.insumos.some(i => {
      if (i.insumoId !== selectedInsumoId) return false;
      // Se tem variante, verificar se é a mesma variante
      if (selectedVarianteId) {
        return i.varianteId === selectedVarianteId;
      }
      // Se não tem variante selecionada, verificar se existe sem variante
      return !i.varianteId;
    });
  };

  // Adicionar insumo à fórmula
  const handleAddInsumo = () => {
    const insumo = getSelectedInsumo();
    if (!insumo || insumoQuantidade <= 0) return;

    // Verificar duplicado
    if (isInsumoDuplicado()) {
      return;
    }

    let nome = insumo.nome;
    let valorUnitario = insumo.valorUnitario;

    // Se tem variante selecionada
    if (insumo.variantes && insumo.variantes.length > 0 && selectedVarianteId) {
      const variante = insumo.variantes.find(v => v.id === selectedVarianteId);
      if (variante) {
        nome = `${insumo.nome} - ${variante.nome}`;
        valorUnitario = variante.valorUnitario;
      }
    }

    const quantidade = insumoQuantidade;

    const newInsumo: FormulaInsumo = {
      id: Date.now().toString(),
      insumoId: insumo.id,
      varianteId: selectedVarianteId || undefined,
      nome,
      unidade: insumo.unidade,
      quantidade,
      valorUnitario,
      quimico: insumo.quimico,
    };

    setForm(prev => ({
      ...prev,
      insumos: [...(prev.insumos || []), newInsumo],
    }));

    // Reset
    setSelectedInsumoId('');
    setSelectedVarianteId('');
    setInsumoQuantidade(0);
  };

  const handleRemoveInsumo = (id: string) => {
    setForm(prev => ({
      ...prev,
      insumos: prev.insumos?.filter(i => i.id !== id) || [],
    }));
  };


  // Estado local para controlar inputs de quantidade durante edição
  const [quantidadeInputs, setQuantidadeInputs] = useState<Record<string, string>>({});

  const handleQuantidadeInputChange = (id: string, value: string, quimico: boolean) => {
    // Permite digitação livre, validando apenas caracteres
    let cleanValue = value;
    
    if (!quimico) {
      // Para não-químicos, apenas números inteiros
      cleanValue = value.replace(/\D/g, '');
    } else {
      // Para químicos, permite números e vírgula
      cleanValue = value.replace(/[^\d,]/g, '');
      // Garante apenas uma vírgula
      const parts = cleanValue.split(',');
      if (parts.length > 2) {
        cleanValue = parts[0] + ',' + parts.slice(1).join('');
      }
      // Limita a 3 casas decimais
      if (parts.length === 2 && parts[1].length > 3) {
        cleanValue = parts[0] + ',' + parts[1].substring(0, 3);
      }
    }
    
    setQuantidadeInputs(prev => ({ ...prev, [id]: cleanValue }));
  };

  const handleQuantidadeInputBlur = (id: string, quimico: boolean) => {
    const value = quantidadeInputs[id] || '0';
    const quantidade = parseFloat(value.replace(',', '.')) || 0;
    
    setForm(prev => ({
      ...prev,
      insumos: prev.insumos?.map(i => 
        i.id === id ? { ...i, quantidade } : i
      ) || [],
    }));
    
    // Formata o valor após blur
    const formatted = quimico ? quantidade.toFixed(3).replace('.', ',') : Math.round(quantidade).toString();
    setQuantidadeInputs(prev => ({ ...prev, [id]: formatted }));
  };

  const getQuantidadeInputValue = (insumo: FormulaInsumo) => {
    if (quantidadeInputs[insumo.id] !== undefined) {
      return quantidadeInputs[insumo.id];
    }
    return insumo.quimico ? insumo.quantidade.toFixed(3).replace('.', ',') : insumo.quantidade.toString();
  };

  // Grupos handlers
  const handleOpenNewGrupo = () => {
    setEditingGrupo(null);
    setGrupoForm({ nome: '', cor: '#3B82F6' });
    setShowGrupoModal(true);
  };

  const handleOpenEditGrupo = (grupo: Grupo) => {
    setEditingGrupo(grupo);
    setGrupoForm({ nome: grupo.nome, cor: grupo.cor });
    setShowGrupoModal(true);
  };

  const handleSaveGrupo = () => {
    if (!grupoForm.nome) return;

    if (editingGrupo) {
      setGrupos(prev => prev.map(g => g.id === editingGrupo.id ? { ...g, ...grupoForm } : g));
    } else {
      const newGrupo: Grupo = {
        id: Date.now().toString(),
        nome: grupoForm.nome,
        cor: grupoForm.cor,
      };
      setGrupos(prev => [...prev, newGrupo]);
    }
    setShowGrupoModal(false);
  };

  const handleDeleteGrupo = (id: string) => {
    const hasFormulas = formulas.some(f => f.grupoId === id);
    if (hasFormulas) {
      alert('Não é possível excluir um grupo que possui fórmulas vinculadas.');
      return;
    }
    if (confirm('Tem certeza que deseja excluir este grupo?')) {
      setGrupos(prev => prev.filter(g => g.id !== id));
    }
  };

  const selectedInsumo = getSelectedInsumo();
  const hasVariantes = selectedInsumo?.variantes && selectedInsumo.variantes.length > 0;
  const canAddInsumo = selectedInsumoId && insumoQuantidade && (!hasVariantes || selectedVarianteId);

  // Calculate total chemical quantity for percentages in the modal
  const totalQuimico = useMemo(() => {
    return form.insumos?.reduce((acc, insumo) => insumo.quimico ? acc + insumo.quantidade : acc, 0) || 0;
  }, [form.insumos]);

  const tabs = [
    { id: 'formulas', label: 'Fórmulas', icon: FlaskConical },
    { id: 'grupos', label: 'Grupos', icon: FolderTree },
    { id: 'proporcao', label: 'Proporção', icon: Calculator },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fórmulas</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie as fórmulas de produtos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <motion.div
                animate={activeTab === tab.id ? { 
                  scale: [1, 1.2, 1],
                  rotate: [0, -10, 10, 0]
                } : { 
                  scale: 1, 
                  rotate: 0 
                }}
                transition={activeTab === tab.id ? { 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                } : { 
                  duration: 0.3 
                }}
              >
                <Icon className="w-4 h-4" />
              </motion.div>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Fórmulas */}
      {activeTab === 'formulas' && (
        <div className="space-y-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar fórmulas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                >
                  <List className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                >
                  <LayoutGrid className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Sort Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                <button
                  onClick={() => setSortMode('az')}
                  className={`p-2 rounded-lg transition-colors ${sortMode === 'az' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                >
                  <ArrowUpAZ className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setSortMode('za')}
                  className={`p-2 rounded-lg transition-colors ${sortMode === 'za' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                >
                  <ArrowDownAZ className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <button
                onClick={handleOpenNew}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                  canAdd 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
                title={!canAdd ? 'Limite de fórmulas atingido' : ''}
              >
                <Plus className="w-5 h-5" />
                Nova Fórmula
              </button>
            </div>
          </div>

          {/* Results */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredFormulas.length} fórmula(s) encontrada(s)
          </p>

          {/* Grid View */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFormulas.map((formula) => {
                const grupo = getGrupo(formula.grupoId);
                const custoTotal = calcularCustoTotal(formula.insumos);
                const custoUnidade = calcularCustoUnidade(formula);

                return (
                  <div
                    key={formula.id}
                    className="relative bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden"
                  >
                    {/* Watermark */}
                    <FlaskConical className="absolute -right-4 -bottom-4 w-24 h-24 text-gray-100 dark:text-gray-700/30 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
                    
                    <div className="relative z-10 flex items-start justify-between mb-3">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: grupo?.cor || '#6B7280' }}
                      >
                        {grupo?.nome || 'Sem grupo'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        formula.status === 'finalizado' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      }`}>
                        {formula.status === 'finalizado' ? 'Finalizado' : 'Rascunho'}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{formula.nome}</h3>
                    <p className="text-xs text-gray-500 italic mb-3">{formula.codigo}</p>

                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-xs text-blue-600 dark:text-blue-400">Rendimento</p>
                        <p className="font-semibold text-blue-700 dark:text-blue-300">{formula.rendimento} un</p>
                      </div>
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-xs text-green-600 dark:text-green-400">Custo/Un</p>
                        <p className="font-semibold text-green-700 dark:text-green-300">R$ {custoUnidade.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <span>{(formula.insumos || []).length} insumo(s)</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        Total: R$ {custoTotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-1 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => { setSelectedFormula(formula); setShowViewModal(true); }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>

                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(formula)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4 text-blue-500" />
                        </button>
                      )}
                      
                      {canAdd && (
                        <button
                          onClick={() => handleDuplicate(formula)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Duplicar"
                        >
                          <Copy className="w-4 h-4 text-purple-500" />
                        </button>
                      )}
                      
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(formula.id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Grupo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Nome / Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Rendimento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Custo Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Custo/Un</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredFormulas.map((formula) => {
                    const grupo = getGrupo(formula.grupoId);
                    const custoTotal = calcularCustoTotal(formula.insumos);
                    const custoUnidade = calcularCustoUnidade(formula);

                    return (
                      <tr key={formula.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: grupo?.cor || '#6B7280' }}
                          >
                            {grupo?.nome || 'Sem grupo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">{formula.nome}</p>
                          <p className="text-xs text-gray-500 italic">{formula.codigo}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formula.rendimento} un</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          R$ {custoTotal.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600 dark:text-green-400">
                          R$ {custoUnidade.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            formula.status === 'finalizado' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          }`}>
                            {formula.status === 'finalizado' ? 'Finalizado' : 'Rascunho'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setSelectedFormula(formula); setShowViewModal(true); }}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(formula)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-blue-500" />
                            </button>
                            <button
                              onClick={() => handleDuplicate(formula)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <Copy className="w-4 h-4 text-purple-500" />
                            </button>
                            <button
                              onClick={() => handleDelete(formula.id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Grupos */}
      {activeTab === 'grupos' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            {canAdd && (
              <button
                onClick={handleOpenNewGrupo}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
                Novo Grupo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grupos.map((grupo) => {
              const formulasCount = formulas.filter(f => f.grupoId === grupo.id).length;
              return (
                <div
                  key={grupo.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl"
                      style={{ backgroundColor: grupo.cor }}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{grupo.nome}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formulasCount} fórmula(s)</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    {canEdit && (
                      <button
                        onClick={() => handleOpenEditGrupo(grupo)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-blue-500" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteGrupo(grupo.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Proporção */}
      {activeTab === 'proporcao' && (
        <ProporcaoTab 
          formulas={formulas} 
          grupos={grupos} 
          onUpdateFormula={(updatedFormula) => {
            setFormulas(prev => prev.map(f => f.id === updatedFormula.id ? updatedFormula : f));
          }}
          quantidade={proportionQuantidade}
          setQuantidade={setProportionQuantidade}
          unidade={proportionUnidade}
          setUnidade={setProportionUnidade}
        />
      )}

      {/* Modal: Create/Edit Formula */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingFormula ? 'Editar Fórmula' : 'Nova Fórmula'}
        size="xl"
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nome do Produto *"
              type="text"
              value={form.nome || ''}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
            <Input
              label="Lista Material - LM"
              type="text"
              value={form.codigo || ''}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              placeholder="Ex: LM-001"
            />
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Descrição
              </label>
              <textarea
                value={form.descricao || ''}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <Select
              label="Grupo"
              value={form.grupoId || '1'}
              onChange={(e) => setForm({ ...form, grupoId: e.target.value })}
              options={grupos.map(g => ({ value: g.id, label: g.nome }))}
            />
            <CurrencyInput
              label="Rendimento (unidades)"
              value={form.rendimento || 1}
              onChange={(val) => setForm({ ...form, rendimento: val })}
            />
            <Input
              label="Peso/Volume"
              type="text"
              value={form.pesoVolume || ''}
              onChange={(e) => setForm({ ...form, pesoVolume: e.target.value })}
            />
            <Select
              label="Unidade"
              value={form.unidade || 'ml'}
              onChange={(e) => setForm({ ...form, unidade: e.target.value })}
              options={[
                { value: 'ML', label: 'ML' },
                { value: 'LT', label: 'LT' },
                { value: 'GR', label: 'GR' },
                { value: 'KG', label: 'KG' },
                { value: 'UN', label: 'UN' },
                { value: 'PC', label: 'PC' },
              ]}
            />
          </div>

          {/* Insumos Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Composição da Fórmula ({form.insumos?.length || 0})
            </h3>

            {/* Add Insumo */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Adicionar Insumo</p>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar (mín. 4 letras)..."
                    value={insumoSearch}
                    onChange={(e) => setInsumoSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              
                  <div className="grid grid-cols-4 gap-3">
                    {/* Select Insumo */}
                    <div className="relative">
                      <select
                        value={selectedInsumoId}
                        onChange={(e) => {
                          setSelectedInsumoId(e.target.value);
                          setSelectedVarianteId('');
                        }}
                        className={`w-full px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border ${isInsumoDuplicado() ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-gray-600'} text-gray-900 dark:text-white text-sm appearance-none transition-all`}
                      >
                        <option value="">
                          {insumoSearch.length >= 4 
                            ? `${filteredInsumosParaAdicao.length} resultados encontrados...` 
                            : 'Selecione o insumo...'}
                        </option>
                        {filteredInsumosParaAdicao.map((insumo) => (
                          <option key={insumo.id} value={insumo.id}>
                            {insumo.quimico ? '🧪' : '📦'} {insumo.nome} {insumo.apelido ? `(${insumo.apelido})` : ''} - R$ {insumo.valorUnitario.toFixed(2)}/{insumo.unidade.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                {/* Select Variante (if has variants) */}
                {hasVariantes && (
                  <div className="relative">
                    <select
                      value={selectedVarianteId}
                      onChange={(e) => setSelectedVarianteId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm appearance-none"
                    >
                      <option value="">Selecione a variante...</option>
                      {selectedInsumo?.variantes?.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nome} - R$ {v.valorUnitario.toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                )}

                {/* Quantidade */}
                <div>
                  <CurrencyInput
                    placeholder={selectedInsumo?.quimico ? "0,000" : "0"}
                    value={insumoQuantidade}
                    onChange={(val) => setInsumoQuantidade(val)}
                    decimals={selectedInsumo?.quimico ? 3 : 2}
                    className="text-sm"
                  />
                </div>

                <button
                  onClick={handleAddInsumo}
                  disabled={!canAddInsumo || isInsumoDuplicado()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Adicionar
                </button>
              </div>
              {isInsumoDuplicado() && (
                <p className="text-xs text-red-500 font-medium animate-pulse">
                  ⚠️ Este insumo já foi adicionado à fórmula.
                </p>
              )}
            </div>

            {/* Insumos List */}
            {form.insumos && form.insumos.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-8"></th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Insumo</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-24">Qtd</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-16">%</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-16">Unid.</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-24">Val. Unit.</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-24">Total</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {(form.insumos || []).sort((a, b) => {
                      const percA = a.quimico && totalQuimico > 0 ? (a.quantidade / totalQuimico) : -1;
                      const percB = b.quimico && totalQuimico > 0 ? (b.quantidade / totalQuimico) : -1;
                      
                      if (percA !== percB) {
                        return percB - percA; // Higher percentage first
                      }
                      
                      // If both are non-chemical or have same percentage, sort by quantity
                      return b.quantidade - a.quantidade;
                    }).map((insumo) => (
                      <tr key={insumo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-3 py-2">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {insumo.quimico ? (
                              <FlaskConical className="w-4 h-4 text-amber-500" />
                            ) : (
                              <Flag className="w-4 h-4 text-blue-500" />
                            )}
                            <span className="text-sm text-gray-900 dark:text-white">{insumo.nome}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={getQuantidadeInputValue(insumo)}
                            onFocus={() => {
                              // Inicializa o input com o valor atual ao focar, sem zerar
                              if (quantidadeInputs[insumo.id] === undefined) {
                                const formatted = insumo.quimico 
                                  ? insumo.quantidade.toFixed(3).replace('.', ',') 
                                  : insumo.quantidade.toString();
                                setQuantidadeInputs(prev => ({ ...prev, [insumo.id]: formatted }));
                              }
                            }}
                            onChange={(e) => handleQuantidadeInputChange(insumo.id, e.target.value, insumo.quimico)}
                            onBlur={() => handleQuantidadeInputBlur(insumo.id, insumo.quimico)}
                            className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-3 py-2 text-xs font-mono text-gray-500 dark:text-gray-400">
                          {insumo.quimico && totalQuimico > 0 
                            ? `${((insumo.quantidade / totalQuimico) * 100).toFixed(2)}%`
                            : '-'
                          }
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                          {insumo.unidade.toUpperCase()}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                          R$ {insumo.valorUnitario.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                          R$ {(insumo.quantidade * insumo.valorUnitario).toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleRemoveInsumo(insumo.id)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <td colSpan={6} className="px-3 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                        Custo Total:
                      </td>
                      <td className="px-3 py-2 text-sm font-bold text-green-600 dark:text-green-400">
                        R$ {calcularCustoTotal(form.insumos).toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Additional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observações / Instruções
              </label>
              <textarea
                value={form.observacoes || ''}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={form.status || 'rascunho'}
                onChange={(e) => setForm({ ...form, status: e.target.value as 'rascunho' | 'finalizado' })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="rascunho">Rascunho</option>
                <option value="finalizado">Finalizado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prefixo do Lote
              </label>
              <input
                type="text"
                value={form.prefixoLote || ''}
                onChange={(e) => setForm({ ...form, prefixoLote: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowModal(false)}
              className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!form.nome}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl transition-colors"
            >
              {editingFormula ? 'Salvar Alterações' : 'Criar Fórmula'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: View Formula */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalhes da Fórmula"
        size="lg"
      >
        {selectedFormula && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Nome</label>
                <p className="font-medium text-gray-900 dark:text-white">{selectedFormula.nome}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Lista Material - LM</label>
                <p className="font-medium text-gray-900 dark:text-white">{selectedFormula.codigo}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Grupo</label>
                <p className="font-medium text-gray-900 dark:text-white">{getGrupo(selectedFormula.grupoId)?.nome}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Status</label>
                <p className="font-medium text-gray-900 dark:text-white capitalize">{selectedFormula.status}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-sm text-blue-600 dark:text-blue-400">Rendimento</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{selectedFormula.rendimento} un</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-sm text-green-600 dark:text-green-400">Custo/Unidade</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  R$ {calcularCustoUnidade(selectedFormula).toFixed(2)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Composição ({(selectedFormula.insumos || []).length} insumos)
              </h4>
              <div className="space-y-2">
                {/* Químicos primeiro */}
                {(selectedFormula.insumos || []).filter(i => i.quimico).map((insumo) => (
                  <div key={insumo.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-amber-500" />
                      <span className="text-gray-900 dark:text-white">{insumo.nome}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">{insumo.quantidade.toFixed(3)} {insumo.unidade}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        R$ {(insumo.quantidade * insumo.valorUnitario).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
                {/* Não-químicos depois */}
                {(selectedFormula.insumos || []).filter(i => !i.quimico).map((insumo) => (
                  <div key={insumo.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-900 dark:text-white">{insumo.nome}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">{insumo.quantidade} {insumo.unidade}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        R$ {(insumo.quantidade * insumo.valorUnitario).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="font-medium text-green-800 dark:text-green-300">Custo Total</span>
                <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                  R$ {calcularCustoTotal(selectedFormula.insumos).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      

      {/* Modal: Grupo */}
      <Modal
        isOpen={showGrupoModal}
        onClose={() => setShowGrupoModal(false)}
        title={editingGrupo ? 'Editar Grupo' : 'Novo Grupo'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={grupoForm.nome}
              onChange={(e) => setGrupoForm({ ...grupoForm, nome: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cor
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={grupoForm.cor}
                onChange={(e) => setGrupoForm({ ...grupoForm, cor: e.target.value })}
                className="w-12 h-12 rounded-xl cursor-pointer"
              />
              <div
                className="flex-1 h-12 rounded-xl"
                style={{ backgroundColor: grupoForm.cor }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowGrupoModal(false)}
              className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveGrupo}
              disabled={!grupoForm.nome}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Formula Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Tem certeza que deseja excluir esta fórmula permanentemente? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDeleteFormula}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
            >
              Excluir Agora
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Proporcao Tab Component
interface ProporcaoTabProps {
  formulas: Formula[];
  grupos: Grupo[];
  onUpdateFormula?: (formula: Formula) => void;
  quantidade: number;
  setQuantidade: (value: number) => void;
  unidade: 'un' | 'kg' | 'L' | 'ml';
  setUnidade: (value: 'un' | 'kg' | 'L' | 'ml') => void;
}

function ProporcaoTab({ 
  formulas, 
  grupos, 
  onUpdateFormula, 
  quantidade,
  setQuantidade,
  unidade,
  setUnidade
}: ProporcaoTabProps) {
  const [selectedFormulaId, setSelectedFormulaId] = useState('');
  const [insumosAjustados, setInsumosAjustados] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);
  

  

  

  const selectedFormula = formulas.find(f => f.id === selectedFormulaId);
  const fator = selectedFormula ? quantidade / selectedFormula.rendimento : 1;

  const getGrupo = (grupoId: string) => grupos.find(g => g.id === grupoId);

  // Quando muda a fórmula selecionada, preenche a quantidade com o rendimento original
  useEffect(() => {
    if (selectedFormula) {
      setQuantidade(selectedFormula.rendimento);
    }
    setInsumosAjustados({});
    setPropInputs({});
    setHasChanges(false);
  }, [selectedFormulaId, selectedFormula?.rendimento]);

  // Calcula a quantidade ajustada considerando edições manuais
  const getQuantidadeAjustada = (insumo: FormulaInsumo) => {
    if (insumosAjustados[insumo.id] !== undefined) {
      return insumosAjustados[insumo.id];
    }
    return insumo.quimico 
      ? insumo.quantidade * fator 
      : Math.round(insumo.quantidade * fator);
  };

  const calcularCustoTotal = () => {
    if (!selectedFormula) return 0;
    return (selectedFormula.insumos || []).reduce((sum, i) => {
      const qtd = getQuantidadeAjustada(i);
      return sum + (qtd * i.valorUnitario);
    }, 0);
  };

  // Estado local para inputs de proporção
  const [propInputs, setPropInputs] = useState<Record<string, string>>({});
  // Estado para guardar valores originais ao focar (para comparação)
  const [propOriginalValues, setPropOriginalValues] = useState<Record<string, number>>({});

  // Handler para edição da quantidade - permite digitação livre sem zerar o campo
  const handlePropInputChange = (insumoId: string, value: string, quimico: boolean) => {
    let cleanValue = value;
    
    if (!quimico) {
      // Apenas inteiros para não-químicos
      cleanValue = value.replace(/\D/g, '');
    } else {
      // Permite números e vírgula para químicos
      cleanValue = value.replace(/[^\d,]/g, '');
      // Apenas uma vírgula
      const parts = cleanValue.split(',');
      if (parts.length > 2) {
        cleanValue = parts[0] + ',' + parts.slice(1).join('');
      }
      // Máximo 3 decimais
      if (parts.length === 2 && parts[1].length > 3) {
        cleanValue = parts[0] + ',' + parts[1].substring(0, 3);
      }
    }

    setPropInputs(prev => ({ ...prev, [insumoId]: cleanValue }));
  };

  // Ao focar no campo, NÃO zerar o valor - apenas guardar o valor original para comparação
  const handlePropInputFocus = (insumoId: string, insumo: FormulaInsumo) => {
    const qtd = getQuantidadeAjustada(insumo);
    // Guarda o valor original ao focar para comparar depois
    setPropOriginalValues(prev => ({ ...prev, [insumoId]: qtd }));
    // Se não existe valor no propInputs, inicializa com o valor atual
    if (propInputs[insumoId] === undefined) {
      const formatted = insumo.quimico ? qtd.toFixed(3).replace('.', ',') : Math.round(qtd).toString();
      setPropInputs(prev => ({ ...prev, [insumoId]: formatted }));
    }
  };

  // Ao sair do campo, aplica o valor e formata - SÓ marca como editado se o valor realmente mudou
  const handlePropInputBlur = (insumoId: string, quimico: boolean) => {
    const value = propInputs[insumoId] || '0';
    const novaQuantidade = parseFloat(value.replace(',', '.')) || 0;
    const quantidadeOriginal = propOriginalValues[insumoId];
    
    // Tolerância para comparação de floats
    const mudou = quantidadeOriginal !== undefined && Math.abs(novaQuantidade - quantidadeOriginal) > 0.0001;
    
    // Só atualiza se o valor realmente mudou
    if (mudou) {
      setInsumosAjustados(prev => ({
        ...prev,
        [insumoId]: novaQuantidade,
      }));
      setHasChanges(true);
    }

    // Formata após blur
    const formatted = quimico ? novaQuantidade.toFixed(3).replace('.', ',') : Math.round(novaQuantidade).toString();
    setPropInputs(prev => ({ ...prev, [insumoId]: formatted }));
  };

  // Obtém o valor para exibição no input
  const getPropInputValue = (insumo: FormulaInsumo) => {
    if (propInputs[insumo.id] !== undefined) {
      return propInputs[insumo.id];
    }
    const qtd = getQuantidadeAjustada(insumo);
    return insumo.quimico ? qtd.toFixed(3).replace('.', ',') : Math.round(qtd).toString();
  };

  // Salvar ajustes na fórmula original
  const handleSaveToOriginal = () => {
    if (!selectedFormula || !onUpdateFormula) return;

    const now = new Date();
    const dataStr = now.toLocaleString('pt-BR');
    
    // Calcula as novas quantidades base (dividindo pelo fator)
    const insumosAtualizados = (selectedFormula.insumos || []).map(insumo => {
      const qtdAjustada = getQuantidadeAjustada(insumo);
      const qtdOriginal = insumo.quantidade;
      const novaQtdBase = fator > 0 ? qtdAjustada / fator : insumo.quantidade;
      
      return {
        ...insumo,
        quantidade: novaQtdBase,
        _qtdAnterior: qtdOriginal,
        _qtdNova: novaQtdBase,
      };
    });

    // Cria histórico das alterações
    const alteracoes = insumosAtualizados
      .filter(i => Math.abs(i._qtdAnterior - i._qtdNova) > 0.0001)
      .map(i => `${i.nome}: ${i._qtdAnterior.toFixed(3)} → ${i._qtdNova.toFixed(3)}`);

    if (alteracoes.length === 0) {
      alert('Nenhuma alteração detectada.');
      return;
    }

    const novoHistorico: FormulaHistorico = {
      id: Date.now().toString(),
      data: dataStr,
      acao: 'Ajuste de Proporção',
      detalhes: `Proporção: ${quantidade} ${unidade} (fator ${fator.toFixed(2)}x)\n${alteracoes.join('\n')}`,
    };

    const formulaAtualizada: Formula = {
      ...selectedFormula,
      insumos: insumosAtualizados.map(({ _qtdAnterior, _qtdNova, ...rest }) => rest),
      historico: [...selectedFormula.historico, novoHistorico],
      updatedAt: now.toISOString().split('T')[0],
    };

    onUpdateFormula(formulaAtualizada);
    setInsumosAjustados({});
    setHasChanges(false);
    alert('Alterações salvas na fórmula original!');
  };

  const predefinedQuantities = [1, 5, 10, 20, 30, 50, 80, 100];

  return (
    <div className="space-y-6">
      {/* Select Formula */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Selecione a Fórmula
          </label>
          <select
            value={selectedFormulaId}
            onChange={(e) => setSelectedFormulaId(e.target.value)}
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Selecione...</option>
            {formulas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome} ({f.status === 'finalizado' ? '✓' : '○'})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Unidade
          </label>
          <select
            value={unidade}
            onChange={(e) => setUnidade(e.target.value as 'un' | 'kg' | 'L' | 'ml')}
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
          >
            <option value="UN">UNIDADES</option>
            <option value="KG">KG</option>
            <option value="LT">LITROS</option>
            <option value="ML">ML</option>
            <option value="GR">GRAMAS</option>
            <option value="PC">PEÇAS</option>
          </select>
        </div>
      </div>

      {/* Quantity Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          Quantidade de Produção
        </h3>

        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => setQuantidade(Math.max(1, quantidade - 10))}
            className="w-12 h-12 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-xl text-red-600 dark:text-red-400 font-bold text-lg transition-colors"
          >
            -10
          </button>
          <button
            onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
            className="w-10 h-10 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-xl text-red-600 dark:text-red-400 font-bold transition-colors"
          >
            -1
          </button>
          
          <div className="px-8 py-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border-2 border-blue-500">
            <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">{quantidade}</span>
            <span className="text-lg text-blue-500 dark:text-blue-400 ml-2">{unidade}</span>
          </div>
          
          <button
            onClick={() => setQuantidade(quantidade + 1)}
            className="w-10 h-10 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-xl text-green-600 dark:text-green-400 font-bold transition-colors"
          >
            +1
          </button>
          <button
            onClick={() => setQuantidade(quantidade + 10)}
            className="w-12 h-12 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-xl text-green-600 dark:text-green-400 font-bold text-lg transition-colors"
          >
            +10
          </button>
        </div>

        {/* Predefined */}
        <div className="flex flex-wrap justify-center gap-2">
          {predefinedQuantities.map((q) => (
            <button
              key={q}
              onClick={() => setQuantidade(q)}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                quantidade === q
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Fator */}
        {selectedFormula && (
          <div className="mt-4 text-center">
            <span className="inline-block px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm font-medium">
              Fator de Escala: {fator.toFixed(2)}x
            </span>
          </div>
        )}
      </div>

      {/* Calculated Insumos */}
      {selectedFormula && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{selectedFormula.nome}</h3>
                <span
                  className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs text-white"
                  style={{ backgroundColor: getGrupo(selectedFormula.grupoId)?.cor }}
                >
                  {getGrupo(selectedFormula.grupoId)?.nome}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Produção: {quantidade} {unidade}</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  Total: R$ {calcularCustoTotal().toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Insumo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Qtd Original</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Quantidade</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {/* Químicos */}
              {(selectedFormula.insumos || []).filter(i => i.quimico).map((insumo) => {
                const qtdAjustada = getQuantidadeAjustada(insumo);
                const total = qtdAjustada * insumo.valorUnitario;
                const wasEdited = insumosAjustados[insumo.id] !== undefined;
                
                return (
                  <tr key={insumo.id} className={`${wasEdited ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-amber-50/50 dark:bg-amber-900/10'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-gray-900 dark:text-white">{insumo.nome}</span>
                        {wasEdited && (
                          <span className="px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded">editado</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{insumo.quantidade.toFixed(3)} {insumo.unidade}</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={getPropInputValue(insumo)}
                        onFocus={() => handlePropInputFocus(insumo.id, insumo)}
                        onChange={(e) => handlePropInputChange(insumo.id, e.target.value, true)}
                        onBlur={() => handlePropInputBlur(insumo.id, true)}
                        className="w-24 px-2 py-1 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white font-medium"
                      />
                      <span className="ml-1 text-xs text-gray-500">{insumo.unidade}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-right text-gray-900 dark:text-white">
                      R$ {total.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {/* Não-químicos */}
              {(selectedFormula.insumos || []).filter(i => !i.quimico).map((insumo) => {
                const qtdAjustada = getQuantidadeAjustada(insumo);
                const total = qtdAjustada * insumo.valorUnitario;
                const wasEdited = insumosAjustados[insumo.id] !== undefined;
                
                return (
                  <tr key={insumo.id} className={`${wasEdited ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-50/50 dark:bg-gray-700/30'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-900 dark:text-white">{insumo.nome}</span>
                        {wasEdited && (
                          <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded">editado</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{insumo.quantidade} {insumo.unidade}</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={getPropInputValue(insumo)}
                        onFocus={() => handlePropInputFocus(insumo.id, insumo)}
                        onChange={(e) => handlePropInputChange(insumo.id, e.target.value, false)}
                        onBlur={() => handlePropInputBlur(insumo.id, false)}
                        className="w-24 px-2 py-1 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white font-medium"
                      />
                      <span className="ml-1 text-xs text-gray-500">{insumo.unidade}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-right text-gray-900 dark:text-white">
                      R$ {total.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Actions */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            {hasChanges && (
              <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                ⚠️ Alterações não salvas na fórmula original
              </span>
            )}
            <div className="flex gap-3 ml-auto">

              {hasChanges && onUpdateFormula && (
                <button
                  onClick={handleSaveToOriginal}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Salvar na Original
                </button>
              )}
            </div>
          </div>

          {/* Histórico */}
          {selectedFormula.historico && selectedFormula.historico.length > 0 && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                📜 Histórico de Alterações
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFormula.historico.slice().reverse().map((h) => (
                  <div key={h.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">{h.acao}</span>
                      <span className="text-xs text-gray-500">{h.data}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{h.detalhes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}


    </div>
  );
}
