// Migration 0074 — Unificação de contas (Jucana/Mizael/Bravo)
//
// Os registros do usuário estão espalhados em 3 contas do PocketBase:
//   - 997htanqgdz2ndi (Marco Chagas, conta master principal — Jucana)
//   - jnr537hxney1sju (Mizael)
//   - ub3d1lh4kqxl8wj (Bravo)
// Esta migração REATRIBUI a posse de todos os registros (campo user_id /
// usuario_id) das duas contas antigas para a conta principal, para que tudo
// apareça na Carteira de Clientes num único login. As contas de usuário NÃO
// são deletadas — só a posse dos dados muda.
//
// IDEMPOTENTE: seleciona apenas registros ainda apontando para os ids antigos
// (em banco vazio ou já migrado, não faz nada) e cria o registro do Bravo na
// coleção 'clientes' apenas se ele ainda não existir.

const USER_PRINCIPAL = '997htanqgdz2ndi'
const USUARIOS_ANTIGOS = ['jnr537hxney1sju', 'ub3d1lh4kqxl8wj']
const CNPJ_BRAVO_LIMPO = '44461692000140'

// Coleções que guardam posse de dados do usuário (relation -> users).
// Campos de ATRIBUIÇÃO de trabalho (analista_responsavel, analista_id, autor,
// responsavel, funil_atualizado_por) NÃO são tocados — a migração muda
// posse de dados, não designações de fluxo de trabalho.
const COLECOES_POSSE = [
  'diagnosticos', // user_id
  'clientes_empresas', // user_id
  'simulacoes_calculadora', // user_id
  'clientes', // user_id
  'conversas_assistente', // user_id
  'simulacoes_recuperador', // user_id
  'historico_relatorios_diagnostico', // user_id
  'anuncios_creditos', // user_id
  'reunioes', // user_id
  'onboarding_progresso', // user_id
  'configuracoes_radar', // user_id
  'historico_dados_empresa', // user_id
  'relatorios_personalizados', // user_id
  'fornecedores_diagnostico', // user_id
  'historico_cotacoes_fornecedores', // user_id
  'notas_fiscais', // user_id
  'crm_interacoes', // usuario_id
]

migrate(
  (app) => {
    let reatribuidos = 0

    for (const nomeColecao of COLECOES_POSSE) {
      let colecao
      try {
        colecao = app.findCollectionByNameOrId(nomeColecao)
      } catch (_) {
        continue // coleção não existe nesta cópia do banco
      }

      let campo = 'user_id'
      if (!colecao.fields.getByName('user_id')) {
        if (!colecao.fields.getByName('usuario_id')) continue
        campo = 'usuario_id'
      }

      for (const idAntigo of USUARIOS_ANTIGOS) {
        let registros = []
        try {
          registros = app.findRecordsByFilter(
            nomeColecao,
            `${campo} = "${idAntigo}"`,
            '-created',
            0,
            0,
          )
        } catch (e) {
          console.log(`[0074] filtro falhou em ${nomeColecao}:`, e)
          continue
        }
        for (const rec of registros) {
          rec.set(campo, USER_PRINCIPAL)
          try {
            app.save(rec)
            reatribuidos++
          } catch (e) {
            console.log(`[0074] não foi possível reatribuir ${nomeColecao}/${rec.id}:`, e)
          }
        }
      }
    }

    // onboarding_progresso tem UNIQUE em user_id (um registro por usuário).
    // Não é posse de dados a mesclar: era andamento do onboarding de cada
    // conta. Mantém o da conta principal e apaga os das contas antigas
    // (idempotente: se já não existem, nada acontece).
    try {
      const obsoletos = app.findRecordsByFilter(
        'onboarding_progresso',
        `user_id = "jnr537hxney1sju" || user_id = "ub3d1lh4kqxl8wj"`,
        '-created',
        0,
        0,
      )
      for (const rec of obsoletos) {
        app.delete(rec)
        console.log(`[0074] onboarding_progresso de conta antiga removido: ${rec.id}`)
      }
    } catch (_) {
      // coleção ausente nesta cópia do banco — ignora
    }

    console.log(`[0074] registros reatribuídos para ${USER_PRINCIPAL}: ${reatribuidos}`)

    // ----- Cliente do BRAVO na coleção 'clientes' (criação idempotente) -----
    // A empresa Bravo existe em clientes_empresas (CNPJ 44.461.692/0001-40),
    // mas não havia registro correspondente na coleção 'clientes', o que
    // impedia o detalhe /clientes/:id de abrir normalmente. Espelha a
    // estrutura do registro da Jucana, preenchendo a partir da empresa.
    let existente = null
    try {
      existente = app.findFirstRecordByFilter(
        'clientes',
        `cnpj_cpf = "${CNPJ_BRAVO_LIMPO}" || cnpj_cpf = "44.461.692/0001-40" || cnpj_cpf = "44461692/0001-40"`,
      )
    } catch (_) {
      existente = null
    }

    if (existente) {
      // Já existe: apenas garante a posse na conta principal
      if (existente.getString('user_id', '') !== USER_PRINCIPAL) {
        existente.set('user_id', USER_PRINCIPAL)
        app.save(existente)
        console.log(`[0074] cliente Bravo existente reatribuído: ${existente.id}`)
      }
    } else {
      let empresa = null
      try {
        empresa = app.findFirstRecordByFilter(
          'clientes_empresas',
          `cnpj = "${CNPJ_BRAVO_LIMPO}" || cnpj = "44.461.692/0001-40" || cnpj = "44461692/0001-40"`,
        )
      } catch (_) {
        empresa = null
      }
      const col = app.findCollectionByNameOrId('clientes')
      const rec = new Record(col)
      rec.set('user_id', USER_PRINCIPAL)
      rec.set(
        'nome',
        empresa ? empresa.getString('nome_empresa') : 'BRAVO IT SECURITY - INTERNATIONAL LTDA',
      )
      rec.set('cnpj_cpf', CNPJ_BRAVO_LIMPO)
      rec.set(
        'uf',
        empresa && empresa.getString('uf_origem') ? empresa.getString('uf_origem') : 'SP',
      )
      rec.set(
        'segmento',
        empresa && empresa.getString('segmento') ? empresa.getString('segmento') : 'Tecnologia',
      )
      rec.set(
        'regime_atual',
        empresa && empresa.getString('regime_atual')
          ? empresa.getString('regime_atual')
          : 'Lucro Presumido',
      )
      rec.set('email', empresa ? empresa.getString('email') : '')
      rec.set('telefone', empresa ? empresa.getString('telefone') : '')
      rec.set('arquivado', false)
      rec.set('estagio_funil', 'diagnostico') // default do hook padrão
      app.save(rec)
      console.log(`[0074] cliente Bravo criado: ${rec.id}`)
    }
  },
  // Down: no-op — reatribuição de posse de dados não é revertida
  (app) => {},
)
