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

        {/* Factory SVG Scene */}
        <svg
          className="absolute inset-0 w-full h-full transition-transform duration-1000 ease-out group-hover:scale-105 group-active:scale-95"
          viewBox="0 0 800 900"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#050f24" />
              <stop offset="100%" stopColor="#020810" />
            </linearGradient>
            <linearGradient id="buildingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f2040" />
              <stop offset="100%" stopColor="#060e20" />
            </linearGradient>
            <linearGradient id="buildingGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0a1a35" />
              <stop offset="100%" stopColor="#050c1a" />
            </linearGradient>
            <linearGradient id="gearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e4080" />
              <stop offset="100%" stopColor="#0d2255" />
            </linearGradient>
            <linearGradient id="gearGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#163570" />
              <stop offset="100%" stopColor="#0a1c45" />
            </linearGradient>
            <linearGradient id="conveyorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0d2255" />
              <stop offset="50%" stopColor="#1a3a6e" />
              <stop offset="100%" stopColor="#0d2255" />
            </linearGradient>
            <radialGradient id="glowBlue" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="glowOrange" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="smokeGrad" cx="50%" cy="100%" r="60%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glowStrong">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <clipPath id="scene">
              <rect width="800" height="900" />
            </clipPath>
          </defs>

          {/* ── Background ── */}
          <rect width="800" height="900" fill="url(#bgGrad)" />

          {/* Stars */}
          {[
            [50,40],[120,80],[200,20],[310,55],[420,30],[530,70],[650,25],[740,60],
            [80,150],[180,130],[290,160],[400,110],[500,140],[620,100],[720,170],
          ].map(([cx,cy],i) => (
            <circle key={i} cx={cx} cy={cy} r="1.2" fill="#93c5fd" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.1;0.6" dur={`${2+i*0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}

          {/* ── Background Buildings (silhouettes) ── */}
          <rect x="30" y="420" width="80" height="400" fill="#061020" opacity="0.9" />
          <rect x="50" y="400" width="40" height="30" fill="#061020" opacity="0.9" />
          <rect x="150" y="380" width="100" height="440" fill="#071222" opacity="0.85" />
          <rect x="165" y="355" width="15" height="30" fill="#071222" opacity="0.85" />
          <rect x="185" y="360" width="15" height="25" fill="#071222" opacity="0.85" />
          <rect x="600" y="400" width="90" height="420" fill="#061020" opacity="0.9" />
          <rect x="680" y="430" width="110" height="390" fill="#050f1e" opacity="0.9" />
          <rect x="700" y="410" width="20" height="25" fill="#050f1e" opacity="0.9" />

          {/* Windows (background buildings) */}
          {[
            [55,440],[55,480],[55,520],[55,560],
            [80,440],[80,480],[80,520],[80,560],
            [160,395],[160,430],[160,470],[160,510],[160,550],
            [185,395],[185,430],[185,470],[185,510],[185,550],
            [210,395],[210,430],[210,470],[210,510],[210,550],
            [610,420],[610,460],[610,500],[610,540],
            [640,420],[640,460],[640,500],[640,540],
            [690,450],[690,490],[690,530],[690,570],
            [720,450],[720,490],[720,530],[720,570],
            [750,450],[750,490],[750,530],[750,570],
          ].map(([x,y],i) => (
            <rect key={i} x={x} y={y} width="12" height="8" rx="1" fill="#1e3a6e" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.3;0.8" dur={`${3+i*0.4}s`} repeatCount="indefinite" />
            </rect>
          ))}

          {/* ── Main Factory Building ── */}
          <rect x="200" y="500" width="420" height="400" fill="url(#buildingGrad)" rx="4" />
          {/* Roof structures */}
          <rect x="220" y="480" width="380" height="30" fill="#0d2040" rx="3" />
          <rect x="240" y="460" width="100" height="25" fill="#0b1c38" rx="2" />
          <rect x="480" y="460" width="100" height="25" fill="#0b1c38" rx="2" />
          {/* Factory door */}
          <rect x="355" y="700" width="90" height="200" fill="#050e20" rx="4" />
          <line x1="400" y1="700" x2="400" y2="900" stroke="#0d2040" strokeWidth="2" />
          {/* Factory windows grid */}
          {[
            [220,510],[280,510],[340,510],[400,510],[460,510],[520,510],[560,510],
            [220,560],[280,560],[340,560],[400,560],[460,560],[520,560],[560,560],
            [220,610],[280,610],[340,610],[400,610],[460,610],[520,610],[560,610],
            [220,660],[280,660],[340,660],[460,660],[520,660],[560,660],
          ].map(([x,y],i) => (
            <rect key={i} x={x} y={y} width="40" height="28" rx="3" fill="#0a2050">
              <animate attributeName="fill" values="#0a2050;#1a4090;#0a2050" dur={`${4+i*0.5}s`} repeatCount="indefinite" />
            </rect>
          ))}

          {/* ── Side Building Left ── */}
          <rect x="100" y="560" width="120" height="340" fill="url(#buildingGrad2)" rx="3" />
          <rect x="110" y="545" width="100" height="20" fill="#0a1c38" rx="2" />

          {/* ── Side Building Right ── */}
          <rect x="590" y="560" width="120" height="340" fill="url(#buildingGrad2)" rx="3" />
          <rect x="600" y="545" width="100" height="20" fill="#0a1c38" rx="2" />

          {/* ── Chimneys ── */}
          {/* Chimney 1 */}
          <rect x="250" y="300" width="35" height="185" fill="#0c1c38" rx="4" />
          <rect x="244" y="292" width="47" height="16" fill="#0f2040" rx="3" />
          {/* Chimney 2 */}
          <rect x="480" y="320" width="35" height="165" fill="#0c1c38" rx="4" />
          <rect x="474" y="312" width="47" height="16" fill="#0f2040" rx="3" />
          {/* Chimney 3 (small side) */}
          <rect x="140" y="410" width="25" height="155" fill="#0a1830" rx="3" />
          <rect x="135" y="403" width="35" height="12" fill="#0d2040" rx="2" />

          {/* ── Smoke animations ── */}
          {/* Chimney 1 smoke */}
          {[0,1,2,3].map(i => (
            <ellipse key={i} cx="267" cy="290" rx="18" ry="12" fill="#60a5fa" opacity="0">
              <animate attributeName="cy" values="290;180;80" dur={`${3+i*0.7}s`} begin={`${i*0.8}s`} repeatCount="indefinite" />
              <animate attributeName="rx" values="18;32;50" dur={`${3+i*0.7}s`} begin={`${i*0.8}s`} repeatCount="indefinite" />
              <animate attributeName="ry" values="12;22;35" dur={`${3+i*0.7}s`} begin={`${i*0.8}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0.18;0.12;0" dur={`${3+i*0.7}s`} begin={`${i*0.8}s`} repeatCount="indefinite" />
            </ellipse>
          ))}
          {/* Chimney 2 smoke */}
          {[0,1,2].map(i => (
            <ellipse key={i} cx="497" cy="310" rx="16" ry="10" fill="#93c5fd" opacity="0">
              <animate attributeName="cy" values="310;200;100" dur={`${2.5+i*0.6}s`} begin={`${i*0.9}s`} repeatCount="indefinite" />
              <animate attributeName="rx" values="16;28;44" dur={`${2.5+i*0.6}s`} begin={`${i*0.9}s`} repeatCount="indefinite" />
              <animate attributeName="ry" values="10;20;30" dur={`${2.5+i*0.6}s`} begin={`${i*0.9}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0.2;0.1;0" dur={`${2.5+i*0.6}s`} begin={`${i*0.9}s`} repeatCount="indefinite" />
            </ellipse>
          ))}
          {/* Chimney 3 smoke */}
          {[0,1].map(i => (
            <ellipse key={i} cx="152" cy="402" rx="12" ry="8" fill="#60a5fa" opacity="0">
              <animate attributeName="cy" values="402;320;240" dur={`${2+i*0.5}s`} begin={`${i}s`} repeatCount="indefinite" />
              <animate attributeName="rx" values="12;20;32" dur={`${2+i*0.5}s`} begin={`${i}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0.15;0" dur={`${2+i*0.5}s`} begin={`${i}s`} repeatCount="indefinite" />
            </ellipse>
          ))}

          {/* ── Large Gear Center ── */}
          <g transform="translate(400,635)">
            <g>
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="12s" repeatCount="indefinite" />
              <circle r="55" fill="url(#gearGrad)" stroke="#2563eb" strokeWidth="2" opacity="0.9" />
              <circle r="43" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.4" />
              <circle r="15" fill="#051030" stroke="#2563eb" strokeWidth="2" />
              {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg,i) => (
                <rect key={i} x="-8" y="-65" width="16" height="14" rx="3"
                  fill="#1e4080" stroke="#3b82f6" strokeWidth="1"
                  transform={`rotate(${deg})`} />
              ))}
            </g>
            <circle r="6" fill="#3b82f6" filter="url(#glow)" />
          </g>

          {/* ── Medium Gear Left ── */}
          <g transform="translate(290,635)">
            <g>
              <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="8s" repeatCount="indefinite" />
              <circle r="38" fill="url(#gearGrad2)" stroke="#1d4ed8" strokeWidth="1.5" opacity="0.9" />
              <circle r="28" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.3" />
              <circle r="10" fill="#051030" stroke="#1d4ed8" strokeWidth="1.5" />
              {[0,45,90,135,180,225,270,315].map((deg,i) => (
                <rect key={i} x="-5.5" y="-46" width="11" height="10" rx="2"
                  fill="#163570" stroke="#2563eb" strokeWidth="1"
                  transform={`rotate(${deg})`} />
              ))}
            </g>
            <circle r="4" fill="#60a5fa" filter="url(#glow)" />
          </g>

          {/* ── Medium Gear Right ── */}
          <g transform="translate(510,635)">
            <g>
              <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="9s" repeatCount="indefinite" />
              <circle r="38" fill="url(#gearGrad2)" stroke="#1d4ed8" strokeWidth="1.5" opacity="0.9" />
              <circle r="28" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.3" />
              <circle r="10" fill="#051030" stroke="#1d4ed8" strokeWidth="1.5" />
              {[0,45,90,135,180,225,270,315].map((deg,i) => (
                <rect key={i} x="-5.5" y="-46" width="11" height="10" rx="2"
                  fill="#163570" stroke="#2563eb" strokeWidth="1"
                  transform={`rotate(${deg})`} />
              ))}
            </g>
            <circle r="4" fill="#60a5fa" filter="url(#glow)" />
          </g>

          {/* ── Small Gears ── */}
          <g transform="translate(210,560)">
            <g>
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="5s" repeatCount="indefinite" />
              <circle r="22" fill="url(#gearGrad)" stroke="#2563eb" strokeWidth="1.5" />
              <circle r="8" fill="#051030" stroke="#2563eb" strokeWidth="1" />
              {[0,60,120,180,240,300].map((deg,i) => (
                <rect key={i} x="-4" y="-28" width="8" height="8" rx="2"
                  fill="#1a3868" stroke="#3b82f6" strokeWidth="0.8"
                  transform={`rotate(${deg})`} />
              ))}
            </g>
          </g>

          <g transform="translate(590,560)">
            <g>
              <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="6s" repeatCount="indefinite" />
              <circle r="22" fill="url(#gearGrad)" stroke="#2563eb" strokeWidth="1.5" />
              <circle r="8" fill="#051030" stroke="#2563eb" strokeWidth="1" />
              {[0,60,120,180,240,300].map((deg,i) => (
                <rect key={i} x="-4" y="-28" width="8" height="8" rx="2"
                  fill="#1a3868" stroke="#3b82f6" strokeWidth="0.8"
                  transform={`rotate(${deg})`} />
              ))}
            </g>
          </g>

          {/* Gear axles / belts */}
          <line x1="328" y1="635" x2="362" y2="635" stroke="#2563eb" strokeWidth="3" strokeDasharray="4,3" opacity="0.5">
            <animate attributeName="strokeDashoffset" values="0;-14" dur="0.5s" repeatCount="indefinite" />
          </line>
          <line x1="438" y1="635" x2="472" y2="635" stroke="#2563eb" strokeWidth="3" strokeDasharray="4,3" opacity="0.5">
            <animate attributeName="strokeDashoffset" values="0;-14" dur="0.5s" repeatCount="indefinite" />
          </line>

          {/* ── Conveyor Belt ── */}
          <rect x="180" y="750" width="460" height="22" rx="4" fill="#081830" />
          <rect x="180" y="765" width="460" height="10" rx="0" fill="#0d2040" />
          {/* Belt lines */}
          {Array.from({length:20}).map((_,i) => (
            <line key={i} x1={180+i*25} y1="750" x2={180+i*25} y2="772" stroke="#163570" strokeWidth="2">
              <animate attributeName="x1" values={`${180+i*25};${180+i*25-25}`} dur="2s" repeatCount="indefinite" />
              <animate attributeName="x2" values={`${180+i*25};${180+i*25-25}`} dur="2s" repeatCount="indefinite" />
            </line>
          ))}
          {/* Belt rollers */}
          <ellipse cx="185" cy="761" rx="12" ry="12" fill="#0f2040" stroke="#2563eb" strokeWidth="1.5" />
          <ellipse cx="635" cy="761" rx="12" ry="12" fill="#0f2040" stroke="#2563eb" strokeWidth="1.5" />
          <g transform="translate(185,761)">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2s" repeatCount="indefinite" additive="sum" />
            <line x1="0" y1="-10" x2="0" y2="10" stroke="#2563eb" strokeWidth="1.5" />
            <line x1="-10" y1="0" x2="10" y2="0" stroke="#2563eb" strokeWidth="1.5" />
          </g>
          <g transform="translate(635,761)">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2s" repeatCount="indefinite" additive="sum" />
            <line x1="0" y1="-10" x2="0" y2="10" stroke="#2563eb" strokeWidth="1.5" />
            <line x1="-10" y1="0" x2="10" y2="0" stroke="#2563eb" strokeWidth="1.5" />
          </g>

          {/* Items on conveyor */}
          {[0,1,2].map(i => (
            <g key={i}>
              <rect y="-18" width="28" height="18" rx="3" fill="#0f2a55" stroke="#2563eb" strokeWidth="1">
                <animateTransform attributeName="transform" type="translate" values={`${580-i*140},750;${180-i*140+460+28},750`} dur="6s" begin={`${i*2}s`} repeatCount="indefinite" />
              </rect>
              <circle r="4" fill="#60a5fa">
                <animateTransform attributeName="transform" type="translate" values={`${594-i*140},736;${194-i*140+460+28},736`} dur="6s" begin={`${i*2}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;1;0;0" dur="6s" begin={`${i*2}s`} repeatCount="indefinite" />
              </circle>
            </g>
          ))}

          {/* ── Indicator lights / status panel ── */}
          <rect x="310" y="485" width="180" height="12" rx="3" fill="#081830" />
          {['#22c55e','#3b82f6','#f59e0b','#22c55e','#3b82f6'].map((c,i) => (
            <circle key={i} cx={322+i*34} cy="491" r="4" fill={c} filter="url(#glow)">
              <animate attributeName="opacity" values="1;0.3;1" dur={`${1+i*0.4}s`} repeatCount="indefinite" />
            </circle>
          ))}

          {/* ── Pipe system ── */}
          <rect x="235" y="540" width="12" height="120" fill="#0a1c38" rx="2" />
          <rect x="235" y="540" width="80" height="12" fill="#0a1c38" rx="2" />
          <rect x="315" y="540" width="12" height="60" fill="#0a1c38" rx="2" />
          <rect x="553" y="540" width="12" height="120" fill="#0a1c38" rx="2" />
          <rect x="485" y="540" width="80" height="12" fill="#0a1c38" rx="2" />
          <rect x="485" y="540" width="12" height="60" fill="#0a1c38" rx="2" />
          {/* Pipe glows */}
          <rect x="238" y="543" width="6" height="114" fill="#3b82f6" opacity="0.12" rx="1" />
          <rect x="556" y="543" width="6" height="114" fill="#3b82f6" opacity="0.12" rx="1" />

          {/* ── Floor / ground glow ── */}
          <ellipse cx="400" cy="900" rx="350" ry="40" fill="#1d4ed8" opacity="0.08" />

          {/* ── Floating particles ── */}
          {[
            {cx:320,cy:700,dur:"4s",begin:"0s"},
            {cx:450,cy:680,dur:"5s",begin:"1s"},
            {cx:380,cy:720,dur:"3.5s",begin:"0.5s"},
            {cx:500,cy:710,dur:"4.5s",begin:"1.5s"},
            {cx:300,cy:690,dur:"3s",begin:"2s"},
            {cx:560,cy:695,dur:"5.5s",begin:"0.8s"},
          ].map((p,i)=>(
            <circle key={i} cx={p.cx} cy={p.cy} r="2.5" fill="#60a5fa" opacity="0">
              <animate attributeName="cy" values={`${p.cy};${p.cy-80};${p.cy-160}`} dur={p.dur} begin={p.begin} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0.6;0" dur={p.dur} begin={p.begin} repeatCount="indefinite" />
            </circle>
          ))}

          {/* ── Blue glow accent bottom ── */}
          <ellipse cx="400" cy="800" rx="200" ry="60" fill="url(#glowBlue)" opacity="0.3" />
        </svg>

        {/* Text overlay — centered vertically and horizontally */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-10 text-white text-center pointer-events-none pb-20">
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
