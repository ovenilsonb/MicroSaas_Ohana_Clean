import { getSupabase, isSupabaseConfigured, testSupabaseConnection } from './supabase';
import { Insumo, Formula, InsumoVariante } from '../types';

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

class DataServiceImpl {

  private connectionCache: { connected: boolean; checkedAt: number } | null = null;
  private readonly CACHE_DURATION = 30000;

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

          if (error) throw error;

          if (data && data.length > 0) {
            const { data: variantes } = await supabase
              .from('insumo_variantes')
              .select('*');

            const result = data.map((insumo: any) => ({
              id: insumo.id,
              nome: insumo.nome,
              apelido: insumo.apelido,
              codigo: insumo.codigo,
              unidade: insumo.unidade,
              valorUnitario: Number(insumo.valor_unitario) || 0,
              fornecedor: insumo.fornecedor,
              estoque: Number(insumo.estoque) || 0,
              estoqueMinimo: Number(insumo.estoque_minimo) || 0,
              validade: insumo.validade,
              quimico: insumo.quimico,
              imagem: insumo.imagem,
              foto: insumo.foto,
              validadeIndeterminada: insumo.validade_indeterminada,
              variantes: variantes?.filter((v: any) => v.insumo_id === insumo.id).map((v: any) => ({
                id: v.id,
                nome: v.nome,
                codigo: v.codigo,
                valorUnitario: Number(v.valor_unitario) || 0,
              })) || []
            }));
            localStorage.setItem('ohana_insumos', JSON.stringify(result));
            return result;
          }
          return [];
        } catch (error) {
          console.error('Erro ao buscar insumos do Supabase:', error);
        }
      }
      const stored = localStorage.getItem('ohana_insumos');
      return stored ? JSON.parse(stored) : [];
    },

    save: async (insumos: Insumo[]): Promise<{ success: boolean; error?: string }> => {
      localStorage.setItem('ohana_insumos', JSON.stringify(insumos));

      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          for (const insumo of insumos) {
            const { variantes, ...rest } = insumo;

            const dbData: Record<string, any> = {
              id: rest.id,
              nome: rest.nome,
              apelido: (rest as any).apelido || null,
              codigo: rest.codigo || null,
              unidade: rest.unidade,
              valor_unitario: rest.valorUnitario || 0,
              fornecedor: rest.fornecedor || null,
              estoque: rest.estoque || 0,
              estoque_minimo: rest.estoqueMinimo || 0,
              validade: rest.validade || null,
              quimico: rest.quimico || false,
              imagem: rest.imagem || null,
              foto: (rest as any).foto || null,
              validade_indeterminada: rest.validadeIndeterminada || false,
            };

            const { error } = await supabase
              .from('insumos')
              .upsert(dbData, { onConflict: 'id' });
            if (error) throw error;

            if (variantes && variantes.length > 0) {
              const varData = variantes.map((v: InsumoVariante) => ({
                id: v.id,
                insumo_id: insumo.id,
                nome: v.nome,
                codigo: v.codigo || null,
                valor_unitario: v.valorUnitario || 0,
              }));
              const currentIds = variantes.map((v: InsumoVariante) => v.id);
              await supabase.from('insumo_variantes').delete().eq('insumo_id', insumo.id).not('id', 'in', `(${currentIds.join(',')})`);
              const { error: varError } = await supabase.from('insumo_variantes').upsert(varData, { onConflict: 'id' });
              if (varError) console.error('Erro variantes:', varError);
            } else {
              await supabase.from('insumo_variantes').delete().eq('insumo_id', insumo.id);
            }
          }
          return { success: true };
        } catch (error) {
          console.error('Erro ao salvar insumos:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      return { success: true };
    },

    syncFull: async (insumos: Insumo[]): Promise<{ success: boolean; error?: string }> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          await supabase.from('insumo_variantes').delete().neq('id', '');
          await supabase.from('insumos').delete().neq('id', '');

          if (insumos.length > 0) {
            for (const insumo of insumos) {
              const { variantes, ...rest } = insumo;
              const dbData: Record<string, any> = {
                id: rest.id,
                nome: rest.nome,
                apelido: (rest as any).apelido || null,
                codigo: rest.codigo || null,
                unidade: rest.unidade,
                valor_unitario: rest.valorUnitario || 0,
                fornecedor: rest.fornecedor || null,
                estoque: rest.estoque || 0,
                estoque_minimo: rest.estoqueMinimo || 0,
                validade: rest.validade || null,
                quimico: rest.quimico || false,
                imagem: rest.imagem || null,
                foto: (rest as any).foto || null,
                validade_indeterminada: rest.validadeIndeterminada || false,
              };
              await supabase.from('insumos').insert(dbData);

              if (variantes && variantes.length > 0) {
                const varData = variantes.map((v: InsumoVariante) => ({
                  id: v.id,
                  insumo_id: insumo.id,
                  nome: v.nome,
                  codigo: v.codigo || null,
                  valor_unitario: v.valorUnitario || 0,
                }));
                await supabase.from('insumo_variantes').insert(varData);
              }
            }
          }
          return { success: true };
        } catch (error) {
          console.error('Erro syncFull insumos:', error);
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
            .select('*, formula_insumos (*)')
            .order('nome');
          if (error) throw error;

          if (data && data.length > 0) {
            const result = data.map((f: any) => ({
              id: f.id,
              nome: f.nome,
              codigo: f.codigo,
              descricao: f.descricao,
              grupoId: f.grupo_id,
              pesoVolume: f.peso_volume,
              unidade: f.unidade,
              rendimento: f.rendimento,
              observacoes: f.observacoes,
              status: f.status,
              listaInsumo: f.lista_insumo,
              prefixoLote: f.prefixo_lote,
              custoTotal: Number(f.custo_total) || 0,
              createdAt: f.created_at,
              updatedAt: f.updated_at,
              insumos: f.formula_insumos?.map((i: any) => ({
                id: i.id,
                insumoId: i.insumo_id,
                varianteId: i.variante_id,
                nome: i.nome,
                unidade: i.unidade,
                quantidade: Number(i.quantidade) || 0,
                custo: Number(i.custo) || 0,
                quimico: i.quimico || false,
                valorUnitario: Number(i.valor_unitario) || 0,
                ordem: i.ordem || 0
              })) || [],
              historico: [],
            }));
            localStorage.setItem('ohana_formulas', JSON.stringify(result));
            return result;
          }
          return [];
        } catch (error) {
          console.error('Erro ao buscar fórmulas:', error);
        }
      }
      const stored = localStorage.getItem('ohana_formulas');
      return stored ? JSON.parse(stored) : [];
    },

    save: async (formulas: Formula[]): Promise<{ success: boolean; error?: string }> => {
      localStorage.setItem('ohana_formulas', JSON.stringify(formulas));

      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          for (const formula of formulas) {
            const { insumos: formulaInsumos, historico, ...rest } = formula;

            const dbData: Record<string, any> = {
              id: rest.id,
              nome: rest.nome,
              codigo: rest.codigo || null,
              descricao: rest.descricao || null,
              grupo_id: rest.grupoId || null,
              peso_volume: rest.pesoVolume || null,
              unidade: rest.unidade || null,
              rendimento: rest.rendimento || 1,
              observacoes: rest.observacoes || null,
              status: rest.status || 'rascunho',
              lista_insumo: rest.listaInsumo || null,
              prefixo_lote: rest.prefixoLote || null,
              custo_total: (rest as any).custoTotal || 0,
            };

            const { error } = await supabase
              .from('formulas')
              .upsert(dbData, { onConflict: 'id' });
            if (error) throw error;

            if (formulaInsumos && formulaInsumos.length > 0) {
              await supabase.from('formula_insumos').delete().eq('formula_id', formula.id);
              const insData = formulaInsumos.map((i: any, idx: number) => ({
                id: i.id || `${formula.id}-${i.insumoId}-${idx}`,
                formula_id: formula.id,
                insumo_id: i.insumoId,
                variante_id: i.varianteId || null,
                nome: i.nome,
                unidade: i.unidade || null,
                quantidade: i.quantidade || 0,
                custo: i.custo || 0,
                valor_unitario: i.valorUnitario || 0,
                quimico: i.quimico || false,
                ordem: i.ordem || idx
              }));
              const { error: insErr } = await supabase.from('formula_insumos').insert(insData);
              if (insErr) console.error('Erro formula_insumos:', insErr);
            }
          }
          return { success: true };
        } catch (error) {
          console.error('Erro ao salvar fórmulas:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      return { success: true };
    },

    syncFull: async (formulas: Formula[]): Promise<{ success: boolean; error?: string }> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          await supabase.from('formula_insumos').delete().neq('id', '');
          await supabase.from('formulas').delete().neq('id', '');

          for (const formula of formulas) {
            const { insumos: formulaInsumos, historico, ...rest } = formula;
            const dbData = {
              id: rest.id,
              nome: rest.nome,
              codigo: rest.codigo || null,
              descricao: rest.descricao || null,
              grupo_id: rest.grupoId || null,
              peso_volume: rest.pesoVolume || null,
              unidade: rest.unidade || null,
              rendimento: rest.rendimento || 1,
              observacoes: rest.observacoes || null,
              status: rest.status || 'rascunho',
              lista_insumo: rest.listaInsumo || null,
              prefixo_lote: rest.prefixoLote || null,
              custo_total: (rest as any).custoTotal || 0,
            };
            await supabase.from('formulas').insert(dbData);

            if (formulaInsumos && formulaInsumos.length > 0) {
              const insData = formulaInsumos.map((i: any, idx: number) => ({
                id: i.id || `${rest.id}-${i.insumoId}-${idx}`,
                formula_id: rest.id,
                insumo_id: i.insumoId,
                variante_id: i.varianteId || null,
                nome: i.nome,
                unidade: i.unidade || null,
                quantidade: i.quantidade || 0,
                custo: i.custo || 0,
                valor_unitario: i.valorUnitario || 0,
                quimico: i.quimico || false,
                ordem: i.ordem || idx
              }));
              await supabase.from('formula_insumos').insert(insData);
            }
          }
          return { success: true };
        } catch (error) {
          console.error('Erro syncFull fórmulas:', error);
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
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        await supabase.from('formula_insumos').delete().eq('formula_id', id);
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
          if (error) throw error;

          const result = (data || []).map((c: any) => ({
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
          localStorage.setItem('ohana_clientes', JSON.stringify(result));
          return result;
        } catch (error) {
          console.error('Erro ao buscar clientes:', error);
        }
      }
      const stored = localStorage.getItem('ohana_clientes');
      return stored ? JSON.parse(stored) : [];
    },

    save: async (clientes: Cliente[]): Promise<{ success: boolean; error?: string }> => {
      localStorage.setItem('ohana_clientes', JSON.stringify(clientes));

      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          for (const cliente of clientes) {
            const dbData: Record<string, any> = {
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
            const { error } = await supabase.from('clientes').upsert(dbData, { onConflict: 'id' });
            if (error) throw error;
          }
          return { success: true };
        } catch (error) {
          console.error('Erro ao salvar clientes:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      return { success: true };
    },

    syncFull: async (clientes: Cliente[]): Promise<{ success: boolean; error?: string }> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          await supabase.from('clientes').delete().neq('id', '');
          if (clientes.length > 0) {
            const dbData = clientes.map(c => ({
              id: c.id,
              nome: c.nome,
              email: c.email || null,
              telefone: c.telefone || null,
              documento: c.documento || null,
              tipo: c.tipo || 'pf',
              endereco_rua: c.endereco?.rua || null,
              endereco_numero: c.endereco?.numero || null,
              endereco_bairro: c.endereco?.bairro || null,
              endereco_cidade: c.endereco?.cidade || null,
              endereco_estado: c.endereco?.estado || null,
              endereco_cep: c.endereco?.cep || null,
              observacoes: c.observacoes || null,
              ativo: c.ativo !== false,
            }));
            const { error } = await supabase.from('clientes').insert(dbData);
            if (error) throw error;
          }
          return { success: true };
        } catch (error) {
          console.error('Erro syncFull clientes:', error);
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
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        await supabase.from('clientes').delete().eq('id', id);
      }
      return await this.clientes.save(clientes);
    },
  };

  // ==================== GRUPOS ====================
  grupos = {
    getAll: async (): Promise<any[]> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          const { data, error } = await supabase.from('grupos').select('*').order('nome');
          if (error) throw error;
          if (data) {
            localStorage.setItem('ohana_grupos', JSON.stringify(data));
            return data;
          }
        } catch (error) {
          console.error('Erro ao buscar grupos:', error);
        }
      }
      const stored = localStorage.getItem('ohana_grupos');
      return stored ? JSON.parse(stored) : [];
    },

    save: async (grupos: any[]): Promise<{ success: boolean; error?: string }> => {
      localStorage.setItem('ohana_grupos', JSON.stringify(grupos));
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          for (const grupo of grupos) {
            const { error } = await supabase.from('grupos').upsert({
              id: grupo.id,
              nome: grupo.nome,
              cor: grupo.cor || '#3B82F6',
            }, { onConflict: 'id' });
            if (error) throw error;
          }
          return { success: true };
        } catch (error) {
          console.error('Erro ao salvar grupos:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      return { success: true };
    },

    delete: async (id: string): Promise<void> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        await supabase.from('grupos').delete().eq('id', id);
      }
      let grupos = await this.grupos.getAll();
      grupos = grupos.filter(g => g.id !== id);
      localStorage.setItem('ohana_grupos', JSON.stringify(grupos));
    },
  };

  // ==================== PEDIDOS ====================
  pedidos = {
    getAll: async (): Promise<any[]> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          const { data, error } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          if (data && data.length > 0) {
            const result = data.map((p: any) => ({
              id: p.id,
              numero: p.numero,
              tipo: p.tipo,
              clienteId: p.cliente_id,
              cliente: p.cliente,
              telefone: p.telefone,
              email: p.email,
              endereco: p.endereco,
              items: p.items || [],
              subtotal: Number(p.subtotal) || 0,
              desconto: Number(p.desconto) || 0,
              total: Number(p.total) || 0,
              status: p.status,
              formaPagamento: p.forma_pagamento,
              tipoEntrega: p.tipo_entrega,
              listaPrecoId: p.lista_preco_id,
              observacoes: p.observacoes,
              createdAt: p.created_at,
              updatedAt: p.updated_at,
            }));
            localStorage.setItem('pedidos', JSON.stringify(result));
            return result;
          }
          return [];
        } catch (error) {
          console.error('Erro ao buscar pedidos:', error);
        }
      }
      const stored = localStorage.getItem('pedidos');
      return stored ? JSON.parse(stored) : [];
    },

    save: async (pedidos: any[]): Promise<{ success: boolean; error?: string }> => {
      localStorage.setItem('pedidos', JSON.stringify(pedidos));
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          for (const p of pedidos) {
            const dbData = {
              id: p.id,
              numero: p.numero,
              tipo: p.tipo || 'venda',
              cliente_id: p.clienteId || null,
              cliente: p.cliente || null,
              telefone: p.telefone || null,
              email: p.email || null,
              endereco: p.endereco || null,
              items: p.items || [],
              subtotal: p.subtotal || 0,
              desconto: p.desconto || 0,
              total: p.total || 0,
              status: p.status || 'pendente',
              forma_pagamento: p.formaPagamento || null,
              tipo_entrega: p.tipoEntrega || null,
              lista_preco_id: p.listaPrecoId || null,
              observacoes: p.observacoes || null,
            };
            const { error } = await supabase.from('pedidos').upsert(dbData, { onConflict: 'id' });
            if (error) throw error;
          }
          return { success: true };
        } catch (error) {
          console.error('Erro ao salvar pedidos:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      return { success: true };
    },

    delete: async (id: string): Promise<void> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        await supabase.from('pedidos').delete().eq('id', id);
      }
      let pedidos = await this.pedidos.getAll();
      pedidos = pedidos.filter(p => p.id !== id);
      localStorage.setItem('pedidos', JSON.stringify(pedidos));
    },
  };

  // ==================== ORDENS DE PRODUÇÃO ====================
  ordensProducao = {
    getAll: async (): Promise<any[]> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          const { data, error } = await supabase.from('ordens_producao').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          if (data && data.length > 0) {
            const result = data.map((o: any) => ({
              id: o.id,
              numero: o.numero,
              pedidoId: o.pedido_id,
              pedidoNumero: o.pedido_numero,
              cliente: o.cliente,
              formulaId: o.formula_id,
              formulaNome: o.formula_nome,
              quantidade: Number(o.quantidade) || 0,
              status: o.status,
              prioridade: o.prioridade,
              lote: o.lote,
              observacoes: o.observacoes,
              iniciadoEm: o.iniciado_em,
              concluidoEm: o.concluido_em,
              createdAt: o.created_at,
              updatedAt: o.updated_at,
            }));
            localStorage.setItem('ordensProducao', JSON.stringify(result));
            return result;
          }
          return [];
        } catch (error) {
          console.error('Erro ao buscar ordens:', error);
        }
      }
      const stored = localStorage.getItem('ordensProducao');
      return stored ? JSON.parse(stored) : [];
    },

    save: async (ordens: any[]): Promise<{ success: boolean; error?: string }> => {
      localStorage.setItem('ordensProducao', JSON.stringify(ordens));
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          for (const o of ordens) {
            const dbData = {
              id: o.id,
              numero: o.numero,
              pedido_id: o.pedidoId || null,
              pedido_numero: o.pedidoNumero || null,
              cliente: o.cliente || null,
              formula_id: o.formulaId || null,
              formula_nome: o.formulaNome || null,
              quantidade: o.quantidade || 0,
              status: o.status || 'aguardando',
              prioridade: o.prioridade || 'normal',
              lote: o.lote || null,
              observacoes: o.observacoes || null,
              iniciado_em: o.iniciadoEm || null,
              concluido_em: o.concluidoEm || null,
            };
            const { error } = await supabase.from('ordens_producao').upsert(dbData, { onConflict: 'id' });
            if (error) throw error;
          }
          return { success: true };
        } catch (error) {
          console.error('Erro ao salvar ordens:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      return { success: true };
    },

    delete: async (id: string): Promise<void> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        await supabase.from('ordens_producao').delete().eq('id', id);
      }
      let ordens = await this.ordensProducao.getAll();
      ordens = ordens.filter(o => o.id !== id);
      localStorage.setItem('ordensProducao', JSON.stringify(ordens));
    },
  };

  // ==================== PRODUTOS ESTOQUE ====================
  produtosEstoque = {
    getAll: async (): Promise<any[]> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          const { data, error } = await supabase.from('produtos_estoque').select('*').order('nome');
          if (error) throw error;
          if (data && data.length > 0) {
            const result = data.map((p: any) => ({
              id: p.id,
              formulaId: p.formula_id,
              nome: p.nome,
              codigo: p.codigo,
              quantidade: Number(p.quantidade) || 0,
              estoqueMinimo: Number(p.estoque_minimo) || 0,
              unidade: p.unidade,
              ultimaEntrada: p.ultima_entrada,
              ultimaSaida: p.ultima_saida,
            }));
            localStorage.setItem('produtosEstoque', JSON.stringify(result));
            return result;
          }
          return [];
        } catch (error) {
          console.error('Erro ao buscar estoque:', error);
        }
      }
      const stored = localStorage.getItem('produtosEstoque');
      return stored ? JSON.parse(stored) : [];
    },

    save: async (produtos: any[]): Promise<{ success: boolean; error?: string }> => {
      localStorage.setItem('produtosEstoque', JSON.stringify(produtos));
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          for (const p of produtos) {
            const dbData = {
              id: p.id,
              formula_id: p.formulaId || null,
              nome: p.nome,
              codigo: p.codigo || null,
              quantidade: p.quantidade || 0,
              estoque_minimo: p.estoqueMinimo || 0,
              unidade: p.unidade || null,
              ultima_entrada: p.ultimaEntrada || null,
              ultima_saida: p.ultimaSaida || null,
            };
            const { error } = await supabase.from('produtos_estoque').upsert(dbData, { onConflict: 'id' });
            if (error) throw error;
          }
          return { success: true };
        } catch (error) {
          console.error('Erro ao salvar estoque:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      return { success: true };
    },

    delete: async (id: string): Promise<void> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        await supabase.from('produtos_estoque').delete().eq('id', id);
      }
      let produtos = await this.produtosEstoque.getAll();
      produtos = produtos.filter(p => p.id !== id);
      localStorage.setItem('produtosEstoque', JSON.stringify(produtos));
    },
  };

  // ==================== MOVIMENTAÇÕES ESTOQUE ====================
  movimentacoesEstoque = {
    getAll: async (): Promise<any[]> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          const { data, error } = await supabase.from('movimentacoes_estoque').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          if (data && data.length > 0) {
            const result = data.map((m: any) => ({
              id: m.id,
              tipo: m.tipo,
              produtoId: m.produto_id,
              produtoNome: m.produto_nome,
              quantidade: Number(m.quantidade) || 0,
              motivo: m.motivo,
              referencia: m.referencia,
              createdAt: m.created_at,
            }));
            localStorage.setItem('movimentosEstoque', JSON.stringify(result));
            return result;
          }
          return [];
        } catch (error) {
          console.error('Erro ao buscar movimentações:', error);
        }
      }
      const stored = localStorage.getItem('movimentosEstoque');
      return stored ? JSON.parse(stored) : [];
    },

    save: async (movimentos: any[]): Promise<{ success: boolean; error?: string }> => {
      localStorage.setItem('movimentosEstoque', JSON.stringify(movimentos));
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          for (const m of movimentos) {
            const dbData = {
              id: m.id,
              tipo: m.tipo,
              produto_id: m.produtoId || null,
              produto_nome: m.produtoNome || null,
              quantidade: m.quantidade || 0,
              motivo: m.motivo || null,
              referencia: m.referencia || null,
            };
            const { error } = await supabase.from('movimentacoes_estoque').upsert(dbData, { onConflict: 'id' });
            if (error) throw error;
          }
          return { success: true };
        } catch (error) {
          console.error('Erro ao salvar movimentações:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      return { success: true };
    },
  };

  // ==================== LISTAS DE PREÇO ====================
  listasPreco = {
    getAll: async (): Promise<any[]> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          const { data, error } = await supabase.from('listas_preco').select('*').order('nome');
          if (error) throw error;
          if (data && data.length > 0) {
            const result = data.map((l: any) => ({
              id: l.id,
              nome: l.nome,
              descricao: l.descricao,
              aplicarA: l.aplicar_a,
              ativo: l.ativo,
              regras: l.regras || [],
              dataCriacao: l.created_at,
            }));
            localStorage.setItem('listasPreco', JSON.stringify(result));
            return result;
          }
          return [];
        } catch (error) {
          console.error('Erro ao buscar listas de preço:', error);
        }
      }
      const stored = localStorage.getItem('listasPreco');
      return stored ? JSON.parse(stored) : [];
    },

    save: async (listas: any[]): Promise<{ success: boolean; error?: string }> => {
      localStorage.setItem('listasPreco', JSON.stringify(listas));
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          for (const l of listas) {
            const dbData = {
              id: l.id,
              nome: l.nome,
              descricao: l.descricao || null,
              aplicar_a: l.aplicarA || 'produto',
              ativo: l.ativo !== false,
              regras: l.regras || [],
            };
            const { error } = await supabase.from('listas_preco').upsert(dbData, { onConflict: 'id' });
            if (error) throw error;
          }
          return { success: true };
        } catch (error) {
          console.error('Erro ao salvar listas de preço:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      return { success: true };
    },

    delete: async (id: string): Promise<void> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        await supabase.from('listas_preco').delete().eq('id', id);
      }
      let listas = await this.listasPreco.getAll();
      listas = listas.filter(l => l.id !== id);
      localStorage.setItem('listasPreco', JSON.stringify(listas));
    },
  };

  // ==================== PRECIFICAÇÃO ====================
  precificacao = {
    getAll: async (): Promise<any[]> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          const { data, error } = await supabase.from('precificacao').select('*');
          if (error) throw error;
          if (data && data.length > 0) {
            const result = data.map((p: any) => ({
              id: p.id,
              formulaId: p.formula_id,
              custosFixos: Number(p.custos_fixos) || 0,
              precoVarejo: Number(p.preco_varejo) || 0,
              precoAtacado: Number(p.preco_atacado) || 0,
              precoFardo: Number(p.preco_fardo) || 0,
              quantidadeFardo: Number(p.quantidade_fardo) || 0,
              updatedAt: p.updated_at,
            }));
            localStorage.setItem('precificacoes', JSON.stringify(
              result.reduce((acc: any, p: any) => { acc[p.id] = p; return acc; }, {})
            ));
            return result;
          }
          return [];
        } catch (error) {
          console.error('Erro ao buscar precificação:', error);
        }
      }
      const stored = localStorage.getItem('precificacoes');
      if (stored) {
        return Object.values(JSON.parse(stored));
      }
      return [];
    },

    save: async (precificacoes: any[]): Promise<{ success: boolean; error?: string }> => {
      const obj = precificacoes.reduce((acc: any, p: any) => { acc[p.id] = p; return acc; }, {});
      localStorage.setItem('precificacoes', JSON.stringify(obj));

      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          for (const p of precificacoes) {
            const dbData = {
              id: p.id,
              formula_id: p.formulaId || null,
              custos_fixos: p.custosFixos || 0,
              preco_varejo: p.precoVarejo || 0,
              preco_atacado: p.precoAtacado || 0,
              preco_fardo: p.precoFardo || 0,
              quantidade_fardo: p.quantidadeFardo || 0,
            };
            const { error } = await supabase.from('precificacao').upsert(dbData, { onConflict: 'id' });
            if (error) throw error;
          }
          return { success: true };
        } catch (error) {
          console.error('Erro ao salvar precificação:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      return { success: true };
    },
  };

  // ==================== ANOTAÇÕES ====================
  anotacoes = {
    getAll: async (userId?: string): Promise<any[]> => {
      const storageKey = userId ? `ohana_notes_${userId}` : 'ohana_notes';
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          let query = supabase.from('anotacoes').select('*').order('created_at', { ascending: false });
          if (userId) {
            query = query.eq('user_id', userId);
          }
          const { data, error } = await query;
          if (error) throw error;
          if (data && data.length > 0) {
            const result = data.map((n: any) => ({
              id: n.id,
              titulo: n.titulo || '',
              conteudo: n.conteudo || '',
              cor: n.cor || '#fbbf24',
              fixada: n.fixada || false,
              userId: n.user_id || userId,
              createdAt: n.created_at,
              updatedAt: n.updated_at,
            }));
            localStorage.setItem(storageKey, JSON.stringify(result));
            return result;
          }
          return [];
        } catch (error) {
          console.error('Erro ao buscar anotações:', error);
        }
      }
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    },

    save: async (notes: any[], userId?: string): Promise<{ success: boolean; error?: string }> => {
      const storageKey = userId ? `ohana_notes_${userId}` : 'ohana_notes';
      localStorage.setItem(storageKey, JSON.stringify(notes));
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          for (const n of notes) {
            const dbData: Record<string, any> = {
              id: n.id,
              titulo: n.titulo || '',
              conteudo: n.conteudo || '',
              cor: n.cor || '#fbbf24',
              fixada: n.fixada || false,
            };
            if (userId) {
              dbData.user_id = userId;
            }
            const { error } = await supabase.from('anotacoes').upsert(dbData, { onConflict: 'id' });
            if (error) throw error;
          }
          return { success: true };
        } catch (error) {
          console.error('Erro ao salvar anotações:', error);
          return { success: false, error: (error as Error).message };
        }
      }
      return { success: true };
    },

    delete: async (id: string, userId?: string): Promise<void> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        let query = supabase.from('anotacoes').delete().eq('id', id);
        if (userId) {
          query = query.eq('user_id', userId);
        }
        await query;
      }
      let notes = await this.anotacoes.getAll(userId);
      notes = notes.filter(n => n.id !== id);
      const storageKey = userId ? `ohana_notes_${userId}` : 'ohana_notes';
      localStorage.setItem(storageKey, JSON.stringify(notes));
    },
  };

  // ==================== UTILS ====================
  async isConnected(): Promise<boolean> {
    if (this.connectionCache && Date.now() - this.connectionCache.checkedAt < this.CACHE_DURATION) {
      return this.connectionCache.connected;
    }

    if (!isSupabaseConfigured()) {
      this.connectionCache = { connected: false, checkedAt: Date.now() };
      return false;
    }

    const result = await testSupabaseConnection();
    this.connectionCache = { connected: result.success, checkedAt: Date.now() };
    return result.success;
  }

  async syncToCloud(): Promise<{ success: boolean; message: string; details?: any }> {
    if (!await this.isConnected()) {
      return { success: false, message: 'Supabase não está configurado ou conectado' };
    }

    try {
      const insumosLocal = localStorage.getItem('ohana_insumos');
      const formulasLocal = localStorage.getItem('ohana_formulas');
      const clientesLocal = localStorage.getItem('ohana_clientes');
      const gruposLocal = localStorage.getItem('ohana_grupos');
      const pedidosLocal = localStorage.getItem('pedidos');
      const ordensLocal = localStorage.getItem('ordensProducao');
      const estoqueLocal = localStorage.getItem('produtosEstoque');
      const movimentosLocal = localStorage.getItem('movimentosEstoque');
      const listasLocal = localStorage.getItem('listasPreco');
      const precificacoesLocal = localStorage.getItem('precificacoes');
      const notasLocal = localStorage.getItem('ohana_notes');

      const insumos = insumosLocal ? JSON.parse(insumosLocal) : [];
      const formulas = formulasLocal ? JSON.parse(formulasLocal) : [];
      const clientesRaw = clientesLocal ? JSON.parse(clientesLocal) : [];
      const grupos = gruposLocal ? JSON.parse(gruposLocal) : [];
      const pedidos = pedidosLocal ? JSON.parse(pedidosLocal) : [];
      const ordens = ordensLocal ? JSON.parse(ordensLocal) : [];
      const estoque = estoqueLocal ? JSON.parse(estoqueLocal) : [];
      const movimentos = movimentosLocal ? JSON.parse(movimentosLocal) : [];
      const listas = listasLocal ? JSON.parse(listasLocal) : [];
      const precificacoes = precificacoesLocal ? Object.values(JSON.parse(precificacoesLocal)) : [];
      const notas = notasLocal ? JSON.parse(notasLocal) : [];

      const clientes = clientesRaw.map((c: any) => ({
        ...c,
        createdAt: c.createdAt || c.dataCadastro || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      if (grupos.length) await this.grupos.save(grupos);

      const insumosResult = await this.insumos.syncFull(insumos);
      const formulasResult = await this.formulas.syncFull(formulas);
      const clientesResult = await this.clientes.syncFull(clientes);
      if (pedidos.length) await this.pedidos.save(pedidos);
      if (ordens.length) await this.ordensProducao.save(ordens);
      if (estoque.length) await this.produtosEstoque.save(estoque);
      if (movimentos.length) await this.movimentacoesEstoque.save(movimentos);
      if (listas.length) await this.listasPreco.save(listas);
      if (precificacoes.length) await this.precificacao.save(precificacoes as any[]);
      if (notas.length) await this.anotacoes.save(notas);

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
      console.error('Erro ao sincronizar:', error);
      return {
        success: false,
        message: 'Erro ao sincronizar dados: ' + (error as Error).message,
      };
    }
  }

  async getStats(): Promise<{ insumos: number; formulas: number; clientes: number; precificacoes: number }> {
    const supabase = getSupabase();
    if (supabase && await this.isConnected()) {
      try {
        const [insumosResult, formulasResult, clientesResult, precificacaoResult] = await Promise.all([
          supabase.from('insumos').select('id', { count: 'exact', head: true }),
          supabase.from('formulas').select('id', { count: 'exact', head: true }),
          supabase.from('clientes').select('id', { count: 'exact', head: true }),
          supabase.from('precificacao').select('id', { count: 'exact', head: true }),
        ]);

        return {
          insumos: insumosResult.count || 0,
          formulas: formulasResult.count || 0,
          clientes: clientesResult.count || 0,
          precificacoes: precificacaoResult.count || 0,
        };
      } catch (error) {
        console.error('Erro estatísticas:', error);
      }
    }

    const insumos = localStorage.getItem('ohana_insumos');
    const formulas = localStorage.getItem('ohana_formulas');
    const clientes = localStorage.getItem('ohana_clientes');
    const precificacoes = localStorage.getItem('precificacoes');

    return {
      insumos: insumos ? JSON.parse(insumos).length : 0,
      formulas: formulas ? JSON.parse(formulas).length : 0,
      clientes: clientes ? JSON.parse(clientes).length : 0,
      precificacoes: precificacoes ? Object.keys(JSON.parse(precificacoes)).length : 0,
    };
  }

  // Keep generic for backward compatibility
  generic = {
    getAll: async <T>(table: string): Promise<T[]> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          const { data, error } = await supabase.from(table).select('*');
          if (error) throw error;
          return data as T[];
        } catch (error) {
          console.error(`Erro ao buscar ${table}:`, error);
        }
      }
      return [];
    },
    save: async <T extends { id: string }>(table: string, items: T[]): Promise<{ success: boolean; error?: string }> => {
      const supabase = getSupabase();
      if (supabase && await this.isConnected()) {
        try {
          for (const item of items) {
            const { error } = await supabase.from(table).upsert(item, { onConflict: 'id' });
            if (error) throw error;
          }
          return { success: true };
        } catch (error) {
          console.error(`Erro ao salvar ${table}:`, error);
          return { success: false, error: (error as Error).message };
        }
      }
      return { success: false, error: 'Não conectado' };
    }
  };

  clearConnectionCache(): void {
    this.connectionCache = null;
  }
}

export const dataService = new DataServiceImpl();
