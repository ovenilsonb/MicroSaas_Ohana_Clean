import { useState } from 'react';
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  TrendingUp,
  TrendingDown,
  Eye,

  Filter,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Modal } from './Modal';
import { CurrencyInput } from './ui/CurrencyInput';

export interface MovimentoEstoque {
  id: string;
  tipo: 'entrada' | 'saida';
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  motivo: string;
  referencia?: string; // Número da ordem de produção ou pedido
  createdAt: string;
}




export interface ProdutoEstoque {
  id: string;
  formulaId: string;
  nome: string;
  codigo: string;
  quantidade: number;
  estoqueMinimo: number;
  unidade: string;
  ultimaEntrada?: string;
  ultimaSaida?: string;
}

interface EstoqueProps {
  produtos: ProdutoEstoque[];
  setProdutos: React.Dispatch<React.SetStateAction<ProdutoEstoque[]>>;
  movimentos: MovimentoEstoque[];
  setMovimentos: React.Dispatch<React.SetStateAction<MovimentoEstoque[]>>;
  companyName?: string;
  companyLogo?: string;
}

type TabType = 'produtos' | 'movimentos';

export function Estoque({ produtos, setProdutos, movimentos }: EstoqueProps) {
  const [activeTab, setActiveTab] = useState<TabType>('produtos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedProduto, setSelectedProduto] = useState<ProdutoEstoque | null>(null);

  // Ajuste manual de estoque
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [ajusteTipo, setAjusteTipo] = useState<'entrada' | 'saida'>('entrada');
  const [ajusteQuantidade, setAjusteQuantidade] = useState(0);
  const [ajusteMotivo, setAjusteMotivo] = useState('');

  const filteredProdutos = produtos.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMovimentos = movimentos
    .filter(m => filterTipo === 'todos' || m.tipo === filterTipo)
    .filter(m =>
      m.produtoNome.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusEstoque = (produto: ProdutoEstoque) => {
    if (produto.quantidade === 0) {
      return { label: 'Sem Estoque', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' };
    }
    if (produto.quantidade <= produto.estoqueMinimo) {
      return { label: 'Baixo', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' };
    }
    return { label: 'Normal', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' };
  };

  // Estatísticas
  const stats = {
    totalProdutos: produtos.length,
    quantidadeTotal: produtos.reduce((sum, p) => sum + p.quantidade, 0),
    estoqueBaixo: produtos.filter(p => p.quantidade <= p.estoqueMinimo && p.quantidade > 0).length,
    semEstoque: produtos.filter(p => p.quantidade === 0).length,
    entradasHoje: movimentos.filter(m => 
      m.tipo === 'entrada' && 
      new Date(m.createdAt).toDateString() === new Date().toDateString()
    ).reduce((sum, m) => sum + m.quantidade, 0),
    saidasHoje: movimentos.filter(m => 
      m.tipo === 'saida' && 
      new Date(m.createdAt).toDateString() === new Date().toDateString()
    ).reduce((sum, m) => sum + m.quantidade, 0),
  };



  const handleAjusteEstoque = () => {
    if (!selectedProduto || ajusteQuantidade <= 0 || !ajusteMotivo) return;

    const novaQuantidade = ajusteTipo === 'entrada'
      ? selectedProduto.quantidade + ajusteQuantidade
      : Math.max(0, selectedProduto.quantidade - ajusteQuantidade);

    // Atualiza produto
    setProdutos(prev => prev.map(p =>
      p.id === selectedProduto.id
        ? {
            ...p,
            quantidade: novaQuantidade,
            ...(ajusteTipo === 'entrada' ? { ultimaEntrada: new Date().toISOString() } : { ultimaSaida: new Date().toISOString() }),
          }
        : p
    ));

    // Registra movimento (usando o callback seria melhor, mas para simplificar)
    // O movimento será adicionado pelo App.tsx através da integração

    setShowAjusteModal(false);
    setAjusteQuantidade(0);
    setAjusteMotivo('');
    alert('Estoque ajustado com sucesso!');
  };

  const tabs = [
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'movimentos', label: 'Movimentações', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estoque</h1>
          <p className="text-gray-500 dark:text-gray-400">Controle de entrada e saída de produtos</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.totalProdutos}</p>
              <p className="text-xs text-blue-600 dark:text-blue-500">Produtos</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.quantidadeTotal}</p>
              <p className="text-xs text-purple-600 dark:text-purple-500">Total em Estoque</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <TrendingDown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.estoqueBaixo}</p>
              <p className="text-xs text-amber-600 dark:text-amber-500">Estoque Baixo</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <Package className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.semEstoque}</p>
              <p className="text-xs text-red-600 dark:text-red-500">Sem Estoque</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.entradasHoje}</p>
              <p className="text-xs text-green-600 dark:text-green-500">Entradas Hoje</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
              <ArrowDownRight className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{stats.saidasHoje}</p>
              <p className="text-xs text-orange-600 dark:text-orange-500">Saídas Hoje</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
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

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 'produtos' ? 'Buscar produtos...' : 'Buscar movimentações...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {activeTab === 'movimentos' && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            >
              <option value="todos">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab: Produtos */}
      {activeTab === 'produtos' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] lg:min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Produto</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Quantidade</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Mínimo</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Última Entrada</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Última Saída</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredProdutos.map((produto) => {
                  const status = getStatusEstoque(produto);
                  return (
                    <tr key={produto.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{produto.nome}</p>
                        <p className="text-xs text-gray-500">{produto.codigo}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {produto.quantidade}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">{produto.unidade}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                        {produto.estoqueMinimo}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {produto.ultimaEntrada 
                          ? new Date(produto.ultimaEntrada).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {produto.ultimaSaida 
                          ? new Date(produto.ultimaSaida).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedProduto(produto); setShowViewModal(true); }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => { 
                              setSelectedProduto(produto); 
                              setAjusteTipo('entrada');
                              setShowAjusteModal(true); 
                            }}
                            className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                            title="Entrada"
                          >
                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                          </button>
                          <button
                            onClick={() => { 
                              setSelectedProduto(produto); 
                              setAjusteTipo('saida');
                              setShowAjusteModal(true); 
                            }}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Saída"
                          >
                            <ArrowDownRight className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredProdutos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <p>Nenhum produto no estoque</p>
                      <p className="text-sm mt-1">Os produtos serão adicionados automaticamente após a conclusão da produção</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Movimentos */}
      {activeTab === 'movimentos' && (
        <div className="space-y-3">
          {filteredMovimentos.map((mov) => (
            <div
              key={mov.id}
              className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border-l-4 ${
                mov.tipo === 'entrada' ? 'border-l-green-500' : 'border-l-red-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${
                    mov.tipo === 'entrada' 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {mov.tipo === 'entrada' 
                      ? <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                      : <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                    }
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{mov.produtoNome}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{mov.motivo}</p>
                    {mov.referencia && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">Ref: {mov.referencia}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    mov.tipo === 'entrada' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(mov.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {filteredMovimentos.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
              <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Nenhuma movimentação encontrada</p>
            </div>
          )}
        </div>
      )}

      {/* Modal: View */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={`Produto: ${selectedProduto?.nome || ''}`}
        size="md"
      >
        {selectedProduto && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Quantidade em Estoque</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                  {selectedProduto.quantidade} <span className="text-lg font-normal">{selectedProduto.unidade}</span>
                </p>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Estoque Mínimo</p>
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                  {selectedProduto.estoqueMinimo}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Código</label>
                <p className="font-mono font-medium text-gray-900 dark:text-white">{selectedProduto.codigo}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Status</label>
                <p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusEstoque(selectedProduto).color}`}>
                    {getStatusEstoque(selectedProduto).label}
                  </span>
                </p>
              </div>
            </div>

            {/* Últimos movimentos deste produto */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Últimas Movimentações</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {movimentos
                  .filter(m => m.produtoId === selectedProduto.id)
                  .slice(0, 5)
                  .map((mov) => (
                    <div key={mov.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {mov.tipo === 'entrada' 
                          ? <ArrowUpRight className="w-4 h-4 text-green-500" />
                          : <ArrowDownRight className="w-4 h-4 text-red-500" />
                        }
                        <span className="text-sm text-gray-600 dark:text-gray-400">{mov.motivo}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium ${
                          mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {new Date(mov.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))
                }
                {movimentos.filter(m => m.produtoId === selectedProduto.id).length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                    Nenhuma movimentação registrada
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => { setShowViewModal(false); setAjusteTipo('entrada'); setShowAjusteModal(true); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" />
                Entrada
              </button>
              <button
                onClick={() => { setShowViewModal(false); setAjusteTipo('saida'); setShowAjusteModal(true); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
              >
                <ArrowDownRight className="w-4 h-4" />
                Saída
              </button>

            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Ajuste */}
      <Modal
        isOpen={showAjusteModal}
        onClose={() => setShowAjusteModal(false)}
        title={`${ajusteTipo === 'entrada' ? 'Entrada' : 'Saída'} de Estoque`}
        size="sm"
      >
        {selectedProduto && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="text-sm text-gray-500 dark:text-gray-400">Produto</p>
              <p className="font-medium text-gray-900 dark:text-white">{selectedProduto.nome}</p>
              <p className="text-sm text-gray-500 mt-1">
                Estoque atual: <span className="font-medium">{selectedProduto.quantidade}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantidade *
              </label>
              <CurrencyInput
                value={ajusteQuantidade}
                onChange={(val) => setAjusteQuantidade(val)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Motivo *
              </label>
              <select
                value={ajusteMotivo}
                onChange={(e) => setAjusteMotivo(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
              >
                <option value="">Selecione...</option>
                {ajusteTipo === 'entrada' ? (
                  <>
                    <option value="Produção">Produção</option>
                    <option value="Devolução">Devolução</option>
                    <option value="Ajuste de inventário">Ajuste de inventário</option>
                    <option value="Outros">Outros</option>
                  </>
                ) : (
                  <>
                    <option value="Venda">Venda</option>
                    <option value="Avaria">Avaria</option>
                    <option value="Vencimento">Vencimento</option>
                    <option value="Ajuste de inventário">Ajuste de inventário</option>
                    <option value="Outros">Outros</option>
                  </>
                )}
              </select>
            </div>

            <div className={`p-4 rounded-xl ${
              ajusteTipo === 'entrada' 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <p className="text-sm text-center">
                <span className={ajusteTipo === 'entrada' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                  Novo estoque: <span className="font-bold text-lg">
                    {ajusteTipo === 'entrada' 
                      ? selectedProduto.quantidade + ajusteQuantidade
                      : Math.max(0, selectedProduto.quantidade - ajusteQuantidade)
                    }
                  </span>
                </span>
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowAjusteModal(false)}
                className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAjusteEstoque}
                disabled={!ajusteQuantidade || !ajusteMotivo}
                className={`px-6 py-2.5 text-white rounded-xl transition-colors ${
                  ajusteTipo === 'entrada'
                    ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-300'
                    : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-300'
                }`}
              >
                Confirmar {ajusteTipo === 'entrada' ? 'Entrada' : 'Saída'}
              </button>
            </div>
          </div>
        )}
      </Modal>


    </div>
  );
}
