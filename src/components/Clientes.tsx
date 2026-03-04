import React, { useState } from 'react';
import { 
  Users, Plus, Search, Edit2, Trash2, Eye, Phone, Mail, MapPin,
  Building2, User, Package, Calendar, DollarSign, Save,
  FileText, ShoppingBag, TrendingUp
} from 'lucide-react';
import { Modal } from './Modal';
import { dataService } from '../lib/dataService';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  tipo: 'pf' | 'pj' | 'revendedor' | 'distribuidor';
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  observacoes: string;
  dataCadastro: string;
  ativo: boolean;
}

// Usando o tipo Pedido do Vendas.tsx
import { Pedido } from './Vendas';

interface ClientesProps {
  clientes: Cliente[];
  setClientes: React.Dispatch<React.SetStateAction<Cliente[]>>;
  pedidos: Pedido[];
  companyName?: string;
  companyLogo?: string;
}

const Clientes: React.FC<ClientesProps> = ({ clientes, setClientes, pedidos }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [viewingCliente, setViewingCliente] = useState<Cliente | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    documento: '',
    tipo: 'pf' as 'pf' | 'pj' | 'revendedor' | 'distribuidor',
    endereco: {
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    },
    observacoes: '',
    ativo: true
  });

  const tipoLabels: Record<string, string> = {
    pf: 'Pessoa Física',
    pj: 'Pessoa Jurídica',
    revendedor: 'Revendedor',
    distribuidor: 'Distribuidor'
  };

  const tipoColors: Record<string, string> = {
    pf: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pj: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    revendedor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    distribuidor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  };

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = 
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone.includes(searchTerm) ||
      cliente.documento.includes(searchTerm);
    
    const matchesTipo = filterTipo === 'todos' || cliente.tipo === filterTipo;
    
    return matchesSearch && matchesTipo;
  });

  const getClientePedidos = (clienteId: string) => {
    return pedidos.filter(p => p.clienteId === clienteId);
  };

  const getClienteStats = (clienteId: string) => {
    const clientePedidos = getClientePedidos(clienteId);
    const totalGasto = clientePedidos
      .filter(p => p.status === 'concluido' || p.status === 'pago')
      .reduce((acc, p) => acc + p.total, 0);
    const totalPedidos = clientePedidos.length;
    const ultimoPedido = clientePedidos.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    
    return { totalGasto, totalPedidos, ultimoPedido };
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      documento: '',
      tipo: 'pf',
      endereco: {
        rua: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: ''
      },
      observacoes: '',
      ativo: true
    });
    setEditingCliente(null);
  };

  const handleOpenModal = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        documento: cliente.documento,
        tipo: cliente.tipo,
        endereco: { ...cliente.endereco },
        observacoes: cliente.observacoes,
        ativo: cliente.ativo
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSaveCliente = () => {
    if (!formData.nome.trim()) {
      alert('Nome é obrigatório!');
      return;
    }

    if (editingCliente) {
      setClientes(prev => prev.map(c => 
        c.id === editingCliente.id
          ? { ...c, ...formData }
          : c
      ));
    } else {
      const novoCliente: Cliente = {
        id: `CLI-${Date.now()}`,
        ...formData,
        dataCadastro: new Date().toISOString()
      };
      setClientes(prev => [...prev, novoCliente]);
    }

    setShowModal(false);
    resetForm();
  };

  const handleDeleteCliente = (id: string) => {
    setClienteToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCliente = async () => {
    if (!clienteToDelete) return;
    const id = clienteToDelete;
    
    setClientes(prev => prev.filter(c => c.id !== id));
    
    // Deletar do Supabase também
    try {
      await dataService.clientes.delete(id);
    } catch (error) {
      console.error('Erro ao deletar cliente do Supabase:', error);
    } finally {
      setShowDeleteConfirm(false);
      setClienteToDelete(null);
    }
  };

  const handleViewCliente = (cliente: Cliente) => {
    setViewingCliente(cliente);
    setShowViewModal(true);
  };

  const handleViewHistorico = (cliente: Cliente) => {
    setViewingCliente(cliente);
    setShowHistoricoModal(true);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatDocumento = (value: string, tipo: string) => {
    const numbers = value.replace(/\D/g, '');
    if (tipo === 'pf') {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  // Estatísticas gerais
  const totalClientes = clientes.length;
  const clientesAtivos = clientes.filter(c => c.ativo).length;
  const clientesPJ = clientes.filter(c => c.tipo === 'pj').length;
  const revendedores = clientes.filter(c => c.tipo === 'revendedor').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie sua carteira de clientes</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 
            text-white rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/25"
        >
          <Plus size={20} />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <Users size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalClientes}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total de Clientes</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <User size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{clientesAtivos}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Clientes Ativos</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
              <Building2 size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{clientesPJ}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pessoa Jurídica</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
              <ShoppingBag size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{revendedores}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Revendedores</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nome, email, telefone ou documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl 
              text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 shadow-sm"
          />
        </div>
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white 
            focus:outline-none focus:border-blue-500/50 shadow-sm"
        >
          <option value="todos">Todos os Tipos</option>
          <option value="pf">Pessoa Física</option>
          <option value="pj">Pessoa Jurídica</option>
          <option value="revendedor">Revendedor</option>
          <option value="distribuidor">Distribuidor</option>
        </select>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700/50">
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Contato</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Pedidos</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Total Gasto</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Users size={48} className="mx-auto mb-3 opacity-50" />
                    <p>Nenhum cliente encontrado</p>
                  </td>
                </tr>
              ) : (
                filteredClientes.map(cliente => {
                  const stats = getClienteStats(cliente.id);
                  return (
                    <tr 
                      key={cliente.id} 
                      className="border-b border-gray-200 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
                            flex items-center justify-center text-white font-bold">
                            {cliente.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{cliente.nome}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{cliente.documento}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <Phone size={14} className="text-gray-400 dark:text-gray-500" />
                            {cliente.telefone || '-'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Mail size={14} className="text-gray-400 dark:text-gray-500" />
                            {cliente.email || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${tipoColors[cliente.tipo]}`}>
                          {tipoLabels[cliente.tipo]}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleViewHistorico(cliente)}
                          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                          <Package size={16} />
                          <span className="font-medium">{stats.totalPedidos}</span>
                        </button>
                      </td>
                      <td className="p-4">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {formatCurrency(stats.totalGasto)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          cliente.ativo 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                        }`}>
                          {cliente.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewCliente(cliente)}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 
                              rounded-lg transition-colors"
                            title="Visualizar"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleViewHistorico(cliente)}
                            className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 
                              rounded-lg transition-colors"
                            title="Histórico de Compras"
                          >
                            <FileText size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenModal(cliente)}
                            className="p-2 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 
                              rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteCliente(cliente.id)}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 
                              rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
      >
        <div className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nome Completo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-xl 
                text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
              placeholder="Nome do cliente"
            />
          </div>

          {/* Tipo e Documento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  tipo: e.target.value as 'pf' | 'pj' | 'revendedor' | 'distribuidor' 
                }))}
                className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-xl 
                  text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="pf">Pessoa Física</option>
                <option value="pj">Pessoa Jurídica</option>
                <option value="revendedor">Revendedor</option>
                <option value="distribuidor">Distribuidor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {formData.tipo === 'pf' ? 'CPF' : 'CNPJ'}
              </label>
              <input
                type="text"
                value={formData.documento}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  documento: formatDocumento(e.target.value, formData.tipo) 
                }))}
                className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-xl 
                  text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                placeholder={formData.tipo === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                maxLength={formData.tipo === 'pf' ? 14 : 18}
              />
            </div>
          </div>

          {/* Email e Telefone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-xl 
                  text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Telefone</label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  telefone: formatTelefone(e.target.value) 
                }))}
                className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-xl 
                  text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="border-t border-gray-700/50 pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <MapPin size={16} />
              Endereço
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Rua</label>
                <input
                  type="text"
                  value={formData.endereco.rua}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    endereco: { ...prev.endereco, rua: e.target.value } 
                  }))}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg 
                    text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                  placeholder="Rua/Avenida"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Número</label>
                <input
                  type="text"
                  value={formData.endereco.numero}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    endereco: { ...prev.endereco, numero: e.target.value } 
                  }))}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg 
                    text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                  placeholder="Nº"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Bairro</label>
                <input
                  type="text"
                  value={formData.endereco.bairro}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    endereco: { ...prev.endereco, bairro: e.target.value } 
                  }))}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg 
                    text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                  placeholder="Bairro"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">CEP</label>
                <input
                  type="text"
                  value={formData.endereco.cep}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    endereco: { ...prev.endereco, cep: e.target.value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2') } 
                  }))}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg 
                    text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Cidade</label>
                <input
                  type="text"
                  value={formData.endereco.cidade}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    endereco: { ...prev.endereco, cidade: e.target.value } 
                  }))}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg 
                    text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                  placeholder="Cidade"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Estado</label>
                <select
                  value={formData.endereco.estado}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    endereco: { ...prev.endereco, estado: e.target.value } 
                  }))}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg 
                    text-white text-sm focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">Selecione</option>
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </select>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Observações</label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-xl 
                text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none"
              placeholder="Observações sobre o cliente..."
            />
          </div>

          {/* Status Ativo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, ativo: !prev.ativo }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                formData.ativo ? 'bg-emerald-500' : 'bg-gray-600'
              }`}
            >
              <span 
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  formData.ativo ? 'left-7' : 'left-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-300">Cliente Ativo</span>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-gray-700/50">
            <button
              onClick={() => { setShowModal(false); resetForm(); }}
              className="flex-1 px-4 py-2.5 bg-gray-700 text-gray-300 rounded-xl 
                hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveCliente}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 
                bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl 
                hover:from-blue-500 hover:to-blue-600 transition-all"
            >
              <Save size={18} />
              Salvar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Visualização */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Dados do Cliente"
      >
        {viewingCliente && (
          <div className="space-y-4">
            {/* Avatar e Nome */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-700/50">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
                flex items-center justify-center text-white text-2xl font-bold">
                {viewingCliente.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{viewingCliente.nome}</h3>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${tipoColors[viewingCliente.tipo]}`}>
                  {tipoLabels[viewingCliente.tipo]}
                </span>
              </div>
            </div>

            {/* Informações */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Documento</p>
                <p className="text-white">{viewingCliente.documento || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Data de Cadastro</p>
                <p className="text-white">{formatDate(viewingCliente.dataCadastro)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-white">{viewingCliente.email || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Telefone</p>
                <p className="text-white">{viewingCliente.telefone || '-'}</p>
              </div>
            </div>

            {/* Endereço */}
            {viewingCliente.endereco.rua && (
              <div className="pt-4 border-t border-gray-700/50">
                <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <MapPin size={14} />
                  Endereço
                </h4>
                <p className="text-white">
                  {viewingCliente.endereco.rua}, {viewingCliente.endereco.numero}
                  {viewingCliente.endereco.bairro && ` - ${viewingCliente.endereco.bairro}`}
                </p>
                <p className="text-gray-400">
                  {viewingCliente.endereco.cidade && `${viewingCliente.endereco.cidade}`}
                  {viewingCliente.endereco.estado && ` - ${viewingCliente.endereco.estado}`}
                  {viewingCliente.endereco.cep && ` | CEP: ${viewingCliente.endereco.cep}`}
                </p>
              </div>
            )}

            {/* Observações */}
            {viewingCliente.observacoes && (
              <div className="pt-4 border-t border-gray-700/50">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Observações</h4>
                <p className="text-white">{viewingCliente.observacoes}</p>
              </div>
            )}

            {/* Estatísticas */}
            <div className="pt-4 border-t border-gray-700/50">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Resumo de Compras</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                  <Package size={20} className="mx-auto text-blue-400 mb-1" />
                  <p className="text-xl font-bold text-white">
                    {getClienteStats(viewingCliente.id).totalPedidos}
                  </p>
                  <p className="text-xs text-gray-400">Pedidos</p>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                  <DollarSign size={20} className="mx-auto text-emerald-400 mb-1" />
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(getClienteStats(viewingCliente.id).totalGasto)}
                  </p>
                  <p className="text-xs text-gray-400">Total Gasto</p>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                  <TrendingUp size={20} className="mx-auto text-purple-400 mb-1" />
                  <p className="text-xl font-bold text-white">
                    {getClienteStats(viewingCliente.id).totalPedidos > 0 
                      ? formatCurrency(getClienteStats(viewingCliente.id).totalGasto / getClienteStats(viewingCliente.id).totalPedidos)
                      : 'R$ 0,00'
                    }
                  </p>
                  <p className="text-xs text-gray-400">Ticket Médio</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Histórico de Compras */}
      <Modal
        isOpen={showHistoricoModal}
        onClose={() => setShowHistoricoModal(false)}
        title="Histórico de Compras"
      >
        {viewingCliente && (
          <div className="space-y-4">
            {/* Header do Cliente */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-700/50">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
                flex items-center justify-center text-white font-bold">
                {viewingCliente.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-white">{viewingCliente.nome}</h3>
                <p className="text-sm text-gray-400">
                  {getClienteStats(viewingCliente.id).totalPedidos} pedidos | 
                  Total: {formatCurrency(getClienteStats(viewingCliente.id).totalGasto)}
                </p>
              </div>
            </div>

            {/* Lista de Pedidos */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getClientePedidos(viewingCliente.id).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingBag size={40} className="mx-auto mb-2 opacity-50" />
                  <p>Nenhum pedido encontrado</p>
                </div>
              ) : (
                getClientePedidos(viewingCliente.id)
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(pedido => (
                    <div 
                      key={pedido.id}
                      className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-blue-400">#{pedido.numero}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            pedido.tipo === 'venda' 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {pedido.tipo === 'venda' ? 'Venda' : 'Orçamento'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400">
                          <Calendar size={12} className="inline mr-1" />
                          {formatDate(pedido.createdAt)}
                        </span>
                      </div>
                      <div className="space-y-1 mb-2">
                        {pedido.items.map((item: { id: string; formulaId: string; nome: string; quantidade: number; precoUnitario: number; total: number }, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-300">
                              {item.quantidade}x {item.nome}
                            </span>
                            <span className="text-gray-400">
                              {formatCurrency(item.quantidade * item.precoUnitario)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-600/30">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          pedido.status === 'concluido' ? 'bg-emerald-500/20 text-emerald-400' :
                          pedido.status === 'pago' ? 'bg-blue-500/20 text-blue-400' :
                          pedido.status === 'cancelado' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1)}
                        </span>
                        <span className="font-bold text-emerald-400">
                          {formatCurrency(pedido.total)}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
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
            Tem certeza que deseja excluir este cliente permanentemente? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDeleteCliente}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
            >
              Excluir Agora
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Clientes;
