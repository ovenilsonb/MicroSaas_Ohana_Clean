-- =====================================================
-- OHANA CLEAN - Sistema de Gestão Industrial
-- Script SQL para Supabase
-- Versão 1.31.0
-- =====================================================

-- =====================================================
-- IMPORTANTE: Execute este script no SQL Editor do Supabase
-- Este script usa TEXT para IDs para compatibilidade com
-- o sistema que gera IDs como strings simples
-- =====================================================

-- =====================================================
-- TABELA: INSUMOS
-- =====================================================
DROP TABLE IF EXISTS formula_historico CASCADE;
DROP TABLE IF EXISTS formula_insumos CASCADE;
DROP TABLE IF EXISTS insumo_variantes CASCADE;
DROP TABLE IF EXISTS regras_preco CASCADE;
DROP TABLE IF EXISTS precificacao CASCADE;
DROP TABLE IF EXISTS movimentacoes_estoque CASCADE;
DROP TABLE IF EXISTS produtos_estoque CASCADE;
DROP TABLE IF EXISTS ordens_producao CASCADE;
DROP TABLE IF EXISTS pedido_itens CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS listas_preco CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS formulas CASCADE;
DROP TABLE IF EXISTS grupos CASCADE;
DROP TABLE IF EXISTS insumos CASCADE;

CREATE TABLE insumos (
  id TEXT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  codigo VARCHAR(50),
  unidade VARCHAR(20) NOT NULL,
  valor_unitario DECIMAL(10,4) NOT NULL DEFAULT 0,
  fornecedor VARCHAR(255),
  estoque DECIMAL(10,2) DEFAULT 0,
  estoque_minimo DECIMAL(10,2) DEFAULT 0,
  validade DATE,
  validade_indeterminada BOOLEAN DEFAULT FALSE,
  quimico BOOLEAN DEFAULT FALSE,
  foto TEXT,
  imagem TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: VARIANTES DE INSUMOS
-- =====================================================
CREATE TABLE insumo_variantes (
  id TEXT PRIMARY KEY,
  insumo_id TEXT REFERENCES insumos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  codigo VARCHAR(50),
  valor_unitario DECIMAL(10,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: GRUPOS DE FÓRMULAS
-- =====================================================
CREATE TABLE grupos (
  id TEXT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cor VARCHAR(20) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: FÓRMULAS
-- =====================================================
CREATE TABLE formulas (
  id TEXT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  codigo VARCHAR(50),
  descricao TEXT,
  grupo_id TEXT REFERENCES grupos(id),
  peso_volume VARCHAR(50),
  unidade VARCHAR(20),
  rendimento INTEGER DEFAULT 1,
  observacoes TEXT,
  status VARCHAR(20) DEFAULT 'rascunho',
  lista_insumo VARCHAR(255),
  prefixo_lote VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: INSUMOS DA FÓRMULA
-- =====================================================
CREATE TABLE formula_insumos (
  id TEXT PRIMARY KEY,
  formula_id TEXT REFERENCES formulas(id) ON DELETE CASCADE,
  insumo_id TEXT REFERENCES insumos(id),
  variante_id TEXT REFERENCES insumo_variantes(id),
  nome VARCHAR(255) NOT NULL,
  unidade VARCHAR(20),
  quantidade DECIMAL(10,3) NOT NULL DEFAULT 0,
  valor_unitario DECIMAL(10,4) DEFAULT 0,
  quimico BOOLEAN DEFAULT FALSE,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: HISTÓRICO DE ALTERAÇÕES DA FÓRMULA
-- =====================================================
CREATE TABLE formula_historico (
  id TEXT PRIMARY KEY,
  formula_id TEXT REFERENCES formulas(id) ON DELETE CASCADE,
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acao VARCHAR(255),
  detalhes TEXT
);

-- =====================================================
-- TABELA: CLIENTES
-- =====================================================
CREATE TABLE clientes (
  id TEXT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(50),
  documento VARCHAR(50),
  tipo VARCHAR(50) DEFAULT 'pf',
  endereco_rua VARCHAR(255),
  endereco_numero VARCHAR(20),
  endereco_bairro VARCHAR(100),
  endereco_cidade VARCHAR(100),
  endereco_estado VARCHAR(50),
  endereco_cep VARCHAR(20),
  observacoes TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: LISTAS DE PREÇO
-- =====================================================
CREATE TABLE listas_preco (
  id TEXT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: PEDIDOS
-- =====================================================
CREATE TABLE pedidos (
  id TEXT PRIMARY KEY,
  numero VARCHAR(50) NOT NULL,
  tipo VARCHAR(20) DEFAULT 'venda',
  cliente_id TEXT REFERENCES clientes(id),
  cliente_nome VARCHAR(255),
  cliente_telefone VARCHAR(50),
  cliente_email VARCHAR(255),
  cliente_endereco TEXT,
  forma_pagamento VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pendente',
  subtotal DECIMAL(10,2) DEFAULT 0,
  desconto DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  observacoes TEXT,
  lista_preco_id TEXT REFERENCES listas_preco(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: ITENS DO PEDIDO
-- =====================================================
CREATE TABLE pedido_itens (
  id TEXT PRIMARY KEY,
  pedido_id TEXT REFERENCES pedidos(id) ON DELETE CASCADE,
  formula_id TEXT REFERENCES formulas(id),
  nome VARCHAR(255) NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: ORDENS DE PRODUÇÃO
-- =====================================================
CREATE TABLE ordens_producao (
  id TEXT PRIMARY KEY,
  numero VARCHAR(50) NOT NULL,
  pedido_id TEXT REFERENCES pedidos(id),
  formula_id TEXT REFERENCES formulas(id),
  produto_nome VARCHAR(255) NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  lote VARCHAR(50),
  status VARCHAR(50) DEFAULT 'aguardando',
  prioridade VARCHAR(20) DEFAULT 'normal',
  cliente_nome VARCHAR(255),
  iniciado_em TIMESTAMP WITH TIME ZONE,
  concluido_em TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: PRODUTOS EM ESTOQUE
-- =====================================================
CREATE TABLE produtos_estoque (
  id TEXT PRIMARY KEY,
  formula_id TEXT REFERENCES formulas(id),
  nome VARCHAR(255) NOT NULL,
  quantidade INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 10,
  lote VARCHAR(50),
  validade DATE,
  localizacao VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: MOVIMENTAÇÕES DE ESTOQUE
-- =====================================================
CREATE TABLE movimentacoes_estoque (
  id TEXT PRIMARY KEY,
  produto_id TEXT REFERENCES produtos_estoque(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  motivo VARCHAR(255),
  referencia VARCHAR(255),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: REGRAS DE PREÇO
-- =====================================================
CREATE TABLE regras_preco (
  id TEXT PRIMARY KEY,
  lista_id TEXT REFERENCES listas_preco(id) ON DELETE CASCADE,
  aplicar_a VARCHAR(20) DEFAULT 'produto',
  formula_id TEXT REFERENCES formulas(id),
  grupo_id TEXT REFERENCES grupos(id),
  variante VARCHAR(255),
  tipo_preco VARCHAR(20) DEFAULT 'formula',
  margem DECIMAL(10,2) DEFAULT 0,
  preco_fixo DECIMAL(10,2),
  quantidade_minima INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: PRECIFICAÇÃO
-- =====================================================
CREATE TABLE precificacao (
  id TEXT PRIMARY KEY,
  formula_id TEXT REFERENCES formulas(id),
  custos_fixos DECIMAL(10,2) DEFAULT 0,
  preco_varejo DECIMAL(10,2),
  preco_atacado DECIMAL(10,2),
  preco_fardo DECIMAL(10,2),
  quantidade_fardo INTEGER DEFAULT 6,
  tipo_unidade VARCHAR(10) DEFAULT '2L',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumo_variantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE formula_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE formula_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE listas_preco ENABLE ROW LEVEL SECURITY;
ALTER TABLE regras_preco ENABLE ROW LEVEL SECURITY;
ALTER TABLE precificacao ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para desenvolvimento (CRUD completo)
-- Em produção, configure políticas mais restritivas com autenticação

CREATE POLICY "Allow all for insumos" ON insumos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for insumo_variantes" ON insumo_variantes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for grupos" ON grupos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for formulas" ON formulas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for formula_insumos" ON formula_insumos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for formula_historico" ON formula_historico FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for pedidos" ON pedidos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for pedido_itens" ON pedido_itens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for ordens_producao" ON ordens_producao FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for produtos_estoque" ON produtos_estoque FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for movimentacoes_estoque" ON movimentacoes_estoque FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for listas_preco" ON listas_preco FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for regras_preco" ON regras_preco FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for precificacao" ON precificacao FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_insumos_codigo ON insumos(codigo);
CREATE INDEX idx_insumos_nome ON insumos(nome);
CREATE INDEX idx_formulas_codigo ON formulas(codigo);
CREATE INDEX idx_formulas_grupo ON formulas(grupo_id);
CREATE INDEX idx_clientes_documento ON clientes(documento);
CREATE INDEX idx_pedidos_numero ON pedidos(numero);
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_ordens_pedido ON ordens_producao(pedido_id);
CREATE INDEX idx_estoque_formula ON produtos_estoque(formula_id);

-- =====================================================
-- FIM DO SCRIPT
-- Execute este script no SQL Editor do Supabase
-- Depois configure a URL e Anon Key no sistema
-- =====================================================
