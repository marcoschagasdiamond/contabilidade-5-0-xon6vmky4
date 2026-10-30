import pb from '@/lib/pocketbase/client'
import type {
  ReuniaoRecord,
  NovaReuniaoInput,
  ConfiguracaoAgendaRecord,
  DisponibilidadeAgendaDia,
  StatusReuniao,
} from '@/types/reunioes'

export const HORARIOS_PADRAO_FALLBACK = [
  '09:00',
  '10:00',
  '11:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
]

export const DIAS_SEMANA_PADRAO_FALLBACK = [1, 2, 3, 4, 5] // Seg a Sex

/**
 * Consulta a disponibilidade da agenda para um dia específico (AAAA-MM-DD)
 */
export async function consultarDisponibilidadeDia(
  dataIso: string,
): Promise<DisponibilidadeAgendaDia> {
  if (!dataIso) {
    throw new Error('Data obrigatória para consultar disponibilidade.')
  }

  // Tenta o endpoint seguro do backend
  try {
    const url = `${pb.baseUrl}/backend/v1/reunioes/disponibilidade?data=${encodeURIComponent(dataIso)}`
    const token = pb.authStore.token
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (res.ok) {
      const json = await res.json()
      return json as DisponibilidadeAgendaDia
    }
  } catch (err) {
    console.warn('Falha na rota customizada de disponibilidade, consultando via SDK:', err)
  }

  // Fallback seguro via SDK PocketBase direto nas coleções
  let configHorarios = HORARIOS_PADRAO_FALLBACK
  let diasSemana = DIAS_SEMANA_PADRAO_FALLBACK
  let ativo = true

  try {
    const config = await pb
      .collection('configuracoes_agenda')
      .getFirstListItem<ConfiguracaoAgendaRecord>('chave = "agenda_padrao_especialista"')
    if (config) {
      ativo = config.ativo !== false
      if (config.horarios_disponiveis_json) {
        const parsed =
          typeof config.horarios_disponiveis_json === 'string'
            ? JSON.parse(config.horarios_disponiveis_json)
            : config.horarios_disponiveis_json
        if (Array.isArray(parsed) && parsed.length > 0) {
          configHorarios = parsed
        }
      }
      if (config.dias_semana_json) {
        const parsedD =
          typeof config.dias_semana_json === 'string'
            ? JSON.parse(config.dias_semana_json)
            : config.dias_semana_json
        if (Array.isArray(parsedD) && parsedD.length > 0) {
          diasSemana = parsedD
        }
      }
    }
  } catch {
    /* intentionally ignored */
  }

  if (!ativo) {
    return {
      data: dataIso,
      disponivel: false,
      motivo: 'Agenda do especialista temporariamente pausada.',
      diasSemanaHabilitados: diasSemana,
      horariosConfigurados: configHorarios,
      horariosOcupados: [],
      horariosLivres: [],
    }
  }

  // Buscar reuniões já marcadas para o dia
  const reunioesDia = await pb.collection('reunioes').getFullList<ReuniaoRecord>({
    filter: `data = "${dataIso}" && status != "cancelada"`,
    sort: 'horario',
  })

  const ocupados = reunioesDia.map((r) => r.horario)
  const livres = configHorarios.filter((h) => !ocupados.includes(h))

  return {
    data: dataIso,
    disponivel: true,
    diasSemanaHabilitados: diasSemana,
    horariosConfigurados: configHorarios,
    horariosOcupados: ocupados,
    horariosLivres: livres,
  }
}

/**
 * Cria um novo agendamento de reunião para o usuário logado
 */
export async function criarAgendamentoReuniao(input: NovaReuniaoInput): Promise<ReuniaoRecord> {
  const user = pb.authStore.record
  if (!user?.id) {
    throw new Error('É necessário estar conectado para agendar uma reunião.')
  }

  const payload = {
    user_id: user.id,
    cliente_nome: input.cliente_nome.trim(),
    cliente_email: input.cliente_email.trim().toLowerCase(),
    cliente_telefone: input.cliente_telefone?.trim() || '',
    empresa: input.empresa?.trim() || '',
    data: input.data.trim(),
    horario: input.horario.trim(),
    assunto: input.assunto.trim(),
    observacao: input.observacao?.trim() || '',
    origem_contexto: input.origem_contexto?.trim() || 'geral',
    status: 'agendada' as StatusReuniao,
  }

  const record = await pb.collection('reunioes').create<ReuniaoRecord>(payload)
  // Garantir que o objeto retornado sempre contenha campos essenciais definidos
  return {
    ...record,
    status: (record?.status || 'agendada') as StatusReuniao,
    data: record?.data || payload.data,
    horario: record?.horario || payload.horario,
    cliente_nome: record?.cliente_nome || payload.cliente_nome,
    cliente_email: record?.cliente_email || payload.cliente_email,
    assunto: record?.assunto || payload.assunto,
  }
}

/**
 * Lista reuniões do usuário logado (cliente/empresário/analista)
 */
export async function listarMinhasReunioes(): Promise<ReuniaoRecord[]> {
  const user = pb.authStore.record
  if (!user?.id) return []

  const records = await pb.collection('reunioes').getFullList<ReuniaoRecord>({
    filter: `user_id = "${user.id}"`,
    sort: '-data,-horario',
  })
  return records
}

/**
 * Lista todas as reuniões (para painel Master / Admin)
 */
export async function listarTodasReunioesAdmin(): Promise<ReuniaoRecord[]> {
  const records = await pb.collection('reunioes').getFullList<ReuniaoRecord>({
    sort: '-data,-horario',
  })
  return records
}

/**
 * Atualiza o status e anotações de uma reunião (Master / Admin)
 */
export async function atualizarStatusReuniao(
  reuniaoId: string,
  novoStatus: StatusReuniao,
  opcoes?: {
    respostaEspecialista?: string
    canceladoMotivo?: string
    novaData?: string
    novoHorario?: string
  },
): Promise<ReuniaoRecord> {
  const payload: any = {
    status: novoStatus,
  }

  if (opcoes?.respostaEspecialista !== undefined) {
    payload.resposta_especialista = opcoes.respostaEspecialista
  }
  if (opcoes?.canceladoMotivo !== undefined) {
    payload.cancelado_motivo = opcoes.canceladoMotivo
  }
  if (opcoes?.novaData) {
    payload.data = opcoes.novaData
  }
  if (opcoes?.novoHorario) {
    payload.horario = opcoes.novoHorario
  }

  return await pb.collection('reunioes').update<ReuniaoRecord>(reuniaoId, payload)
}

/**
 * Cancela uma reunião marcada pelo próprio cliente ou pelo admin
 */
export async function cancelarReuniao(reuniaoId: string, motivo?: string): Promise<ReuniaoRecord> {
  return await atualizarStatusReuniao(reuniaoId, 'cancelada', {
    canceladoMotivo: motivo || 'Cancelada a pedido do usuário',
  })
}

/**
 * Obtém as configurações atuais da agenda do especialista
 */
export async function obterConfiguracaoAgenda(): Promise<ConfiguracaoAgendaRecord | null> {
  try {
    const record = await pb
      .collection('configuracoes_agenda')
      .getFirstListItem<ConfiguracaoAgendaRecord>('chave = "agenda_padrao_especialista"')
    return record
  } catch (_) {
    return null
  }
}

/**
 * Salva/atualiza as configurações da agenda (Master / Admin)
 */
export async function salvarConfiguracaoAgenda(dados: {
  diasSemana: number[]
  horarios: string[]
  duracaoMinutos?: number
  antecedenciaMinimaHoras?: number
  ativo?: boolean
  observacoes?: string
}): Promise<ConfiguracaoAgendaRecord> {
  let configAtual = await obterConfiguracaoAgenda()

  const payload = {
    chave: 'agenda_padrao_especialista',
    dias_semana_json: JSON.stringify(dados.diasSemana),
    horarios_disponiveis_json: JSON.stringify(dados.horarios),
    duracao_minutos: dados.duracaoMinutos || 50,
    antecedencia_minima_horas: dados.antecedenciaMinimaHoras || 2,
    ativo: dados.ativo !== undefined ? dados.ativo : true,
    observacoes: dados.observacoes || 'Disponibilidade de reuniões estratégicas Diamond Group',
  }

  if (configAtual?.id) {
    return await pb
      .collection('configuracoes_agenda')
      .update<ConfiguracaoAgendaRecord>(configAtual.id, payload)
  } else {
    return await pb.collection('configuracoes_agenda').create<ConfiguracaoAgendaRecord>(payload)
  }
}
