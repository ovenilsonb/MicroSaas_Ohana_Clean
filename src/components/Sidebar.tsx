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
} from 'lucide-react';
import { motion } from 'framer-motion';
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

// Produção fica separado como item especial
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
      <div className="p-6 flex items-center gap-3">
        {companyLogo ? (
          <img src={companyLogo} alt={companyName} className="w-10 h-10 rounded-xl object-cover flex-shrink-0 bg-white/20 backdrop-blur-sm" />
        ) : (
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-xl">💧</span>
          </div>
        )}
        {!collapsed && (
          <div className="animate-fadeIn truncate flex-1">
            <h1 className="font-bold text-lg leading-tight truncate" title={companyName}>{companyName}</h1>
            <p className="text-xs text-white/70">Sistema de Gestão</p>
            <p className="text-[10px] text-white/40 mt-1">v{currentVersion}</p>
          </div>
        )}
        
        {/* Mobile Close Button */}
        {!collapsed && (
          <button 
            onClick={() => setCollapsed(true)}
            className="md:hidden p-2 hover:bg-white/10 rounded-xl transition-colors ml-auto"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.filter(item => visibleModules.includes(item.id)).map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveModule(item.id);
                if (window.innerWidth < 768) {
                  setCollapsed(true);
                }
              }}
              className={`liquid-glass-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-800 dark:bg-blue-900 shadow-lg shadow-black/20'
                  : 'hover:bg-white/10'
              }`}
            >
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
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-white/70'}`} />
              </motion.div>
              {!collapsed && (
                <span className={`font-medium ${isActive ? 'text-white' : 'text-white/70'}`}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}

        {/* Separador */}
        {visibleModules.includes(producaoItem.id) && (
          <>
            <div className="my-4 border-t border-white/10" />

            {/* Produção - Item Especial com Destaque */}
            <button
              onClick={() => {
                setActiveModule(producaoItem.id);
                if (window.innerWidth < 768) {
                  setCollapsed(true);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeModule === producaoItem.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30'
                  : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/40 hover:to-orange-500/40 border border-amber-400/30'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${activeModule === producaoItem.id ? 'bg-white/20' : 'bg-amber-400/20'}`}>
                <producaoItem.icon className={`w-5 h-5 flex-shrink-0 ${activeModule === producaoItem.id ? 'text-white' : 'text-amber-400'}`} />
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
              {!collapsed && (
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                  activeModule === producaoItem.id 
                    ? 'bg-white/20 text-white' 
                    : 'bg-amber-400/20 text-amber-300'
                }`}>
                  🔥
                </span>
              )}
            </button>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-2">
        {/* Anotações */}
        <button
          onClick={() => {
            setActiveModule('anotacoes');
            if (window.innerWidth < 768) {
              setCollapsed(true);
            }
          }}
          className={`liquid-glass-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeModule === 'anotacoes'
              ? 'bg-blue-800 dark:bg-blue-900 shadow-lg shadow-black/20'
              : 'hover:bg-white/10'
          }`}
        >
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
        {visibleModules.includes('usuarios') && (
          <button
            onClick={() => setActiveModule('usuarios')}
            className={`liquid-glass-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeModule === 'usuarios'
                ? 'active'
                : ''
            }`}
          >
            <motion.div
              animate={activeModule === 'usuarios' ? { scale: 1.2, rotate: [0, -10, 10, 0] } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ShieldCheck className={`w-5 h-5 flex-shrink-0 ${activeModule === 'usuarios' ? 'text-white' : 'text-white/70'}`} />
            </motion.div>
            {!collapsed && (
              <span className={`font-medium ${activeModule === 'usuarios' ? 'text-white' : 'text-white/70'}`}>
                Usuários e Acessos
              </span>
            )}
          </button>
        )}

        {/* Configurações */}
        {visibleModules.includes('config') && (
          <button
            onClick={() => setActiveModule('config')}
            className={`liquid-glass-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeModule === 'config'
                ? 'active'
                : ''
            }`}
          >
            <motion.div
              animate={activeModule === 'config' ? { rotate: 90 } : { rotate: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Settings className="w-5 h-5 text-white/70" />
            </motion.div>
            {!collapsed && (
              <span className="font-medium text-white/70">Configurações</span>
            )}
          </button>
        )}

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
