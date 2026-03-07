-- =====================================================
-- OHANA CLEAN - Sistema de Gestão Industrial
-- Script SQL Completo para Supabase
-- =====================================================
-- IMPORTANTE: Execute este script no SQL Editor do Supabase
-- Ele vai recriar TODAS as tabelas com estrutura limpa
-- =====================================================

-- =====================================================
-- 1. REMOVER TABELAS EXISTENTES (ordem correta por dependências)
-- =====================================================
DROP TABLE IF EXISTS public.anotacoes CASCADE;
DROP TABLE IF EXISTS public.formula_historico CASCADE;
DROP TABLE IF EXISTS public.formula_insumos CASCADE;
DROP TABLE IF EXISTS public.insumo_variantes CASCADE;
DROP TABLE IF EXISTS public.insumo_movimentacoes CASCADE;
DROP TABLE IF EXISTS public.regras_preco CASCADE;
DROP TABLE IF EXISTS public.precificacao CASCADE;
DROP TABLE IF EXISTS public.movimentacoes_estoque CASCADE;
DROP TABLE IF EXISTS public.produtos_estoque CASCADE;
DROP TABLE IF EXISTS public.ordens_producao CASCADE;
DROP TABLE IF EXISTS public.pedido_itens CASCADE;
DROP TABLE IF EXISTS public.pedidos CASCADE;
DROP TABLE IF EXISTS public.listas_preco CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;
DROP TABLE IF EXISTS public.formulas CASCADE;
DROP TABLE IF EXISTS public.grupos CASCADE;
DROP TABLE IF EXISTS public.insumos CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.access_groups CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =====================================================
-- 2. TABELAS BASE
-- =====================================================

CREATE TABLE public.insumos (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  apelido TEXT,
  codigo TEXT,
  unidade TEXT NOT NULL,
  valor_unitario NUMERIC NOT NULL DEFAULT 0,
  fornecedor TEXT,
  estoque NUMERIC NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC NOT NULL DEFAULT 0,
  validade TEXT,
  validade_indeterminada BOOLEAN DEFAULT false,
  quimico BOOLEAN DEFAULT false,
  foto TEXT,
  imagem TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.insumo_variantes (
  id TEXT PRIMARY KEY,
  insumo_id TEXT REFERENCES public.insumos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  codigo TEXT,
  valor_unitario NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.grupos (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.formulas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo TEXT,
  descricao TEXT,
  grupo_id TEXT REFERENCES public.grupos(id) ON DELETE SET NULL,
  peso_volume TEXT,
  unidade TEXT,
  rendimento NUMERIC NOT NULL DEFAULT 1,
  observacoes TEXT,
  status TEXT DEFAULT 'rascunho',
  lista_insumo TEXT,
  prefixo_lote TEXT,
  custo_total NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.formula_insumos (
  id TEXT PRIMARY KEY,
  formula_id TEXT REFERENCES public.formulas(id) ON DELETE CASCADE,
  insumo_id TEXT REFERENCES public.insumos(id) ON DELETE SET NULL,
  variante_id TEXT,
  nome TEXT NOT NULL,
  unidade TEXT,
  quantidade NUMERIC NOT NULL DEFAULT 0,
  valor_unitario NUMERIC DEFAULT 0,
  custo NUMERIC DEFAULT 0,
  quimico BOOLEAN DEFAULT false,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.formula_historico (
  id TEXT PRIMARY KEY,
  formula_id TEXT REFERENCES public.formulas(id) ON DELETE CASCADE,
  data TIMESTAMPTZ DEFAULT NOW(),
  acao TEXT,
  detalhes TEXT
);

CREATE TABLE public.clientes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  documento TEXT,
  tipo TEXT DEFAULT 'pf',
  endereco_rua TEXT,
  endereco_numero TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  endereco_estado TEXT,
  endereco_cep TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.listas_preco (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  aplicar_a TEXT DEFAULT 'produto',
  ativo BOOLEAN DEFAULT true,
  regras JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.pedidos (
  id TEXT PRIMARY KEY,
  numero TEXT NOT NULL,
  tipo TEXT DEFAULT 'venda',
  cliente_id TEXT,
  cliente TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  desconto NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  forma_pagamento TEXT,
  tipo_entrega TEXT,
  lista_preco_id TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ordens_producao (
  id TEXT PRIMARY KEY,
  numero TEXT NOT NULL,
  pedido_id TEXT,
  pedido_numero TEXT,
  cliente TEXT,
  formula_id TEXT,
  formula_nome TEXT,
  quantidade NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aguardando',
  prioridade TEXT DEFAULT 'normal',
  lote TEXT,
  observacoes TEXT,
  iniciado_em TEXT,
  concluido_em TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.produtos_estoque (
  id TEXT PRIMARY KEY,
  formula_id TEXT,
  nome TEXT NOT NULL,
  codigo TEXT,
  quantidade NUMERIC NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC NOT NULL DEFAULT 0,
  unidade TEXT,
  ultima_entrada TEXT,
  ultima_saida TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.movimentacoes_estoque (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  produto_id TEXT,
  produto_nome TEXT,
  quantidade NUMERIC NOT NULL DEFAULT 0,
  motivo TEXT,
  referencia TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.precificacao (
  id TEXT PRIMARY KEY,
  formula_id TEXT,
  custos_fixos NUMERIC NOT NULL DEFAULT 0,
  preco_varejo NUMERIC NOT NULL DEFAULT 0,
  preco_atacado NUMERIC NOT NULL DEFAULT 0,
  preco_fardo NUMERIC NOT NULL DEFAULT 0,
  quantidade_fardo NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.anotacoes (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL DEFAULT '',
  conteudo TEXT NOT NULL DEFAULT '',
  cor TEXT DEFAULT '#fbbf24',
  fixada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. TABELAS DE ACESSO E USUÁRIOS
-- =====================================================

CREATE TABLE public.access_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  funcao TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'operador',
  role_id UUID REFERENCES public.access_groups(id) ON DELETE SET NULL,
  limits JSONB DEFAULT '{"insumos": 100, "formulas": 50, "relatorios": 100, "cadastros": 100}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insumo_variantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formula_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formula_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listas_preco ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t_name text;
BEGIN
  FOR t_name IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
      'insumos', 'insumo_variantes', 'grupos', 'formulas', 'formula_insumos',
      'formula_historico', 'clientes', 'listas_preco', 'pedidos',
      'ordens_producao', 'produtos_estoque', 'movimentacoes_estoque',
      'precificacao', 'anotacoes', 'access_groups', 'user_profiles'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all for authenticated" ON public.%I;', t_name);
    EXECUTE format('CREATE POLICY "Allow all for authenticated" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);', t_name);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all for anon" ON public.%I;', t_name);
    EXECUTE format('CREATE POLICY "Allow all for anon" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true);', t_name);
  END LOOP;
END $$;

-- =====================================================
-- 5. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_insumos_codigo ON public.insumos(codigo);
CREATE INDEX idx_insumos_nome ON public.insumos(nome);
CREATE INDEX idx_formulas_codigo ON public.formulas(codigo);
CREATE INDEX idx_formulas_grupo ON public.formulas(grupo_id);
CREATE INDEX idx_clientes_documento ON public.clientes(documento);
CREATE INDEX idx_pedidos_numero ON public.pedidos(numero);
CREATE INDEX idx_pedidos_cliente ON public.pedidos(cliente_id);
CREATE INDEX idx_ordens_pedido ON public.ordens_producao(pedido_id);
CREATE INDEX idx_estoque_formula ON public.produtos_estoque(formula_id);
CREATE INDEX idx_precificacao_formula ON public.precificacao(formula_id);

-- =====================================================
-- 6. GRUPO ADMINISTRADOR PADRÃO
-- =====================================================

INSERT INTO public.access_groups (id, name, description, permissions)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Administrador',
  'Acesso total ao sistema',
  '{
    "insumos": ["view", "create", "edit", "delete", "copy"],
    "formulas": ["view", "create", "edit", "delete", "copy"],
    "precificacao": ["view", "create", "edit", "delete", "copy"],
    "vendas": ["view", "create", "edit", "delete", "copy"],
    "producao": ["view", "create", "edit", "delete", "copy"],
    "estoque": ["view", "create", "edit", "delete", "copy"],
    "clientes": ["view", "create", "edit", "delete", "copy"],
    "relatorios": ["view", "create", "edit", "delete", "copy"],
    "configuracoes": ["view", "create", "edit", "delete", "copy"],
    "usuarios": ["view", "create", "edit", "delete", "copy"]
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 7. CONFIGURAR USUÁRIO ADMINISTRADOR (contato@ohanaclean.com.br)
-- =====================================================

INSERT INTO public.user_profiles (id, email, nome, role, role_id)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  CASE WHEN email = 'contato@ohanaclean.com.br' THEN 'admin' ELSE 'operador' END,
  CASE WHEN email = 'contato@ohanaclean.com.br' THEN '00000000-0000-0000-0000-000000000000'::uuid ELSE NULL END
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET
  role = CASE WHEN EXCLUDED.email = 'contato@ohanaclean.com.br' THEN 'admin' ELSE public.user_profiles.role END,
  role_id = CASE WHEN EXCLUDED.email = 'contato@ohanaclean.com.br' THEN '00000000-0000-0000-0000-000000000000'::uuid ELSE public.user_profiles.role_id END;

-- =====================================================
-- 8. TRIGGER PARA NOVOS USUÁRIOS
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, nome, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'operador'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================================
-- FIM DO SCRIPT
-- Execute no SQL Editor do Supabase
-- =====================================================
