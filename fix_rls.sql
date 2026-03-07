-- Script para corrigir as permissões (RLS) do Supabase

-- 1. Primeiro, vamos garantir que o usuário admin@ohanaclean.com.br seja um admin
-- Se a tabela user_profiles existir, vamos atualizar o role dele
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'admin@ohanaclean.com.br';

-- 2. Vamos recriar as políticas de segurança para garantir que funcionem
-- Removemos as políticas antigas
DROP POLICY IF EXISTS "Permitir gerenciamento de access_groups apenas para admins" ON public.access_groups;
DROP POLICY IF EXISTS "Permitir gerenciamento de user_profiles apenas para admins" ON public.user_profiles;

-- 3. Criamos políticas mais simples e robustas para os admins
-- Para access_groups:
CREATE POLICY "Permitir gerenciamento de access_groups apenas para admins"
    ON public.access_groups
    FOR ALL
    TO authenticated
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    )
    WITH CHECK (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );

-- Para user_profiles:
CREATE POLICY "Permitir gerenciamento de user_profiles apenas para admins"
    ON public.user_profiles
    FOR ALL
    TO authenticated
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    )
    WITH CHECK (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );

-- 4. Se você não tem a tabela user_profiles ou ela está vazia, 
-- e você quer apenas liberar o acesso total temporariamente para testar,
-- você pode rodar os comandos abaixo (DESCOMENTE SE PRECISAR):

/*
DROP POLICY IF EXISTS "Permitir gerenciamento de access_groups apenas para admins" ON public.access_groups;
CREATE POLICY "Permitir tudo em access_groups" ON public.access_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir gerenciamento de user_profiles apenas para admins" ON public.user_profiles;
CREATE POLICY "Permitir tudo em user_profiles" ON public.user_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
*/
