import React, { useState } from 'react';
import { Lock, Mail, Shield, AlertCircle, Eye, EyeOff, Building2, Database } from 'lucide-react';
import { User as UserType } from '../types';
import { Modal } from './Modal';
import SupabaseConfig from './SupabaseConfig';
import { getSupabase } from '../lib/supabase';
import { ParticleNetwork } from './ParticleNetwork';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'recovery'>('login');
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
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (profileError) {
            console.error('Erro ao buscar perfil:', profileError);
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
      } else if (mode === 'recovery') {
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
      {/* Left Column - Animated Factory */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#030c1f] overflow-hidden group cursor-pointer transition-shadow duration-500 hover:shadow-[inset_0_0_150px_rgba(59,130,246,0.2)]">
        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/60 via-[#030c1f]/40 to-[#030712]/80 z-10 pointer-events-none transition-opacity duration-700 group-hover:opacity-80" />

        {/* 3D Particle Network Scene */}
        <ParticleNetwork />

        {/* Text overlay — centered at the very top */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-start px-10 pt-24 text-white text-center pointer-events-none pb-20">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600/20 mb-8 border border-blue-500/30 backdrop-blur-md transition-all duration-700 group-hover:bg-blue-500/30 group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(59,130,246,0.4)]"
            style={{ animation: 'floatIcon 4s ease-in-out infinite' }}
          >
            <Building2 className="w-10 h-10 text-blue-400 transition-colors duration-700 group-hover:text-blue-300" />
          </div>
          <h1
            className="text-5xl font-extrabold mb-6 leading-tight drop-shadow-2xl tracking-tight transition-all duration-700 group-hover:tracking-wide"
            style={{ animation: 'fadeSlideUp 0.9s ease both' }}
          >
            Gestão Inteligente para<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-200 group-hover:from-blue-300 group-hover:to-white transition-all duration-700">Produção de Saneantes</span>
          </h1>
          <p
            className="text-lg text-blue-100/70 max-w-md leading-relaxed drop-shadow-md font-medium transition-colors duration-700 group-hover:text-blue-100"
            style={{ animation: 'fadeSlideUp 1.1s ease both' }}
          >
            Controle fórmulas, insumos, precificação e estoque em um único lugar com total eficiência.
          </p>

          {/* Cleaning products floating illustration */}
          <div
            className="absolute bottom-16 left-0 right-0 flex items-end justify-center gap-12 px-8"
            style={{ animation: 'fadeSlideUp 1.4s ease both' }}
          >
            {/* Spray bottle */}
            <div style={{ animation: 'floatA 5s ease-in-out infinite' }}>
              <svg width="56" height="90" viewBox="0 0 56 90" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.75">
                <rect x="18" y="30" width="26" height="52" rx="6" fill="#1e3a6e" stroke="#3b82f6" strokeWidth="1.5"/>
                <rect x="18" y="30" width="26" height="14" rx="3" fill="#163570"/>
                <rect x="10" y="20" width="8" height="26" rx="3" fill="#1e3a6e" stroke="#3b82f6" strokeWidth="1.5"/>
                <rect x="10" y="16" width="20" height="8" rx="3" fill="#2563eb" opacity="0.8"/>
                <line x1="30" y1="14" x2="50" y2="6" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.6"/>
                <circle cx="50" cy="5" r="3" fill="#60a5fa" opacity="0.7"/>
                <rect x="22" y="50" width="18" height="3" rx="1.5" fill="#3b82f6" opacity="0.4"/>
                <rect x="22" y="58" width="12" height="3" rx="1.5" fill="#3b82f6" opacity="0.3"/>
                <rect x="22" y="66" width="15" height="3" rx="1.5" fill="#3b82f6" opacity="0.3"/>
              </svg>
            </div>

            {/* Detergent bottle */}
            <div style={{ animation: 'floatB 6s ease-in-out infinite' }}>
              <svg width="48" height="100" viewBox="0 0 48 100" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.75">
                <rect x="10" y="28" width="28" height="64" rx="8" fill="#0f2a55" stroke="#3b82f6" strokeWidth="1.5"/>
                <rect x="16" y="16" width="16" height="16" rx="4" fill="#1e3a6e" stroke="#2563eb" strokeWidth="1.5"/>
                <rect x="20" y="8" width="8" height="10" rx="3" fill="#2563eb"/>
                <rect x="14" y="44" width="20" height="24" rx="4" fill="#163570" opacity="0.6"/>
                <rect x="16" y="47" width="16" height="3" rx="1.5" fill="#60a5fa" opacity="0.5"/>
                <rect x="16" y="54" width="10" height="3" rx="1.5" fill="#60a5fa" opacity="0.4"/>
                <rect x="16" y="61" width="13" height="3" rx="1.5" fill="#60a5fa" opacity="0.4"/>
              </svg>
            </div>

            {/* Bucket */}
            <div style={{ animation: 'floatA 7s ease-in-out infinite', animationDelay: '1s' }}>
              <svg width="62" height="80" viewBox="0 0 62 80" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.75">
                <path d="M8 28 L14 74 Q14 78 20 78 L42 78 Q48 78 48 74 L54 28 Z" fill="#0f2040" stroke="#3b82f6" strokeWidth="1.5"/>
                <rect x="8" y="24" width="46" height="8" rx="4" fill="#1e3a6e" stroke="#3b82f6" strokeWidth="1.5"/>
                <path d="M20 24 Q31 10 42 24" stroke="#2563eb" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                <ellipse cx="31" cy="54" rx="16" ry="6" fill="#1e4080" opacity="0.5"/>
                <rect x="16" y="38" width="30" height="3" rx="1.5" fill="#3b82f6" opacity="0.35"/>
                <rect x="18" y="46" width="26" height="3" rx="1.5" fill="#3b82f6" opacity="0.3"/>
              </svg>
            </div>

            {/* Flask */}
            <div style={{ animation: 'floatB 4.5s ease-in-out infinite', animationDelay: '0.5s' }}>
              <svg width="38" height="75" viewBox="0 0 38 75" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.7">
                <rect x="14" y="4" width="10" height="20" rx="3" fill="#1e3a6e" stroke="#3b82f6" strokeWidth="1.5"/>
                <path d="M10 24 L4 66 Q4 72 10 72 L28 72 Q34 72 34 66 L28 24 Z" fill="#0f2040" stroke="#3b82f6" strokeWidth="1.5"/>
                <ellipse cx="19" cy="54" rx="10" ry="5" fill="#1e4080" opacity="0.6"/>
                <rect x="12" y="2" width="14" height="5" rx="2.5" fill="#2563eb"/>
                <circle cx="19" cy="52" r="4" fill="#22c55e" opacity="0.4">
                  <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite"/>
                </circle>
              </svg>
            </div>
          </div>

          <style>{`
            @keyframes floatIcon {
              0%, 100% { transform: translateY(0px); }
              50%       { transform: translateY(-8px); }
            }
            @keyframes floatA {
              0%, 100% { transform: translateY(0px); }
              50%       { transform: translateY(-12px); }
            }
            @keyframes floatB {
              0%, 100% { transform: translateY(0px); }
              50%       { transform: translateY(-16px); }
            }
            @keyframes fadeSlideUp {
              from { opacity: 0; transform: translateY(24px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-16">
        <div className="w-full max-w-md animate-fadeIn">
          {/* Mobile Header */}
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
                {mode === 'login' ? 'Acessar Conta' : 'Recuperar Senha'}
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
                  <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">
                    Senha de Acesso
                  </label>
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
                {loading ? 'Aguarde...' : (mode === 'login' ? 'Entrar no Sistema' : 'Enviar Link de Recuperação')}
              </button>

              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setShowDbConfig(true)}
                  className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-2xl shadow-lg transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2 border border-gray-700"
                >
                  <Database className="w-5 h-5" />
                  Configurar Banco de Dados
                </button>
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
