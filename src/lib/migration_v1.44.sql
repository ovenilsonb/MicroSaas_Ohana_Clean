-- =====================================================
-- OHANA CLEAN - Migração v1.44.0 + v1.46.0
-- Novas tabelas e colunas necessárias
-- Execute no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- 1. ADICIONAR user_id NA TABELA anotacoes
-- =====================================================
ALTER TABLE public.anotacoes 
ADD COLUMN IF NOT EXISTS user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_anotacoes_user_id ON public.anotacoes(user_id);

-- =====================================================
-- 2. ADICIONAR PROPRIEDADES QUÍMICAS NA TABELA insumos
-- =====================================================
ALTER TABLE public.insumos 
ADD COLUMN IF NOT EXISTS peso_especifico TEXT,
ADD COLUMN IF NOT EXISTS ph TEXT,
ADD COLUMN IF NOT EXISTS temperatura TEXT,
ADD COLUMN IF NOT EXISTS viscosidade TEXT,
ADD COLUMN IF NOT EXISTS solubilidade TEXT,
ADD COLUMN IF NOT EXISTS risco TEXT;

-- =====================================================
-- 3. CRIAR TABELA insumo_movimentacoes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.insumo_movimentacoes (
  id TEXT PRIMARY KEY,
  insumo_id TEXT REFERENCES public.insumos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'entrada',
  data TEXT NOT NULL,
  quantidade NUMERIC NOT NULL DEFAULT 0,
  saldo_atual NUMERIC NOT NULL DEFAULT 0,
  fornecedor TEXT,
  lote TEXT,
  validade TEXT,
  documento TEXT,
  destino TEXT,
  pedido TEXT,
  responsavel TEXT,
  motivo TEXT,
  observacoes TEXT,
  usuario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insumo_movimentacoes_insumo ON public.insumo_movimentacoes(insumo_id);
CREATE INDEX IF NOT EXISTS idx_insumo_movimentacoes_tipo ON public.insumo_movimentacoes(tipo);

-- =====================================================
-- 4. RLS E POLICIES PARA insumo_movimentacoes
-- =====================================================
ALTER TABLE public.insumo_movimentacoes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Allow all for authenticated" ON public.insumo_movimentacoes;';
  EXECUTE 'CREATE POLICY "Allow all for authenticated" ON public.insumo_movimentacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);';
  EXECUTE 'DROP POLICY IF EXISTS "Allow all for anon" ON public.insumo_movimentacoes;';
  EXECUTE 'CREATE POLICY "Allow all for anon" ON public.insumo_movimentacoes FOR ALL TO anon USING (true) WITH CHECK (true);';
END $$;

-- =====================================================
-- 5. ADICIONAR unit_volume NA TABELA precificacao
-- =====================================================
ALTER TABLE public.precificacao
ADD COLUMN IF NOT EXISTS unit_volume NUMERIC DEFAULT 2;

-- =====================================================
-- 6. CRIAR TABELA listas_preco (SE NÃO EXISTIR)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.listas_preco (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  aplicar_a TEXT NOT NULL DEFAULT 'produto',
  ativo BOOLEAN NOT NULL DEFAULT true,
  regras JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listas_preco_nome ON public.listas_preco(nome);
CREATE INDEX IF NOT EXISTS idx_listas_preco_ativo ON public.listas_preco(ativo);

-- =====================================================
-- 7. RLS E POLICIES PARA listas_preco
-- =====================================================
ALTER TABLE public.listas_preco ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Allow all for authenticated" ON public.listas_preco;';
  EXECUTE 'CREATE POLICY "Allow all for authenticated" ON public.listas_preco FOR ALL TO authenticated USING (true) WITH CHECK (true);';
  EXECUTE 'DROP POLICY IF EXISTS "Allow all for anon" ON public.listas_preco;';
  EXECUTE 'CREATE POLICY "Allow all for anon" ON public.listas_preco FOR ALL TO anon USING (true) WITH CHECK (true);';
END $$;

-- =====================================================
-- 8. CRIAR TABELA insumo_variantes (SE NÃO EXISTIR)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.insumo_variantes (
  id TEXT PRIMARY KEY,
  insumo_id TEXT REFERENCES public.insumos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  codigo TEXT,
  valor_unitario NUMERIC NOT NULL DEFAULT 0,
  unidade TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.insumo_variantes
ADD COLUMN IF NOT EXISTS codigo TEXT;

CREATE INDEX IF NOT EXISTS idx_insumo_variantes_insumo ON public.insumo_variantes(insumo_id);

-- =====================================================
-- 9. RLS E POLICIES PARA insumo_variantes
-- =====================================================
ALTER TABLE public.insumo_variantes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Allow all for authenticated" ON public.insumo_variantes;';
  EXECUTE 'CREATE POLICY "Allow all for authenticated" ON public.insumo_variantes FOR ALL TO authenticated USING (true) WITH CHECK (true);';
  EXECUTE 'DROP POLICY IF EXISTS "Allow all for anon" ON public.insumo_variantes;';
  EXECUTE 'CREATE POLICY "Allow all for anon" ON public.insumo_variantes FOR ALL TO anon USING (true) WITH CHECK (true);';
END $$;

-- =====================================================
-- FIM DA MIGRAÇÃO v1.44.0 + v1.46.0
-- =====================================================
