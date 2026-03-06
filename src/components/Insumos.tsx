import { useState } from 'react';
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
  Package,
  Flag,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Insumo, InsumoVariante } from '../types';
import { Modal } from './Modal';
import { dataService } from '../lib/dataService';
import { Input } from './ui/Input';
import { CurrencyInput } from './ui/CurrencyInput';
import { Select } from './ui/Select';
import { InsumoMovimentacaoTab } from './InsumoMovimentacaoTab';

// Props interface - recebe dados do App.tsx
interface InsumosProps {
  insumos: Insumo[];
  setInsumos: React.Dispatch<React.SetStateAction<Insumo[]>>;
  canAdd?: boolean;
}

type ViewMode = 'list' | 'grid';
type SortMode = 'az' | 'za' | 'asc' | 'desc';

export function Insumos({ insumos, setInsumos, canAdd = true }: InsumosProps) {
  // Estados locais apenas para UI
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortMode, setSortMode] = useState<SortMode>('az');
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [insumoToDelete, setInsumoToDelete] = useState<string | null>(null);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [activeTab, setActiveTab] = useState<'geral' | 'tecnico' | 'movimentacao'>('geral');
  const [duplicateNameError, setDuplicateNameError] = useState(false);

  // Form state
  const [form, setForm] = useState<Partial<Insumo>>({
    nome: '',
    apelido: '',
    codigo: '',
    unidade: 'kg',
    valorUnitario: 0,
    fornecedor: '',
    estoque: 0,
    estoqueMinimo: 0,
    validade: null,
    quimico: true,
    variantes: [],
    validadeIndeterminada: false,
    pesoEspecifico: '',
    ph: '',
    temperatura: '',
    viscosidade: '',
    solubilidade: '',
    risco: '',
  });
  const [hasVariants, setHasVariants] = useState(false);
  const [newVariant, setNewVariant] = useState<Partial<InsumoVariante>>({ nome: '', codigo: '', valorUnitario: 0 });

  const getValidadeStatus = (validade: string | null) => {
    if (!validade) return { color: 'bg-gray-900 dark:bg-gray-100', label: 'Indeterminado' };
    
    const hoje = new Date();
    const dataValidade = new Date(validade);
    const diffDays = Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { color: 'bg-purple-500', label: 'Vencido' };
    if (diffDays <= 60) return { color: 'bg-red-500', label: 'Próximo do vencimento' };
    return { color: 'bg-green-500', label: 'Dentro do prazo' };
  };

  const filteredInsumos = insumos
    .filter(i => 
      i.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.apelido && i.apelido.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortMode) {
        case 'az': return a.nome.localeCompare(b.nome);
        case 'za': return b.nome.localeCompare(a.nome);
        case 'asc': return a.valorUnitario - b.valorUnitario;
        case 'desc': return b.valorUnitario - a.valorUnitario;
        default: return 0;
      }
    });

  const handleOpenNew = () => {
    if (!canAdd) {
      alert('Limite de insumos atingido para o seu plano.');
      return;
    }
    setEditingInsumo(null);
    setForm({
      nome: '',
      apelido: '',
      codigo: '',
      unidade: 'kg',
      valorUnitario: 0,
      fornecedor: '',
      estoque: 0,
      estoqueMinimo: 0,
      validade: null,
      quimico: true,
      variantes: [],
    });
    setHasVariants(false);
    setDuplicateNameError(false);
    setShowModal(true);
  };

  const handleOpenEdit = (insumo: Insumo) => {
    setEditingInsumo(insumo);
    setForm({ ...insumo });
    setHasVariants((insumo.variantes?.length ?? 0) > 0);
    setDuplicateNameError(false);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.nome || !form.unidade) return;

    const isDuplicateName = insumos.some(
      (i) => i.nome.toLowerCase() === form.nome?.toLowerCase() && i.id !== editingInsumo?.id
    );

    if (isDuplicateName) {
      setDuplicateNameError(true);
      setTimeout(() => setDuplicateNameError(false), 3000);
      return;
    }

    if (editingInsumo) {
      setInsumos(prev => prev.map(i => i.id === editingInsumo.id ? { ...i, ...form, unidade: form.unidade?.toUpperCase() } as Insumo : i));
    } else {
      const newInsumo: Insumo = {
        ...form as Insumo,
        unidade: form.unidade?.toUpperCase() || 'KG',
        id: Date.now().toString(),
        codigo: form.codigo || `INS-${Date.now()}`,
      };
      setInsumos(prev => [...prev, newInsumo]);
    }
    setShowModal(false);
  };

  const handleDuplicate = (insumo: Insumo) => {
    const duplicate: Insumo = {
      ...insumo,
      id: Date.now().toString(),
      nome: `${insumo.nome} (Cópia)`,
      codigo: `${insumo.codigo}-CPY`,
    };
    setInsumos(prev => [...prev, duplicate]);
  };

  const handleDelete = (id: string) => {
    if (!id) {
      console.error('Tentativa de excluir insumo sem ID');
      return;
    }
    setInsumoToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!insumoToDelete) return;
    
    const id = insumoToDelete;
    console.log('🗑️ Iniciando exclusão do insumo:', id);
    
    // 1. Atualiza o estado local IMEDIATAMENTE
    setInsumos(prev => {
      const newInsumos = prev.filter(i => i.id !== id);
      console.log(`📊 Estado local atualizado: ${prev.length} -> ${newInsumos.length} itens`);
      return newInsumos;
    });
    
    // 2. Remove do banco de dados/localStorage através do serviço
    try {
      await dataService.insumos.delete(id);
      console.log('✅ Insumo removido com sucesso do banco de dados');
    } catch (error) {
      console.error('❌ Erro ao deletar insumo do banco:', error);
    } finally {
      setShowDeleteConfirm(false);
      setInsumoToDelete(null);
    }
  };

  const handleAddVariant = () => {
    if (!newVariant.nome) return;
    
    const variant: InsumoVariante = {
      id: Date.now().toString(),
      nome: newVariant.nome || '',
      codigo: newVariant.codigo || `VAR-${Date.now()}`,
      valorUnitario: newVariant.valorUnitario || 0,
    };
    
    setForm(prev => ({
      ...prev,
      variantes: [...(prev.variantes || []), variant],
    }));
    setNewVariant({ nome: '', codigo: '', valorUnitario: 0 });
  };

  const handleRemoveVariant = (id: string) => {
    setForm(prev => ({
      ...prev,
      variantes: prev.variantes?.filter(v => v.id !== id) || [],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Insumos</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie os insumos da produção</p>
        </div>
        <button
          onClick={handleOpenNew}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            canAdd 
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20' 
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
          title={!canAdd ? 'Limite de insumos atingido' : ''}
        >
          <Plus className="w-5 h-5" />
          Novo Insumo
        </button>
      </div>

      {/* Filters & View */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar insumos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* View & Sort Buttons */}
        <div className="flex items-center gap-2">
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

          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setSortMode('az')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${sortMode === 'az' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
            >
              <ArrowUpAZ className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setSortMode('za')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${sortMode === 'za' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
            >
              <ArrowDownAZ className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-x-6 gap-y-2 text-sm flex-wrap">
        <span className="text-gray-500 dark:text-gray-400">Validade:</span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">No prazo</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600 dark:text-gray-400">Próximo (2 meses)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-gray-600 dark:text-gray-400">Vencido</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-900 dark:bg-gray-100" />
          <span className="text-gray-600 dark:text-gray-400">Indeterminado</span>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {filteredInsumos.length} insumo(s) encontrado(s)
      </p>

      {/* List View */}
      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] lg:min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Validade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Nome / Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Unidade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Fornecedor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Estoque</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredInsumos.map((insumo) => {
                const validadeStatus = getValidadeStatus(insumo.validade);
                return (
                  <tr key={insumo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <span 
                        className={`w-3 h-3 rounded-full inline-block ${validadeStatus.color}`}
                        title={validadeStatus.label}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{insumo.nome}</p>
                        <p className="text-xs text-gray-500 italic">{insumo.codigo}</p>
                        {insumo.variantes && insumo.variantes.length > 0 && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                            {insumo.variantes.length} variante(s)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{insumo.unidade.toUpperCase()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {insumo.variantes && insumo.variantes.length > 0 ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-green-500">▲</span>
                            <span className="text-green-600 dark:text-green-400">
                              R$ {Math.min(...insumo.variantes.map(v => v.valorUnitario)).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-blue-500">▼</span>
                            <span className="text-blue-600 dark:text-blue-400">
                              R$ {Math.max(...insumo.variantes.map(v => v.valorUnitario)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        `R$ ${insumo.valorUnitario.toFixed(2)}`
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{insumo.fornecedor}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{insumo.estoque}</td>
                    <td className="px-4 py-3 text-center">
                      {insumo.quimico ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30" title="Químico">
                          <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30" title="Não-Químico">
                          <Flag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setSelectedInsumo(insumo); setShowViewModal(true); }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(insumo)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(insumo)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4 text-purple-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(insumo.id)}
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
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredInsumos.map((insumo) => {
            const validadeStatus = getValidadeStatus(insumo.validade);
            return (
              <div
                key={insumo.id}
                className="relative bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden"
              >
                {/* Watermark */}
                <Package className="absolute -right-4 -bottom-4 w-24 h-24 text-gray-100 dark:text-gray-700/30 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
                
                <div className="relative z-10 flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${validadeStatus.color}`} />
                    {insumo.quimico ? (
                      <FlaskConical className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Flag className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  {insumo.variantes && insumo.variantes.length > 0 ? (
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-xs text-green-500">▲</span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          R$ {Math.min(...insumo.variantes.map(v => v.valorUnitario)).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-xs text-blue-500">▼</span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          R$ {Math.max(...insumo.variantes.map(v => v.valorUnitario)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      R$ {insumo.valorUnitario.toFixed(2)}
                    </span>
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{insumo.nome}</h3>
                <p className="text-xs text-gray-500 italic mb-2">{insumo.codigo}</p>
                
                {insumo.variantes && insumo.variantes.length > 0 && (
                  <span className="inline-block text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full mb-3">
                    {insumo.variantes.length} variante(s)
                  </span>
                )}
                
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>{insumo.unidade.toUpperCase()}</span>
                  <span>Estoque: {insumo.estoque}</span>
                </div>

                <div className="flex items-center justify-end gap-1 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => { setSelectedInsumo(insumo); setShowViewModal(true); }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(insumo)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-blue-500" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(insumo)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4 text-purple-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(insumo.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalhes do Insumo"
        size="md"
      >
        {selectedInsumo && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Nome</label>
                <p className="font-medium text-gray-900 dark:text-white">{selectedInsumo.nome}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Código</label>
                <p className="font-medium text-gray-900 dark:text-white">{selectedInsumo.codigo}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Unidade</label>
                <p className="font-medium text-gray-900 dark:text-white">{selectedInsumo.unidade}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Valor Unitário</label>
                <p className="font-medium text-gray-900 dark:text-white">R$ {selectedInsumo.valorUnitario.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Fornecedor</label>
                <p className="font-medium text-gray-900 dark:text-white">{selectedInsumo.fornecedor}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Tipo</label>
                <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  {selectedInsumo.quimico ? (
                    <>
                      <FlaskConical className="w-4 h-4 text-amber-500" />
                      Químico
                    </>
                  ) : (
                    <>
                      <Flag className="w-4 h-4 text-blue-500" />
                      Não-Químico
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Informações Técnicas */}
            {(selectedInsumo.pesoEspecifico || selectedInsumo.ph || selectedInsumo.temperatura || selectedInsumo.viscosidade || selectedInsumo.solubilidade || selectedInsumo.risco) && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Informações Técnicas</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedInsumo.pesoEspecifico && (
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Peso Específico</label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedInsumo.pesoEspecifico}</p>
                    </div>
                  )}
                  {selectedInsumo.ph && (
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">pH</label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedInsumo.ph}</p>
                    </div>
                  )}
                  {selectedInsumo.temperatura && (
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Temperatura</label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedInsumo.temperatura}</p>
                    </div>
                  )}
                  {selectedInsumo.viscosidade && (
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Viscosidade</label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedInsumo.viscosidade}</p>
                    </div>
                  )}
                  {selectedInsumo.solubilidade && (
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 dark:text-gray-400">Solubilidade</label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedInsumo.solubilidade}</p>
                    </div>
                  )}
                  {selectedInsumo.risco && (
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 dark:text-gray-400">Risco</label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedInsumo.risco}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedInsumo.variantes && selectedInsumo.variantes.length > 0 && (
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">Variantes</label>
                <div className="space-y-2">
                  {selectedInsumo.variantes.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <span className="font-medium text-gray-900 dark:text-white">{v.nome}</span>
                      <span className="text-sm text-gray-500">{v.codigo}</span>
                      <span className="font-medium text-gray-900 dark:text-white">R$ {v.valorUnitario.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Tem certeza que deseja excluir este insumo permanentemente? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
            >
              Excluir Agora
            </button>
          </div>
        </div>
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingInsumo ? 'Editar Insumo' : 'Novo Insumo'}
        size="lg"
      >
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('geral')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'geral'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <motion.div
                animate={activeTab === 'geral' ? { 
                  scale: [1, 1.2, 1],
                  rotate: [0, -10, 10, 0]
                } : { 
                  scale: 1, 
                  rotate: 0 
                }}
                transition={activeTab === 'geral' ? { 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                } : { 
                  duration: 0.3 
                }}
              >
                <Package className="w-4 h-4" />
              </motion.div>
              Geral
            </button>
            <button
              onClick={() => setActiveTab('tecnico')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'tecnico'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <motion.div
                animate={activeTab === 'tecnico' ? { 
                  scale: [1, 1.2, 1],
                  rotate: [0, -10, 10, 0]
                } : { 
                  scale: 1, 
                  rotate: 0 
                }}
                transition={activeTab === 'tecnico' ? { 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                } : { 
                  duration: 0.3 
                }}
              >
                <FlaskConical className="w-4 h-4" />
              </motion.div>
              Informações Técnicas
            </button>
            <button
              onClick={() => setActiveTab('movimentacao')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'movimentacao'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <motion.div
                animate={activeTab === 'movimentacao' ? { 
                  scale: [1, 1.2, 1],
                  rotate: [0, -10, 10, 0]
                } : { 
                  scale: 1, 
                  rotate: 0 
                }}
                transition={activeTab === 'movimentacao' ? { 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                } : { 
                  duration: 0.3 
                }}
              >
                <List className="w-4 h-4" />
              </motion.div>
              Movimentação de Estoque
            </button>
          </div>

          {activeTab === 'geral' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Input
                    label="Nome *"
                    type="text"
                    value={form.nome || ''}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  />
                  {duplicateNameError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-500 flex items-center gap-1"
                    >
                      <motion.span
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 bg-red-500 rounded-full inline-block"
                      />
                      Já existe um insumo cadastrado com esse nome
                    </motion.p>
                  )}
                </div>
                <Input
                  label="Código"
                  type="text"
                  value={form.codigo || ''}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                />
                <Input
                  label="Apelido"
                  type="text"
                  value={form.apelido || ''}
                  onChange={(e) => setForm({ ...form, apelido: e.target.value })}
                />
                <Select
                  label="Unidade *"
                  value={form.unidade || 'kg'}
                  onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                  options={[
                    { value: 'KG', label: 'KG' },
                    { value: 'GR', label: 'GR' },
                    { value: 'LT', label: 'LT' },
                    { value: 'ML', label: 'ML' },
                    { value: 'UN', label: 'UN' },
                    { value: 'PC', label: 'PC' },
                  ]}
                />
                <CurrencyInput
                  label="Valor Unitário"
                  value={form.valorUnitario || 0}
                  onChange={(val) => setForm({ ...form, valorUnitario: val })}
                />
                <Input
                  label="Fornecedor"
                  type="text"
                  value={form.fornecedor || ''}
                  onChange={(e) => setForm({ ...form, fornecedor: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Validade
                  </label>
                  <div className="space-y-3">
                    {/* Toggle Validade Indeterminada */}
                    <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Validade Indeterminada</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Produto não possui data de validade</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (form.validadeIndeterminada) {
                            setForm({ ...form, validadeIndeterminada: false });
                          } else {
                            setForm({ ...form, validade: null, validadeIndeterminada: true });
                          }
                        }}
                        className={`w-12 h-7 rounded-full transition-colors ${
                          form.validadeIndeterminada ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span className={`block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                          form.validadeIndeterminada ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    
                    {/* Campo de Data - visível apenas se não for indeterminada */}
                    {!form.validadeIndeterminada && (
                      <Input
                        type="date"
                        value={form.validade || ''}
                        onChange={(e) => setForm({ ...form, validade: e.target.value || null })}
                        placeholder="Selecione a data"
                      />
                    )}
                  </div>
                </div>
                <CurrencyInput
                  label="Estoque Atual"
                  value={form.estoque || 0}
                  onChange={(val) => setForm({ ...form, estoque: val })}
                />
                <CurrencyInput
                  label="Estoque Mínimo"
                  value={form.estoqueMinimo || 0}
                  onChange={(val) => setForm({ ...form, estoqueMinimo: val })}
                />
              </div>

          {/* Químico Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Produto Químico *</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Químicos são calculados em porcentagem nas fórmulas
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, quimico: !form.quimico })}
              className={`w-14 h-8 rounded-full transition-colors ${
                form.quimico ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`block w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                form.quimico ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Variantes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Tem Variantes?</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ex: Essência com múltiplos aromas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHasVariants(!hasVariants)}
                className={`w-14 h-8 rounded-full transition-colors ${
                  hasVariants ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`block w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                  hasVariants ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {hasVariants && (
              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <h4 className="font-medium text-gray-900 dark:text-white">Variantes</h4>
                
                {/* List of variants */}
                {form.variantes && form.variantes.length > 0 && (
                  <div className="space-y-2">
                    {form.variantes.map((v) => (
                      <div key={v.id} className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-xl">
                        <span className="flex-1 font-medium text-gray-900 dark:text-white">{v.nome}</span>
                        <span className="text-sm text-gray-500">{v.codigo}</span>
                        <span className="font-medium text-gray-900 dark:text-white">R$ {v.valorUnitario.toFixed(2)}</span>
                        <button
                          onClick={() => handleRemoveVariant(v.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new variant */}
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Nome"
                    value={newVariant.nome || ''}
                    onChange={(e) => setNewVariant({ ...newVariant, nome: e.target.value })}
                    className="px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Código"
                    value={newVariant.codigo || ''}
                    onChange={(e) => setNewVariant({ ...newVariant, codigo: e.target.value })}
                    className="px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm"
                  />
                  <CurrencyInput
                    placeholder="Valor"
                    value={newVariant.valorUnitario || 0}
                    onChange={(val) => setNewVariant({ ...newVariant, valorUnitario: val })}
                    className="text-sm"
                  />
                  <button
                    onClick={handleAddVariant}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
          ) : activeTab === 'tecnico' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Peso Específico"
                  type="text"
                  value={form.pesoEspecifico || ''}
                  onChange={(e) => setForm({ ...form, pesoEspecifico: e.target.value })}
                  placeholder="Ex: 0.8 g/cm³"
                />
                <Input
                  label="pH"
                  type="text"
                  value={form.ph || ''}
                  onChange={(e) => setForm({ ...form, ph: e.target.value })}
                  placeholder="Ex: 7.0"
                />
                <Input
                  label="Temperatura"
                  type="text"
                  value={form.temperatura || ''}
                  onChange={(e) => setForm({ ...form, temperatura: e.target.value })}
                  placeholder="Ex: 20°C"
                />
                <Input
                  label="Viscosidade"
                  type="text"
                  value={form.viscosidade || ''}
                  onChange={(e) => setForm({ ...form, viscosidade: e.target.value })}
                  placeholder="Ex: 2.5 cP"
                />
                <div className="col-span-2">
                  <Input
                    label="Solubilidade"
                    type="text"
                    value={form.solubilidade || ''}
                    onChange={(e) => setForm({ ...form, solubilidade: e.target.value })}
                    placeholder="Ex: Totalmente solúvel em água"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    label="Risco"
                    type="text"
                    value={form.risco || ''}
                    onChange={(e) => setForm({ ...form, risco: e.target.value })}
                    placeholder="Ex: R36/37/38 - Irritante"
                  />
                </div>
              </div>
            </div>
          ) : activeTab === 'movimentacao' ? (
            <InsumoMovimentacaoTab 
              insumo={form} 
              onUpdateInsumo={(updatedInsumo) => setForm(prev => ({ ...prev, ...updatedInsumo }))} 
            />
          ) : null}

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
              disabled={!form.nome || !form.unidade}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl transition-colors"
            >
              {editingInsumo ? 'Salvar Alterações' : 'Criar Insumo'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
