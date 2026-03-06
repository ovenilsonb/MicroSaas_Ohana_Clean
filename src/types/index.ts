// Tipos principais do sistema

export interface InsumoVariante {
  id: string;
  nome: string;
  codigo: string;
  valorUnitario: number;
}

export interface InsumoMovimentacao {
  id: string;
  insumoId: string;
  tipo: 'entrada' | 'saida';
  data: string;
  quantidade: number;
  saldoAtual: number;
  
  // Campos de Entrada
  fornecedor?: string;
  lote?: string;
  validade?: string;
  documento?: string;
  
  // Campos de Saída
  destino?: string;
  pedido?: string;
  responsavel?: string;
  motivo?: string;
  
  observacoes?: string;
  usuario: string;
}

export interface Insumo {
  id: string;
  nome: string;
  apelido?: string;
  codigo: string;
  unidade: string;
  valorUnitario: number;
  fornecedor: string;
  estoque: number;
  estoqueMinimo: number;
  validade: string | null;
  validadeIndeterminada?: boolean;
  quimico: boolean;
  foto?: string;
  imagem?: string;
  variantes?: InsumoVariante[];
  pesoEspecifico?: string;
  ph?: string;
  temperatura?: string;
  viscosidade?: string;
  solubilidade?: string;
  risco?: string;
  movimentacoes?: InsumoMovimentacao[];
}

export interface FormulaInsumo {
  id: string;
  insumoId: string;
  varianteId?: string;
  nome: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  quimico: boolean;
}

export interface FormulaHistorico {
  id: string;
  data: string;
  acao: string;
  detalhes: string;
}

export interface Formula {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
  grupoId: string;
  pesoVolume: string;
  unidade: string;
  rendimento: number;
  insumos: FormulaInsumo[];
  observacoes: string;
  status: 'rascunho' | 'finalizado';
  listaInsumo: string;
  prefixoLote: string;
  historico: FormulaHistorico[];
  createdAt: string;
  updatedAt: string;
}

export interface Grupo {
  id: string;
  nome: string;
  cor: string;
}

export interface Precificacao {
  id: string;
  formulaId: string;
  custosFixos: number;
  precoVarejo: number;
  precoAtacado: number;
  quantidadeFardo: number;
  precoFardo: number;
  updatedAt: string;
}

export interface VersionEntry {
  version: string;
  date: string;
  changes: string[];
}

// Tipos para Clientes
export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  tipo: 'fisica' | 'juridica' | 'revendedor' | 'distribuidor';
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
}

// Tipos para Lista de Preços
export interface ListaPreco {
  id: string;
  nome: string;
  desconto: number;
  ativo: boolean;
  descricao: string;
}

// Tipos para Pedidos/Vendas
export interface PedidoItem {
  id: string;
  formulaId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  precoOriginal: number;
}

export interface Pedido {
  id: string;
  tipo: 'venda' | 'orcamento';
  clienteId: string;
  clienteNome: string;
  clienteEmail: string;
  clienteTelefone: string;
  clienteEndereco: string;
  listaPrecoId: string;
  itens: PedidoItem[];
  subtotal: number;
  desconto: number;
  total: number;
  formaPagamento: string;
  tipoEntrega?: 'entrega' | 'retirada';
  status: 'pendente' | 'aprovado' | 'pago' | 'producao' | 'concluido' | 'cancelado';
  observacoes: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

// Tipos para Produção
export interface OrdemProducao {
  id: string;
  pedidoId: string;
  formulaId: string;
  formulaNome: string;
  quantidade: number;
  lote: string;
  status: 'aguardando' | 'producao' | 'pausado' | 'concluido';
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  clienteNome: string;
  iniciadoEm?: string;
  concluidoEm?: string;
  dataCriacao: string;
}

// Tipos para Estoque
export interface ProdutoEstoque {
  id: string;
  formulaId: string;
  nome: string;
  lote: string;
  quantidade: number;
  estoqueMinimo: number;
  dataEntrada: string;
  dataValidade?: string;
}

export interface MovimentacaoEstoque {
  id: string;
  produtoId: string;
  produtoNome: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  motivo: string;
  lote: string;
  data: string;
  observacoes: string;
}

// Tipos para Usuários e Limites
export interface UserLimits {
  insumos: number;
  formulas: number;
  relatorios: number;
  cadastros: number;
}

export interface User {
  id: string;
  email: string;
  nome: string;
  funcao: string;
  avatar?: string;
  role: 'admin' | 'operador' | 'visualizador';
  limits: UserLimits;
}

export interface ReportTemplateConfig {
  id: string;
  name: string;
  logoSize: number;
  headerText: string;
  footerText: string;
  showSeparator: boolean;
}

export interface ReportAssignments {
  formula: string;
  proportion: string;
  pricing: string;
  venda: string;
}
