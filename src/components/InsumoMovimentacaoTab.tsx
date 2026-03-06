import { useState, useMemo } from 'react';
import { Insumo, InsumoMovimentacao } from '../types';
import { ArrowDownRight, ArrowUpRight, History, Search } from 'lucide-react';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { CurrencyInput } from './ui/CurrencyInput';

interface InsumoMovimentacaoTabProps {
  insumo: Partial<Insumo>;
  onUpdateInsumo: (updatedInsumo: Partial<Insumo>) => void;
}

export function InsumoMovimentacaoTab({ insumo, onUpdateInsumo }: InsumoMovimentacaoTabProps) {
  const [subTab, setSubTab] = useState<'entrada' | 'saida' | 'historico'>('historico');
  
  // Form states
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [quantidade, setQuantidade] = useState(0);
  const [fornecedor, setFornecedor] = useState('');
  const [lote, setLote] = useState('');
  const [validade, setValidade] = useState('');
  const [documento, setDocumento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  const [destino, setDestino] = useState('');
  const [pedido, setPedido] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [motivo, setMotivo] = useState('consumo');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');

  // Validation states
  const [errors, setErrors] = useState<{
    quantidade?: string;
    data?: string;
    motivo?: string;
  }>({});

  const movimentacoes = insumo.movimentacoes || [];

  const handleRegistrarEntrada = () => {
    const newErrors: typeof errors = {};
    if (!data) newErrors.data = '⚠️ Inclua a data';
    if (quantidade <= 0) newErrors.quantidade = '⚠️ Inclua a quantidade';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const novaMovimentacao: InsumoMovimentacao = {
      id: Date.now().toString(),
      insumoId: insumo.id || '',
      tipo: 'entrada',
      data,
      quantidade,
      saldoAtual: (insumo.estoque || 0) + quantidade,
      fornecedor,
      lote,
      validade,
      documento,
      observacoes,
      usuario: 'Usuário Atual', // Mock
    };

    const updatedInsumo = {
      ...insumo,
      estoque: (insumo.estoque || 0) + quantidade,
      movimentacoes: [novaMovimentacao, ...movimentacoes],
    };

    onUpdateInsumo(updatedInsumo);
    resetForm();
    setSubTab('historico');
  };

  const handleRegistrarSaida = () => {
    const newErrors: typeof errors = {};
    if (!data) newErrors.data = '⚠️ Inclua a data';
    if (quantidade <= 0) newErrors.quantidade = '⚠️ Inclua a quantidade';
    if (!motivo) newErrors.motivo = '⚠️ Inclua o motivo';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if ((insumo.estoque || 0) < quantidade) {
      alert('Estoque insuficiente para esta saída.');
      return;
    }

    const novaMovimentacao: InsumoMovimentacao = {
      id: Date.now().toString(),
      insumoId: insumo.id || '',
      tipo: 'saida',
      data,
      quantidade,
      saldoAtual: (insumo.estoque || 0) - quantidade,
      destino,
      pedido,
      responsavel,
      motivo,
      observacoes,
      usuario: 'Usuário Atual', // Mock
    };

    const updatedInsumo = {
      ...insumo,
      estoque: (insumo.estoque || 0) - quantidade,
      movimentacoes: [novaMovimentacao, ...movimentacoes],
    };

    onUpdateInsumo(updatedInsumo);
    resetForm();
    setSubTab('historico');
  };

  const resetForm = () => {
    setData(new Date().toISOString().split('T')[0]);
    setQuantidade(0);
    setFornecedor('');
    setLote('');
    setValidade('');
    setDocumento('');
    setObservacoes('');
    setDestino('');
    setPedido('');
    setResponsavel('');
    setMotivo('consumo');
    setErrors({});
  };

  const filteredMovimentacoes = useMemo(() => {
    return movimentacoes.filter(m => {
      const matchSearch = 
        m.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.destino?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.lote?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.documento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.pedido?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchTipo = filterTipo === 'todos' || m.tipo === filterTipo;

      return matchSearch && matchTipo;
    });
  }, [movimentacoes, searchTerm, filterTipo]);

  if (!insumo.id) {
    return (
      <div className="p-8 text-center text-gray-500">
        Salve o insumo primeiro para poder registrar movimentações de estoque.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo de Estoque */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-center justify-between border border-blue-100 dark:border-blue-800">
        <div>
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider">Saldo Atual em Estoque</p>
          <p className="text-3xl font-black text-blue-700 dark:text-blue-300">
            {insumo.estoque?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-lg font-normal">{insumo.unidade}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">Estoque Mínimo: {insumo.estoqueMinimo} {insumo.unidade}</p>
          {(insumo.estoque || 0) <= (insumo.estoqueMinimo || 0) && (
            <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md">Estoque Baixo</span>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button
          onClick={() => setSubTab('historico')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            subTab === 'historico' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <History className="w-4 h-4" /> Histórico
        </button>
        <button
          onClick={() => setSubTab('entrada')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            subTab === 'entrada' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'text-gray-500 hover:text-green-600'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" /> Nova Entrada
        </button>
        <button
          onClick={() => setSubTab('saida')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            subTab === 'saida' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'text-gray-500 hover:text-red-600'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" /> Nova Saída
        </button>
      </div>

      {/* Conteúdo das Sub-abas */}
      {subTab === 'entrada' && (
        <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-green-700 dark:text-green-400 flex items-center gap-2 mb-4">
            <ArrowDownRight className="w-5 h-5" /> Registrar Entrada de Estoque
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Input 
                label="Data da Entrada *" 
                type="date" 
                value={data} 
                onChange={e => { setData(e.target.value); setErrors(prev => ({ ...prev, data: undefined })); }} 
                className={errors.data ? 'border-red-500 ring-2 ring-red-500/20' : ''}
              />
              {errors.data && <p className="text-xs text-red-500 font-medium animate-pulse">{errors.data}</p>}
            </div>
            <div className="space-y-1">
              <CurrencyInput 
                label={`Quantidade Recebida (${insumo.unidade}) *`} 
                value={quantidade} 
                onChange={val => { setQuantidade(val); setErrors(prev => ({ ...prev, quantidade: undefined })); }} 
                decimals={3} 
                className={errors.quantidade ? 'border-red-500 ring-2 ring-red-500/20' : ''}
              />
              {errors.quantidade && <p className="text-xs text-red-500 font-medium animate-pulse">{errors.quantidade}</p>}
            </div>
            <Input label="Fornecedor" type="text" value={fornecedor} onChange={e => setFornecedor(e.target.value)} />
            <Input label="Documento (NF/Pedido)" type="text" value={documento} onChange={e => setDocumento(e.target.value)} />
            <Input label="Lote" type="text" value={lote} onChange={e => setLote(e.target.value)} />
            <Input label="Data de Validade" type="date" value={validade} onChange={e => setValidade(e.target.value)} />
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Observações</label>
              <textarea
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 text-sm"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button onClick={handleRegistrarEntrada} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors">
              Confirmar Entrada
            </button>
          </div>
        </div>
      )}

      {subTab === 'saida' && (
        <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-4">
            <ArrowUpRight className="w-5 h-5" /> Registrar Saída de Estoque
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Input 
                label="Data da Saída *" 
                type="date" 
                value={data} 
                onChange={e => { setData(e.target.value); setErrors(prev => ({ ...prev, data: undefined })); }} 
                className={errors.data ? 'border-red-500 ring-2 ring-red-500/20' : ''}
              />
              {errors.data && <p className="text-xs text-red-500 font-medium animate-pulse">{errors.data}</p>}
            </div>
            <div className="space-y-1">
              <CurrencyInput 
                label={`Quantidade Retirada (${insumo.unidade}) *`} 
                value={quantidade} 
                onChange={val => { setQuantidade(val); setErrors(prev => ({ ...prev, quantidade: undefined })); }} 
                decimals={3} 
                className={errors.quantidade ? 'border-red-500 ring-2 ring-red-500/20' : ''}
              />
              {errors.quantidade && <p className="text-xs text-red-500 font-medium animate-pulse">{errors.quantidade}</p>}
            </div>
            <div className="space-y-1">
              <Select 
                label="Tipo de Saída *" 
                value={motivo} 
                onChange={e => { setMotivo(e.target.value); setErrors(prev => ({ ...prev, motivo: undefined })); }}
                options={[
                  { value: 'consumo', label: 'Consumo / Produção' },
                  { value: 'venda', label: 'Venda Direta' },
                  { value: 'devolucao', label: 'Devolução ao Fornecedor' },
                  { value: 'ajuste', label: 'Ajuste de Inventário / Perda' },
                ]}
                className={errors.motivo ? 'border-red-500 ring-2 ring-red-500/20' : ''}
              />
              {errors.motivo && <p className="text-xs text-red-500 font-medium animate-pulse">{errors.motivo}</p>}
            </div>
            <Input label="Destino (Setor/Cliente)" type="text" value={destino} onChange={e => setDestino(e.target.value)} />
            <Input label="Documento / Pedido" type="text" value={pedido} onChange={e => setPedido(e.target.value)} />
            <Input label="Responsável" type="text" value={responsavel} onChange={e => setResponsavel(e.target.value)} />
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Observações</label>
              <textarea
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 text-sm"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button onClick={handleRegistrarSaida} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors">
              Confirmar Saída
            </button>
          </div>
        </div>
      )}

      {subTab === 'historico' && (
        <div className="space-y-4">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por lote, fornecedor, documento..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
              />
            </div>
            <select
              value={filterTipo}
              onChange={e => setFilterTipo(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
            >
              <option value="todos">Todas as Movimentações</option>
              <option value="entrada">Apenas Entradas</option>
              <option value="saida">Apenas Saídas</option>
            </select>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Quantidade</th>
                    <th className="px-4 py-3 font-medium">Saldo</th>
                    <th className="px-4 py-3 font-medium">Origem/Destino</th>
                    <th className="px-4 py-3 font-medium">Lote/Doc</th>
                    <th className="px-4 py-3 font-medium">Usuário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredMovimentacoes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        Nenhuma movimentação encontrada.
                      </td>
                    </tr>
                  ) : (
                    filteredMovimentacoes.map(mov => (
                      <tr key={mov.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(mov.data).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3">
                          {mov.tipo === 'entrada' ? (
                            <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md text-xs font-medium">
                              <ArrowDownRight className="w-3 h-3" /> Entrada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-medium">
                              <ArrowUpRight className="w-3 h-3" /> Saída
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium">
                          {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-500">
                          {mov.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-[150px] truncate" title={mov.fornecedor || mov.destino || '-'}>
                            {mov.fornecedor || mov.destino || '-'}
                          </div>
                          {mov.motivo && <div className="text-[10px] text-gray-400 uppercase">{mov.motivo}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs">
                            {mov.lote && <div><span className="text-gray-400">L:</span> {mov.lote}</div>}
                            {(mov.documento || mov.pedido) && <div><span className="text-gray-400">D:</span> {mov.documento || mov.pedido}</div>}
                            {!mov.lote && !mov.documento && !mov.pedido && '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {mov.usuario}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
