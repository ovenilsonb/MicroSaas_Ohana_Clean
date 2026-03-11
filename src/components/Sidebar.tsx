import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  FlaskConical,
  Factory,
  Warehouse,
  ShoppingCart,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
  StickyNote,
  LogOut,
  FileText,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { currentVersion } from '../version';
import { User, AccessGroup } from '../types';
import { getVisibleModules } from '../utils/permissions';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  darkMode: boolean;
  companyName?: string;
  companyLogo?: string;
  onLogout?: () => void;
  currentUser: User | null;
  groups: AccessGroup[];
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'insumos', label: 'Insumos', icon: Package },
  { id: 'formulas', label: 'Fórmulas', icon: FlaskConical },
  { id: 'precificacao', label: 'Precificação', icon: DollarSign },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
  { id: 'estoque', label: 'Estoque', icon: Warehouse },
  { id: 'relatorios', label: 'Relatórios', icon: FileText },
];

const producaoItem = { id: 'producao', label: 'Produção', icon: Factory };

export function Sidebar({
  activeModule,
  setActiveModule,
  collapsed,
  setCollapsed,
  darkMode,
  companyName = 'Ohana Clean',
  companyLogo,
  onLogout,
  currentUser,
  groups
}: SidebarProps) {
  const visibleModules = getVisibleModules(currentUser, groups);
  const [blockedNotice, setBlockedNotice] = useState<string | null>(null);

  const handleModuleClick = (moduleId: string, label: string) => {
    if (!visibleModules.includes(moduleId)) {
      setBlockedNotice(label);
      setTimeout(() => setBlockedNotice(null), 2500);
      return;
    }
    setActiveModule(moduleId);
    if (window.innerWidth < 768) {
      setCollapsed(true);
    }
  };

  return (
    <aside
      className={`liquid-glass fixed left-0 top-0 h-screen bg-gradient-to-b ${
        darkMode
          ? 'from-gray-900/90 via-gray-900/85 to-gray-950/90'
          : 'from-blue-600/90 via-blue-700/85 to-blue-800/90'
      } text-white flex flex-col transition-all duration-300 z-40 ${
        collapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-full md:w-64'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 ${collapsed ? 'px-3 py-4 justify-center' : 'px-4 py-4'}`}>
        {companyLogo ? (
          <img
            src={companyLogo}
            alt={companyName}
            className={`rounded-xl object-contain flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-12 h-12' : 'w-14 h-14'}`}
            style={{ background: 'transparent' }}
          />
        ) : (
          <div className={`bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-12 h-12' : 'w-14 h-14'}`}>
            <span className={`${collapsed ? 'text-2xl' : 'text-3xl'}`}>💧</span>
          </div>
        )}
        {!collapsed && (
          <div className="animate-fadeIn truncate flex-1 min-w-0">
            <h1 className="font-bold text-lg leading-tight truncate" title={companyName}>{companyName}</h1>
            <p className="text-xs text-white/70">Sistema de Gestão</p>
            <p className="text-[10px] text-white/40 mt-1">v{currentVersion}</p>
          </div>
        )}

        {/* Mobile Close Button */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="md:hidden p-2 hover:bg-white/10 rounded-xl transition-colors ml-auto flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Blocked Notice */}
      <AnimatePresence>
        {blockedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mx-3 mb-2 px-3 py-2 bg-red-500/20 border border-red-500/40 rounded-xl flex items-center gap-2 text-red-300 text-xs"
          >
            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
            {!collapsed && (
              <span>Sem acesso a <strong>{blockedNotice}</strong></span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          const isLocked = !visibleModules.includes(item.id);

          return (
            <button
              key={item.id}
              onClick={() => handleModuleClick(item.id, item.label)}
              className={`liquid-glass-item w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
                isActive
                  ? 'bg-blue-800 dark:bg-blue-900 shadow-lg shadow-black/20 sidebar-active-curved -mr-3'
                  : isLocked
                  ? 'opacity-40 cursor-pointer hover:opacity-55 rounded-xl'
                  : 'hover:bg-white/10 rounded-xl'
              }`}
            >
              {isActive && (
                <>
                  <span className="sidebar-curve-top" />
                  <span className="sidebar-curve-bottom" />
                </>
              )}
              <motion.div
                animate={isActive ? {
                  scale: [1, 1.1, 1],
                  y: [0, -2, 0]
                } : {
                  scale: 1,
                  y: 0
                }}
                transition={isActive ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : {
                  duration: 0.3
                }}
                className="relative"
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-white/70'}`} />
                {isLocked && (
                  <Lock className="absolute -top-1 -right-1 w-2.5 h-2.5 text-red-400" />
                )}
              </motion.div>
              {!collapsed && (
                <span className={`font-medium flex-1 text-left ${isActive ? 'text-white' : 'text-white/70'}`}>
                  {item.label}
                </span>
              )}
              {!collapsed && isLocked && (
                <Lock className="w-3 h-3 text-red-400/70" />
              )}
            </button>
          );
        })}

        {/* Separador + Produção */}
        <>
          <div className="my-4 border-t border-white/10" />
          {(() => {
            const isLocked = !visibleModules.includes(producaoItem.id);
            return (
              <button
                onClick={() => handleModuleClick(producaoItem.id, producaoItem.label)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
                  activeModule === producaoItem.id
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30 sidebar-active-curved -mr-3'
                    : isLocked
                    ? 'opacity-40 cursor-pointer hover:opacity-55 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/20 rounded-xl'
                    : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/40 hover:to-orange-500/40 border border-amber-400/30 rounded-xl'
                }`}
              >
                {activeModule === producaoItem.id && (
                  <>
                    <span className="sidebar-curve-top sidebar-curve-producao" />
                    <span className="sidebar-curve-bottom sidebar-curve-producao" />
                  </>
                )}
                <div className={`p-1.5 rounded-lg relative ${activeModule === producaoItem.id ? 'bg-white/20' : 'bg-amber-400/20'}`}>
                  <producaoItem.icon className={`w-5 h-5 flex-shrink-0 ${activeModule === producaoItem.id ? 'text-white' : 'text-amber-400'}`} />
                  {isLocked && (
                    <Lock className="absolute -top-1 -right-1 w-2.5 h-2.5 text-red-400" />
                  )}
                </div>
                {!collapsed && (
                  <div className="flex-1 text-left">
                    <span className={`font-semibold block ${activeModule === producaoItem.id ? 'text-white' : 'text-amber-300'}`}>
                      {producaoItem.label}
                    </span>
                    <span className={`text-xs ${activeModule === producaoItem.id ? 'text-white/70' : 'text-amber-400/70'}`}>
                      Iniciar produção
                    </span>
                  </div>
                )}
                {!collapsed && !isLocked && (
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    activeModule === producaoItem.id
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-400/20 text-amber-300'
                  }`}>
                    🔥
                  </span>
                )}
                {!collapsed && isLocked && (
                  <Lock className="w-3 h-3 text-red-400/70" />
                )}
              </button>
            );
          })()}
        </>
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-2">
        {/* Anotações */}
        <button
          onClick={() => handleModuleClick('anotacoes', 'Anotações')}
          className={`liquid-glass-item w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
            activeModule === 'anotacoes'
              ? 'bg-blue-800 dark:bg-blue-900 shadow-lg shadow-black/20 sidebar-active-curved -mr-3'
              : 'hover:bg-white/10 rounded-xl'
          }`}
        >
          {activeModule === 'anotacoes' && (
            <>
              <span className="sidebar-curve-top" />
              <span className="sidebar-curve-bottom" />
            </>
          )}
          <motion.div
            animate={activeModule === 'anotacoes' ? { scale: 1.2, rotate: [0, -10, 10, 0] } : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StickyNote className={`w-5 h-5 flex-shrink-0 ${activeModule === 'anotacoes' ? 'text-white' : 'text-white/70'}`} />
          </motion.div>
          {!collapsed && (
            <span className={`font-medium ${activeModule === 'anotacoes' ? 'text-white' : 'text-white/70'}`}>
              Anotações
            </span>
          )}
        </button>

        {/* Usuários e Acessos */}
        {(() => {
          const isLocked = !visibleModules.includes('usuarios');
          return (
            <button
              onClick={() => handleModuleClick('usuarios', 'Usuários e Acessos')}
              className={`liquid-glass-item w-full flex items-center gap-3 px-4 py-3 transition-all ${
                activeModule === 'usuarios'
                  ? 'active sidebar-active-curved -mr-3 bg-blue-800 dark:bg-blue-900 shadow-lg shadow-black/20'
                  : isLocked
                  ? 'opacity-40 hover:opacity-55 rounded-xl'
                  : 'rounded-xl'
              }`}
            >
              {activeModule === 'usuarios' && (
                <>
                  <span className="sidebar-curve-top" />
                  <span className="sidebar-curve-bottom" />
                </>
              )}
              <motion.div
                animate={activeModule === 'usuarios' ? { scale: 1.2, rotate: [0, -10, 10, 0] } : { scale: 1, rotate: 0 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <ShieldCheck className={`w-5 h-5 flex-shrink-0 ${activeModule === 'usuarios' ? 'text-white' : 'text-white/70'}`} />
                {isLocked && (
                  <Lock className="absolute -top-1 -right-1 w-2.5 h-2.5 text-red-400" />
                )}
              </motion.div>
              {!collapsed && (
                <span className={`font-medium flex-1 text-left ${activeModule === 'usuarios' ? 'text-white' : 'text-white/70'}`}>
                  Usuários e Acessos
                </span>
              )}
              {!collapsed && isLocked && (
                <Lock className="w-3 h-3 text-red-400/70" />
              )}
            </button>
          );
        })()}

        {/* Configurações */}
        {(() => {
          const isLocked = !visibleModules.includes('config');
          return (
            <button
              onClick={() => handleModuleClick('config', 'Configurações')}
              className={`liquid-glass-item w-full flex items-center gap-3 px-4 py-3 transition-all ${
                activeModule === 'config'
                  ? 'active sidebar-active-curved -mr-3 bg-blue-800 dark:bg-blue-900 shadow-lg shadow-black/20'
                  : isLocked
                  ? 'opacity-40 hover:opacity-55 rounded-xl'
                  : 'rounded-xl'
              }`}
            >
              {activeModule === 'config' && (
                <>
                  <span className="sidebar-curve-top" />
                  <span className="sidebar-curve-bottom" />
                </>
              )}
              <motion.div
                animate={activeModule === 'config' ? { rotate: 90 } : { rotate: 0 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <Settings className="w-5 h-5 text-white/70" />
                {isLocked && (
                  <Lock className="absolute -top-1 -right-1 w-2.5 h-2.5 text-red-400" />
                )}
              </motion.div>
              {!collapsed && (
                <span className="font-medium text-white/70 flex-1 text-left">Configurações</span>
              )}
              {!collapsed && isLocked && (
                <Lock className="w-3 h-3 text-red-400/70" />
              )}
            </button>
          );
        })()}

        {/* Sair */}
        <button
          onClick={onLogout}
          className="liquid-glass-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-red-500/20 text-red-400 dark:text-[#FF626C]"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && (
            <span className="font-medium">Sair</span>
          )}
        </button>

        {/* Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-white/10 transition-all"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-white/70" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-white/70" />
          )}
        </button>
      </div>
    </aside>
  );
}
