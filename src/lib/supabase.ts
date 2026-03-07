import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url') || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase_anon_key') || '';
  return { url, key };
};

export const setSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('supabase_url', url);
  localStorage.setItem('supabase_anon_key', key);
  supabaseInstance = null;
};

export const getSupabase = (): SupabaseClient | null => {
  const { url, key } = getSupabaseConfig();

  if (!url || !key) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key);
  }

  return supabaseInstance;
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return !!(url && key);
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  const supabase = getSupabase();

  if (!supabase) {
    return { success: false, error: 'Supabase não configurado' };
  }

  try {
    const { error } = await supabase.from('insumos').select('id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        return { success: true };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Erro ao conectar com Supabase' };
  }
};

export const getSession = async () => {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
};

export const signOut = async () => {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
};
