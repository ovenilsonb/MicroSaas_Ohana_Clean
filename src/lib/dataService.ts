// Serviço de dados que abstrai localStorage e Supabase
import { getSupabase, isSupabaseConfigured, testSupabaseConnection } from './supabase';
import { Insumo, Formula, InsumoVariante } from '../types';

// Tipos para cliente e outros dados
export interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  documento?: string;
  tipo: 'pf' | 'pj' | 'revendedor' | 'distribuidor';
  endereco?: {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
  observacoes?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Implementação do serviço
class DataServiceImpl {
  
  // Cache de conexão
  private connectionCache: { connected: boolean; checkedAt: number } | null = null;
  private readonly CACHE_DURATION = 30000; // 30 segundos
  
  // ==================== INSUMOS ====================
  insumos = {
    getAll: async (): Promise<Insumo[]> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          const { data, error } = await supabase
            .from('insumos')
            .select('*')
            .order('nome');
          
          if (error) {
            console.error('Erro ao buscar insumos:', error);
            throw error;
          }
          
          // Buscar variantes
          if (data && data.length > 0) {
            const { data: variantes } = await supabase
              .from('insumo_variantes')
              .select('*');
            
            return data.map((insumo: any) => ({
              id: insumo.id,
              nome: insumo.nome,
              codigo: insumo.codigo,
              unidade: insumo.unidade,
              valorUnitario: insumo.valor,
              fornecedor: insumo.fornecedor,
              estoque: insumo.estoque,
              estoqueMinimo: insumo.estoque_minimo,
              validade: insumo.validade,
              quimico: insumo.quimico,
              imagem: insumo.imagem,
              validadeIndeterminada: insumo.validade_indeterminada,
              status: insumo.status,
              variantes: variantes?.filter((v: any) => v.insumo_id === insumo.id).map((v: any) => ({
                id: v.id,
                nome: v.nome,
                codigo: v.codigo,
                valorUnitario: v.valor,
              })) || []
            }));
          }
          return data || [];
        } catch (error) {
          console.error('Erro ao buscar insumos do Supabase:', error);
        }
      }
      
      // Fallback para localStorage
      const stored = localStorage.getItem('ohana_insumos');
      return stored ? JSON.parse(stored) : [];
    },
    
    save: async (insumos: Insumo[]): Promise<{ success: boolean; error?: string }> => {
      // Sempre salva no localStorage
      localStorage.setItem('ohana_insumos', JSON.stringify(insumos));
      
      // Se conectado, salva no Supabase
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          console.log('🔄 Iniciando sincronização de insumos com Supabase...', insumos.length);
          
          for (const insumo of insumos) {
            const { variantes, ...insumoData } = insumo;
            
            // Converte para snake_case - COLUNAS CORRETAS DO BANCO
            const supabaseData: Record<string, any> = {
              id: insumoData.id,
              nome: insumoData.nome,
              codigo: insumoData.codigo || null,
              unidade: insumoData.unidade,
              valor: insumoData.valorUnitario || 0, // banco usa 'valor' não 'valor_unitario'
              fornecedor: insumoData.fornecedor || null,
              estoque: insumoData.estoque || 0,
              estoque_minimo: insumoData.estoqueMinimo || 0,
              validade: insumoData.validade || null,
              quimico: insumoData.quimico || false,
              imagem: insumoData.imagem || null, // banco usa 'imagem' não 'foto'
              validade_indeterminada: insumoData.validadeIndeterminada || false,
              status: (insumoData as any).status || 'ativo',
            };
            
            console.log('📤 Enviando insumo:', supabaseData);
            
            const { error } = await supabase
              .from('insumos')
              .upsert(supabaseData, { onConflict: 'id' });
            
            if (error) {
              console.error('❌ Erro ao salvar insumo:', error);
              throw error;
            }
            
            console.log('✅ Insumo salvo:', insumoData.nome);
            
            // Salvar variantes
            if (variantes && variantes.length > 0) {
              // Deletar variantes antigas deste insumo
              await supabase
                .from('insumo_variantes')
                .delete()
                .eq('insumo_id', insumo.id);
              
              const variantesData = variantes.map((v: InsumoVariante) => ({
                id: v.id,
                insumo_id: insumo.id,
                nome: v.nome,
                codigo: v.codigo || null,
                valor: v.valorUnitario || 0, // banco usa 'valor' não 'valor_unitario'
              }));
              
              const { error: varError } = await supabase
                .from('insumo_variantes')
                .insert(variantesData);
              
              if (varError) {
                console.error('Erro ao salvar variantes:', varError);
              }
            }
          }
          
          console.log('✅ Insumos sincronizados com sucesso!');
          return { success: true };
        } catch (error) {
          console.error('❌ Erro ao salvar insumos no Supabase:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      
      return { success: true };
    },

    syncFull: async (insumos: Insumo[]): Promise<{ success: boolean; error?: string }> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          console.log('🔄 Iniciando sincronização COMPLETA (Espelho) de insumos...');
          
          // 1. Deletar tudo
          const { error: deleteError } = await supabase.from('insumos').delete().neq('id', '0');
          if (deleteError) throw deleteError;
          
          // 2. Inserir dados locais
          if (insumos.length > 0) {
            for (const insumo of insumos) {
              const { variantes, ...insumoData } = insumo;
              
              const supabaseData: Record<string, any> = {
                id: insumoData.id,
                nome: insumoData.nome,
                codigo: insumoData.codigo || null,
                unidade: insumoData.unidade,
                valor: insumoData.valorUnitario || 0,
                fornecedor: insumoData.fornecedor || null,
                estoque: insumoData.estoque || 0,
                estoque_minimo: insumoData.estoqueMinimo || 0,
                validade: insumoData.validade || null,
                quimico: insumoData.quimico || false,
                imagem: insumoData.imagem || null,
                validade_indeterminada: insumoData.validadeIndeterminada || false,
                status: (insumoData as any).status || 'ativo',
              };
              
              const { error: insertError } = await supabase.from('insumos').insert(supabaseData);
              if (insertError) throw insertError;

              // Variantes
              if (variantes && variantes.length > 0) {
                const variantesData = variantes.map((v: InsumoVariante) => ({
                  id: v.id,
                  insumo_id: insumo.id,
                  nome: v.nome,
                  codigo: v.codigo || null,
                  valor: v.valorUnitario || 0,
                }));
                const { error: varError } = await supabase.from('insumo_variantes').insert(variantesData);
                if (varError) console.error('Erro variantes:', varError);
              }
            }
          }
          return { success: true };
        } catch (error) {
          console.error('❌ Erro no syncFull de insumos:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      return { success: false, error: 'Não conectado' };
    },
    
    create: async (insumo: Insumo): Promise<void> => {
      const insumos = await this.insumos.getAll();
      insumos.push(insumo);
      await this.insumos.save(insumos);
    },
    
    update: async (insumo: Insumo): Promise<void> => {
      const insumos = await this.insumos.getAll();
      const index = insumos.findIndex(i => i.id === insumo.id);
      if (index >= 0) {
        insumos[index] = insumo;
        await this.insumos.save(insumos);
      }
    },
    
    delete: async (id: string): Promise<void> => {
      let insumos = await this.insumos.getAll();
      insumos = insumos.filter(i => i.id !== id);
      await this.insumos.save(insumos);
      
      // Deletar do Supabase também
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        await supabase.from('insumo_variantes').delete().eq('insumo_id', id);
        await supabase.from('insumos').delete().eq('id', id);
      }
    },
  };
  
  // ==================== FORMULAS ====================
  formulas = {
    getAll: async (): Promise<Formula[]> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          const { data, error } = await supabase
            .from('formulas')
            .select('*')
            .order('nome');
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            return data.map((formula: any) => ({
              id: formula.id,
              nome: formula.nome,
              codigo: formula.codigo,
              descricao: formula.descricao,
              grupoId: formula.grupo,
              pesoVolume: formula.peso_volume,
              unidade: formula.unidade,
              rendimento: formula.rendimento,
              observacoes: formula.observacoes,
              status: formula.status,
              listaInsumo: formula.lista_insumo,
              prefixoLote: formula.prefixo_lote,
              custoTotal: formula.custo_total,
              createdAt: formula.created_at,
              updatedAt: formula.updated_at,
              insumos: formula.insumos || [],
              historico: formula.historico || [],
            }));
          }
          return data || [];
        } catch (error) {
          console.error('Erro ao buscar fórmulas do Supabase:', error);
        }
      }
      
      // Fallback para localStorage
      const stored = localStorage.getItem('ohana_formulas');
      return stored ? JSON.parse(stored) : [];
    },
    
    save: async (formulas: Formula[]): Promise<{ success: boolean; error?: string }> => {
      // Sempre salva no localStorage
      localStorage.setItem('ohana_formulas', JSON.stringify(formulas));
      
      // Se conectado, salva no Supabase
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          console.log('🔄 Iniciando sincronização de fórmulas com Supabase...', formulas.length);
          
          for (const formula of formulas) {
            const { insumos: formulaInsumos, historico, ...formulaData } = formula;
            
            // COLUNAS CORRETAS DO BANCO - 'grupo' não 'grupo_id'
            const supabaseData: Record<string, any> = {
              id: formulaData.id,
              nome: formulaData.nome,
              codigo: formulaData.codigo || null,
              descricao: formulaData.descricao || null,
              grupo: formulaData.grupoId || null, // banco usa 'grupo' não 'grupo_id'
              peso_volume: formulaData.pesoVolume || null,
              unidade: formulaData.unidade || null,
              rendimento: formulaData.rendimento || 1,
              custo_total: (formulaData as any).custoTotal || 0,
              observacoes: formulaData.observacoes || null,
              status: formulaData.status || 'rascunho',
              lista_insumo: formulaData.listaInsumo || null,
              prefixo_lote: formulaData.prefixoLote || null,
              insumos: JSON.stringify(formulaInsumos || []), // Salvar como JSON
              historico: JSON.stringify(historico || []), // Salvar como JSON
            };
            
            console.log('📤 Enviando fórmula:', supabaseData);
            
            const { error } = await supabase
              .from('formulas')
              .upsert(supabaseData, { onConflict: 'id' });
            
            if (error) {
              console.error('❌ Erro ao salvar fórmula:', error);
              throw error;
            }
            
            console.log('✅ Fórmula salva:', formulaData.nome);
          }
          
          console.log('✅ Fórmulas sincronizadas com sucesso!');
          return { success: true };
        } catch (error) {
          console.error('❌ Erro ao salvar fórmulas no Supabase:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      
      return { success: true };
    },

    syncFull: async (formulas: Formula[]): Promise<{ success: boolean; error?: string }> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          console.log('🔄 Iniciando sincronização COMPLETA (Espelho) de fórmulas...');
          
          // 1. Deletar tudo
          const { error: deleteError } = await supabase.from('formulas').delete().neq('id', '0');
          if (deleteError) throw deleteError;
          
          // 2. Inserir dados locais
          if (formulas.length > 0) {
            const supabaseData = formulas.map(formula => {
              const { insumos, historico, ...formulaData } = formula;
              return {
                id: formulaData.id,
                nome: formulaData.nome,
                codigo: formulaData.codigo || null,
                descricao: formulaData.descricao || null,
                grupo: formulaData.grupoId || null,
                peso_volume: formulaData.pesoVolume || null,
                unidade: formulaData.unidade || null,
                rendimento: formulaData.rendimento || 1,
                custo_total: (formulaData as any).custoTotal || 0,
                observacoes: formulaData.observacoes || null,
                status: formulaData.status || 'rascunho',
                lista_insumo: formulaData.listaInsumo || null,
                prefixo_lote: formulaData.prefixoLote || null,
                insumos: JSON.stringify(insumos || []),
                historico: JSON.stringify(historico || []),
              };
            });
            
            const { error: insertError } = await supabase.from('formulas').insert(supabaseData);
            if (insertError) throw insertError;
          }
          return { success: true };
        } catch (error) {
          console.error('❌ Erro no syncFull de fórmulas:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      return { success: false, error: 'Não conectado' };
    },
    
    create: async (formula: Formula): Promise<void> => {
      const formulas = await this.formulas.getAll();
      formulas.push(formula);
      await this.formulas.save(formulas);
    },
    
    update: async (formula: Formula): Promise<void> => {
      const formulas = await this.formulas.getAll();
      const index = formulas.findIndex(f => f.id === formula.id);
      if (index >= 0) {
        formulas[index] = formula;
        await this.formulas.save(formulas);
      }
    },
    
    delete: async (id: string): Promise<void> => {
      let formulas = await this.formulas.getAll();
      formulas = formulas.filter(f => f.id !== id);
      await this.formulas.save(formulas);
      
      // Deletar do Supabase também
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        await supabase.from('formulas').delete().eq('id', id);
      }
    },
  };
  
  // ==================== CLIENTES ====================
  clientes = {
    getAll: async (): Promise<Cliente[]> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('nome');
          
          if (error) {
            console.error('Erro ao buscar clientes:', error);
            throw error;
          }
          
          // Converter de snake_case para camelCase
          return (data || []).map((c: any) => ({
            id: c.id,
            nome: c.nome,
            email: c.email,
            telefone: c.telefone,
            documento: c.documento,
            tipo: c.tipo,
            endereco: {
              rua: c.endereco_rua,
              numero: c.endereco_numero,
              bairro: c.endereco_bairro,
              cidade: c.endereco_cidade,
              estado: c.endereco_estado,
              cep: c.endereco_cep,
            },
            observacoes: c.observacoes,
            ativo: c.ativo,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
          }));
        } catch (error) {
          console.error('Erro ao buscar clientes do Supabase:', error);
        }
      }
      
      // Fallback para localStorage
      const stored = localStorage.getItem('ohana_clientes');
      return stored ? JSON.parse(stored) : [];
    },
    
    save: async (clientes: Cliente[]): Promise<{ success: boolean; error?: string }> => {
      localStorage.setItem('ohana_clientes', JSON.stringify(clientes));
      
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          console.log('🔄 Iniciando sincronização de clientes com Supabase...', clientes.length);
          
          for (const cliente of clientes) {
            const supabaseData: Record<string, any> = {
              id: cliente.id,
              nome: cliente.nome,
              email: cliente.email || null,
              telefone: cliente.telefone || null,
              documento: cliente.documento || null,
              tipo: cliente.tipo || 'pf',
              endereco_rua: cliente.endereco?.rua || null,
              endereco_numero: cliente.endereco?.numero || null,
              endereco_bairro: cliente.endereco?.bairro || null,
              endereco_cidade: cliente.endereco?.cidade || null,
              endereco_estado: cliente.endereco?.estado || null,
              endereco_cep: cliente.endereco?.cep || null,
              observacoes: cliente.observacoes || null,
              ativo: cliente.ativo !== false,
            };
            
            console.log('📤 Enviando cliente:', supabaseData);
            
            const { error } = await supabase
              .from('clientes')
              .upsert(supabaseData, { onConflict: 'id' });
            
            if (error) {
              console.error('❌ Erro ao salvar cliente:', error);
              throw error;
            }
            
            console.log('✅ Cliente salvo:', cliente.nome);
          }
          
          console.log('✅ Todos os clientes sincronizados!');
          return { success: true };
        } catch (error) {
          console.error('❌ Erro ao salvar clientes no Supabase:', error);
          return { success: false, error: (error as Error).message };
        }
      } else {
        console.log('⚠️ Supabase não conectado, salvando apenas no localStorage');
      }
      
      return { success: true };
    },

    syncFull: async (clientes: Cliente[]): Promise<{ success: boolean; error?: string }> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          console.log('🔄 Iniciando sincronização COMPLETA (Espelho) de clientes...');
          
          // 1. Deletar tudo
          const { error: deleteError } = await supabase.from('clientes').delete().neq('id', '0');
          if (deleteError) throw deleteError;
          
          // 2. Inserir dados locais
          if (clientes.length > 0) {
            const supabaseData = clientes.map(cliente => ({
              id: cliente.id,
              nome: cliente.nome,
              email: cliente.email || null,
              telefone: cliente.telefone || null,
              documento: cliente.documento || null,
              tipo: cliente.tipo || 'pf',
              endereco_rua: cliente.endereco?.rua || null,
              endereco_numero: cliente.endereco?.numero || null,
              endereco_bairro: cliente.endereco?.bairro || null,
              endereco_cidade: cliente.endereco?.cidade || null,
              endereco_estado: cliente.endereco?.estado || null,
              endereco_cep: cliente.endereco?.cep || null,
              observacoes: cliente.observacoes || null,
              ativo: cliente.ativo !== false,
            }));
            
            const { error: insertError } = await supabase.from('clientes').insert(supabaseData);
            if (insertError) throw insertError;
          }
          
          return { success: true };
        } catch (error) {
          console.error('❌ Erro no syncFull de clientes:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      return { success: false, error: 'Não conectado' };
    },
    
    create: async (cliente: Cliente): Promise<{ success: boolean; error?: string }> => {
      const clientes = await this.clientes.getAll();
      clientes.push(cliente);
      return await this.clientes.save(clientes);
    },
    
    update: async (cliente: Cliente): Promise<{ success: boolean; error?: string }> => {
      const clientes = await this.clientes.getAll();
      const index = clientes.findIndex(c => c.id === cliente.id);
      if (index >= 0) {
        clientes[index] = cliente;
        return await this.clientes.save(clientes);
      }
      return { success: false, error: 'Cliente não encontrado' };
    },
    
    delete: async (id: string): Promise<{ success: boolean; error?: string }> => {
      let clientes = await this.clientes.getAll();
      clientes = clientes.filter(c => c.id !== id);
      
      // Deletar do Supabase também
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        const { error } = await supabase.from('clientes').delete().eq('id', id);
        if (error) {
          console.error('Erro ao deletar cliente do Supabase:', error);
        }
      }
      
      return await this.clientes.save(clientes);
    },
  };
  
  // ==================== UTILS ====================
  async isConnected(): Promise<boolean> {
    // Usa cache para evitar múltiplas verificações
    if (this.connectionCache && Date.now() - this.connectionCache.checkedAt < this.CACHE_DURATION) {
      return this.connectionCache.connected;
    }
    
    if (!isSupabaseConfigured()) {
      this.connectionCache = { connected: false, checkedAt: Date.now() };
      return false;
    }
    
    const result = await testSupabaseConnection();
    this.connectionCache = { connected: result.success, checkedAt: Date.now() };
    console.log('🔌 Status conexão Supabase:', result.success ? 'Conectado' : 'Desconectado');
    return result.success;
  }
  
  async syncToCloud(): Promise<{ success: boolean; message: string; details?: any }> {
    if (!await this.isConnected()) {
      return { success: false, message: 'Supabase não está configurado ou não está conectado' };
    }
    
    try {
      console.log('🔄 Iniciando sincronização completa...');
      
      // Pega dados do localStorage
      const insumosLocal = localStorage.getItem('ohana_insumos');
      const formulasLocal = localStorage.getItem('ohana_formulas');
      const clientesLocal = localStorage.getItem('ohana_clientes');
      
      const insumos = insumosLocal ? JSON.parse(insumosLocal) : [];
      const formulas = formulasLocal ? JSON.parse(formulasLocal) : [];
      const clientesRaw = clientesLocal ? JSON.parse(clientesLocal) : [];
      
      // Converter clientes para o formato correto
      const clientes = clientesRaw.map((c: any) => ({
        ...c,
        createdAt: c.createdAt || c.dataCadastro || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      
      // Salva no Supabase (USANDO SYNC FULL = DELETE + INSERT)
      const insumosResult = await this.insumos.syncFull(insumos);
      const formulasResult = await this.formulas.syncFull(formulas);
      const clientesResult = await this.clientes.syncFull(clientes);
      
      const allSuccess = insumosResult.success && formulasResult.success && clientesResult.success;
      
      return {
        success: allSuccess,
        message: allSuccess ? 'Dados sincronizados com sucesso!' : 'Alguns dados não foram sincronizados',
        details: {
          insumos: { count: insumos.length, success: insumosResult.success },
          formulas: { count: formulas.length, success: formulasResult.success },
          clientes: { count: clientes.length, success: clientesResult.success },
        }
      };
    } catch (error) {
      console.error('❌ Erro ao sincronizar dados:', error);
      return {
        success: false,
        message: 'Erro ao sincronizar dados: ' + (error as Error).message,
      };
    }
  }
  
  async getStats(): Promise<{ insumos: number; formulas: number; clientes: number }> {
    const supabase = getSupabase();
    if (supabase && await this.isConnected()) {
      try {
        const [insumosResult, formulasResult, clientesResult] = await Promise.all([
          supabase.from('insumos').select('id', { count: 'exact', head: true }),
          supabase.from('formulas').select('id', { count: 'exact', head: true }),
          supabase.from('clientes').select('id', { count: 'exact', head: true }),
        ]);
        
        return {
          insumos: insumosResult.count || 0,
          formulas: formulasResult.count || 0,
          clientes: clientesResult.count || 0,
        };
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      }
    }
    
    // Fallback para localStorage
    const insumos = localStorage.getItem('ohana_insumos');
    const formulas = localStorage.getItem('ohana_formulas');
    const clientes = localStorage.getItem('ohana_clientes');
    
    return {
      insumos: insumos ? JSON.parse(insumos).length : 0,
      formulas: formulas ? JSON.parse(formulas).length : 0,
      clientes: clientes ? JSON.parse(clientes).length : 0,
    };
  }
  
  // Limpa o cache de conexão
  clearConnectionCache(): void {
    this.connectionCache = null;
  }
}

export const dataService = new DataServiceImpl();
