import { useState, useEffect } from 'react';
import { Database, Cloud, CloudOff, CheckCircle, XCircle, RefreshCw, Key, Link, Package, FlaskConical, Users, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabaseConfig, setSupabaseConfig, testSupabaseConnection, isSupabaseConfigured } from '../lib/supabase';
import { dataService } from '../lib/dataService';
import { playSound } from '../utils/sounds';

interface SupabaseConfigProps {
  onSync?: () => void;
}

export default function SupabaseConfig({ onSync }: SupabaseConfigProps) {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [status, setStatus] = useState<'disconnected' | 'connected' | 'testing' | 'error'>('disconnected');
  const [message, setMessage] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<{ insumos: number; formulas: number; clientes: number; precificacoes: number } | null>(null);

  useEffect(() => {
    const config = getSupabaseConfig();
    setUrl(config.url);
    setAnonKey(config.key);

    if (config.url && config.key) {
      checkConnection();
    }
  }, []);

  const checkConnection = async () => {
    setStatus('testing');
    setMessage('Testando conexão...');

    const result = await testSupabaseConnection();

    if (result.success) {
      playSound('success');
      setStatus('connected');
      setMessage('Conectado ao Supabase com sucesso!');
      loadStats();
    } else {
      playSound('error');
      setStatus('error');
      setMessage(result.error || 'Erro ao conectar');
      setStats(null);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await dataService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleSave = () => {
    setSupabaseConfig(url, anonKey);
    dataService.clearConnectionCache();
    checkConnection();
  };

  const handleSync = async () => {
    if (!isSupabaseConfigured()) {
      setMessage('Configure o Supabase primeiro');
      return;
    }

    setSyncing(true);
    setMessage('Sincronizando dados...');

    try {
      const result = await dataService.syncToCloud();

      if (result.success) {
        setMessage(`Sincronizado: ${result.details?.insumos || 0} insumos, ${result.details?.formulas || 0} fórmulas, ${result.details?.clientes || 0} clientes`);
        loadStats();
        if (onSync) {
          onSync();
        }
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage('Erro ao sincronizar dados');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'testing':
        return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <CloudOff className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'testing': return 'Testando...';
      case 'error': return 'Erro';
      default: return 'Desconectado';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'bg-green-500/20 border-green-500/50 text-green-400';
      case 'testing': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      case 'error': return 'bg-red-500/20 border-red-500/50 text-red-400';
      default: return 'bg-gray-500/20 border-gray-500/50 text-gray-400';
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 pb-4 border-b border-white/10"
      >
        <div className="p-3 rounded-xl bg-emerald-500/20">
          <Database className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Banco de Dados na Nuvem</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure o Supabase para sincronizar seus dados</p>
        </div>
      </motion.div>

      {/* Status Badge */}
      <motion.div 
        animate={status === 'error' ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className={`flex items-center gap-2 p-3 rounded-xl border transition-colors duration-500 ${getStatusColor()}`}
      >
        {getStatusIcon()}
        <span className="font-medium">{getStatusText()}</span>
        {message && <span className="text-sm opacity-75 ml-2">• {message}</span>}
      </motion.div>

      {/* Statistics - Only show when connected */}
      <AnimatePresence>
        {status === 'connected' && stats && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 overflow-hidden"
          >
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Insumos</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.insumos}</p>
            </motion.div>

            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Fórmulas</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.formulas}</p>
            </motion.div>

            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Clientes</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.clientes}</p>
            </motion.div>

            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
              className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Precificações</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.precificacoes}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Link className="w-4 h-4" />
            URL do Projeto
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://seu-projeto.supabase.co"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Key className="w-4 h-4" />
            Chave Anônima (anon key)
          </label>
          <input
            type="password"
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIs..."
            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
          />
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-3 pt-2"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/20 transition-all"
        >
          <CheckCircle className="w-4 h-4" />
          Salvar e Testar
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={checkConnection}
          disabled={!url || !anonKey || status === 'testing'}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${status === 'testing' ? 'animate-spin' : ''}`} />
          Testar Conexão
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSync}
          disabled={status !== 'connected' || syncing}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Cloud className="w-4 h-4" />
          )}
          Sincronizar Dados
        </motion.button>
      </motion.div>

      {/* Instructions Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Instructions */}
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">📚 Como configurar:</h4>
          <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-decimal list-inside">
            <li>Acesse <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">supabase.com</a> e crie uma conta</li>
            <li>Crie um novo projeto e aguarde a inicialização</li>
            <li>Vá em <strong>SQL Editor</strong> e execute o script do arquivo <code className="px-1 py-0.5 bg-gray-200 dark:bg-[#0f172a] rounded">database.sql</code></li>
            <li>Vá em <strong>Settings → API</strong> e copie a URL e a chave anônima</li>
            <li>Cole os valores acima e clique em "Salvar e Testar"</li>
          </ol>
        </div>

        {/* How to verify data */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <h4 className="font-medium text-emerald-600 dark:text-emerald-400 mb-2">🔍 Como verificar os dados:</h4>
          <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-decimal list-inside">
            <li>Acesse seu projeto no Supabase</li>
            <li>Clique em <strong>"Table Editor"</strong> no menu lateral</li>
            <li>Selecione a tabela desejada (ex: <code className="px-1 py-0.5 bg-gray-200 dark:bg-[#0f172a] rounded">insumos</code>)</li>
            <li>Veja todos os registros sincronizados perfeitamente!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
