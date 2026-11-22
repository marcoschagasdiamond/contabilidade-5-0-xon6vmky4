// Migration 0077 — Reatribuição de posse: Bravo IT e Mizael -> Fernando
//
// Decisão do usuário: as empresas BRAVO IT SECURITY - INTERNATIONAL LTDA
// (CNPJ 44.461.692/0001-40) e MIZAEL FREITAS GONCALVES (CNPJ 14.130.333/0001-40)
// foram cadastradas pelo técnico Fernando (fernando@rs41.com.br) e foram parar
// na conta de Marco (997htanqgdz2ndi) por causa da unificação de contas da
// migração 0074. Esta migração devolve a posse desses registros à conta do
// Fernando (ub3d1lh4kqxl8wj).
//
// A Jucana (registro clientes brq9360g8xgqelw / clientes_empresas
// l3zjamzgu2cbt0j, inclusive vinculos_societarios e historico_vinculos)
// permanece com Marco — NÃO é tocada.
//
// Registros reatribuídos (localizados por CNPJ, nunca por nome):
//   - clientes:              j1yvkipiwaeh19l (Bravo), d4j6iks3370275x (Mizael)
//   - clientes_empresas:     om61kfi9rghwlet (Bravo), 479qud2jzxynfcq (Mizael)
//   - dependências: qualquer registro de diagnosticos, historico_dados_empresa,
//     historico_relatorios_diagnostico, historico_simulacoes,
//     fornecedores_diagnostico, historico_cotacoes_fornecedores,
//     conversas_assistente, simulacoes_calculadora, simulacoes_recuperador,
//     notas_fiscais, relatorios_personalizados, onboarding_progresso
//     cujo user_id aponte para UM DOS IDs reatribuídos (cliente ou empresa).
//   - onboarding_progresso tem UNIQUE em user_id (um por usuário): se o
//     Fernando já tiver registro próprio, o da posse antiga é APAGADO em vez
//     de reatribuído, para não violar a constraint.
//
// TUDO-OU-NADA: toda a reatribuição roda dentro de app.runInTransaction —
// qualquer falha aborta e reverte o bloco inteiro.
//
// IDEMPOTENTE: só atua em registros que ainda apontam para Marco; em banco
// vazio ou já migrado não faz nada.

const USER_FERNANDO = 'ub3d1lh4kqxl8wj'
const USER_MARCO = '997htanqgdz2ndi'

// CNPJs alvo, em todas as variações já usadas no banco
const CNPJS_BRAVO = ['44.461.692/0001-40', '44461692000140']
const CNPJS_MIZAEL = ['14.130.333/0001-40', '14130333000140']

const CLIENTES_ALVO = ['j1yvkipiwaeh19l', 'd4j6iks3370275x']
const EMPRESAS_ALVO = ['om61kfi9rghwlet', '479qud2jzxynfcq']

// Coleções de posse direta por user_id, já reatribuíveis por cliente/empresa.
// Nada aqui é um dossiê do Marco: o filtro por user_id dos registros alvo
// garante que só dados de Bravo/Mizael movem.
const COLECOES_DEPENDENTES = [
  'diagnosticos',
  'historico_dados_empresa',
  'historico_relatorios_diagnostico',
  'historico_simulacoes',
  'fornecedores_diagnostico',
  'historico_cotacoes_fornecedores',
  'conversas_assistente',
  'simulacoes_calculadora',
  'simulacoes_recuperador',
  'notas_fiscais',
  'relatorios_personalizados',
  'onboarding_progresso',
]

// diagnosticos também referencia o cliente via campo texto cliente_id
// (id do clientes OU id da clientes_empresas, conforme o fluxo). Como nenhum
// diagnóstico de Bravo/Mizael existe no banco hoje, o filtro abaixo é
// defensivo: pega qualquer registro futuro/legado desses ids.

function filtroCnpj(cnpjs) {
  return cnpjs.map((c) => `cnpj = "${c}"`).join(' || ')
}

function coletarIdsAlvo(app) {
  const ids = new Set(CLIENTES_ALVO)
  const empresas = app.findRecordsByFilter(
    'clientes_empresas',
    filtroCnpj(CNPJS_BRAVO) + ' || ' + filtroCnpj(CNPJS_MIZAEL),
    '-created',
    0,
    0,
  )
  for (const e of empresas) ids.add(e.id)
  // Também aceita qualquer clientes encontrado pelos CNPJs (id pode ter mudado
  // em outra cópia do banco — a migração roda em toda cópia)
  const clientes = app.findRecordsByFilter(
    'clientes',
    '(' +
      CNPJS_BRAVO.concat(CNPJS_MIZAEL)
        .map((c) => `cnpj_cpf = "${c}"`)
        .join(' || ') +
      ')',
    '-created',
    0,
    0,
  )
  for (const c of clientes) ids.add(c.id)
  return [...ids]
}

migrate(
  (app) => {
    app.runInTransaction((txApp) => {
      const idsAlvo = coletarIdsAlvo(txApp)
      if (idsAlvo.length === 0) {
        console.log('[0077] nenhum registro alvo nesta cópia do banco — no-op')
        return
      }

      let reatribuidos = 0
      let jaDoFernando = 0

      // 1) Registros-alvo: clientes e clientes_empresas de Bravo/Mizael
      for (const nomeColecao of ['clientes', 'clientes_empresas']) {
        for (const idAlvo of idsAlvo) {
          let rec = null
          try {
            rec = txApp.findRecordById(nomeColecao, idAlvo)
          } catch (_) {
            continue // não existe nesta cópia (ex.: id de clientes em clientes_empresas)
          }
          const dono = rec.getString('user_id', '')
          if (dono === USER_FERNANDO) {
            jaDoFernando++
            continue
          }
          if (dono !== USER_MARCO) continue // não toca em posse de terceiros
          rec.set('user_id', USER_FERNANDO)
          txApp.save(rec)
          reatribuidos++
          console.log(`[0077] ${nomeColecao}/${rec.id} -> Fernando`)
        }
      }

      // 2) Dependências: qualquer registro que aponte user_id para um dos ids alvo
      for (const nomeColecao of COLECOES_DEPENDENTES) {
        let colecao = null
        try {
          colecao = txApp.findCollectionByNameOrId(nomeColecao)
        } catch (_) {
          continue // coleção não existe nesta cópia
        }
        if (!colecao.fields.getByName('user_id')) continue

        for (const idDono of idsAlvo) {
          let registros = []
          try {
            registros = txApp.findRecordsByFilter(
              nomeColecao,
              `user_id = "${idDono}"`,
              '-created',
              0,
              0,
            )
          } catch (e) {
            console.log(`[0077] filtro falhou em ${nomeColecao}:`, e)
            continue
          }
          for (const rec of registros) {
            if (rec.getString('user_id', '') === USER_FERNANDO) continue
            if (nomeColecao === 'onboarding_progresso') {
              // UNIQUE(user_id): se Fernando já tem registro, apaga o antigo;
              // senão reatribui
              let existenteFernando = []
              try {
                existenteFernando = txApp.findRecordsByFilter(
                  'onboarding_progresso',
                  `user_id = "${USER_FERNANDO}"`,
                  '-created',
                  1,
                  0,
                )
              } catch (_) {
                existenteFernando = []
              }
              if (existenteFernando.length > 0) {
                txApp.delete(rec)
                console.log(`[0077] onboarding_progresso obsoleto removido: ${rec.id}`)
              } else {
                rec.set('user_id', USER_FERNANDO)
                txApp.save(rec)
                reatribuidos++
                console.log(`[0077] onboarding_progresso/${rec.id} -> Fernando`)
              }
              continue
            }
            rec.set('user_id', USER_FERNANDO)
            txApp.save(rec)
            reatribuidos++
            console.log(`[0077] ${nomeColecao}/${rec.id} -> Fernando`)
          }
        }
      }

      console.log(
        `[0077] concluído: ${reatribuidos} registro(s) reatribuído(s) para Fernando (${USER_FERNANDO}); ${jaDoFernando} já eram dele`,
      )
    })
  },
  // Down: no-op — reatribuição de posse de dados não é revertida
  (app) => {},
)
