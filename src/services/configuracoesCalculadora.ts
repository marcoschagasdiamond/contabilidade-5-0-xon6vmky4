import pb from '@/lib/pocketbase/client'
import type { ConfiguracoesGerais } from '@/types/calculadoraIbsCbs'

// ============================================================
// Autosave das Configurações (Módulo 1) da Calculadora IBS/CBS
// Guarda as seleções do painel de Configurações em
// simulacoes_calculadora.parametros_json (registro próprio com
// marcador _autosaveConfiguracoes, invisível na lista de
// simulações). Se a nuvem falhar (ex.: sem simulação ativa/sem
// rede), o fallback é um registro por usuário no localStorage.
// Nenhum cálculo é alterado: apenas persiste/repõe o estado.
// ============================================================

const MARCADOR_AUTOSAVE = '_autosaveConfiguracoes'
const NOME_REGISTRO_AUTOSAVE = 'CONFIG-AUTOSAVE Calculadora IBS/CBS'

export interface PayloadConfiguracoesCalculadora {
  config: Partial<ConfiguracoesGerais>
  identidade: {
    cnpj: string
    nomeEmpresa: string
  }
  salvoEm: string
}

function camposAutosave(config: ConfiguracoesGerais): Partial<ConfiguracoesGerais> {
  return {
    presetSetor: config.presetSetor,
    regimeAtualEmpresa: config.regimeAtualEmpresa,
    cbsPadrao: config.cbsPadrao,
    ibsPadrao: config.ibsPadrao,
    totalIvaDual: config.totalIvaDual,
    anoTransicao: config.anoTransicao,
    saudeEducacaoAliquota: config.saudeEducacaoAliquota,
    transporteAliquota: config.transporteAliquota,
    cestaBasicaIsencao: config.cestaBasicaIsencao,
    aliquotaImpostoSeletivo: config.aliquotaImpostoSeletivo,
    proporcaoServicoMisto: config.proporcaoServicoMisto,
    faturamentoMensal: config.faturamentoMensal,
    percentualComprasVendas: config.percentualComprasVendas,
    porcentagemComprasSimplesNacional: config.porcentagemComprasSimplesNacional,
    tipoAtividade: config.tipoAtividade,
    subatividadeServico: config.subatividadeServico,
    subatividadeIndustria: config.subatividadeIndustria,
    subatividadeComercio: config.subatividadeComercio,
    subatividadeAgro: config.subatividadeAgro,
    subatividadeConstrucao: config.subatividadeConstrucao,
    subatividadeLocacao: config.subatividadeLocacao,
    subatividadeFoodService: config.subatividadeFoodService,
    etiquetasOrigem: config.etiquetasOrigem,
    ajusteAliquotaSimplesMedia: config.ajusteAliquotaSimplesMedia,
    ajusteIvaDualCenarioCheio: config.ajusteIvaDualCenarioCheio,
  }
}

export function montarPayloadConfiguracoes(
  config: ConfiguracoesGerais,
  identidade: { cnpj: string; nomeEmpresa: string },
): PayloadConfiguracoesCalculadora {
  return {
    config: camposAutosave(config),
    identidade: {
      cnpj: identidade.cnpj || '',
      nomeEmpresa: identidade.nomeEmpresa || '',
    },
    salvoEm: new Date().toISOString(),
  }
}

// ==========================================
// FALLBACK LOCAL (por usuário)
// ==========================================

function chaveLocal(usuarioId: string): string {
  return `contabilidade50_config_calculadora_${usuarioId}`
}

export function salvarConfiguracaoLocal(
  usuarioId: string,
  payload: PayloadConfiguracoesCalculadora,
): boolean {
  try {
    localStorage.setItem(chaveLocal(usuarioId), JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}

export function carregarConfiguracaoLocal(
  usuarioId: string,
): PayloadConfiguracoesCalculadora | null {
  try {
    const raw = localStorage.getItem(chaveLocal(usuarioId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as PayloadConfiguracoesCalculadora
    if (!parsed || !parsed.config) return null
    return parsed
  } catch {
    return null
  }
}

export function removerConfiguracaoLocal(usuarioId: string): void {
  try {
    localStorage.removeItem(chaveLocal(usuarioId))
  } catch {
    // localStorage indisponível: nada a remover
  }
}

// ==========================================
// NUVEM (simulacoes_calculadora.parametros_json)
// ==========================================

function filtroAutosave(usuarioId: string): string {
  return `user_id = "${usuarioId}" && nome = "${NOME_REGISTRO_AUTOSAVE}"`
}

function parsePayload(record: {
  parametros_json: unknown
}): PayloadConfiguracoesCalculadora | null {
  try {
    const pj =
      typeof record.parametros_json === 'string'
        ? JSON.parse(record.parametros_json)
        : record.parametros_json
    if (!pj || !pj.config) return null
    return {
      config: pj.config,
      identidade: pj.identidade || { cnpj: '', nomeEmpresa: '' },
      salvoEm: pj.salvoEm || '',
    }
  } catch {
    return null
  }
}

/** Salva (create/update) o registro de autosave na nuvem. false = falhou. */
export async function salvarConfiguracaoCalculadora(
  usuarioId: string,
  payload: PayloadConfiguracoesCalculadora,
): Promise<boolean> {
  try {
    const existentes = await pb
      .collection('simulacoes_calculadora')
      .getFullList<{ id: string }>({ filter: filtroAutosave(usuarioId), sort: '-created' })

    const payloadRecord = {
      user_id: usuarioId,
      cliente_id: '',
      nome: NOME_REGISTRO_AUTOSAVE,
      empresa: payload.identidade?.nomeEmpresa || '',
      cnpj: payload.identidade?.cnpj || '',
      parametros_json: { [MARCADOR_AUTOSAVE]: true, ...payload },
      resultados_json: {},
      regime_recomendado: 'Lucro Presumido',
      economia_anual: 0,
      aliquota_efetiva: 0,
      faturamento_mensal: Number(payload.config?.faturamentoMensal) || 0,
      ano_base: 2026,
    }

    if (existentes.length > 0) {
      await pb.collection('simulacoes_calculadora').update(existentes[0].id, payloadRecord)
      // Remove duplicatas antigas, se houver
      for (const dup of existentes.slice(1)) {
        try {
          await pb.collection('simulacoes_calculadora').delete(dup.id)
        } catch {
          /* ignora duplicata não removível */
        }
      }
    } else {
      await pb.collection('simulacoes_calculadora').create(payloadRecord)
    }
    return true
  } catch (err) {
    console.warn('[ConfigCalculadora] Autosave das Configurações na nuvem falhou:', err)
    return false
  }
}

/** Busca o registro de autosave das Configurações do usuário. */
export async function carregarConfiguracaoCalculadora(
  usuarioId: string,
): Promise<PayloadConfiguracoesCalculadora | null> {
  try {
    const recs = await pb
      .collection('simulacoes_calculadora')
      .getFullList<{ id: string; parametros_json: unknown }>({
        filter: filtroAutosave(usuarioId),
        sort: '-updated',
      })
    if (!recs || recs.length === 0) return null
    return parsePayload(recs[0])
  } catch (err) {
    console.warn('[ConfigCalculadora] Erro ao buscar autosave das Configurações:', err)
    return null
  }
}

/** Exclui o autosave (nuvem + local) — usado ao zerar a calculadora. */
export async function excluirConfiguracaoCalculadora(usuarioId: string): Promise<void> {
  removerConfiguracaoLocal(usuarioId)
  try {
    const recs = await pb
      .collection('simulacoes_calculadora')
      .getFullList<{ id: string }>({ filter: filtroAutosave(usuarioId) })
    for (const rec of recs) {
      try {
        await pb.collection('simulacoes_calculadora').delete(rec.id)
      } catch {
        /* ignora */
      }
    }
  } catch {
    /* ignora */
  }
}

/** Reconhece o registro de autosave para escondê-lo da lista de simulações. */
export function ehRegistroAutosave(parametros: unknown): boolean {
  try {
    if (!parametros || typeof parametros === 'string') {
      return typeof parametros === 'string' && parametros.includes(MARCADOR_AUTOSAVE)
    }
    return MARCADOR_AUTOSAVE in (parametros as Record<string, unknown>)
  } catch {
    return false
  }
}
