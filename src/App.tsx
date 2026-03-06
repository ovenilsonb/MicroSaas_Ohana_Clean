import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Insumos } from './components/Insumos';
import { Formulas } from './components/Formulas';
import { Precificacao } from './components/Precificacao';
import { Vendas, Pedido } from './components/Vendas';
import { Producao, OrdemProducao } from './components/Producao';
import { Estoque, ProdutoEstoque, MovimentoEstoque } from './components/Estoque';
import Clientes from './components/Clientes';
import { Relatorios } from './components/Relatorios';
import { Anotacoes } from './components/Anotacoes';
import { Modal } from './components/Modal';
import { Login } from './components/Login';
import SupabaseConfig from './components/SupabaseConfig';
import { Insumo, Formula, User as UserType } from './types';
import { 
  Download, 
  Upload,
  Camera,
  Key,
  Link,
  Mail as MailIcon,
  User as UserIcon,
  Briefcase,
} from 'lucide-react';
import { 
  versionHistory, 
  currentVersion, 
  formulasData,
  insumosData as initialInsumosData,
} from './data/mockData';
import { dataService } from './lib/dataService';
import { isSupabaseConfigured, testSupabaseConnection, getSession, getSupabase } from './lib/supabase';
import { useTheme } from './hooks/useTheme';

// Tipos para Clientes e Lista de Preços
interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  tipo: 'pf' | 'pj' | 'revendedor' | 'distribuidor';
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  observacoes: string;
  dataCadastro: string;
  ativo: boolean;
}

// Tipos para Lista de Preços Avançada (baseado no ODOO)
type AplicarA = 'produto' | 'categoria';
type TipoPreco = 'formula' | 'fixo';

interface RegraPreco {
  id: string;
  produtoId?: string;
  produtoNome?: string;
  varianteId?: string;
  varianteNome?: string;
  categoriaId?: string;
  categoriaNome?: string;
  tipoPreco: TipoPreco;
  custoBase?: number;
  margemLucro?: number;
  precoFixo?: number;
  quantidadeMinima?: number;
  precoCalculado?: number;
}

interface ListaPrecoAvancada {
  id: string;
  nome: string;
  descricao: string;
  aplicarA: AplicarA;
  ativo: boolean;
  dataCriacao: string;
  regras: RegraPreco[];
}

interface PrecificacaoData {
  id: string;
  formulaId: string;
  precoVarejo: number;
  precoAtacado: number;
  precoFardo: number;
  quantidadeFardo: number;
  custosFixos: number;
  updatedAt: string;
}

import { ReportConfig } from './components/ReportConfig';
import { ReportTemplateConfig, ReportAssignments } from './types';

export function App() {
  const { isDark } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [configTab, setConfigTab] = useState<'aparencia' | 'backup' | 'banco' | 'historico' | 'relatorios'>('aparencia');
  
  const [userName, setUserName] = useState('Administrador');
  const [userPhoto, setUserPhoto] = useState<string | undefined>();
  
  // Configurações da Empresa
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('ohana_company_name') || 'Ohana Clean');
  const [companyLogo, setCompanyLogo] = useState(() => localStorage.getItem('ohana_company_logo') || '');

  // Configurações de Relatórios
  const [reportTemplates, setReportTemplates] = useState<ReportTemplateConfig[]>(() => {
    const saved = localStorage.getItem('ohana_report_templates');
    return saved ? JSON.parse(saved) : [];
  });
  const [reportAssignments, setReportAssignments] = useState<ReportAssignments>(() => {
    const saved = localStorage.getItem('ohana_report_assignments');
    return saved ? JSON.parse(saved) : { formula: '', proportion: '', pricing: '', venda: '' };
  });

  useEffect(() => {
    localStorage.setItem('ohana_report_templates', JSON.stringify(reportTemplates));
  }, [reportTemplates]);

  useEffect(() => {
    localStorage.setItem('ohana_report_assignments', JSON.stringify(reportAssignments));
  }, [reportAssignments]);
  
  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    nome: '',
    email: '',
    funcao: '',
    avatar: '',
    password: ''
  });

  // ============== ESTADOS DOS MÓDULOS ==============
  
  // INSUMOS - Estado centralizado
  const [insumos, setInsumos] = useState<Insumo[]>(() => {
    const saved = localStorage.getItem('ohana_insumos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialInsumosData;
      }
    }
    return initialInsumosData;
  });

  // FÓRMULAS - Estado centralizado
  const [formulas, setFormulas] = useState<Formula[]>(() => {
    const saved = localStorage.getItem('ohana_formulas');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return formulasData;
      }
    }
    return formulasData;
  });
  
  // Vendas
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  
  // Produção
  const [ordensProducao, setOrdensProducao] = useState<OrdemProducao[]>([]);
  
  // Estoque
  const [produtosEstoque, setProdutosEstoque] = useState<ProdutoEstoque[]>([]);
  const [movimentosEstoque, setMovimentosEstoque] = useState<MovimentoEstoque[]>([]);
  
  // Clientes
  const [clientes, setClientes] = useState<Cliente[]>([]);
  
  // Lista de Preços Avançada (baseado no ODOO)
  const [listasPreco, setListasPreco] = useState<ListaPrecoAvancada[]>([]);
  
  // Precificações
  const [precificacoes, setPrecificacoes] = useState<Record<string, PrecificacaoData>>({});
  
  // Supabase Status
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'disconnected' | 'local'>('local');

  // ============== EFEITOS ==============

  // Verificar status do Supabase e Auth
  useEffect(() => {
    const checkStatus = async () => {
      if (!isSupabaseConfigured()) {
        setSupabaseStatus('local');
        setIsCheckingAuth(false);
        return;
      }
      
      const result = await testSupabaseConnection();
      setSupabaseStatus(result.success ? 'connected' : 'disconnected');

      const session = await getSession();
      if (session) {
        setIsAuthenticated(true);
        if (session.user?.user_metadata?.full_name) {
          setUserName(session.user.user_metadata.full_name);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsCheckingAuth(false);
    };
    
    checkStatus();
    // Verificar a cada 30 segundos
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user?.user_metadata?.full_name) {
        setUserName(session.user.user_metadata.full_name);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabaseStatus]);

  // Alerta ao fechar o navegador
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Salvar INSUMOS no localStorage e sincronizar com Supabase
  useEffect(() => {
    localStorage.setItem('ohana_insumos', JSON.stringify(insumos));
    
    // Sincronizar com Supabase se configurado
    if (isSupabaseConfigured()) {
      dataService.insumos.save(insumos).catch(err => {
        console.error('Erro ao sincronizar insumos com Supabase:', err);
      });
    }
  }, [insumos]);

  // Salvar FÓRMULAS no localStorage e sincronizar com Supabase
  useEffect(() => {
    localStorage.setItem('ohana_formulas', JSON.stringify(formulas));
    
    // Sincronizar com Supabase se configurado
    if (isSupabaseConfigured()) {
      dataService.formulas.save(formulas).catch(err => {
        console.error('Erro ao sincronizar fórmulas com Supabase:', err);
      });
    }
  }, [formulas]);

  // Load saved data
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setUserName(profile.nome);
      setUserPhoto(profile.foto);
      setProfileForm(prev => ({ ...prev, ...profile }));
    }
    
    // Load pedidos
    const savedPedidos = localStorage.getItem('pedidos');
    if (savedPedidos) setPedidos(JSON.parse(savedPedidos));
    
    // Load ordens
    const savedOrdens = localStorage.getItem('ordensProducao');
    if (savedOrdens) setOrdensProducao(JSON.parse(savedOrdens));
    
    // Load estoque
    const savedEstoque = localStorage.getItem('produtosEstoque');
    if (savedEstoque) setProdutosEstoque(JSON.parse(savedEstoque));
    
    const savedMovimentos = localStorage.getItem('movimentosEstoque');
    if (savedMovimentos) setMovimentosEstoque(JSON.parse(savedMovimentos));
    
    // Load clientes
    const savedClientes = localStorage.getItem('clientes');
    if (savedClientes) setClientes(JSON.parse(savedClientes));
    
    // Load listas de preço
    const savedListas = localStorage.getItem('listasPreco');
    if (savedListas) setListasPreco(JSON.parse(savedListas));
    
    // Load precificacoes
    const savedPrecificacoes = localStorage.getItem('precificacoes');
    if (savedPrecificacoes) setPrecificacoes(JSON.parse(savedPrecificacoes));
  }, []);

  // Save data on changes
  useEffect(() => {
    localStorage.setItem('pedidos', JSON.stringify(pedidos));
  }, [pedidos]);

  useEffect(() => {
    localStorage.setItem('ordensProducao', JSON.stringify(ordensProducao));
  }, [ordensProducao]);

  useEffect(() => {
    localStorage.setItem('produtosEstoque', JSON.stringify(produtosEstoque));
  }, [produtosEstoque]);

  useEffect(() => {
    localStorage.setItem('movimentosEstoque', JSON.stringify(movimentosEstoque));
  }, [movimentosEstoque]);

  useEffect(() => {
    localStorage.setItem('clientes', JSON.stringify(clientes));
    
    // Sincronizar com Supabase se configurado
    if (isSupabaseConfigured() && clientes.length > 0) {
      dataService.clientes.save(clientes.map(c => ({
        ...c,
        createdAt: c.dataCadastro || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))).catch(err => {
        console.error('Erro ao sincronizar clientes com Supabase:', err);
      });
    }
  }, [clientes]);

  useEffect(() => {
    localStorage.setItem('listasPreco', JSON.stringify(listasPreco));
  }, [listasPreco]);

  useEffect(() => {
    localStorage.setItem('precificacoes', JSON.stringify(precificacoes));
  }, [precificacoes]);

  // ============== INTEGRAÇÕES ==============

  // Vendas -> Produção: Quando pedido é pago
  const handleEnviarProducao = (pedido: Pedido) => {
    const now = new Date().toISOString();
    
    // Criar uma ordem de produção para cada item do pedido
    const novasOrdens: OrdemProducao[] = pedido.items.map((item, index) => {
      const formula = formulas.find(f => f.id === item.formulaId);
      return {
        id: `${Date.now()}-${index}`,
        numero: `OP-${Date.now().toString().slice(-6)}-${index + 1}`,
        pedidoId: pedido.id,
        pedidoNumero: pedido.numero,
        cliente: pedido.cliente,
        formulaId: item.formulaId,
        formulaNome: item.nome,
        quantidade: item.quantidade,
        status: 'aguardando',
        prioridade: 'normal',
        lote: `${formula?.prefixoLote || 'LOT'}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        observacoes: '',
        createdAt: now,
        updatedAt: now,
      };
    });

    setOrdensProducao(prev => [...prev, ...novasOrdens]);
  };

  // Produção -> Estoque: Quando produção é concluída
  const handleConcluirProducao = (ordem: OrdemProducao) => {
    const now = new Date().toISOString();
    const formula = formulas.find(f => f.id === ordem.formulaId);
    
    // Verifica se o produto já existe no estoque
    const produtoExistente = produtosEstoque.find(p => p.formulaId === ordem.formulaId);
    
    let newProdutoId = produtoExistente?.id || Date.now().toString();

    if (produtoExistente) {
      // Atualiza quantidade
      setProdutosEstoque(prev => prev.map(p =>
        p.id === produtoExistente.id
          ? {
              ...p,
              quantidade: p.quantidade + ordem.quantidade,
              ultimaEntrada: now,
            }
          : p
      ));
    } else {
      // Cria novo produto no estoque
      const novoProduto: ProdutoEstoque = {
        id: newProdutoId,
        formulaId: ordem.formulaId,
        nome: ordem.formulaNome,
        codigo: formula?.codigo || `PRD-${Date.now()}`,
        quantidade: ordem.quantidade,
        estoqueMinimo: 10,
        unidade: 'un',
        ultimaEntrada: now,
      };
      setProdutosEstoque(prev => [...prev, novoProduto]);
    }

    // Registra movimento de entrada
    const movimentoEntrada: MovimentoEstoque = {
      id: Date.now().toString(),
      tipo: 'entrada',
      produtoId: newProdutoId,
      produtoNome: ordem.formulaNome,
      quantidade: ordem.quantidade,
      motivo: 'Produção',
      referencia: ordem.numero || ordem.id,
      createdAt: now,
    };
    setMovimentosEstoque(prev => [...prev, movimentoEntrada]);

    // Check if this order is linked to a pending sale
    if (ordem.pedidoId) {
      const pedido = pedidos.find(p => p.id === ordem.pedidoId);
      if (pedido && pedido.status === 'producao') {
        // Deduct the produced amount from inventory for this sale
        setProdutosEstoque(prev => prev.map(p => 
          p.id === newProdutoId 
            ? { ...p, quantidade: Math.max(0, p.quantidade - ordem.quantidade) }
            : p
        ));

        // Registra movimento de saída para a venda
        const movimentoSaida: MovimentoEstoque = {
          id: (Date.now() + 1).toString(),
          tipo: 'saida',
          produtoId: newProdutoId,
          produtoNome: ordem.formulaNome,
          quantidade: ordem.quantidade,
          motivo: 'Venda',
          referencia: pedido.numero,
          createdAt: now,
        };
        setMovimentosEstoque(prev => [...prev, movimentoSaida]);
      }
    }
  };

  // ============== HANDLERS ==============

  const handleLogout = async () => {
    try {
      const { signOut } = await import('./lib/supabase');
      await signOut();
    } catch (error) {
      console.error('Erro ao sair do Supabase:', error);
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // BACKUP - Inclui INSUMOS e FÓRMULAS
  const handleBackup = () => {
    const data = {
      version: currentVersion,
      date: new Date().toISOString(),
      // Dados principais
      insumos,
      formulas,
      pedidos,
      ordensProducao,
      produtosEstoque,
      movimentosEstoque,
      clientes,
      listasPreco,
      precificacoes,
      // Perfil
      userProfile: {
        ...profileForm,
        nome: userName,
        foto: userPhoto,
      },
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const filename = `ohana-clean-backup_${now.toISOString().slice(0, 10)}_${now.toTimeString().slice(0, 8).replace(/:/g, '-')}.json`;
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // RESTORE - Restaura INSUMOS e FÓRMULAS
  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const data = JSON.parse(reader.result as string);
          
          // Restaurar INSUMOS
          if (data.insumos) {
            setInsumos(data.insumos);
          }
          
          // Restaurar FÓRMULAS
          if (data.formulas) {
            setFormulas(data.formulas);
          }
          
          // Restaurar outros dados
          if (data.pedidos) setPedidos(data.pedidos);
          if (data.ordensProducao) setOrdensProducao(data.ordensProducao);
          if (data.produtosEstoque) setProdutosEstoque(data.produtosEstoque);
          if (data.movimentosEstoque) setMovimentosEstoque(data.movimentosEstoque);
          if (data.clientes) setClientes(data.clientes);
          if (data.listasPreco) setListasPreco(data.listasPreco);
          if (data.precificacoes) setPrecificacoes(data.precificacoes);
          
          // Restaurar perfil
          if (data.userProfile) {
            setUserName(data.userProfile.nome);
            setUserPhoto(data.userProfile.foto);
            setProfileForm(prev => ({ 
              ...prev, 
              nome: data.userProfile.nome,
              email: data.userProfile.email,
              funcao: data.userProfile.funcao || data.userProfile.cargo || ''
            }));
            localStorage.setItem('userProfile', JSON.stringify(data.userProfile));
          }
          
          alert('Backup restaurado com sucesso!');
        } catch {
          alert('Erro ao restaurar backup. Arquivo inválido.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCompanyLogo(base64String);
        localStorage.setItem('ohana_company_logo', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard darkMode={isDark} formulas={formulas} insumos={insumos} pedidos={pedidos} />;
      case 'insumos':
        return <Insumos insumos={insumos} setInsumos={setInsumos} canAdd={checkLimit('insumos', insumos.length)} />;
      case 'formulas':
        return <Formulas formulas={formulas} setFormulas={setFormulas} insumos={insumos} canAdd={checkLimit('formulas', formulas.length)} />;
      case 'precificacao':
        return (
          <Precificacao 
            formulas={formulas}
            insumosData={insumos}
            precificacoes={precificacoes}
            setPrecificacoes={setPrecificacoes}
            listasPreco={listasPreco}
            setListasPreco={setListasPreco}
          />
        );
      case 'clientes':
        return (
          <Clientes 
            clientes={clientes}
            setClientes={setClientes}
            pedidos={pedidos}
            companyName={companyName}
            companyLogo={companyLogo}
          />
        );
      case 'vendas':
        return (
          <Vendas 
            pedidos={pedidos}
            setPedidos={setPedidos}
            onEnviarProducao={handleEnviarProducao}
            clientes={clientes}
            setClientes={setClientes}
            listasPreco={listasPreco}
            precificacoes={precificacoes}
            canAdd={checkLimit('relatorios', pedidos.length)}
            produtosEstoque={produtosEstoque}
            setProdutosEstoque={setProdutosEstoque}
            insumos={insumos}
            setInsumos={setInsumos}
            formulas={formulas}
            ordensProducao={ordensProducao}
            setOrdensProducao={setOrdensProducao}
            setMovimentosEstoque={setMovimentosEstoque}
          />
        );
      case 'producao':
        return (
          <Producao 
            ordensProducao={ordensProducao}
            setOrdensProducao={setOrdensProducao}
            pedidos={pedidos}
            setPedidos={setPedidos}
            onConcluirProducao={handleConcluirProducao}
            companyName={companyName}
            companyLogo={companyLogo}
          />
        );
      case 'estoque':
        return (
          <Estoque 
            produtos={produtosEstoque}
            setProdutos={setProdutosEstoque}
            movimentos={movimentosEstoque}
            companyName={companyName}
            companyLogo={companyLogo}
            setMovimentos={setMovimentosEstoque}
          />
        );
      case 'anotacoes':
        return <Anotacoes />;
      case 'relatorios':
        return (
          <Relatorios 
            formulas={formulas}
            insumos={insumos}
            pedidos={pedidos}
            clientes={clientes}
            precificacoes={precificacoes}
            companyName={companyName}
            companyLogo={companyLogo}
            reportTemplates={reportTemplates}
            reportAssignments={reportAssignments}
          />
        );
      case 'config':
        return null;
      default:
        return <Dashboard darkMode={isDark} formulas={formulas} insumos={insumos} pedidos={pedidos} />;
    }
  };

  // Open config when clicking config in sidebar
  useEffect(() => {
    if (activeModule === 'config') {
      setShowConfig(true);
      setActiveModule('dashboard');
    }
  }, [activeModule]);

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        nome: currentUser.nome,
        email: currentUser.email,
        funcao: currentUser.funcao,
        avatar: currentUser.avatar || '',
        password: ''
      });
    }
  }, [currentUser]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        nome: profileForm.nome,
        email: profileForm.email,
        funcao: profileForm.funcao,
        avatar: profileForm.avatar
      };
      setCurrentUser(updatedUser);
      setUserName(profileForm.nome);
      setUserPhoto(profileForm.avatar);
      setShowProfileModal(false);
      alert('Perfil atualizado com sucesso!');
    }
  };

  const checkLimit = (type: keyof UserType['limits'], currentCount: number) => {
    if (!currentUser) return true;
    if (currentUser.role === 'admin') return true;
    return currentCount < currentUser.limits[type];
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (!currentUser && !isAuthenticated) {
    return <Login onLogin={(user) => {
      setCurrentUser(user);
      setIsAuthenticated(true);
      setUserName(user.nome);
      setUserPhoto(user.avatar);
    }} />;
  }

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        darkMode={isDark}
        companyName={companyName}
        companyLogo={companyLogo}
        onLogout={handleLogout}
      />

      <Header
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        userName={userName}
        userPhoto={userPhoto}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenConfig={() => setShowConfig(true)}
        onLogout={handleLogout}
        supabaseStatus={supabaseStatus}
      />

      <main
        className={`pt-20 pb-8 px-4 md:px-6 min-h-screen transition-all duration-300 ml-0 ${
          collapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {renderModule()}
      </main>

      {/* Profile Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Meu Perfil"
        size="md"
      >
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl bg-gray-800 border-2 border-blue-500/30 overflow-hidden flex items-center justify-center">
                {profileForm.avatar ? (
                  <img src={profileForm.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-12 h-12 text-gray-600" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 flex gap-1">
                <label className="cursor-pointer p-2 bg-blue-600 rounded-xl text-white shadow-lg hover:bg-blue-700 transition-all">
                  <Camera className="w-4 h-4" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProfileForm(prev => ({ ...prev, avatar: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                <button 
                  type="button"
                  className="p-2 bg-gray-700 rounded-xl text-white shadow-lg hover:bg-gray-600 transition-all"
                  onClick={() => {
                    const url = prompt('Insira a URL da imagem:');
                    if (url) setProfileForm(prev => ({ ...prev, avatar: url }));
                  }}
                  title="Inserir URL"
                >
                  <Link className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Escolha um arquivo ou insira uma URL</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Nome Completo</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={profileForm.nome}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">E-mail</label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Função na Empresa</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={profileForm.funcao}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, funcao: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Nova Senha (opcional)</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={profileForm.password}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Deixe em branco para manter a atual"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setShowProfileModal(false)}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        title="Configurações"
        size="lg"
      >
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
            {(['aparencia', 'relatorios', 'backup', 'banco', 'historico'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setConfigTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                  configTab === tab
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {tab === 'aparencia' ? 'Aparência' : tab === 'relatorios' ? 'Relatórios' : tab === 'backup' ? 'Backup' : tab === 'banco' ? 'Banco de Dados' : 'Histórico'}
              </button>
            ))}
          </div>

          {/* Aparência */}
          {configTab === 'aparencia' && (
            <div className="space-y-6">
              {/* Configurações da Empresa */}
              <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Identidade Visual da Empresa</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">Nome da Empresa</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => {
                        setCompanyName(e.target.value);
                        localStorage.setItem('ohana_company_name', e.target.value);
                      }}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Ex: Ohana Clean"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">Logotipo da Empresa</label>
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <div className="w-full flex-1 space-y-2">
                        <input
                          type="text"
                          value={companyLogo}
                          onChange={(e) => {
                            setCompanyLogo(e.target.value);
                            localStorage.setItem('ohana_company_logo', e.target.value);
                          }}
                          className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="URL da imagem (https://...)"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">ou</span>
                          <label className="cursor-pointer px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white text-sm rounded-lg transition-colors border border-gray-200 dark:border-transparent">
                            Escolher arquivo local
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                          </label>
                        </div>
                      </div>
                      {companyLogo && (
                        <div className="w-16 h-16 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-1 flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
                          <img src={companyLogo} alt="Logo" className="max-w-full max-h-full object-contain rounded-lg" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Relatórios */}
          {configTab === 'relatorios' && (
            <ReportConfig 
              templates={reportTemplates}
              setTemplates={setReportTemplates}
              assignments={reportAssignments}
              setAssignments={setReportAssignments}
            />
          )}

          {/* Backup */}
          {configTab === 'backup' && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 p-4 sm:p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Download className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300">Fazer Backup</h4>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                      Baixe todos os dados do sistema
                    </p>
                    <button
                      onClick={handleBackup}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-sm font-medium"
                    >
                      Backup Agora
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 sm:p-6 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                    <Upload className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-300">Restaurar</h4>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                      Restaure dados de um arquivo
                    </p>
                    <label className="inline-block w-full text-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl cursor-pointer transition-colors text-sm font-medium">
                      Selecionar
                      <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Banco de Dados - Supabase */}
          {configTab === 'banco' && (
            <SupabaseConfig />
          )}

          {/* Histórico */}
          {configTab === 'historico' && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {versionHistory.map((version, index) => (
                <div
                  key={`${version.version}-${index}`}
                  className={`p-4 rounded-xl border ${
                    index === 0
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold ${index === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                      v{version.version}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{version.date}</span>
                  </div>
                  <ul className="space-y-1">
                    {version.changes.map((change, i) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="text-green-500">•</span>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowConfig(false)}
              className="px-6 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                alert('Configurações salvas com sucesso!');
                setShowConfig(false);
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
