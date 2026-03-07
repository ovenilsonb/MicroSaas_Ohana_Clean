-- ==============================================================================
-- SCRIPT DEFINITIVO DE CONFIGURAÇÃO DE USUÁRIOS E PERMISSÕES
-- ==============================================================================

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

-- 3. Inserir o grupo Administrador Padrão (com ID fixo para facilitar)
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

-- 4. Sincronizar TODOS os usuários que já existem no Supabase para a tabela user_profiles
-- E dar a eles o cargo de 'admin' e o grupo 'Administrador' para você não perder o acesso
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

-- 5. Trigger para criar perfil automaticamente para NOVOS usuários
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

-- 6. Configurar Políticas de Segurança (RLS)
-- Vamos deixar permissivo para usuários autenticados para evitar bloqueios na sua gestão
ALTER TABLE public.access_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir tudo em access_groups" ON public.access_groups;
CREATE POLICY "Permitir tudo em access_groups" 
    ON public.access_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir tudo em user_profiles" ON public.user_profiles;
CREATE POLICY "Permitir tudo em user_profiles" 
    ON public.user_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
