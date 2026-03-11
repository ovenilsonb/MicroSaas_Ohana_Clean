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
  const [grupos, setGrupos] = useState<Grupo[]>(() => {
    const saved = localStorage.getItem('ohana_grupos');
    return saved ? JSON.parse(saved) : initialGrupos;
  });

  useEffect(() => {
    dataService.grupos.getAll().then(data => {
      if (data.length > 0) {
        setGrupos(data);
      } else {
        dataService.grupos.save(initialGrupos).catch(console.error);
      }
    });
  }, []);

  useEffect(() => {
    dataService.grupos.save(grupos).catch(console.error);
  }, [grupos]);
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
      if (parts.length === 2 && parts[1].length > 2) {
        cleanValue = parts[0] + ',' + parts[1].substring(0, 2);
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
    const formatted = quimico ? quantidade.toFixed(2).replace('.', ',') : Math.round(quantidade).toString();
    setQuantidadeInputs(prev => ({ ...prev, [id]: formatted }));
  };

  const getQuantidadeInputValue = (insumo: FormulaInsumo) => {
    if (quantidadeInputs[insumo.id] !== undefined) {
      return quantidadeInputs[insumo.id];
    }
    return insumo.quimico ? insumo.quantidade.toFixed(2).replace('.', ',') : insumo.quantidade.toString();
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
          insumosData={insumos}
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
                                  ? insumo.quantidade.toFixed(2).replace('.', ',') 
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
                      <span className="text-gray-500">{insumo.quantidade.toFixed(2)} {insumo.unidade}</span>
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
function extractVolumeFromName(name: string): number | null {
  const mlMatch = name.match(/(\d+)\s*ml/i);
  if (mlMatch) return parseInt(mlMatch[1]) / 1000;
  const lMatch = name.match(/(\d+(?:[.,]\d+)?)\s*(?:L|LT|litro)/i);
  if (lMatch) return parseFloat(lMatch[1].replace(',', '.'));
  return null;
}

function findMatchingVariant(insumo: Insumo, volumeL: number) {
  if (!insumo.variantes?.length) return null;
  return insumo.variantes.find(v => {
    const vol = extractVolumeFromName(v.nome);
    return vol !== null && Math.abs(vol - volumeL) < 0.01;
  }) || null;
}

interface ProporcaoTabProps {
  formulas: Formula[];
  grupos: Grupo[];
  insumosData: Insumo[];
  onUpdateFormula?: (formula: Formula) => void;
  quantidade: number;
  setQuantidade: (value: number) => void;
  unidade: 'un' | 'kg' | 'L' | 'ml';
  setUnidade: (value: 'un' | 'kg' | 'L' | 'ml') => void;
}

function ProporcaoTab({ 
  formulas, 
  grupos, 
  insumosData,
  onUpdateFormula, 
  quantidade,
  setQuantidade,
}: ProporcaoTabProps) {
  const [selectedFormulaId, setSelectedFormulaId] = useState('');
  const [insumosAjustados, setInsumosAjustados] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedNonChemicals, setSelectedNonChemicals] = useState<Record<string, boolean>>({});
  const [embalagemVolume, setEmbalagemVolume] = useState<number>(1);
  const [embalagemVolumeInput, setEmbalagemVolumeInput] = useState('1');

  const selectedFormula = formulas.find(f => f.id === selectedFormulaId);

  const chemicals = useMemo(() => 
    (selectedFormula?.insumos || []).filter(i => i.quimico), 
    [selectedFormula]
  );

  const nonChemicals = useMemo(() => {
    const formulaNonChem = (selectedFormula?.insumos || []).filter(i => !i.quimico);
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
      } as FormulaInsumo));
    return [...formulaNonChem, ...catalogNonChem];
  }, [selectedFormula, insumosData]);

  const getEffectivePrice = useMemo(() => {
    const cache: Record<string, { price: number; variantName: string | null }> = {};
    nonChemicals.forEach(fi => {
      const fullInsumo = insumosData.find(ins => ins.id === fi.insumoId);
      if (fullInsumo && fullInsumo.variantes && fullInsumo.variantes.length > 0) {
        const matched = findMatchingVariant(fullInsumo, embalagemVolume);
        if (matched) {
          cache[fi.id] = { price: matched.valorUnitario, variantName: matched.nome };
        } else {
          cache[fi.id] = { price: fi.valorUnitario, variantName: null };
        }
      } else {
        cache[fi.id] = { price: fi.valorUnitario, variantName: null };
      }
    });
    return cache;
  }, [nonChemicals, insumosData, embalagemVolume]);

  const totalVolume = quantidade * embalagemVolume;
  const fatorQuimico = selectedFormula ? totalVolume / (selectedFormula.rendimento || 1) : 1;

  const getGrupo = (grupoId: string) => grupos.find(g => g.id === grupoId);

  useEffect(() => {
    if (selectedFormula) {
      setQuantidade(10);
      setEmbalagemVolume(1);
      setEmbalagemVolumeInput('1');
    }
    setInsumosAjustados({});
    setPropInputs({});
    setHasChanges(false);
  }, [selectedFormulaId]);

  useEffect(() => {
    if (selectedFormula && nonChemicals.length > 0) {
      const newSelected: Record<string, boolean> = {};
      nonChemicals.forEach(i => {
        newSelected[i.id] = true;
      });
      setSelectedNonChemicals(newSelected);
    }
  }, [selectedFormulaId, nonChemicals.length]);

  useEffect(() => {
    setPropInputs({});
  }, [quantidade, embalagemVolume]);

  const getQuantidadeAjustada = (insumo: FormulaInsumo) => {
    if (insumosAjustados[insumo.id] !== undefined) {
      return insumosAjustados[insumo.id];
    }
    if (insumo.quimico) {
      return insumo.quantidade * fatorQuimico;
    }
    return quantidade * insumo.quantidade;
  };

  const calcularCustoTotal = () => {
    if (!selectedFormula) return 0;
    let total = 0;
    chemicals.forEach(i => {
      total += getQuantidadeAjustada(i) * i.valorUnitario;
    });
    nonChemicals.forEach(i => {
      if (selectedNonChemicals[i.id]) {
        const effectiveInfo = getEffectivePrice[i.id];
        const price = effectiveInfo ? effectiveInfo.price : i.valorUnitario;
        total += getQuantidadeAjustada(i) * price;
      }
    });
    return total;
  };

  const [propInputs, setPropInputs] = useState<Record<string, string>>({});
  const [propOriginalValues, setPropOriginalValues] = useState<Record<string, number>>({});

  const handlePropInputChange = (insumoId: string, value: string, quimico: boolean) => {
    let cleanValue = value;
    if (!quimico) {
      cleanValue = value.replace(/\D/g, '');
    } else {
      cleanValue = value.replace(/[^\d,]/g, '');
      const parts = cleanValue.split(',');
      if (parts.length > 2) {
        cleanValue = parts[0] + ',' + parts.slice(1).join('');
      }
      if (parts.length === 2 && parts[1].length > 2) {
        cleanValue = parts[0] + ',' + parts[1].substring(0, 2);
      }
    }
    setPropInputs(prev => ({ ...prev, [insumoId]: cleanValue }));
  };

  const handlePropInputFocus = (insumoId: string, insumo: FormulaInsumo) => {
    const qtd = getQuantidadeAjustada(insumo);
    setPropOriginalValues(prev => ({ ...prev, [insumoId]: qtd }));
    if (propInputs[insumoId] === undefined) {
      const formatted = insumo.quimico ? qtd.toFixed(2).replace('.', ',') : Math.round(qtd).toString();
      setPropInputs(prev => ({ ...prev, [insumoId]: formatted }));
    }
  };

  const handlePropInputBlur = (insumoId: string, quimico: boolean) => {
    const value = propInputs[insumoId] || '0';
    const novaQuantidade = parseFloat(value.replace(',', '.')) || 0;
    const quantidadeOriginal = propOriginalValues[insumoId];
    const mudou = quantidadeOriginal !== undefined && Math.abs(novaQuantidade - quantidadeOriginal) > 0.001;
    if (mudou) {
      setInsumosAjustados(prev => ({ ...prev, [insumoId]: novaQuantidade }));
      if (!insumoId.startsWith('auto_')) {
        setHasChanges(true);
      }
    }
    const formatted = quimico ? novaQuantidade.toFixed(2).replace('.', ',') : Math.round(novaQuantidade).toString();
    setPropInputs(prev => ({ ...prev, [insumoId]: formatted }));
  };

  const getPropInputValue = (insumo: FormulaInsumo) => {
    if (propInputs[insumo.id] !== undefined) {
      return propInputs[insumo.id];
    }
    const qtd = getQuantidadeAjustada(insumo);
    return insumo.quimico ? qtd.toFixed(2).replace('.', ',') : Math.round(qtd).toString();
  };

  const handleSaveToOriginal = () => {
    if (!selectedFormula || !onUpdateFormula) return;
    const now = new Date();
    const dataStr = now.toLocaleString('pt-BR');
    const insumosAtualizados = (selectedFormula.insumos || []).map(insumo => {
      if (!insumo.quimico && !selectedNonChemicals[insumo.id]) {
        return { ...insumo, _qtdAnterior: insumo.quantidade, _qtdNova: insumo.quantidade };
      }
      const qtdAjustada = getQuantidadeAjustada(insumo);
      const qtdOriginal = insumo.quantidade;
      const f = insumo.quimico ? fatorQuimico : quantidade;
      const novaQtdBase = f > 0 ? qtdAjustada / f : insumo.quantidade;
      return { ...insumo, quantidade: novaQtdBase, _qtdAnterior: qtdOriginal, _qtdNova: novaQtdBase };
    });
    const alteracoes = insumosAtualizados
      .filter(i => Math.abs(i._qtdAnterior - i._qtdNova) > 0.0001)
      .map(i => `${i.nome}: ${i._qtdAnterior.toFixed(2)} → ${i._qtdNova.toFixed(2)}`);
    if (alteracoes.length === 0) { alert('Nenhuma alteração detectada.'); return; }
    const novoHistorico: FormulaHistorico = {
      id: Date.now().toString(), data: dataStr, acao: 'Ajuste de Proporção',
      detalhes: `Proporção: ${quantidade} un de ${embalagemVolume}L (vol. total: ${totalVolume}L, fator ${fatorQuimico.toFixed(2)}x)\n${alteracoes.join('\n')}`,
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

  const toggleNonChemical = (id: string) => {
    setSelectedNonChemicals(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const predefinedQuantities = [1, 5, 10, 20, 25, 30, 50, 100];
  const predefinedVolumes = [0.5, 1, 2, 5, 10, 20];

  const custoTotal = calcularCustoTotal();
  const custoUnitario = quantidade > 0 ? custoTotal / quantidade : 0;

  return (
    <div className="space-y-6">
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
              {f.nome} ({f.status === 'finalizado' ? '✓' : '○'}) — Rend: {f.rendimento} {f.unidade}
            </option>
          ))}
        </select>
      </div>

      {selectedFormula && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{selectedFormula.nome}</h3>
              <span className="inline-block px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: getGrupo(selectedFormula.grupoId)?.cor }}>
                {getGrupo(selectedFormula.grupoId)?.nome}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Rendimento da fórmula: <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedFormula.rendimento} {selectedFormula.unidade}</span>
              {' · '}{chemicals.length} químico(s) · {nonChemicals.length} material(is)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
                <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                  Volume por Embalagem
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {predefinedVolumes.map((v) => (
                    <button
                      key={v}
                      onClick={() => { setEmbalagemVolume(v); setEmbalagemVolumeInput(String(v)); }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        embalagemVolume === v
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {v}L
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={embalagemVolumeInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d.,]/g, '');
                      setEmbalagemVolumeInput(val);
                      const num = parseFloat(val.replace(',', '.'));
                      if (!isNaN(num) && num > 0) setEmbalagemVolume(num);
                    }}
                    className="w-24 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white font-semibold text-center"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Litros por unidade</span>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
                <label className="block text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-2">
                  Quantidade de Unidades
                </label>
                <div className="flex items-center gap-3 mb-3">
                  <button onClick={() => setQuantidade(Math.max(1, quantidade - 10))} className="w-10 h-10 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400 font-bold text-sm">-10</button>
                  <button onClick={() => setQuantidade(Math.max(1, quantidade - 1))} className="w-8 h-10 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400 font-bold">-1</button>
                  <div className="px-5 py-2 bg-white dark:bg-gray-700 rounded-xl border-2 border-green-500 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">{quantidade}</span>
                    <span className="text-sm text-green-500 dark:text-green-400">un</span>
                  </div>
                  <button onClick={() => setQuantidade(quantidade + 1)} className="w-8 h-10 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg text-green-600 dark:text-green-400 font-bold">+1</button>
                  <button onClick={() => setQuantidade(quantidade + 10)} className="w-10 h-10 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg text-green-600 dark:text-green-400 font-bold text-sm">+10</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {predefinedQuantities.map((q) => (
                    <button key={q} onClick={() => setQuantidade(q)} className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${quantidade === q ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/40 border border-gray-200 dark:border-gray-600'}`}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center border border-purple-100 dark:border-purple-800">
                <p className="text-[10px] uppercase tracking-wider text-purple-500 dark:text-purple-400 font-bold mb-1">Volume Total</p>
                <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{totalVolume.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center border border-amber-100 dark:border-amber-800">
                <p className="text-[10px] uppercase tracking-wider text-amber-500 dark:text-amber-400 font-bold mb-1">Fator Químicos</p>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{fatorQuimico.toFixed(2)}x</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center border border-emerald-100 dark:border-emerald-800">
                <p className="text-[10px] uppercase tracking-wider text-emerald-500 dark:text-emerald-400 font-bold mb-1">Custo por Unidade</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">R$ {custoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          {nonChemicals.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Flag className="w-4 h-4 text-blue-500" />
                Selecionar Itens Não-Químicos para esta Produção
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Marque os itens (embalagem, rótulo, tampa, etc.) que serão utilizados nesta produção. A quantidade será calculada com base nas unidades.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {nonChemicals.map((insumo) => {
                  const effectiveInfo = getEffectivePrice[insumo.id];
                  const price = effectiveInfo ? effectiveInfo.price : insumo.valorUnitario;
                  const variantName = effectiveInfo?.variantName;
                  const priceChanged = Math.abs(price - insumo.valorUnitario) > 0.001;
                  return (
                    <label
                      key={insumo.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        selectedNonChemicals[insumo.id]
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                          : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!selectedNonChemicals[insumo.id]}
                        onChange={() => toggleNonChemical(insumo.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {insumo.nome}
                          {variantName && (
                            <span className="ml-1 text-xs font-semibold text-indigo-500">({variantName})</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {insumo.quantidade} {insumo.unidade}/un · R$ {price.toFixed(2)}/{insumo.unidade}
                          {priceChanged && (
                            <span className="ml-1 text-green-600 dark:text-green-400 font-semibold">
                              (era R$ {insumo.valorUnitario.toFixed(2)})
                            </span>
                          )}
                        </p>
                      </div>
                      {selectedNonChemicals[insumo.id] && (
                        <div className="text-right whitespace-nowrap">
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 block">
                            {Math.round(quantidade * insumo.quantidade)} {insumo.unidade}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            R$ {(Math.round(quantidade * insumo.quantidade) * price).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Insumos Calculados</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {quantidade} un de {embalagemVolume}L = {totalVolume}L total · Fator químicos: {fatorQuimico.toFixed(2)}x
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500">R$ {custoUnitario.toFixed(2)}/un</p>
                </div>
              </div>
            </div>

            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Insumo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Qtd Base</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Qtd Calculada</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {chemicals.length > 0 && (
                  <tr className="bg-amber-50/30 dark:bg-amber-900/5">
                    <td colSpan={4} className="px-4 py-2">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <FlaskConical className="w-3 h-3" /> Químicos (fator {fatorQuimico.toFixed(2)}x)
                      </span>
                    </td>
                  </tr>
                )}
                {chemicals.map((insumo) => {
                  const qtdAjustada = getQuantidadeAjustada(insumo);
                  const total = qtdAjustada * insumo.valorUnitario;
                  const wasEdited = insumosAjustados[insumo.id] !== undefined;
                  return (
                    <tr key={insumo.id} className={wasEdited ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-amber-50/50 dark:bg-amber-900/10'}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FlaskConical className="w-4 h-4 text-amber-500" />
                          <span className="text-sm text-gray-900 dark:text-white">{insumo.nome}</span>
                          {wasEdited && <span className="px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded">editado</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{insumo.quantidade.toFixed(2)} {insumo.unidade}</td>
                      <td className="px-4 py-3">
                        <input type="text" value={getPropInputValue(insumo)} onFocus={() => handlePropInputFocus(insumo.id, insumo)} onChange={(e) => handlePropInputChange(insumo.id, e.target.value, true)} onBlur={() => handlePropInputBlur(insumo.id, true)} className="w-24 px-2 py-1 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white font-medium" />
                        <span className="ml-1 text-xs text-gray-500">{insumo.unidade}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right text-gray-900 dark:text-white">R$ {total.toFixed(2)}</td>
                    </tr>
                  );
                })}
                {nonChemicals.filter(i => selectedNonChemicals[i.id]).length > 0 && (
                  <tr className="bg-blue-50/30 dark:bg-blue-900/5">
                    <td colSpan={4} className="px-4 py-2">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                        <Flag className="w-3 h-3" /> Não-Químicos ({quantidade} unidades)
                      </span>
                    </td>
                  </tr>
                )}
                {nonChemicals.filter(i => selectedNonChemicals[i.id]).map((insumo) => {
                  const qtdAjustada = getQuantidadeAjustada(insumo);
                  const effectiveInfo = getEffectivePrice[insumo.id];
                  const price = effectiveInfo ? effectiveInfo.price : insumo.valorUnitario;
                  const total = qtdAjustada * price;
                  const wasEdited = insumosAjustados[insumo.id] !== undefined;
                  return (
                    <tr key={insumo.id} className={wasEdited ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-50/50 dark:bg-gray-700/30'}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Flag className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-900 dark:text-white">{insumo.nome}</span>
                          {effectiveInfo?.variantName && (
                            <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs rounded font-medium">{effectiveInfo.variantName}</span>
                          )}
                          {wasEdited && <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded">editado</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{insumo.quantidade} {insumo.unidade}/un · R$ {price.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <input type="text" value={getPropInputValue(insumo)} onFocus={() => handlePropInputFocus(insumo.id, insumo)} onChange={(e) => handlePropInputChange(insumo.id, e.target.value, false)} onBlur={() => handlePropInputBlur(insumo.id, false)} className="w-24 px-2 py-1 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white font-medium" />
                        <span className="ml-1 text-xs text-gray-500">{insumo.unidade}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right text-gray-900 dark:text-white">R$ {total.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              {hasChanges && (
                <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  Alterações não salvas na fórmula original
                </span>
              )}
              <div className="flex gap-3 ml-auto">
                {hasChanges && onUpdateFormula && (
                  <button onClick={handleSaveToOriginal} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors">
                    <Save className="w-4 h-4" />
                    Salvar na Original
                  </button>
                )}
              </div>
            </div>

            {selectedFormula.historico && selectedFormula.historico.length > 0 && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Histórico de Alterações</h4>
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
        </>
      )}
    </div>
  );
}
