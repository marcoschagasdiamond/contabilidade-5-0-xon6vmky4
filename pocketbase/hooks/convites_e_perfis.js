/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook de Convites de Clientes & Migração de Perfis em Modo Teste
 *
 * NOTA: Cada callback do routerAdd roda em VM isolada no PocketBase (goja),
 * portanto funções auxiliares de envio de e-mail são definidas inline dentro de cada handler.
 */

/**
 * 1) Enviar novo convite
 * POST /backend/v1/convites/enviar
 */
routerAdd(
  'POST',
  '/backend/v1/convites/enviar',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser || !authUser.id) {
        return e.unauthorizedError('Autenticação necessária para enviar convites.')
      }

      const body = e.requestInfo().body || {}
      const email = (body.email || '').trim().toLowerCase()
      const clienteId = (body.cliente_id || '').trim()
      const clienteNome = (body.cliente_nome || '').trim()
      const mensagem = (body.mensagem || '').trim()
      const baseUrlParam = (body.base_url || '').trim()

      if (!email || !email.includes('@')) {
        return e.badRequestError('E-mail do convidado é obrigatório e deve ser válido.')
      }

      const convitesCol = $app.findCollectionByNameOrId('convites_clientes')

      // Gera um token criptograficamente aleatório
      const token = $security.randomString(36)
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

      const record = new Record(convitesCol)
      record.set('analista_id', authUser.id)
      if (clienteId) record.set('cliente_id', clienteId)
      record.set('cliente_nome', clienteNome)
      record.set('email', email)
      record.set('mensagem', mensagem)
      record.set('token', token)
      record.set('status', 'pendente')
      record.set('enviado_em', now)

      $app.save(record)

      // Determina URL de produção/origem
      let origin = baseUrlParam || $os.getenv('SITE_URL') || ''
      if (!origin) {
        origin = 'https://contabilidade-50.goskip.app'
      }
      origin = origin.replace(/\/+$/, '')

      const linkCadastro = `${origin}/cadastro?convite=${token}&email=${encodeURIComponent(email)}`
      const analistaNome = authUser.getString('name') || 'Seu Analista Contábil'

      // Envia e-mail formatado
      try {
        let senderAddress = 'noreply@goskip.dev'
        let senderName = 'Contabilidade 5.0'
        try {
          const meta = $app.settings().meta
          if (meta && meta.senderAddress) senderAddress = meta.senderAddress
          if (meta && meta.senderName) senderName = meta.senderName
        } catch (_) {}

        const assunto = `Convite de acesso à plataforma Contabilidade 5.0 • ${analistaNome}`
        const htmlContent = `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="utf-8" />
            <title>Convite de Acesso à Contabilidade 5.0</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07132B; margin: 0; padding: 24px; color: #1e293b;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #D4AF37; box-shadow: 0 12px 30px rgba(0,0,0,0.25);">
              <tr>
                <td style="background: linear-gradient(135deg, #07132B 0%, #0d2249 100%); padding: 36px 28px; text-align: center; border-bottom: 2px solid #D4AF37;">
                  <h1 style="color: #ffffff; font-size: 26px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">Contabilidade 5.0</h1>
                  <p style="color: #D4AF37; font-size: 13px; font-weight: 700; text-transform: uppercase; margin: 8px 0 0 0; letter-spacing: 1.5px;">Convite Exclusivo • Espaço do Empresário</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 28px;">
                  <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; color: #07132B; font-weight: 600;">
                    Olá!
                  </p>
                  <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; color: #334155;">
                    O analista <strong>${analistaNome}</strong> convidou você${clienteNome ? ` (empresa: <strong>${clienteNome}</strong>)` : ''} para acessar a plataforma <strong>Contabilidade 5.0</strong>.
                  </p>

                  ${
                    mensagem
                      ? `
                    <div style="background-color: #f8fafc; border-left: 4px solid #D4AF37; padding: 14px 18px; border-radius: 8px; margin-bottom: 24px;">
                      <span style="display: block; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 4px;">Mensagem do seu analista:</span>
                      <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #1e293b; font-style: italic;">"${mensagem}"</p>
                    </div>
                  `
                      : ''
                  }

                  <div style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 18px; margin-bottom: 24px;">
                    <span style="font-size: 12px; font-weight: 800; color: #07132B; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">
                      O que você terá acesso no seu perfil de Empresário:
                    </span>
                    <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #475569; line-height: 1.8;">
                      <li>Visibilidade completa dos diagnósticos e enquadramento tributário da sua empresa.</li>
                      <li>Simulações e projeções de impacto sob o novo sistema IBS/CBS (LC 214/2025).</li>
                      <li>Histórico de pareceres e análises contábeis compartilhadas pelo seu analista.</li>
                      <li>Independência e clareza para a tomada de decisão do seu negócio.</li>
                    </ul>
                  </div>

                  <div style="text-align: center; margin: 32px 0 20px 0;">
                    <a href="${linkCadastro}" style="display: inline-block; background: linear-gradient(135deg, #07132B 0%, #0d2249 100%); color: #D4AF37; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 32px; border-radius: 12px; border: 1px solid #D4AF37; box-shadow: 0 4px 14px rgba(7,19,43,0.35);">
                      Ativar Minha Conta de Empresário
                    </a>
                  </div>

                  <p style="font-size: 12px; line-height: 1.5; color: #64748b; text-align: center; margin-top: 20px;">
                    Ou copie e cole o link abaixo no seu navegador:<br />
                    <a href="${linkCadastro}" style="color: #07132B; word-break: break-all; font-size: 11px;">${linkCadastro}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
                  Contabilidade 5.0 • Diamond Group • Convite gerado com segurança
                </td>
              </tr>
            </table>
          </body>
          </html>
        `

        const mailMsg = new MailerMessage({
          from: {
            address: senderAddress,
            name: senderName,
          },
          to: [{ address: email }],
          subject: assunto,
          html: htmlContent,
        })

        $app.newMailClient().send(mailMsg)
      } catch (mailErr) {
        console.log('[CONVITE] Falha ao disparar e-mail:', mailErr)
      }

      return e.json(200, {
        success: true,
        id: record.id,
        token: token,
        link: linkCadastro,
        email: email,
        status: 'pendente',
      })
    } catch (err) {
      console.log('[CONVITE] Erro ao criar convite:', err)
      return e.json(500, { error: 'Não foi possível enviar o convite. Tente novamente.' })
    }
  },
  $apis.requireAuth(),
)

/**
 * 2) Reenviar convite existente
 * POST /backend/v1/convites/reenviar
 */
routerAdd(
  'POST',
  '/backend/v1/convites/reenviar',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser || !authUser.id) {
        return e.unauthorizedError('Autenticação necessária.')
      }

      const body = e.requestInfo().body || {}
      const conviteId = (body.convite_id || '').trim()
      const baseUrlParam = (body.base_url || '').trim()

      if (!conviteId) {
        return e.badRequestError('ID do convite é obrigatório.')
      }

      const record = $app.findRecordById('convites_clientes', conviteId)
      if (!record) {
        return e.notFoundError('Convite não encontrado.')
      }

      const analistaId = record.getString('analista_id')
      if (analistaId !== authUser.id && authUser.getString('role') !== 'admin') {
        return e.forbiddenError('Você não tem permissão para reenviar este convite.')
      }

      // Atualiza token e data de reenvio
      const novoToken = $security.randomString(36)
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
      record.set('token', novoToken)
      record.set('status', 'pendente')
      record.set('enviado_em', now)
      $app.save(record)

      let origin = baseUrlParam || $os.getenv('SITE_URL') || ''
      if (!origin) {
        origin = 'https://contabilidade-50.goskip.app'
      }
      origin = origin.replace(/\/+$/, '')

      const email = record.getString('email')
      const clienteNome = record.getString('cliente_nome')
      const mensagem = record.getString('mensagem')
      const analistaNome = authUser.getString('name') || 'Seu Analista Contábil'
      const linkCadastro = `${origin}/cadastro?convite=${novoToken}&email=${encodeURIComponent(email)}`

      // Dispara o e-mail
      try {
        let senderAddress = 'noreply@goskip.dev'
        let senderName = 'Contabilidade 5.0'
        try {
          const meta = $app.settings().meta
          if (meta && meta.senderAddress) senderAddress = meta.senderAddress
          if (meta && meta.senderName) senderName = meta.senderName
        } catch (_) {}

        const assunto = `Convite de acesso à plataforma Contabilidade 5.0 • ${analistaNome}`
        const htmlContent = `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="utf-8" />
            <title>Convite de Acesso à Contabilidade 5.0</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07132B; margin: 0; padding: 24px; color: #1e293b;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #D4AF37; box-shadow: 0 12px 30px rgba(0,0,0,0.25);">
              <tr>
                <td style="background: linear-gradient(135deg, #07132B 0%, #0d2249 100%); padding: 36px 28px; text-align: center; border-bottom: 2px solid #D4AF37;">
                  <h1 style="color: #ffffff; font-size: 26px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">Contabilidade 5.0</h1>
                  <p style="color: #D4AF37; font-size: 13px; font-weight: 700; text-transform: uppercase; margin: 8px 0 0 0; letter-spacing: 1.5px;">Convite Reenviado • Espaço do Empresário</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 28px;">
                  <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; color: #07132B; font-weight: 600;">
                    Olá novamente!
                  </p>
                  <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; color: #334155;">
                    O analista <strong>${analistaNome}</strong> reenviou o seu link de acesso${clienteNome ? ` (empresa: <strong>${clienteNome}</strong>)` : ''} para a plataforma <strong>Contabilidade 5.0</strong>.
                  </p>

                  ${
                    mensagem
                      ? `
                    <div style="background-color: #f8fafc; border-left: 4px solid #D4AF37; padding: 14px 18px; border-radius: 8px; margin-bottom: 24px;">
                      <span style="display: block; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 4px;">Mensagem do seu analista:</span>
                      <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #1e293b; font-style: italic;">"${mensagem}"</p>
                    </div>
                  `
                      : ''
                  }

                  <div style="text-align: center; margin: 32px 0 20px 0;">
                    <a href="${linkCadastro}" style="display: inline-block; background: linear-gradient(135deg, #07132B 0%, #0d2249 100%); color: #D4AF37; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 32px; border-radius: 12px; border: 1px solid #D4AF37; box-shadow: 0 4px 14px rgba(7,19,43,0.35);">
                      Ativar Minha Conta de Empresário
                    </a>
                  </div>

                  <p style="font-size: 12px; line-height: 1.5; color: #64748b; text-align: center; margin-top: 20px;">
                    Link direto:<br />
                    <a href="${linkCadastro}" style="color: #07132B; word-break: break-all; font-size: 11px;">${linkCadastro}</a>
                  </p>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `

        const mailMsg = new MailerMessage({
          from: { address: senderAddress, name: senderName },
          to: [{ address: email }],
          subject: assunto,
          html: htmlContent,
        })

        $app.newMailClient().send(mailMsg)
      } catch (mailErr) {
        console.log('[CONVITE] Falha ao reenviar e-mail:', mailErr)
      }

      return e.json(200, {
        success: true,
        id: record.id,
        token: novoToken,
        link: linkCadastro,
      })
    } catch (err) {
      console.log('[CONVITE] Erro ao reenviar convite:', err)
      return e.json(500, { error: 'Não foi possível reenviar o convite.' })
    }
  },
  $apis.requireAuth(),
)

/**
 * 3) Validar token de convite
 * GET /backend/v1/convites/validar/{token}
 */
routerAdd('GET', '/backend/v1/convites/validar/{token}', (e) => {
  try {
    const token = e.request.pathValue('token')
    if (!token) {
      return e.badRequestError('Token é obrigatório.')
    }

    let record = null
    try {
      record = $app.findFirstRecordByFilter(
        'convites_clientes',
        `token = "${token.replace(/"/g, '')}"`,
      )
    } catch (_) {}

    if (!record) {
      return e.notFoundError('Convite não encontrado ou token inválido.')
    }

    const analistaId = record.getString('analista_id')
    let analistaNome = 'Analista Contábil'
    try {
      const analistaRecord = $app.findRecordById('_pb_users_auth_', analistaId)
      analistaNome = analistaRecord.getString('name') || analistaNome
    } catch (_) {}

    return e.json(200, {
      id: record.id,
      email: record.getString('email'),
      cliente_id: record.getString('cliente_id'),
      cliente_nome: record.getString('cliente_nome'),
      status: record.getString('status'),
      analista_id: analistaId,
      analista_nome: analistaNome,
    })
  } catch (err) {
    return e.json(500, { error: 'Erro ao validar convite.' })
  }
})

/**
 * 4) Aceitar convite e vincular novo usuário Empresário
 * POST /backend/v1/convites/aceitar
 */
routerAdd(
  'POST',
  '/backend/v1/convites/aceitar',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser || !authUser.id) {
        return e.unauthorizedError('Autenticação necessária.')
      }

      const body = e.requestInfo().body || {}
      const token = (body.token || '').trim()

      if (!token) {
        return e.badRequestError('Token do convite é obrigatório.')
      }

      let convite = null
      try {
        convite = $app.findFirstRecordByFilter(
          'convites_clientes',
          `token = "${token.replace(/"/g, '')}"`,
        )
      } catch (_) {}

      if (!convite) {
        return e.notFoundError('Convite não encontrado.')
      }

      const clienteId = convite.getString('cliente_id')
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

      // Atualiza o convite como aceito
      convite.set('status', 'aceito')
      convite.set('convidado_user_id', authUser.id)
      convite.set('aceito_em', now)
      $app.save(convite)

      // Atualiza o perfil do usuário para 'empresario' e vincula o cliente_id
      authUser.set('perfil', 'empresario')
      if (clienteId) {
        authUser.set('cliente_id', clienteId)

        // Se o registro de cliente existir e não tiver user_id, vincula
        try {
          const cliRecord = $app.findRecordById('clientes', clienteId)
          if (!cliRecord.getString('user_id')) {
            cliRecord.set('user_id', authUser.id)
            $app.save(cliRecord)
          }
        } catch (_) {}
      }
      $app.save(authUser)

      return e.json(200, {
        success: true,
        perfil: 'empresario',
        cliente_id: clienteId,
      })
    } catch (err) {
      console.log('[CONVITE] Erro ao aceitar convite:', err)
      return e.json(500, { error: 'Falha ao aceitar o convite.' })
    }
  },
  $apis.requireAuth(),
)

/**
 * 5) Migração instantânea de perfil na /minha-conta (Modo Teste)
 * POST /backend/v1/perfis/migrar-analista
 * Muda o perfil de 'empresario' para 'contador' (Analista)
 */
routerAdd(
  'POST',
  '/backend/v1/perfis/migrar-analista',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser || !authUser.id) {
        return e.unauthorizedError('Autenticação necessária.')
      }

      // No modo teste, a migração é instantânea e sem cobrança
      authUser.set('perfil', 'contador')
      $app.save(authUser)

      console.log(
        `[MODO TESTE] Usuário ${authUser.id} (${authUser.getString('email')}) migrou para Analista com sucesso.`,
      )

      return e.json(200, {
        success: true,
        message: 'Perfil migrado com sucesso para Analista (Modo Teste).',
        perfil: 'contador',
      })
    } catch (err) {
      console.log('[PERFIL] Erro ao migrar para Analista:', err)
      return e.json(500, { error: 'Não foi possível migrar seu perfil. Tente novamente.' })
    }
  },
  $apis.requireAuth(),
)
