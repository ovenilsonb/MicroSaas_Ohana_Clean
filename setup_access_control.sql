-- ==============================================================================
-- SCRIPT DE CONFIGURAÇÃO DE CONTROLE DE ACESSO NO SUPABASE
-- ==============================================================================
-- Execute este script no SQL Editor do seu painel do Supabase.
-- Ele criará as tabelas necessárias para gerenciar grupos de acesso e perfis 
-- de usuários, além de configurar as políticas de segurança (RLS).

-- 1. Criar tabela de Grupos de Acesso (access_groups)
CREATE TABLE IF NOT EXISTS public.access_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Criar tabela de Perfis de Usuário (user_profiles)
-- Esta tabela estende a tabela auth.users nativa do Supabase
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

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.access_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para access_groups
-- Todos os usuários autenticados podem ler os grupos
CREATE POLICY "Permitir leitura de access_groups para usuários autenticados"
    ON public.access_groups
    FOR SELECT
    TO authenticated
    USING (true);

-- Apenas administradores podem gerenciar (inserir/atualizar/deletar) grupos
CREATE POLICY "Permitir gerenciamento de access_groups apenas para admins"
    ON public.access_groups
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- 5. Políticas para user_profiles
-- Todos os usuários autenticados podem ver os perfis (necessário para a tela de listagem)
CREATE POLICY "Permitir leitura de user_profiles para usuários autenticados"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Permitir que usuários atualizem o próprio perfil"
    ON public.user_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Apenas administradores podem gerenciar todos os perfis
CREATE POLICY "Permitir gerenciamento de user_profiles apenas para admins"
    ON public.user_profiles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- 6. Trigger para criar perfil automaticamente ao registrar novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, nome, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    -- O primeiro usuário a se cadastrar será admin automaticamente
    CASE WHEN (SELECT count(*) FROM public.user_profiles) = 0 THEN 'admin' ELSE 'operador' END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove a trigger se já existir para evitar erros
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Cria a trigger que é disparada após o insert na auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Inserir um grupo padrão de Administrador (Opcional)
INSERT INTO public.access_groups (name, description, permissions)
VALUES (
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
) ON CONFLICT DO NOTHING;
