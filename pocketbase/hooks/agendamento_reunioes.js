/**
 * Hook de regras de negócio para Agendamento de Reuniões (Contabilidade 5.0 / Diamond Group)
 *
 * 1. Validação estrita no backend (onRecordCreateRequest & onRecordUpdateRequest):
 *    - Impede que um mesmo horário em uma mesma data seja marcado mais de uma vez
 *      (se já existir outra reunião com status != 'cancelada' na mesma data e horário).
 *    - Validação de preenchimento obrigatório e formato de data (YYYY-MM-DD) e horário (HH:mm).
 *    - Bloqueia reagendamento para horário já ocupado.
 *
 * 2. Endpoints auxiliares para checagem rápida e segura de disponibilidade:
 *    - GET /backend/v1/reunioes/disponibilidade?data=YYYY-MM-DD
 */

onRecordCreateRequest((e) => {
  const record = e.record
  const data = record.getString('data').trim()
  const horario = record.getString('horario').trim()

  if (!data || !horario) {
    throw new BadRequestError('Data e horário são obrigatórios para agendar a reunião.')
  }

  // Validação simples de formato
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    throw new BadRequestError('Formato de data inválido. Use AAAA-MM-DD.')
  }
  if (!/^\d{2}:\d{2}$/.test(horario)) {
    throw new BadRequestError('Formato de horário inválido. Use HH:MM.')
  }

  // Checar se já existe reunião ativa para a mesma data e horário
  try {
    const existentes = $app.findRecordsByFilter(
      'reunioes',
      `data = {:d} && horario = {:h} && status != 'cancelada'`,
      '-created',
      1,
      0,
      { d: data, h: horario },
    )
    if (existentes && existentes.length > 0) {
      throw new BadRequestError(
        'Este horário (' +
          horario +
          ' em ' +
          data +
          ') já está reservado por outro cliente. Por favor, escolha outro horário disponível.',
      )
    }
  } catch (err) {
    // Se for BadRequestError relança
    if (err && err.name === 'BadRequestError') {
      throw err
    }
    // Caso contrário relança com a mensagem
    if (err && err.message && err.message.includes('já está reservado')) {
      throw new BadRequestError(err.message)
    }
    console.log('Erro ao checar conflito de reunião:', err)
  }
}, 'reunioes')

onRecordUpdateRequest((e) => {
  const record = e.record
  const recordId = record.id
  const data = record.getString('data').trim()
  const horario = record.getString('horario').trim()
  const status = record.getString('status').trim()

  // Se estiver cancelando, não há conflito
  if (status === 'cancelada') {
    return
  }

  if (!data || !horario) {
    throw new BadRequestError('Data e horário são obrigatórios.')
  }

  try {
    const existentes = $app.findRecordsByFilter(
      'reunioes',
      `id != {:id} && data = {:d} && horario = {:h} && status != 'cancelada'`,
      '-created',
      1,
      0,
      { id: recordId, d: data, h: horario },
    )
    if (existentes && existentes.length > 0) {
      throw new BadRequestError(
        'Este horário (' +
          horario +
          ' em ' +
          data +
          ') já está reservado por outro cliente. Por favor, escolha outro horário disponível.',
      )
    }
  } catch (err) {
    if (err && err.name === 'BadRequestError') {
      throw err
    }
    if (err && err.message && err.message.includes('já está reservado')) {
      throw new BadRequestError(err.message)
    }
    console.log('Erro ao validar reagendamento:', err)
  }
}, 'reunioes')

routerAdd('GET', '/backend/v1/reunioes/disponibilidade', (e) => {
  const dataQuery = e.request.url.query().get('data')
  if (!dataQuery || !/^\d{4}-\d{2}-\d{2}$/.test(dataQuery)) {
    return e.json(400, { erro: 'Parâmetro data no formato AAAA-MM-DD é obrigatório.' })
  }

  try {
    // Buscar horários configurados na agenda
    let configHorarios = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']
    let diasSemanaHabilitados = [1, 2, 3, 4, 5]
    let ativo = true

    try {
      const config = $app.findFirstRecordByData(
        'configuracoes_agenda',
        'chave',
        'agenda_padrao_especialista',
      )
      if (config) {
        ativo = config.getBool('ativo')
        const rawH = config.getString('horarios_disponiveis_json')
        if (rawH) {
          const parsed = JSON.parse(rawH)
          if (Array.isArray(parsed) && parsed.length > 0) {
            configHorarios = parsed
          }
        }
        const rawD = config.getString('dias_semana_json')
        if (rawD) {
          const parsedD = JSON.parse(rawD)
          if (Array.isArray(parsedD) && parsedD.length > 0) {
            diasSemanaHabilitados = parsedD
          }
        }
      }
    } catch (_) {}

    if (!ativo) {
      return e.json(200, {
        data: dataQuery,
        disponivel: false,
        motivo: 'A agenda do especialista está temporariamente desativada.',
        horariosOcupados: [],
        horariosLivres: [],
      })
    }

    // Buscar reuniões já agendadas para esta data
    const reunioesDia = $app.findRecordsByFilter(
      'reunioes',
      `data = {:d} && status != 'cancelada'`,
      'horario',
      100,
      0,
      { d: dataQuery },
    )

    const ocupados = []
    for (let i = 0; i < reunioesDia.length; i++) {
      ocupados.push(reunioesDia[i].getString('horario'))
    }

    const livres = configHorarios.filter((h) => !ocupados.includes(h))

    return e.json(200, {
      data: dataQuery,
      disponivel: true,
      diasSemanaHabilitados: diasSemanaHabilitados,
      horariosConfigurados: configHorarios,
      horariosOcupados: ocupados,
      horariosLivres: livres,
    })
  } catch (err) {
    console.log('Erro ao consultar disponibilidade:', err)
    return e.json(500, { erro: 'Erro interno ao consultar disponibilidade.' })
  }
})
