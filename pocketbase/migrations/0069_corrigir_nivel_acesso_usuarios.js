/// <reference path="../pb_data/types.d.ts" />

/**
 * 0069 — Correção do nivel_acesso dos usuários (idempotente)
 *
 * Auditoria mostrou usuários recentes (Moises, Marcio, Fernando e outros)
 * com nivel_acesso VAZIO — o cadastro público nunca preenchia o campo, o que
 * os impedia de enxergar o painel de analista e de aparecer nos quadros do /admin.
 *
 * Regras (NUNCA sobrescrever níveis já preenchidos):
 * - marcoschagasdiamond@icloud.com → 'master' apenas se nivel_acesso estiver vazio.
 * - Demais usuários com nivel_acesso vazio → 'analista' (ou 'empresario' se o
 *   perfil já for 'empresario', mantendo coerência com o perfil escolhido).
 * - Roda quantas vezes forem necessárias: só atualiza linhas com campo vazio.
 */
migrate(
  (app) => {
    const masterEmail = 'marcoschagasdiamond@icloud.com'

    // 1) Master: só preenche se estiver vazio (nunca rebaixa/altera nível existente)
    app
      .db()
      .newQuery(
        `UPDATE users
         SET nivel_acesso = 'master', role = 'admin'
         WHERE email = '${masterEmail}'
           AND (nivel_acesso IS NULL OR nivel_acesso = '');`,
      )
      .execute()

    // 2) Demais usuários vazios: analista (contador) ou empresario (empresario)
    app
      .db()
      .newQuery(
        `UPDATE users
         SET nivel_acesso = CASE
           WHEN perfil = 'empresario' THEN 'empresario'
           ELSE 'analista'
         END
         WHERE (nivel_acesso IS NULL OR nivel_acesso = '')
           AND email != '${masterEmail}';`,
      )
      .execute()

    // 3) Garantia extra: Marco sempre master mesmo se o UPDATE acima falhar por e-mail em caixa alta
    try {
      const marco = app.findAuthRecordByEmail('_pb_users_auth_', masterEmail)
      if (marco && (marco.getString('nivel_acesso') || '') === '') {
        marco.set('nivel_acesso', 'master')
        marco.set('role', 'admin')
        app.save(marco)
      }
    } catch (_) {
      // usuário master inexistente neste ambiente — nada a fazer
    }
  },
  (app) => {
    // Down: nada reversível de forma segura (os dados preenchidos são a correção desejada).
    // Não removemos níveis — reverter apagaria dados de acesso reais.
  },
)
