import { useState } from 'react';
import {
  Search,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Package,
  AlertTriangle,
  Eye,

} from 'lucide-react';
import { Pedido } from './Vendas';
import { formulasData } from '../data/mockData';
import { Modal } from './Modal';




export interface OrdemProducao {
  id: string;
  numero: string;
  pedidoId: string;
  pedidoNumero: string;
  cliente: string;
  formulaId: string;
  formulaNome: string;
  quantidade: number;
  status: 'aguardando' | 'em_producao' | 'pausado' | 'concluido' | 'cancelado';
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  lote: string;
  observacoes: string;
  createdAt: string;
  updatedAt: string;
  iniciadoEm?: string;
  concluidoEm?: string;
}

interface ProducaoProps {
  ordensProducao: OrdemProducao[];
  setOrdensProducao: React.Dispatch<React.SetStateAction<OrdemProducao[]>>;
  pedidos: Pedido[];
  setPedidos: React.Dispatch<React.SetStateAction<Pedido[]>>;
  onConcluirProducao: (ordem: OrdemProducao) => void;
  companyName?: string;
  companyLogo?: string;
}

export function Producao({ ordensProducao, setOrdensProducao, pedidos: _pedidos, setPedidos, onConcluirProducao }: ProducaoProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedOrdem, setSelectedOrdem] = useState<OrdemProducao | null>(null);

  const getStatusColor = (status: OrdemProducao['status']) => {
    switch (status) {
      case 'aguardando': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      case 'em_producao': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'pausado': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
      case 'concluido': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'cancelado': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: OrdemProducao['status']) => {
    switch (status) {
      case 'aguardando': return 'Aguardando';
      case 'em_producao': return 'Em Produção';
      case 'pausado': return 'Pausado';
      case 'concluido': return 'Concluído';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusIcon = (status: OrdemProducao['status']) => {
    switch (status) {
      case 'aguardando': return <Clock className="w-4 h-4" />;
      case 'em_producao': return <Play className="w-4 h-4" />;
      case 'pausado': return <Pause className="w-4 h-4" />;
      case 'concluido': return <CheckCircle className="w-4 h-4" />;
      case 'cancelado': return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getPrioridadeColor = (prioridade: OrdemProducao['prioridade']) => {
    switch (prioridade) {
      case 'baixa': return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
      case 'normal': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'alta': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
      case 'urgente': return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };



  const filteredOrdens = ordensProducao
    .filter(o => filterStatus === 'todos' || o.status === filterStatus)
    .filter(o =>
      o.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.formulaNome.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Prioridade de ordenação: urgente > alta > normal > baixa
      const prioridadeOrder = { urgente: 4, alta: 3, normal: 2, baixa: 1 };
      const prioridadeDiff = prioridadeOrder[b.prioridade] - prioridadeOrder[a.prioridade];
      if (prioridadeDiff !== 0) return prioridadeDiff;
      // Depois por data
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleIniciarProducao = (ordem: OrdemProducao) => {
    const now = new Date().toISOString();
    setOrdensProducao(prev => prev.map(o =>
      o.id === ordem.id
        ? { ...o, status: 'em_producao', iniciadoEm: now, updatedAt: now }
        : o
    ));
  };

  const handlePausarProducao = (ordem: OrdemProducao) => {
    const now = new Date().toISOString();
    setOrdensProducao(prev => prev.map(o =>
      o.id === ordem.id
        ? { ...o, status: 'pausado', updatedAt: now }
        : o
    ));
  };

  const handleConcluirProducao = (ordem: OrdemProducao) => {
    if (!confirm(`Confirmar conclusão da produção de ${ordem.quantidade} unidade(s) de "${ordem.formulaNome}"?`)) return;

    const now = new Date().toISOString();
    const ordemConcluida = {
      ...ordem,
      status: 'concluido' as const,
      concluidoEm: now,
      updatedAt: now,
    };

    setOrdensProducao(prev => {
      const newOrdens = prev.map(o => o.id === ordem.id ? ordemConcluida : o);
      
      // Check if all orders for this pedido are completed
      const allOrdersForPedido = newOrdens.filter(o => o.pedidoId === ordem.pedidoId);
      const allCompleted = allOrdersForPedido.every(o => o.status === 'concluido');
      
      if (allCompleted) {
        setPedidos(pedidosPrev => pedidosPrev.map(p =>
          p.id === ordem.pedidoId
            ? { ...p, status: 'concluido', updatedAt: now, observacoes: `${p.observacoes}\n[SISTEMA] Produção finalizada e venda concluída em ${new Date().toLocaleDateString('pt-BR')}.` }
            : p
        ));
      }
      
      return newOrdens;
    });

    // Envia para estoque
    onConcluirProducao(ordemConcluida);

    alert(`Produção concluída! ${ordem.quantidade} unidade(s) de "${ordem.formulaNome}" foram enviadas para o estoque.`);
  };

  const statusFilters = [
    { id: 'todos', label: 'Todos' },
    { id: 'aguardando', label: 'Aguardando' },
    { id: 'em_producao', label: 'Em Produção' },
    { id: 'pausado', label: 'Pausado' },
    { id: 'concluido', label: 'Concluído' },
  ];

  // Estatísticas
  const stats = {
    aguardando: ordensProducao.filter(o => o.status === 'aguardando').length,
    emProducao: ordensProducao.filter(o => o.status === 'em_producao').length,
    concluidas: ordensProducao.filter(o => o.status === 'concluido').length,
    total: ordensProducao.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Produção</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie as ordens de produção</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.aguardando}</p>
              <p className="text-xs text-amber-600 dark:text-amber-500">Aguardando</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.emProducao}</p>
              <p className="text-xs text-blue-600 dark:text-blue-500">Em Produção</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.concluidas}</p>
              <p className="text-xs text-green-600 dark:text-green-500">Concluídas</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.total}</p>
              <p className="text-xs text-purple-600 dark:text-purple-500">Total de Ordens</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número, cliente ou produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setFilterStatus(filter.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filterStatus === filter.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredOrdens.map((ordem) => (
          <div
            key={ordem.id}
            className={`bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-l-4 ${
              ordem.prioridade === 'urgente' ? 'border-l-red-500' :
              ordem.prioridade === 'alta' ? 'border-l-orange-500' :
              ordem.prioridade === 'normal' ? 'border-l-blue-500' :
              'border-l-gray-300 dark:border-l-gray-600'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-gray-900 dark:text-white">{ordem.numero}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPrioridadeColor(ordem.prioridade)}`}>
                    {ordem.prioridade.toUpperCase()}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(ordem.status)}`}>
                    {getStatusIcon(ordem.status)}
                    {getStatusLabel(ordem.status)}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Produto</p>
                    <p className="font-medium text-gray-900 dark:text-white">{ordem.formulaNome}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Quantidade</p>
                    <p className="font-medium text-gray-900 dark:text-white">{ordem.quantidade} un</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Cliente</p>
                    <p className="font-medium text-gray-900 dark:text-white">{ordem.cliente}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Lote</p>
                    <p className="font-medium text-gray-900 dark:text-white">{ordem.lote}</p>
                  </div>
                </div>

                {ordem.iniciadoEm && (
                  <p className="text-xs text-gray-400 mt-2">
                    Iniciado em: {new Date(ordem.iniciadoEm).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setSelectedOrdem(ordem); setShowViewModal(true); }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Visualizar"
                >
                  <Eye className="w-5 h-5 text-gray-500" />
                </button>


                {ordem.status === 'aguardando' && (
                  <button
                    onClick={() => handleIniciarProducao(ordem)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Iniciar
                  </button>
                )}

                {ordem.status === 'em_producao' && (
                  <>
                    <button
                      onClick={() => handlePausarProducao(ordem)}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      <Pause className="w-4 h-4" />
                      Pausar
                    </button>
                    <button
                      onClick={() => handleConcluirProducao(ordem)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Concluir
                    </button>
                  </>
                )}

                {ordem.status === 'pausado' && (
                  <button
                    onClick={() => handleIniciarProducao(ordem)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Retomar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredOrdens.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Nenhuma ordem de produção encontrada</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              As ordens aparecerão aqui quando uma venda for confirmada como paga
            </p>
          </div>
        )}
      </div>

      {/* Modal: View */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={`Ordem de Produção ${selectedOrdem?.numero || ''}`}
        size="lg"
      >
        {selectedOrdem && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(selectedOrdem.status)}`}>
                  {getStatusIcon(selectedOrdem.status)}
                  {getStatusLabel(selectedOrdem.status)}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPrioridadeColor(selectedOrdem.prioridade)}`}>
                  {selectedOrdem.prioridade.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Lote: <span className="font-mono font-medium">{selectedOrdem.lote}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Produto</p>
                <p className="font-semibold text-blue-800 dark:text-blue-300">{selectedOrdem.formulaNome}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-xs text-green-600 dark:text-green-400 mb-1">Quantidade</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{selectedOrdem.quantidade} un</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Cliente</label>
                <p className="font-medium text-gray-900 dark:text-white">{selectedOrdem.cliente}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Pedido</label>
                <p className="font-medium text-gray-900 dark:text-white">{selectedOrdem.pedidoNumero}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Criado em</label>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(selectedOrdem.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              {selectedOrdem.iniciadoEm && (
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Iniciado em</label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(selectedOrdem.iniciadoEm).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
              {selectedOrdem.concluidoEm && (
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Concluído em</label>
                  <p className="font-medium text-green-600 dark:text-green-400">
                    {new Date(selectedOrdem.concluidoEm).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
            </div>

            {/* Insumos da fórmula */}
            {(() => {
              const formula = formulasData.find(f => f.id === selectedOrdem.formulaId);
              if (!formula) return null;

              return (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Composição para {selectedOrdem.quantidade} unidade(s)
                  </h4>
                  <div className="space-y-2">
                    {(formula.insumos || []).map((insumo) => {
                      const qtdTotal = insumo.quantidade * (selectedOrdem.quantidade / formula.rendimento);
                      return (
                        <div key={insumo.id} className={`flex items-center justify-between p-3 rounded-xl ${
                          insumo.quimico ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-gray-700/50'
                        }`}>
                          <span className="text-gray-900 dark:text-white">{insumo.nome}</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {insumo.quimico ? qtdTotal.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : Math.round(qtdTotal)} {insumo.unidade}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {selectedOrdem.observacoes && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Observações</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrdem.observacoes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>


    </div>
  );
}
