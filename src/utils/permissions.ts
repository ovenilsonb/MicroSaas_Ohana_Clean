import { User, AccessGroup, ActionType } from '../types';

export const hasPermission = (
  user: User | null,
  groups: AccessGroup[],
  module: string,
  action: ActionType
): boolean => {
  if (!user) return false;
  
  // Admin tem acesso a tudo
  if (user.role === 'admin') return true;
  
  // Se não tem grupo, não tem acesso
  if (!user.roleId) return false;
  
  const userGroup = groups.find(g => g.id === user.roleId);
  if (!userGroup) return false;
  
  const modulePermissions = userGroup.permissions[module as keyof typeof userGroup.permissions];
  if (!modulePermissions) return false;
  
  return modulePermissions.includes(action);
};

export const getVisibleModules = (user: User | null, groups: AccessGroup[]): string[] => {
  if (!user) return [];
  
  // Admin vê tudo
  if (user.role === 'admin') {
    return [
      'dashboard', 'insumos', 'formulas', 'precificacao', 'clientes', 
      'vendas', 'estoque', 'producao', 'relatorios', 'anotacoes', 
      'usuarios', 'config'
    ];
  }
  
  if (!user.roleId) return ['dashboard']; // Dashboard básico sempre visível? Ou nada?
  
  const userGroup = groups.find(g => g.id === user.roleId);
  if (!userGroup) return ['dashboard'];
  
  const visibleModules: string[] = ['dashboard', 'anotacoes']; // Sempre visíveis
  
  // Verifica cada módulo se tem pelo menos a permissão 'view'
  const modulesToCheck = [
    'insumos', 'formulas', 'precificacao', 'clientes', 
    'vendas', 'estoque', 'producao', 'relatorios', 
    'usuarios', 'configuracoes'
  ];
  
  modulesToCheck.forEach(module => {
    const perms = userGroup.permissions[module as keyof typeof userGroup.permissions];
    if (perms && perms.includes('view')) {
      // Mapeia 'configuracoes' para 'config' que é o id usado no Sidebar
      visibleModules.push(module === 'configuracoes' ? 'config' : module);
    }
  });
  
  return visibleModules;
};
