import { useState } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  FileText,
  ShoppingCart,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Formula, Insumo, InsumoMovimentacao } from '../types';
import { ProdutoEstoque, MovimentoEstoque } from './Estoque';
import { OrdemProducao } from './Producao';
import { formulasData } from '../data/mockData';
import { Modal } from './Modal';
import { CurrencyInput } from './ui/CurrencyInput';
import { RichTextEditor } from './ui/RichTextEditor';



export interface PedidoItem {
  id: string;
  formulaId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
  observacoes?: string;
}

export interface Pedido {
  id: string;
  numero: string;
  clienteId?: string;
  tipo: 'venda' | 'orcamento';
  cliente: string;
  telefone: string;
  email: string;
  endereco: string;
  items: PedidoItem[];
  subtotal: number;
  desconto: number;
  total: number;
  status: 'pendente' | 'aprovado' | 'pago' | 'producao' | 'concluido' | 'cancelado';
  formaPagamento: string;
  tipoEntrega?: 'entrega' | 'retirada';
  listaPrecoId?: string;
  observacoes: string;
  createdAt: string;
  updatedAt: string;
}

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

// Interface atualizada para Lista de Preços Avançada
interface RegraPreco {
  id: string;
  produtoId?: string;
  produtoNome?: string;
  varianteId?: string;
  tipoPreco: 'formula' | 'fixo';
  custoBase?: number;
  margemLucro?: number;
  precoFixo?: number;
  quantidadeMinima?: number;
  precoCalculado?: number;
}

interface ListaPreco {
  id: string;
  nome: string;
  descricao: string;
  aplicarA: 'produto' | 'categoria';
  ativo: boolean;
  dataCriacao: string;
  regras: RegraPreco[];
}

interface Precificacao {
  id: string;
  formulaId: string;
  precoVarejo: number;
  precoAtacado: number;
  precoFardo: number;
  quantidadeFardo: number;
  custosFixos: number;
}

interface VendasProps {
  pedidos: Pedido[];
  setPedidos: React.Dispatch<React.SetStateAction<Pedido[]>>;
  onEnviarProducao: (pedido: Pedido) => void;
  clientes?: Cliente[];
  setClientes?: React.Dispatch<React.SetStateAction<Cliente[]>>;
  listasPreco?: ListaPreco[];
  precificacoes?: Record<string, Precificacao>;
  canAdd?: boolean;
  produtosEstoque?: ProdutoEstoque[];
  setProdutosEstoque?: React.Dispatch<React.SetStateAction<ProdutoEstoque[]>>;
  insumos?: Insumo[];
  setInsumos?: React.Dispatch<React.SetStateAction<Insumo[]>>;
  formulas?: Formula[];
  ordensProducao?: OrdemProducao[];
  setOrdensProducao?: React.Dispatch<React.SetStateAction<OrdemProducao[]>>;
  setMovimentosEstoque?: React.Dispatch<React.SetStateAction<MovimentoEstoque[]>>;
}

type TabType = 'vendas' | 'orcamentos';

export function Vendas({ 
  pedidos, 
  setPedidos, 
  onEnviarProducao, 
  clientes = [], 
  setClientes, 
  listasPreco = [], 
  precificacoes = {},
  canAdd = true,
  produtosEstoque = [],
  setProdutosEstoque,
  insumos = [],
  setInsumos,
  formulas = [],
  setOrdensProducao,
  setMovimentosEstoque,
}: VendasProps) {
  const [activeTab, setActiveTab] = useState<TabType>('vendas');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  
  type ValidationStep = 'idle' | 'checking_estoque' | 'checking_insumos' | 'decision';
  const [validationStep, setValidationStep] = useState<ValidationStep>('idle');
  const [validationData, setValidationData] = useState<any>(null);

  // Autocomplete de clientes
  const [clienteSearch, setClienteSearch] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  
  // Lista de Preços
  const [selectedListaPrecoId, setSelectedListaPrecoId] = useState<string>('');

  // Form state
  const [form, setForm] = useState<Partial<Pedido>>({
    tipo: 'venda',
    cliente: '',
    clienteId: undefined,
    telefone: '',
    email: '',
    endereco: '',
    items: [],
    subtotal: 0,
    desconto: 0,
    total: 0,
    status: 'pendente',
    formaPagamento: 'pix',
    tipoEntrega: 'entrega',
    listaPrecoId: '',
    observacoes: '',
  });



  // Add item state
  const [selectedFormulaId, setSelectedFormulaId] = useState('');
  const [itemQuantidade, setItemQuantidade] = useState(1);
  const [itemPreco, setItemPreco] = useState(0);
  
  // Clientes filtrados pelo autocomplete
  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(clienteSearch.toLowerCase()) ||
    c.telefone.includes(clienteSearch) ||
    c.email.toLowerCase().includes(clienteSearch.toLowerCase())
  ).slice(0, 5);
  
  // Função para selecionar cliente do autocomplete
  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedClienteId(cliente.id);
    setClienteSearch(cliente.nome);
    setForm({
      ...form,
      clienteId: cliente.id,
      cliente: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email,
      endereco: cliente.endereco.rua 
        ? `${cliente.endereco.rua}, ${cliente.endereco.numero} - ${cliente.endereco.bairro}, ${cliente.endereco.cidade}/${cliente.endereco.estado}`
        : '',
    });
    setShowClienteDropdown(false);
    
    // Selecionar primeira lista de preços ativa
    const listaAtiva = listasPreco.find(l => l.ativo);
    if (listaAtiva) {
      setSelectedListaPrecoId(listaAtiva.id);
      setForm(prev => ({ ...prev, listaPrecoId: listaAtiva.id }));
    }
  };
  
  // Função para obter preço da lista de preços (baseado nas regras)
  const getPrecoFromLista = (formulaId: string, precoBase: number): number => {
    const lista = listasPreco.find(l => l.id === selectedListaPrecoId);
    if (lista && lista.regras) {
      // Buscar regra específica para este produto
      const regra = lista.regras.find(r => r.produtoId === formulaId);
      if (regra) {
        if (regra.tipoPreco === 'fixo' && regra.precoFixo) {
          return regra.precoFixo;
        } else if (regra.precoCalculado) {
          return regra.precoCalculado;
        }
      }
    }
    return precoBase;
  };

  const calcularCustoUnidade = (formula: Formula) => {
    const custoTotal = formula.insumos.reduce((sum, i) => sum + (i.quantidade * i.valorUnitario), 0);
    return formula.rendimento > 0 ? custoTotal / formula.rendimento : 0;
  };

  const filteredPedidos = pedidos
    .filter(p => p.tipo === (activeTab === 'vendas' ? 'venda' : 'orcamento'))
    .filter(p =>
      p.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.numero.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getStatusColor = (status: Pedido['status']) => {
    switch (status) {
      case 'pendente': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      case 'aprovado': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'pago': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'producao': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case 'concluido': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
      case 'cancelado': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: Pedido['status']) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'aprovado': return 'Aprovado';
      case 'pago': return 'Pago';
      case 'producao': return 'Em Produção';
      case 'concluido': return 'Concluído';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusIcon = (status: Pedido['status']) => {
    switch (status) {
      case 'pendente': return <Clock className="w-4 h-4" />;
      case 'aprovado': return <CheckCircle className="w-4 h-4" />;
      case 'pago': return <CheckCircle className="w-4 h-4" />;
      case 'producao': return <ShoppingCart className="w-4 h-4" />;
      case 'concluido': return <CheckCircle className="w-4 h-4" />;
      case 'cancelado': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const handleOpenNew = (tipo: 'venda' | 'orcamento') => {
    if (!canAdd) {
      alert('Limite de relatórios atingido para o seu plano.');
      return;
    }
    setEditingPedido(null);
    setForm({
      tipo,
      cliente: '',
      clienteId: undefined,
      telefone: '',
      email: '',
      endereco: '',
      items: [],
      subtotal: 0,
      desconto: 0,
      total: 0,
      status: 'pendente',
      formaPagamento: 'pix',
      listaPrecoId: '',
      observacoes: '',
    });
    setSelectedFormulaId('');
    setItemQuantidade(1);
    setItemPreco(0);
    setClienteSearch('');
    setSelectedClienteId(null);
    setSelectedListaPrecoId('');
    setShowModal(true);
  };

  const handleOpenEdit = (pedido: Pedido) => {
    setEditingPedido(pedido);
    setForm({ ...pedido });
    setShowModal(true);
  };

  const handleAddItem = () => {
    const formula = formulasData.find(f => f.id === selectedFormulaId);
    if (!formula || itemQuantidade <= 0) return;

    // Usar preço da precificação se existir, senão calcular
    const precificacao = precificacoes[formula.id];
    let precoBase = itemPreco > 0 ? itemPreco : (precificacao?.precoVarejo || calcularCustoUnidade(formula) * 2);
    
    // Aplicar preço da lista se selecionada
    const preco = getPrecoFromLista(formula.id, precoBase);
    const total = preco * itemQuantidade;

    const newItem: PedidoItem = {
      id: Date.now().toString(),
      formulaId: formula.id,
      nome: formula.nome,
      quantidade: itemQuantidade,
      precoUnitario: preco,
      total,
    };

    const newItems = [...(form.items || []), newItem];
    const subtotal = newItems.reduce((sum, i) => sum + i.total, 0);
    const totalFinal = subtotal - (form.desconto || 0);

    setForm({
      ...form,
      items: newItems,
      subtotal,
      total: totalFinal,
    });

    setSelectedFormulaId('');
    setItemQuantidade(1);
    setItemPreco(0);
  };

  const handleRemoveItem = (itemId: string) => {
    const newItems = (form.items || []).filter(i => i.id !== itemId);
    const subtotal = newItems.reduce((sum, i) => sum + i.total, 0);
    const totalFinal = subtotal - (form.desconto || 0);

    setForm({
      ...form,
      items: newItems,
      subtotal,
      total: totalFinal,
    });
  };

  const handleDescontoChange = (desconto: number) => {
    setForm({
      ...form,
      desconto,
      total: (form.subtotal || 0) - desconto,
    });
  };

  const handleSave = () => {
    if (!form.cliente || !form.items?.length) return;

    const now = new Date().toISOString();
    
    // Se o cliente não existe no sistema e setClientes está disponível, cadastrar automaticamente
    if (!selectedClienteId && setClientes && form.cliente) {
      const novoCliente: Cliente = {
        id: `CLI-${Date.now()}`,
        nome: form.cliente,
        email: form.email || '',
        telefone: form.telefone || '',
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
        observacoes: 'Cadastrado automaticamente via pedido',
        dataCadastro: now,
        ativo: true
      };
      setClientes(prev => [...prev, novoCliente]);
      setForm(prev => ({ ...prev, clienteId: novoCliente.id }));
    }

    const pedidoId = editingPedido ? editingPedido.id : Date.now().toString();
    const numero = editingPedido ? editingPedido.numero : `${form.tipo === 'venda' ? 'VND' : 'ORC'}-${Date.now().toString().slice(-6)}`;
    
    const pedidoToSave: Pedido = {
      ...form as Pedido,
      id: pedidoId,
      numero,
      createdAt: editingPedido ? editingPedido.createdAt : now,
      updatedAt: now,
    };

    if (pedidoToSave.tipo === 'venda' && !editingPedido) {
      // Start validation flow
      setValidationData({ pedido: pedidoToSave });
      setValidationStep('checking_estoque');
      checkEstoqueAcabado(pedidoToSave);
      return; // Don't save yet
    }

    savePedidoFinal(pedidoToSave);
  };

  const savePedidoFinal = (pedido: Pedido) => {
    if (editingPedido) {
      setPedidos(prev => prev.map(p => p.id === pedido.id ? pedido : p));
    } else {
      setPedidos(prev => [...prev, pedido]);
    }
    setShowModal(false);
    setClienteSearch('');
    setSelectedClienteId(null);
    setSelectedListaPrecoId('');
    setValidationStep('idle');
  };

  const checkEstoqueAcabado = (pedido: Pedido) => {
    let hasDeficit = false;
    const itemDeficits: { item: PedidoItem, deficit: number, estoqueAtual: number }[] = [];

    for (const item of pedido.items) {
      const estoqueProduto = produtosEstoque.filter(p => p.formulaId === item.formulaId).reduce((sum, p) => sum + p.quantidade, 0);
      if (estoqueProduto < item.quantidade) {
        hasDeficit = true;
        itemDeficits.push({ item, deficit: item.quantidade - estoqueProduto, estoqueAtual: estoqueProduto });
      }
    }

    if (!hasDeficit) {
      approveSaleAndDeductStock(pedido);
    } else {
      setValidationStep('checking_insumos');
      checkProductionPossibility(pedido, itemDeficits);
    }
  };

  const approveSaleAndDeductStock = (pedido: Pedido) => {
    if (setProdutosEstoque) {
      setProdutosEstoque(prev => {
        let newEstoque = [...prev];
        for (const item of pedido.items) {
          let remainingToDeduct = item.quantidade;
          const lotesProduto = newEstoque.filter(p => p.formulaId === item.formulaId).sort((a, b) => new Date(a.ultimaEntrada || '').getTime() - new Date(b.ultimaEntrada || '').getTime());
          
          for (const lote of lotesProduto) {
            if (remainingToDeduct <= 0) break;
            const deduct = Math.min(lote.quantidade, remainingToDeduct);
            lote.quantidade -= deduct;
            remainingToDeduct -= deduct;
          }
        }
        return newEstoque.filter(p => p.quantidade > 0);
      });
    }

    if (setMovimentosEstoque) {
      const novosMovimentos: MovimentoEstoque[] = pedido.items.map(item => ({
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        tipo: 'saida',
        produtoId: produtosEstoque.find(p => p.formulaId === item.formulaId)?.id || '',
        produtoNome: item.nome,
        quantidade: item.quantidade,
        motivo: 'Venda',
        referencia: pedido.numero,
        createdAt: new Date().toISOString(),
      }));
      setMovimentosEstoque(prev => [...prev, ...novosMovimentos]);
    }

    const finalPedido = { ...pedido, status: 'aprovado' as const };
    savePedidoFinal(finalPedido);
    alert('Venda aprovada e estoque atualizado com sucesso!');
  };

  const checkProductionPossibility = (pedido: Pedido, itemDeficits: any[]) => {
    const requiredInsumos: Record<string, number> = {};
    
    for (const deficitInfo of itemDeficits) {
      const formula = formulas.find(f => f.id === deficitInfo.item.formulaId);
      if (!formula || formula.rendimento <= 0) continue;
      
      const batchesRequired = deficitInfo.deficit / formula.rendimento;
      
      for (const insumo of formula.insumos) {
        if (!requiredInsumos[insumo.insumoId]) {
          requiredInsumos[insumo.insumoId] = 0;
        }
        requiredInsumos[insumo.insumoId] += insumo.quantidade * batchesRequired;
      }
    }

    const missingInsumos: { insumoId: string, nome: string, required: number, available: number }[] = [];
    
    for (const [insumoId, requiredQty] of Object.entries(requiredInsumos)) {
      const insumo = insumos.find(i => i.id === insumoId);
      const available = insumo?.estoque || 0;
      if (available < requiredQty) {
        missingInsumos.push({
          insumoId,
          nome: insumo?.nome || 'Insumo Desconhecido',
          required: requiredQty,
          available
        });
      }
    }

    if (missingInsumos.length === 0) {
      createProductionOrdersAndDeductInsumos(pedido, itemDeficits, requiredInsumos);
    } else {
      setValidationData({ pedido, itemDeficits, missingInsumos });
      setValidationStep('decision');
    }
  };

  const createProductionOrdersAndDeductInsumos = (pedido: Pedido, itemDeficits: any[], requiredInsumos: Record<string, number>) => {
    if (setInsumos) {
      setInsumos(prev => prev.map(insumo => {
        const required = requiredInsumos[insumo.id];
        if (required) {
          // Add movement log for insumo
          const newMovimentacao: InsumoMovimentacao = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            insumoId: insumo.id,
            tipo: 'saida',
            data: new Date().toISOString().split('T')[0],
            quantidade: required,
            saldoAtual: Math.max(0, insumo.estoque - required),
            motivo: 'consumo',
            destino: 'Produção',
            pedido: pedido.numero,
            responsavel: 'Sistema',
            usuario: 'Sistema',
            observacoes: `Reserva automática para OP do pedido ${pedido.numero}`,
          };
          return { 
            ...insumo, 
            estoque: Math.max(0, insumo.estoque - required),
            movimentacoes: [...(insumo.movimentacoes || []), newMovimentacao]
          };
        }
        return insumo;
      }));
    }

    if (setOrdensProducao) {
      const now = new Date().toISOString();
      const newOrders: OrdemProducao[] = itemDeficits.map((deficitInfo, index) => ({
        id: `OP-${Date.now()}-${index}`,
        numero: `OP-${Date.now().toString().slice(-6)}-${index + 1}`,
        pedidoId: pedido.id,
        pedidoNumero: pedido.numero,
        cliente: pedido.cliente,
        formulaId: deficitInfo.item.formulaId,
        formulaNome: deficitInfo.item.nome,
        quantidade: deficitInfo.deficit,
        lote: `LOTE-${Date.now().toString().slice(-6)}`,
        status: 'aguardando',
        prioridade: 'alta',
        observacoes: `Criado automaticamente a partir do pedido ${pedido.numero}`,
        createdAt: now,
        updatedAt: now,
      }));
      setOrdensProducao(prev => [...prev, ...newOrders]);
    }

    if (setProdutosEstoque) {
      setProdutosEstoque(prev => {
        let newEstoque = [...prev];
        for (const deficitInfo of itemDeficits) {
          let remainingToDeduct = deficitInfo.estoqueAtual;
          if (remainingToDeduct <= 0) continue;
          
          const lotesProduto = newEstoque.filter(p => p.formulaId === deficitInfo.item.formulaId).sort((a, b) => new Date(a.ultimaEntrada || '').getTime() - new Date(b.ultimaEntrada || '').getTime());
          
          for (const lote of lotesProduto) {
            if (remainingToDeduct <= 0) break;
            const deduct = Math.min(lote.quantidade, remainingToDeduct);
            lote.quantidade -= deduct;
            remainingToDeduct -= deduct;
          }
        }
        return newEstoque.filter(p => p.quantidade > 0);
      });
    }

    if (setMovimentosEstoque) {
      const novosMovimentos: MovimentoEstoque[] = itemDeficits
        .filter(d => d.estoqueAtual > 0)
        .map(deficitInfo => ({
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          tipo: 'saida',
          produtoId: produtosEstoque.find(p => p.formulaId === deficitInfo.item.formulaId)?.id || '',
          produtoNome: deficitInfo.item.nome,
          quantidade: deficitInfo.estoqueAtual,
          motivo: 'Venda',
          referencia: pedido.numero,
          createdAt: new Date().toISOString(),
        }));
      if (novosMovimentos.length > 0) {
        setMovimentosEstoque(prev => [...prev, ...novosMovimentos]);
      }
    }

    const finalPedido = { ...pedido, status: 'producao' as const };
    savePedidoFinal(finalPedido);
    alert('Venda registrada! Ordens de produção criadas para o déficit e insumos reservados.');
  };

  const handleDecision = (action: 'parcial' | 'pendente' | 'cancelar') => {
    const { pedido, itemDeficits } = validationData;

    if (action === 'cancelar') {
      setValidationStep('idle');
      return;
    }

    if (action === 'pendente') {
      const finalPedido = { ...pedido, status: 'pendente' as const, observacoes: `${pedido.observacoes}\n[SISTEMA] Pedido pendente por falta de insumos.` };
      savePedidoFinal(finalPedido);
      alert('Pedido salvo como pendente. Alerta de reposição de insumos gerado.');
      return;
    }

    if (action === 'parcial') {
      const newItems = pedido.items.map((item: PedidoItem) => {
        const deficitInfo = itemDeficits.find((d: any) => d.item.id === item.id);
        if (deficitInfo) {
          return {
            ...item,
            quantidade: deficitInfo.estoqueAtual,
            total: deficitInfo.estoqueAtual * item.precoUnitario
          };
        }
        return item;
      }).filter((item: PedidoItem) => item.quantidade > 0);

      if (newItems.length === 0) {
        alert('Não há estoque disponível para nenhum dos itens. Pedido cancelado.');
        setValidationStep('idle');
        return;
      }

      const subtotal = newItems.reduce((sum: number, i: PedidoItem) => sum + i.total, 0);
      const totalFinal = subtotal - (pedido.desconto || 0);

      const finalPedido = {
        ...pedido,
        items: newItems,
        subtotal,
        total: totalFinal,
        status: 'aprovado' as const,
        observacoes: `${pedido.observacoes}\n[SISTEMA] Venda parcial realizada devido à falta de insumos para produção.`
      };

      if (setProdutosEstoque) {
        setProdutosEstoque(prev => {
          let newEstoque = [...prev];
          for (const item of newItems) {
            let remainingToDeduct = item.quantidade;
            const lotesProduto = newEstoque.filter(p => p.formulaId === item.formulaId).sort((a, b) => new Date(a.ultimaEntrada || '').getTime() - new Date(b.ultimaEntrada || '').getTime());
            
            for (const lote of lotesProduto) {
              if (remainingToDeduct <= 0) break;
              const deduct = Math.min(lote.quantidade, remainingToDeduct);
              lote.quantidade -= deduct;
              remainingToDeduct -= deduct;
            }
          }
          return newEstoque.filter(p => p.quantidade > 0);
        });
      }

      if (setMovimentosEstoque) {
        const novosMovimentos: MovimentoEstoque[] = newItems.map((item: PedidoItem) => ({
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          tipo: 'saida',
          produtoId: produtosEstoque.find(p => p.formulaId === item.formulaId)?.id || '',
          produtoNome: item.nome,
          quantidade: item.quantidade,
          motivo: 'Venda',
          referencia: pedido.numero,
          createdAt: new Date().toISOString(),
        }));
        setMovimentosEstoque(prev => [...prev, ...novosMovimentos]);
      }

      savePedidoFinal(finalPedido);
      alert('Venda parcial concluída com o estoque disponível!');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este pedido?')) {
      setPedidos(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleChangeStatus = (pedido: Pedido, newStatus: Pedido['status']) => {
    const updatedPedido = {
      ...pedido,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    setPedidos(prev => prev.map(p => p.id === pedido.id ? updatedPedido : p));

    // Se o status for "pago", enviar para produção
    if (newStatus === 'pago') {
      setTimeout(() => {
        if (confirm('Pedido pago! Deseja enviar para produção?')) {
          const pedidoParaProducao = { ...updatedPedido, status: 'producao' as const };
          setPedidos(prev => prev.map(p => p.id === pedido.id ? pedidoParaProducao : p));
          onEnviarProducao(pedidoParaProducao);
        }
      }, 100);
    }
  };

  const handleConverterParaVenda = (orcamento: Pedido) => {
    const venda: Pedido = {
      ...orcamento,
      id: Date.now().toString(),
      numero: `VND-${Date.now().toString().slice(-6)}`,
      tipo: 'venda',
      status: 'pendente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPedidos(prev => [...prev, venda]);
    alert('Orçamento convertido em venda com sucesso!');
  };

  const tabs = [
    { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
    { id: 'orcamentos', label: 'Orçamentos', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendas</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie vendas e orçamentos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenNew('orcamento')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              canAdd 
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
            title={!canAdd ? 'Limite atingido' : ''}
          >
            <FileText className="w-5 h-5" />
            Novo Orçamento
          </button>
          <button
            onClick={() => handleOpenNew('venda')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              canAdd 
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
            title={!canAdd ? 'Limite atingido' : ''}
          >
            <Plus className="w-5 h-5" />
            Nova Venda
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const count = pedidos.filter(p => p.tipo === (tab.id === 'vendas' ? 'venda' : 'orcamento')).length;
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
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por cliente ou número..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Número</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Itens</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Data</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredPedidos.map((pedido) => (
              <tr key={pedido.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 dark:text-white">{pedido.numero}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-900 dark:text-white">{pedido.cliente}</p>
                  <p className="text-xs text-gray-500">{pedido.telefone}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {pedido.items.length} produto(s)
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  R$ {pedido.total.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    <select
                      value={pedido.status}
                      onChange={(e) => handleChangeStatus(pedido, e.target.value as Pedido['status'])}
                      className={`appearance-none px-3 py-1.5 pr-8 rounded-full text-xs font-medium cursor-pointer ${getStatusColor(pedido.status)}`}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="aprovado">Aprovado</option>
                      <option value="pago">Pago</option>
                      <option value="producao">Em Produção</option>
                      <option value="concluido">Concluído</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(pedido.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => { setSelectedPedido(pedido); setShowViewModal(true); }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>

                    {pedido.tipo === 'orcamento' && pedido.status !== 'cancelado' && (
                      <button
                        onClick={() => handleConverterParaVenda(pedido)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Converter em Venda"
                      >
                        <ShoppingCart className="w-4 h-4 text-green-500" />
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEdit(pedido)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4 text-blue-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(pedido.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredPedidos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  Nenhum {activeTab === 'vendas' ? 'pedido' : 'orçamento'} encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create/Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPedido ? `Editar ${form.tipo === 'venda' ? 'Venda' : 'Orçamento'}` : `${form.tipo === 'venda' ? 'Nova Venda' : 'Novo Orçamento'}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Cliente Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cliente * <span className="text-xs text-gray-500">(Digite para buscar)</span>
              </label>
              <input
                type="text"
                value={clienteSearch || form.cliente || ''}
                onChange={(e) => {
                  setClienteSearch(e.target.value);
                  setForm({ ...form, cliente: e.target.value, clienteId: undefined });
                  setSelectedClienteId(null);
                  setShowClienteDropdown(true);
                }}
                onFocus={() => setShowClienteDropdown(true)}
                onBlur={() => setTimeout(() => setShowClienteDropdown(false), 200)}
                placeholder="Digite o nome do cliente..."
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              />
              {/* Dropdown de clientes */}
              {showClienteDropdown && filteredClientes.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredClientes.map(cliente => (
                    <button
                      key={cliente.id}
                      type="button"
                      onClick={() => handleSelectCliente(cliente)}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{cliente.nome}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{cliente.telefone} • {cliente.email}</p>
                    </button>
                  ))}
                </div>
              )}
              {selectedClienteId && (
                <span className="absolute right-3 top-9 text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded">
                  ✓ Cadastrado
                </span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={form.telefone || ''}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lista de Preços
              </label>
              <select
                value={selectedListaPrecoId}
                onChange={(e) => {
                  setSelectedListaPrecoId(e.target.value);
                  setForm({ ...form, listaPrecoId: e.target.value });
                }}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Preço Padrão</option>
                {listasPreco.filter(l => l.ativo).map(lista => (
                  <option key={lista.id} value={lista.id}>
                    {lista.nome} ({lista.regras?.length || 0} regras)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={form.formaPagamento || 'pix'}
                onChange={(e) => setForm({ ...form, formaPagamento: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="boleto">Boleto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Entrega
              </label>
              <select
                value={form.tipoEntrega || 'entrega'}
                onChange={(e) => setForm({ ...form, tipoEntrega: e.target.value as 'entrega' | 'retirada' })}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="entrega">Entregue</option>
                <option value="retirada">Retirado no local</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Endereço
              </label>
              <input
                type="text"
                value={form.endereco || ''}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Produtos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Produtos ({form.items?.length || 0})
            </h3>

            {/* Add Product */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Adicionar Produto</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="relative">
                  <select
                    value={selectedFormulaId}
                    onChange={(e) => {
                      setSelectedFormulaId(e.target.value);
                      const formula = formulasData.find(f => f.id === e.target.value);
                      if (formula) {
                        setItemPreco(calcularCustoUnidade(formula) * 2);
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm appearance-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {formulasData.filter(f => f.status === 'finalizado').map((f) => (
                      <option key={f.id} value={f.id}>{f.nome}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <input
                  type="number"
                  placeholder="Qtd"
                  min={1}
                  value={itemQuantidade}
                  onChange={(e) => setItemQuantidade(parseInt(e.target.value) || 1)}
                  className="px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                />
                <CurrencyInput
                  placeholder="Preço Unit."
                  value={itemPreco}
                  onChange={(val) => setItemPreco(val)}
                  className="text-sm focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddItem}
                  disabled={!selectedFormulaId}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Items List */}
            {form.items && form.items.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Produto</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Qtd</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Preço Unit.</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Total</th>
                      <th className="px-4 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {form.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          <div>{item.nome}</div>
                          {item.observacoes && item.observacoes !== '<p><br></p>' && (
                            <div 
                              className="text-xs text-gray-500 dark:text-gray-400 mt-1 prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: item.observacoes }}
                            />
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-center text-gray-600 dark:text-gray-400">{item.quantidade}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-600 dark:text-gray-400">R$ {item.precoUnitario.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium text-gray-900 dark:text-white">R$ {item.total.toFixed(2)}</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totais */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="font-medium text-gray-900 dark:text-white">R$ {(form.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Desconto:</span>
                <div className="w-24">
                  <CurrencyInput
                    value={form.desconto || 0}
                    onChange={(val) => handleDescontoChange(val)}
                    className="text-right text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">R$ {(form.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Observações do Pedido / Item
            </label>
            <RichTextEditor
              value={form.observacoes || ''}
              onChange={(val) => setForm({ ...form, observacoes: val })}
            />
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
              disabled={!form.cliente || !form.items?.length}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl transition-colors"
            >
              {editingPedido ? 'Salvar Alterações' : 'Criar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Validation Decision */}
      <Modal
        isOpen={validationStep === 'decision'}
        onClose={() => setValidationStep('idle')}
        title="Estoque Insuficiente para Produção"
        size="lg"
      >
        <div className="space-y-6">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800">
            <h4 className="text-red-800 dark:text-red-400 font-medium mb-2">Faltam Insumos para Produzir o Déficit</h4>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              Não há estoque de produto acabado suficiente, e também não há insumos suficientes para produzir a quantidade necessária.
            </p>
            <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
              {validationData?.missingInsumos?.map((missing: any) => (
                <li key={missing.insumoId} className="flex justify-between">
                  <span>{missing.nome}</span>
                  <span className="font-medium">
                    Necessário: {missing.required.toFixed(2)} | Disponível: {missing.available.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Como deseja prosseguir?</h4>
            
            <button
              onClick={() => handleDecision('parcial')}
              className="w-full flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 transition-colors text-left"
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Venda Parcial</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vender apenas a quantidade disponível em estoque de produto acabado.</p>
              </div>
            </button>

            <button
              onClick={() => handleDecision('pendente')}
              className="w-full flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-200 dark:hover:border-amber-800 transition-colors text-left"
            >
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-600 dark:text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Deixar Pendente</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Salvar o pedido como pendente e gerar alerta para compra de insumos.</p>
              </div>
            </button>

            <button
              onClick={() => handleDecision('cancelar')}
              className="w-full flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 transition-colors text-left"
            >
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Cancelar Venda</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Não registrar o pedido de venda.</p>
              </div>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: View */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={`${selectedPedido?.tipo === 'venda' ? 'Venda' : 'Orçamento'} ${selectedPedido?.numero || ''}`}
        size="lg"
      >
        {selectedPedido && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(selectedPedido.status)}`}>
                  {getStatusIcon(selectedPedido.status)}
                  {getStatusLabel(selectedPedido.status)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(selectedPedido.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Cliente</label>
                <p className="font-medium text-gray-900 dark:text-white">{selectedPedido.cliente}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Telefone</label>
                <p className="font-medium text-gray-900 dark:text-white">{selectedPedido.telefone || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">E-mail</label>
                <p className="font-medium text-gray-900 dark:text-white">{selectedPedido.email || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Forma de Pagamento</label>
                <p className="font-medium text-gray-900 dark:text-white capitalize">{selectedPedido.formaPagamento.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Tipo de Entrega</label>
                <p className="font-medium text-gray-900 dark:text-white capitalize">
                  {selectedPedido.tipoEntrega === 'retirada' ? 'Retirado no local' : 'Entregue'}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Produtos</h4>
              <div className="space-y-2">
                {selectedPedido.items.map((item) => (
                  <div key={item.id} className="flex flex-col p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.nome}</p>
                        <p className="text-sm text-gray-500">{item.quantidade}x R$ {item.precoUnitario.toFixed(2)}</p>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">R$ {item.total.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="text-gray-900 dark:text-white">R$ {selectedPedido.subtotal.toFixed(2)}</span>
              </div>
              {selectedPedido.desconto > 0 && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Desconto:</span>
                  <span className="text-red-600 dark:text-red-400">-R$ {selectedPedido.desconto.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-green-200 dark:border-green-800">
                <span className="font-semibold text-green-800 dark:text-green-300">Total:</span>
                <span className="text-2xl font-bold text-green-700 dark:text-green-400">R$ {selectedPedido.total.toFixed(2)}</span>
              </div>
            </div>

            {selectedPedido.observacoes && selectedPedido.observacoes !== '<p><br></p>' && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Observações</h4>
                <div 
                  className="text-sm text-gray-600 dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedPedido.observacoes }}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
}
