import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Menu,
} from 'lucide-react';
import { currentVersion } from '../version';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  userName: string;
  userPhoto?: string;
  onOpenProfile: () => void;
  onOpenConfig: () => void;
  onLogout?: () => void;
  supabaseStatus?: 'connected' | 'disconnected' | 'local';
}

const notifications = [
  { id: 1, title: 'Estoque baixo', desc: 'Lauril está abaixo do mínimo', time: '5 min', type: 'warning' },
  { id: 2, title: 'Produção concluída', desc: 'Lote LRP-2025-001 finalizado', time: '1 hora', type: 'success' },
  { id: 3, title: 'Nova venda', desc: 'Pedido #1234 recebido', time: '2 horas', type: 'info' },
];

export function Header({ 
  collapsed, 
  setCollapsed,
  userName, 
  userPhoto,
  onOpenProfile,
  onOpenConfig,
  onLogout,
  supabaseStatus,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 z-30 flex items-center justify-between px-4 md:px-6 transition-all duration-300 left-0 ${
        collapsed ? 'md:left-20' : 'md:left-64'
      }`}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Version Badge */}
        <div className="hidden md:flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          v{currentVersion}
        </div>

        {/* Supabase Status Indicator */}
        {supabaseStatus && (
          <button
            onClick={onOpenConfig}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              supabaseStatus === 'connected' 
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' 
                : supabaseStatus === 'disconnected'
                ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
            }`}
            title="Status do Banco de Dados"
          >
            <div className={`w-2 h-2 rounded-full ${
              supabaseStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 
              supabaseStatus === 'disconnected' ? 'bg-red-500' : 'bg-amber-500'
            }`} />
            <span className="hidden sm:inline">
              {supabaseStatus === 'connected' ? 'Sync' : 
               supabaseStatus === 'disconnected' ? 'Off' : 'Local'}
            </span>
          </button>
        )}

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fadeIn">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        notif.type === 'warning' ? 'bg-amber-500' :
                        notif.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{notif.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{notif.desc}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{notif.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {userPhoto ? (
              <img src={userPhoto} alt="" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="font-medium text-sm text-gray-700 dark:text-gray-200">{userName}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fadeIn">
              <button
                onClick={() => { setShowUserMenu(false); onOpenProfile(); }}
                className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
              >
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-200">Meu Perfil</span>
              </button>
              <button
                onClick={() => { setShowUserMenu(false); onOpenConfig(); }}
                className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
              >
                <Settings className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-200">Configurações</span>
              </button>
              <div className="border-t border-gray-100 dark:border-gray-700" />
              <button 
                onClick={() => { setShowUserMenu(false); onLogout?.(); }}
                className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left text-red-600 dark:text-[#FF626C]"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sair</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
