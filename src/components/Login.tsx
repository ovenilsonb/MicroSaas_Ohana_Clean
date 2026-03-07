import React, { useState } from 'react';
import { Lock, Mail, Shield, AlertCircle, Eye, EyeOff, Building2, Database } from 'lucide-react';
import { User as UserType } from '../types';
import { Modal } from './Modal';
import SupabaseConfig from './SupabaseConfig';
import { getSupabase } from '../lib/supabase';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'recovery'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDbConfig, setShowDbConfig] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = getSupabase();
    if (!supabase) {
      setError('Banco de dados não configurado. Clique em "Configurar Banco de Dados".');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (authError) {
          throw authError;
        }

        if (authData.user) {
          // Fetch user profile
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (profileError) {
            console.error('Erro ao buscar perfil:', profileError);
            // Fallback if profile doesn't exist yet
            const fallbackUser: UserType = {
              id: authData.user.id,
              email: authData.user.email || email,
              nome: authData.user.user_metadata?.full_name || email.split('@')[0],
              funcao: 'Usuário',
              role: 'operador',
              limits: {
                insumos: 100,
                formulas: 100,
                relatorios: 100,
                cadastros: 100
              }
            };
            onLogin(fallbackUser);
          } else {
            const user: UserType = {
              id: profileData.id,
              email: profileData.email,
              nome: profileData.nome,
              funcao: profileData.funcao || 'Usuário',
              role: profileData.role,
              roleId: profileData.role_id,
              avatar: profileData.avatar,
              limits: profileData.limits || {
                insumos: 100,
                formulas: 100,
                relatorios: 100,
                cadastros: 100
              }
            };
            onLogin(user);
          }
        }
      } else if (mode === 'signup') {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password
        });

        if (authError) {
          throw authError;
        }

        if (authData.user) {
          alert('Conta criada com sucesso! Verifique seu e-mail para confirmar a conta (se necessário) ou faça login.');
          setMode('login');
        }
      } else if (mode === 'recovery') {
        // Password recovery
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        
        if (resetError) {
          throw resetError;
        }
        
        alert('E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada.');
        setMode('login');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message === 'Invalid login credentials') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError(err.message || 'Ocorreu um erro ao tentar fazer login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#030712]">
      {/* Left Column - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-blue-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-[#030712]/90 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1584820927498-cafe2c1c9695?q=80&w=1974&auto=format&fit=crop" 
          alt="Produção de Lava Roupas" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
          referrerPolicy="no-referrer"
        />
        <div className="relative z-20 flex flex-col justify-center p-16 text-white h-full">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-600/30 mb-8 border border-blue-500/30 backdrop-blur-sm">
            <Building2 className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Gestão Inteligente para<br />
            <span className="text-blue-400">Produção de Saneantes</span>
          </h1>
          <p className="text-xl text-blue-100/80 max-w-lg leading-relaxed">
            Controle suas fórmulas, insumos, precificação e estoque em um único lugar com a Ohana Clean.
          </p>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-16">
        <div className="w-full max-w-md animate-fadeIn">
          {/* Mobile Header (only visible on small screens) */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-600/20 mb-4 border border-blue-500/30">
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Ohana Clean</h1>
            <p className="text-gray-400">Sistema de Gestão de Fórmulas e Insumos</p>
          </div>

          {/* Login Card */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-semibold text-white">
                {mode === 'login' ? 'Acessar Conta' : mode === 'signup' ? 'Criar Conta' : 'Recuperar Senha'}
              </h2>
              <Shield className="w-5 h-5 text-blue-500" />
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="exemplo@empresa.com"
                    required
                  />
                </div>
              </div>

              {mode !== 'recovery' && (
                <div>
                  <div className="flex items-center justify-between mb-2 ml-1">
                    <label className="block text-sm font-medium text-gray-400">
                      Senha de Acesso
                    </label>
                    {mode === 'login' && (
                      <button 
                        type="button"
                        onClick={() => setMode('recovery')}
                        className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                      >
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 bg-gray-800/50 border border-gray-700 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Aguarde...' : (mode === 'login' ? 'Entrar no Sistema' : mode === 'signup' ? 'Criar Conta' : 'Enviar Link de Recuperação')}
              </button>

              {mode === 'login' && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-2xl shadow-lg transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2 border border-gray-700"
                  >
                    Criar Nova Conta
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDbConfig(true)}
                    className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-2xl shadow-lg transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2 border border-gray-700"
                  >
                    <Database className="w-5 h-5" />
                    Configurar Banco de Dados
                  </button>
                </>
              )}

              {mode !== 'login' && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full text-sm text-gray-400 hover:text-white transition-colors py-2"
                >
                  Voltar para o Login
                </button>
              )}
            </form>
          </div>

          {/* Footer Info */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2026 Ohana Clean. Todos os direitos reservados.
            </p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <a href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Termos</a>
              <a href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Privacidade</a>
              <a href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Suporte</a>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Configuração do Banco */}
      <Modal
        isOpen={showDbConfig}
        onClose={() => setShowDbConfig(false)}
        title="Conexão com Banco de Dados"
        size="lg"
      >
        <SupabaseConfig />
      </Modal>
    </div>
  );
}

