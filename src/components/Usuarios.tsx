import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Shield, Users, Check, LayoutGrid, List, ArrowUpAZ, ArrowDownAZ } from 'lucide-react';
import { User, AccessGroup, ActionType, RolePermissions } from '../types';
import { Modal } from './Modal';
import { getSupabase, getSupabaseConfig } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';

interface UsuariosProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  groups: AccessGroup[];
  setGroups: React.Dispatch<React.SetStateAction<AccessGroup[]>>;
  currentUser?: User | null;
}

type TabType = 'usuarios' | 'grupos';
type ViewMode = 'grid' | 'list';
type SortMode = 'az' | 'za';

const defaultPermissions: RolePermissions = {
  insumos: [],
  formulas: [],
  precificacao: [],
  vendas: [],
  producao: [],
  estoque: [],
  clientes: [],
  relatorios: [],
  configuracoes: [],
  usuarios: []
};

const modules = [
  { id: 'insumos', label: 'Insumos' },
  { id: 'formulas', label: 'Fórmulas' },
  { id: 'precificacao', label: 'Precificação' },
  { id: 'vendas', label: 'Vendas' },
  { id: 'producao', label: 'Produção' },
  { id: 'estoque', label: 'Estoque' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'relatorios', label: 'Relatórios' },
  { id: 'configuracoes', label: 'Configurações' },
  { id: 'usuarios', label: 'Usuários e Acessos' }
];

const actions: { id: ActionType; label: string }[] = [
  { id: 'view', label: 'Visualizar' },
  { id: 'create', label: 'Criar' },
  { id: 'edit', label: 'Editar' },
  { id: 'delete', label: 'Excluir' },
  { id: 'copy', label: 'Copiar' }
];

export function Usuarios({ users, setUsers, groups, setGroups }: UsuariosProps) {
  const [activeTab, setActiveTab] = useState<TabType>('usuarios');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('az');
  const [searchTerm, setSearchTerm] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AccessGroup | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [groupForm, setGroupForm] = useState<Partial<AccessGroup>>({
    name: '',
    description: '',
    permissions: { ...defaultPermissions }
  });

  const [userForm, setUserForm] = useState<Partial<User> & { password?: string }>({
    nome: '',
    email: '',
    funcao: '',
    roleId: '',
    role: 'operador',
    password: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabase();
      if (!supabase) return;

      const [groupsRes, usersRes] = await Promise.all([
        supabase.from('access_groups').select('*'),
        supabase.from('user_profiles').select('*')
      ]);

      if (groupsRes.data) {
        setGroups(groupsRes.data.map(g => ({
          id: g.id,
          name: g.name,
          description: g.description,
          permissions: g.permissions
        })));
      }

      if (usersRes.data) {
        setUsers(usersRes.data.map(u => ({
          id: u.id,
          email: u.email,
          nome: u.nome,
          funcao: u.funcao || '',
          role: u.role,
          roleId: u.role_id,
          avatar: u.avatar,
          limits: u.limits || { insumos: 100, formulas: 100, relatorios: 100, cadastros: 100 }
        })));
      }
    };

    fetchData();
  }, [setGroups, setUsers]);

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name) return;

    const supabase = getSupabase();
    if (!supabase) return;

    if (editingGroup) {
      const { error } = await supabase
        .from('access_groups')
        .update({
          name: groupForm.name,
          description: groupForm.description,
          permissions: groupForm.permissions
        })
        .eq('id', editingGroup.id);

      if (error) {
        alert('Erro ao atualizar grupo: ' + error.message);
        return;
      }

      setGroups(prev => prev.map(g => g.id === editingGroup.id ? { ...g, ...groupForm } as AccessGroup : g));
    } else {
      const { data, error } = await supabase
        .from('access_groups')
        .insert({
          name: groupForm.name,
          description: groupForm.description || '',
          permissions: groupForm.permissions
        })
        .select()
        .single();

      if (error) {
        alert('Erro ao criar grupo: ' + error.message);
        return;
      }

      const newGroup: AccessGroup = {
        id: data.id,
        name: data.name,
        description: data.description,
        permissions: data.permissions
      };
      setGroups(prev => [...prev, newGroup]);
    }
    setShowGroupModal(false);
    setEditingGroup(null);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.nome || !userForm.email) return;

    const supabase = getSupabase();
    if (!supabase) return;

    if (editingUser) {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          nome: userForm.nome,
          funcao: userForm.funcao,
          role_id: userForm.roleId || null,
          role: userForm.role || 'operador'
        })
        .eq('id', editingUser.id);

      if (error) {
        alert('Erro ao atualizar usuário: ' + error.message);
        return;
      }

      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...userForm } as User : u));
    } else {
      if (!userForm.password) {
        alert('A senha é obrigatória para novos usuários.');
        return;
      }

      const { url, key } = getSupabaseConfig();
      const secondarySupabase = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });

      const { data, error } = await secondarySupabase.auth.signUp({
        email: userForm.email,
        password: userForm.password,
        options: {
          data: {
            full_name: userForm.nome,
          }
        }
      });

      if (error) {
        alert('Erro ao criar usuário: ' + error.message);
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            funcao: userForm.funcao,
            role_id: userForm.roleId || null
          })
          .eq('id', data.user.id);

        if (profileError) {
          console.error('Erro ao atualizar perfil do usuário:', profileError);
        }

        const newUser: User = {
          id: data.user.id,
          nome: userForm.nome,
          email: userForm.email,
          funcao: userForm.funcao || '',
          role: userForm.role || 'operador',
          roleId: userForm.roleId,
          limits: { insumos: 100, formulas: 100, relatorios: 100, cadastros: 100 }
        };
        setUsers(prev => [...prev, newUser]);
      }
    }
    setShowUserModal(false);
    setEditingUser(null);
  };

  const togglePermission = (module: string, action: ActionType) => {
    setGroupForm(prev => {
      const currentPerms = prev.permissions?.[module as keyof typeof prev.permissions] || [];
      const newPerms = currentPerms.includes(action)
        ? currentPerms.filter(a => a !== action)
        : [...currentPerms, action];

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [module]: newPerms
        } as any
      };
    });
  };

  const filteredUsers = users
    .filter(u =>
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => sortMode === 'az'
      ? a.nome.localeCompare(b.nome, 'pt-BR')
      : b.nome.localeCompare(a.nome, 'pt-BR')
    );

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Controle de Acesso</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie usuários e permissões do sistema</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              if (activeTab === 'usuarios') {
                setEditingUser(null);
                setUserForm({ nome: '', email: '', funcao: '', roleId: '', role: 'operador', password: '' });
                setShowUserModal(true);
              } else {
                setEditingGroup(null);
                setGroupForm({ name: '', description: '', permissions: { ...defaultPermissions } });
                setShowGroupModal(true);
              }
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            {activeTab === 'usuarios' ? 'Novo Usuário' : 'Novo Grupo'}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
        <div className="flex gap-2 w-full sm:w-auto bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`flex-1 sm:flex-none flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'usuarios'
                ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Usuários
          </button>
          <button
            onClick={() => setActiveTab('grupos')}
            className={`flex-1 sm:flex-none flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'grupos'
                ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            Grupos de Acesso
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* View controls — only for users tab */}
          {activeTab === 'usuarios' && (
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
              {/* Sort */}
              <button
                onClick={() => setSortMode(s => s === 'az' ? 'za' : 'az')}
                title={sortMode === 'az' ? 'Ordem A → Z' : 'Ordem Z → A'}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
              >
                {sortMode === 'az' ? <ArrowUpAZ className="w-4 h-4" /> : <ArrowDownAZ className="w-4 h-4" />}
              </button>

              {/* Grid view */}
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>

              {/* List view */}
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'usuarios' ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map(user => {
              const group = groups.find(g => g.id === user.roleId);
              const isAdmin = user.role === 'admin';

              return (
                <div key={user.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                        {user.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{user.nome}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setUserForm(user);
                          setShowUserModal(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!isAdmin && (
                        <button
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir este usuário?')) {
                              setUsers(prev => prev.filter(u => u.id !== user.id));
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{user.funcao || 'Sem função'}</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      isAdmin
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {isAdmin ? 'Administrador' : (group?.name || 'Sem Grupo')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Usuário</th>
                  <th className="px-5 py-3 text-left font-medium hidden sm:table-cell">E-mail</th>
                  <th className="px-5 py-3 text-left font-medium hidden md:table-cell">Função</th>
                  <th className="px-5 py-3 text-left font-medium">Acesso</th>
                  <th className="px-5 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredUsers.map(user => {
                  const group = groups.find(g => g.id === user.roleId);
                  const isAdmin = user.role === 'admin';

                  return (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm flex-shrink-0">
                            {user.nome.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{user.nome}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{user.email}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">{user.funcao || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          isAdmin
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {isAdmin ? 'Administrador' : (group?.name || 'Sem Grupo')}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setUserForm(user);
                              setShowUserModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!isAdmin && (
                            <button
                              onClick={() => {
                                if (confirm('Tem certeza que deseja excluir este usuário?')) {
                                  setUsers(prev => prev.filter(u => u.id !== user.id));
                                }
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="py-12 text-center text-gray-400 dark:text-gray-500">
                Nenhum usuário encontrado.
              </div>
            )}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map(group => (
            <div key={group.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    {group.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{group.description}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingGroup(group);
                      setGroupForm(group);
                      setShowGroupModal(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir este grupo? Usuários neste grupo perderão os acessos.')) {
                        setGroups(prev => prev.filter(g => g.id !== group.id));
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Módulos com acesso:</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(group.permissions).map(([mod, perms]) => {
                    if (!perms || perms.length === 0) return null;
                    const modName = modules.find(m => m.id === mod)?.label || mod;
                    return (
                      <span key={mod} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                        {modName}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Grupo */}
      <Modal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        title={editingGroup ? 'Editar Grupo' : 'Novo Grupo'}
        size="xl"
      >
        <form onSubmit={handleSaveGroup} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Grupo</label>
              <input
                type="text"
                required
                value={groupForm.name}
                onChange={e => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
              <input
                type="text"
                value={groupForm.description}
                onChange={e => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Permissões por Módulo</h3>
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Módulo</th>
                    {actions.map(action => (
                      <th key={action.id} className="px-4 py-3 font-medium text-center">{action.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {modules.map(module => (
                    <tr key={module.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{module.label}</td>
                      {actions.map(action => {
                        const hasPerm = groupForm.permissions?.[module.id as keyof RolePermissions]?.includes(action.id);
                        return (
                          <td key={action.id} className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => togglePermission(module.id, action.id)}
                              className={`w-5 h-5 rounded flex items-center justify-center mx-auto transition-colors ${
                                hasPerm
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
                              }`}
                            >
                              {hasPerm && <Check className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setShowGroupModal(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Salvar Grupo
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Usuário */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
            <input
              type="text"
              required
              value={userForm.nome}
              onChange={e => setUserForm(prev => ({ ...prev, nome: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
            <input
              type="email"
              required
              disabled={!!editingUser}
              value={userForm.email}
              onChange={e => setUserForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white disabled:opacity-50"
            />
          </div>
          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
              <input
                type="password"
                required
                value={userForm.password}
                onChange={e => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Função/Cargo</label>
            <input
              type="text"
              value={userForm.funcao}
              onChange={e => setUserForm(prev => ({ ...prev, funcao: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Acesso</label>
            <select
              value={userForm.role || 'operador'}
              onChange={e => setUserForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'operador' }))}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
            >
              <option value="operador">Operador (Usa Grupo de Acesso)</option>
              <option value="admin">Administrador (Acesso Total)</option>
            </select>
          </div>
          {userForm.role !== 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grupo de Acesso</label>
              <select
                value={userForm.roleId || ''}
                onChange={e => setUserForm(prev => ({ ...prev, roleId: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
              >
                <option value="">Sem grupo (Acesso restrito)</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setShowUserModal(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Salvar Usuário
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
