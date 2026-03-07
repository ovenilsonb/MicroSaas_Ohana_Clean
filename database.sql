-- ==============================================================================
-- SCRIPT COMPLETO DE CRIAÇÃO DO BANCO DE DADOS OHANA
-- ==============================================================================

-- 1. Tabelas Base (com mapeamento snake_case no dataService.ts)

CREATE TABLE IF NOT EXISTS public.insumos (
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
    peso_especifico TEXT,
    ph TEXT,
    temperatura TEXT,
    viscosidade TEXT,
    solubilidade TEXT,
    risco TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.insumo_variantes (
    id TEXT PRIMARY KEY,
    insumo_id TEXT REFERENCES public.insumos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    codigo TEXT,
    valor_unitario NUMERIC NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.formulas (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    codigo TEXT,
    descricao TEXT,
    grupo_id TEXT,
    peso_volume TEXT,
    unidade TEXT,
    rendimento NUMERIC NOT NULL DEFAULT 1,
    observacoes TEXT,
    status TEXT DEFAULT 'rascunho',
    lista_insumo TEXT,
    prefixo_lote TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.formula_insumos (
    id TEXT PRIMARY KEY,
    formula_id TEXT REFERENCES public.formulas(id) ON DELETE CASCADE,
    insumo_id TEXT REFERENCES public.insumos(id) ON DELETE CASCADE,
    variante_id TEXT,
    nome TEXT NOT NULL,
    unidade TEXT NOT NULL,
    quantidade NUMERIC NOT NULL DEFAULT 0,
    valor_unitario NUMERIC NOT NULL DEFAULT 0,
    quimico BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.clientes (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Tabelas Genéricas (salvas diretamente do state do React, precisam de aspas para camelCase)

CREATE TABLE IF NOT EXISTS public.pedidos (
    id TEXT PRIMARY KEY,
    numero TEXT,
    "clienteId" TEXT,
    tipo TEXT NOT NULL,
    cliente TEXT,
    telefone TEXT,
    email TEXT,
    endereco TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    desconto NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    "formaPagamento" TEXT,
    "tipoEntrega" TEXT,
    "listaPrecoId" TEXT,
    observacoes TEXT,
    "createdAt" TEXT,
    "updatedAt" TEXT
);

CREATE TABLE IF NOT EXISTS public.ordens_producao (
    id TEXT PRIMARY KEY,
    numero TEXT,
    "pedidoId" TEXT,
    "pedidoNumero" TEXT,
    cliente TEXT,
    "formulaId" TEXT,
    "formulaNome" TEXT,
    quantidade NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    prioridade TEXT,
    lote TEXT,
    observacoes TEXT,
    "createdAt" TEXT,
    "updatedAt" TEXT,
    "iniciadoEm" TEXT,
    "concluidoEm" TEXT
);

CREATE TABLE IF NOT EXISTS public.produtos_estoque (
    id TEXT PRIMARY KEY,
    "formulaId" TEXT,
    nome TEXT NOT NULL,
    codigo TEXT,
    quantidade NUMERIC NOT NULL DEFAULT 0,
    "estoqueMinimo" NUMERIC NOT NULL DEFAULT 0,
    unidade TEXT,
    "ultimaEntrada" TEXT,
    "ultimaSaida" TEXT
);

CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL,
    "produtoId" TEXT,
    "produtoNome" TEXT,
    quantidade NUMERIC NOT NULL DEFAULT 0,
    motivo TEXT,
    referencia TEXT,
    "createdAt" TEXT
);

CREATE TABLE IF NOT EXISTS public.listas_preco (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    "aplicarA" TEXT,
    ativo BOOLEAN DEFAULT true,
    "dataCriacao" TEXT,
    regras JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.precificacao (
    id TEXT PRIMARY KEY,
    "formulaId" TEXT,
    "precoVarejo" NUMERIC NOT NULL DEFAULT 0,
    "precoAtacado" NUMERIC NOT NULL DEFAULT 0,
    "precoFardo" NUMERIC NOT NULL DEFAULT 0,
    "quantidadeFardo" NUMERIC NOT NULL DEFAULT 0,
    "custosFixos" NUMERIC NOT NULL DEFAULT 0,
    "updatedAt" TEXT
);

-- 3. Tabelas de Acesso e Usuários

CREATE TABLE IF NOT EXISTS public.access_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    nome TEXT NOT NULL,
    funcao TEXT,
    avatar TEXT,
    role TEXT DEFAULT 'operador',
    role_id UUID REFERENCES public.access_groups(id) ON DELETE SET NULL,
    limits JSONB DEFAULT '{"insumos": 100, "formulas": 50, "relatorios": 100, "cadastros": 100}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Configurar RLS (Row Level Security) para permitir acesso total a usuários autenticados

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insumo_variantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formula_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listas_preco ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas permissivas para usuários autenticados (para facilitar o uso inicial)
DO $$ 
DECLARE 
    t_name text;
BEGIN 
    FOR t_name IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('insumos', 'insumo_variantes', 'formulas', 'formula_insumos', 'clientes', 'pedidos', 'ordens_producao', 'produtos_estoque', 'movimentacoes_estoque', 'listas_preco', 'precificacao', 'access_groups', 'user_profiles')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Permitir tudo para autenticados" ON public.%I;', t_name);
        EXECUTE format('CREATE POLICY "Permitir tudo para autenticados" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);', t_name);
    END LOOP;
END $$;

-- 5. Inserir grupo Administrador Padrão
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

-- 6. Sincronizar usuários existentes
INSERT INTO public.user_profiles (id, email, nome, role, role_id)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 
    'admin',
    '00000000-0000-0000-0000-000000000000'
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', role_id = '00000000-0000-0000-0000-000000000000';

-- 7. Trigger para novos usuários
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
