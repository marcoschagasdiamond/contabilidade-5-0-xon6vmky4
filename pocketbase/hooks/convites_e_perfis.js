/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook de Convites de Clientes & Migração de Perfis em Modo Teste
 * + Criação Manual de Usuários por Master/Admin
 *
 * NOTA: Cada callback do routerAdd roda em VM isolada no PocketBase (goja),
 * portanto funções auxiliares de envio de e-mail são definidas inline dentro de cada handler.
 */

/**
 * 1) Enviar novo convite (Suporta analista, empresario e admin)
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
      const nivelConvite = (body.nivel_convite || 'empresario').trim().toLowerCase()
      const whatsapp = (body.whatsapp || '').trim()

      if (!email || !email.includes('@')) {
        return e.badRequestError('E-mail do convidado é obrigatório e deve ser válido.')
      }

      const callerNivel = authUser.getString('nivel_acesso') || authUser.getString('role')
      const isMaster =
        callerNivel === 'master' ||
        authUser.getString('email').toLowerCase() === 'marcoschagasdiamond@icloud.com'

      // Só o Master pode enviar convite de Administrador
      if (nivelConvite === 'admin' && !isMaster) {
        return e.forbiddenError(
          'Apenas o Administrador Master tem autorização para convidar administradores.',
        )
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
      if (convitesCol.fields.getByName('nivel_convite')) {
        record.set('nivel_convite', nivelConvite)
      }
      if (whatsapp && convitesCol.fields.getByName('whatsapp')) {
        record.set('whatsapp', whatsapp)
      }

      $app.save(record)

      // Determina URL de produção/origem
      let origin = baseUrlParam || $os.getenv('SITE_URL') || ''
      if (!origin) {
        origin = 'https://contabilidade-50.goskip.app'
      }
      origin = origin.replace(/\/+$/, '')

      const linkCadastro = `${origin}/cadastro?convite=${token}&email=${encodeURIComponent(email)}&nivel=${nivelConvite}`
      const analistaNome = authUser.getString('name') || 'Contabilidade 5.0'

      const nivelRotulo =
        nivelConvite === 'admin'
          ? 'Administrador'
          : nivelConvite === 'analista'
            ? 'Analista & Parceiro'
            : 'Empresário (Cliente)'

      // Envia e-mail formatado Diamond Group
      try {
        let senderAddress = 'noreply@goskip.dev'
        let senderName = 'Contabilidade 5.0'
        try {
          const meta = $app.settings().meta
          if (meta && meta.senderAddress) senderAddress = meta.senderAddress
          if (meta && meta.senderName) senderName = meta.senderName
        } catch (_) {}

        const assunto = `Convite de acesso à Contabilidade 5.0 • Nível ${nivelRotulo}`
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
                  <p style="color: #D4AF37; font-size: 13px; font-weight: 700; text-transform: uppercase; margin: 8px 0 0 0; letter-spacing: 1.5px;">Convite Oficial • Nível ${nivelRotulo}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 28px;">
                  <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; color: #07132B; font-weight: 600;">
                    Olá!
                  </p>
                  <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; color: #334155;">
                    Você foi formalmente convidado por <strong>${analistaNome}</strong>${clienteNome ? ` (empresa: <strong>${clienteNome}</strong>)` : ''} para integrar a plataforma <strong>Contabilidade 5.0</strong> com acesso configurado para o nível <strong>${nivelRotulo}</strong>.
                  </p>

                  ${
                    mensagem
                      ? `
                    <div style="background-color: #f8fafc; border-left: 4px solid #D4AF37; padding: 14px 18px; border-radius: 8px; margin-bottom: 24px;">
                      <span style="display: block; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 4px;">Mensagem:</span>
                      <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #1e293b; font-style: italic;">"${mensagem}"</p>
                    </div>
                  `
                      : ''
                  }

                  <div style="text-align: center; margin: 32px 0 20px 0;">
                    <a href="${linkCadastro}" style="display: inline-block; background: linear-gradient(135deg, #07132B 0%, #0d2249 100%); color: #D4AF37; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 32px; border-radius: 12px; border: 1px solid #D4AF37; box-shadow: 0 4px 14px rgba(7,19,43,0.35);">
                      Concluir Cadastro & Ativar Conta
                    </a>
                  </div>

                  <p style="font-size: 12px; line-height: 1.5; color: #64748b; text-align: center; margin-top: 20px;">
                    Ou copie e cole o link no seu navegador:<br />
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
        nivel_convite: nivelConvite,
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
      const callerNivel = authUser.getString('nivel_acesso') || authUser.getString('role')
      const isMasterOrAdmin =
        callerNivel === 'master' ||
        callerNivel === 'admin' ||
        authUser.getString('role') === 'admin' ||
        authUser.getString('email').toLowerCase() === 'marcoschagasdiamond@icloud.com'

      if (analistaId !== authUser.id && !isMasterOrAdmin) {
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
      const nivelConvite = record.getString('nivel_convite') || 'empresario'
      const analistaNome = authUser.getString('name') || 'Contabilidade 5.0'
      const linkCadastro = `${origin}/cadastro?convite=${novoToken}&email=${encodeURIComponent(email)}&nivel=${nivelConvite}`

      // Dispara o e-mail
      try {
        let senderAddress = 'noreply@goskip.dev'
        let senderName = 'Contabilidade 5.0'
        try {
          const meta = $app.settings().meta
          if (meta && meta.senderAddress) senderAddress = meta.senderAddress
          if (meta && meta.senderName) senderName = meta.senderName
        } catch (_) {}

        const assunto = `Convite de acesso à Contabilidade 5.0 (Reenvio)`
        const htmlContent = `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="utf-8" />
            <title>Convite Reenviado</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07132B; margin: 0; padding: 24px; color: #1e293b;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #D4AF37;">
              <tr>
                <td style="background: linear-gradient(135deg, #07132B 0%, #0d2249 100%); padding: 36px 28px; text-align: center; border-bottom: 2px solid #D4AF37;">
                  <h1 style="color: #ffffff; font-size: 26px; margin: 0; font-weight: 800;">Contabilidade 5.0</h1>
                  <p style="color: #D4AF37; font-size: 13px; font-weight: 700; text-transform: uppercase; margin: 8px 0 0 0;">Convite Reenviado</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 28px;">
                  <p style="font-size: 15px; color: #334155; line-height: 1.6;">
                    O analista <strong>${analistaNome}</strong> reenviou o seu link de acesso à plataforma Contabilidade 5.0.
                  </p>
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${linkCadastro}" style="display: inline-block; background: #07132B; color: #D4AF37; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 32px; border-radius: 12px; border: 1px solid #D4AF37;">
                      Acessar e Criar Minha Conta
                    </a>
                  </div>
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
    let analistaNome = 'Contabilidade 5.0'
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
      nivel_convite: record.getString('nivel_convite') || 'empresario',
      analista_id: analistaId,
      analista_nome: analistaNome,
    })
  } catch (err) {
    return e.json(500, { error: 'Erro ao validar convite.' })
  }
})

/**
 * 4) Aceitar convite e vincular novo usuário com o nível pré-definido
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
      const nivelConvite = convite.getString('nivel_convite') || 'empresario'
      const analistaId = convite.getString('analista_id')
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

      // Atualiza o convite como aceito
      convite.set('status', 'aceito')
      convite.set('convidado_user_id', authUser.id)
      convite.set('aceito_em', now)
      $app.save(convite)

      // Configura nivel_acesso e perfil conforme o convite
      if (nivelConvite === 'admin') {
        authUser.set('nivel_acesso', 'admin')
        authUser.set('role', 'admin')
        authUser.set('is_premium', true)
        authUser.set('criado_por', analistaId)
      } else if (nivelConvite === 'analista') {
        authUser.set('nivel_acesso', 'analista')
        authUser.set('perfil', 'contador')
        authUser.set('role', 'user')
        authUser.set('status_operacao', 'autorizado')
        authUser.set('autorizado_por', analistaId)
        authUser.set('autorizado_em', now)
        authUser.set('criado_por', analistaId)
      } else {
        // Empresário
        authUser.set('nivel_acesso', 'empresario')
        authUser.set('perfil', 'empresario')
        authUser.set('criado_por', analistaId)
        if (clienteId) {
          authUser.set('cliente_id', clienteId)
          try {
            const cliRecord = $app.findRecordById('clientes', clienteId)
            if (!cliRecord.getString('user_id')) {
              cliRecord.set('user_id', authUser.id)
              $app.save(cliRecord)
            }
          } catch (_) {}
        }
      }

      $app.save(authUser)

      return e.json(200, {
        success: true,
        nivel_acesso: authUser.getString('nivel_acesso'),
        perfil: authUser.getString('perfil'),
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
 * 5) Inclusão Manual de Usuário pelo Master / Admin
 * Cria a conta diretamente no banco (com senha provisória aleatória)
 * e dispara e-mail de definição de senha (reset password) para primeiro acesso
 * POST /backend/v1/usuarios/incluir-manual
 */
routerAdd(
  'POST',
  '/backend/v1/usuarios/incluir-manual',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser || !authUser.id) {
        return e.unauthorizedError('Autenticação necessária.')
      }

      const callerNivel = authUser.getString('nivel_acesso') || authUser.getString('role')
      const isMaster =
        callerNivel === 'master' ||
        authUser.getString('email').toLowerCase() === 'marcoschagasdiamond@icloud.com'
      const isAdmin = isMaster || callerNivel === 'admin' || authUser.getString('role') === 'admin'

      if (!isAdmin) {
        return e.forbiddenError('Apenas administradores podem incluir usuários manualmente.')
      }

      const body = e.requestInfo().body || {}
      const nome = (body.nome || '').trim()
      const email = (body.email || '').trim().toLowerCase()
      const whatsapp = (body.whatsapp || '').trim()
      const nivel = (body.nivel_acesso || 'empresario').trim().toLowerCase()
      const permissoes = Array.isArray(body.permissoes_json) ? body.permissoes_json : []
      const valorMensalPersonalizado =
        typeof body.valor_mensal_personalizado === 'number'
          ? body.valor_mensal_personalizado
          : undefined
      const statusOperacao = body.status_operacao || 'autorizado'

      if (!nome || !email || !email.includes('@')) {
        return e.badRequestError('Nome e e-mail corporativo válido são obrigatórios.')
      }

      // Restrição: Só o Master pode criar novos Administradores
      if (nivel === 'admin' && !isMaster) {
        return e.forbiddenError(
          'Apenas o Administrador Master (Dr. Marco Chagas) tem autoridade para criar Administradores.',
        )
      }

      const usersCol = $app.findCollectionByNameOrId('_pb_users_auth_')

      // Verificar se já existe usuário com esse e-mail
      try {
        const existing = $app.findAuthRecordByEmail('_pb_users_auth_', email)
        if (existing) {
          return e.badRequestError('Este e-mail já está cadastrado no sistema.')
        }
      } catch (_) {}

      const record = new Record(usersCol)
      record.setEmail(email)
      // Senha provisória forte e aleatória
      const senhaAleatoria = $security.randomString(16) + 'Aa1!'
      record.setPassword(senhaAleatoria)
      record.setVerified(true)
      record.set('name', nome)
      record.set('nivel_acesso', nivel)
      record.set('criado_por', authUser.id)

      if (nivel === 'admin') {
        record.set('role', 'admin')
        record.set('is_premium', true)
        record.set('permissoes_json', permissoes)
      } else if (nivel === 'analista') {
        record.set('perfil', 'contador')
        record.set('role', 'user')
        record.set('status_operacao', statusOperacao)
        record.set('autorizado_por', authUser.id)
        record.set('autorizado_em', new Date().toISOString().replace('T', ' ').substring(0, 19))
        if (typeof valorMensalPersonalizado === 'number') {
          record.set('valor_mensal_personalizado', valorMensalPersonalizado)
        }
      } else {
        // Empresario
        record.set('perfil', 'empresario')
        record.set('role', 'user')
      }

      $app.save(record)

      // Dispara envio de e-mail de definição de senha (requestPasswordReset)
      let emailEnviado = false
      try {
        // Usa o helper nativo do PocketBase ou dispara e-mail com link de redefinição
        let senderAddress = 'noreply@goskip.dev'
        let senderName = 'Contabilidade 5.0'
        try {
          const meta = $app.settings().meta
          if (meta && meta.senderAddress) senderAddress = meta.senderAddress
          if (meta && meta.senderName) senderName = meta.senderName
        } catch (_) {}

        let origin = (body.base_url || '').trim() || $os.getenv('SITE_URL') || ''
        if (!origin) origin = 'https://contabilidade-50.goskip.app'
        origin = origin.replace(/\/+$/, '')

        // Gera token de redefinição de senha para o usuário recém-criado
        // No PocketBase v0.36, pode-se usar usersCol ou chamar o client mailer
        let resetLink = `${origin}/redefinir-senha?email=${encodeURIComponent(email)}`

        const nivelDesc =
          nivel === 'admin'
            ? 'Administrador'
            : nivel === 'analista'
              ? 'Analista & Parceiro'
              : 'Empresário (Cliente)'

        const assunto = `Sua conta na Contabilidade 5.0 foi criada • Defina sua senha`
        const htmlContent = `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head><meta charset="utf-8" /></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07132B; margin: 0; padding: 24px; color: #1e293b;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #D4AF37;">
              <tr>
                <td style="background: linear-gradient(135deg, #07132B 0%, #0d2249 100%); padding: 32px 24px; text-align: center; border-bottom: 2px solid #D4AF37;">
                  <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 800;">Contabilidade 5.0</h1>
                  <p style="color: #D4AF37; font-size: 12px; font-weight: 700; text-transform: uppercase; margin: 6px 0 0 0;">Conta Criada com Sucesso</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 28px 24px;">
                  <p style="font-size: 15px; color: #07132B; font-weight: 700; margin: 0 0 12px 0;">Olá, ${nome}!</p>
                  <p style="font-size: 13px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
                    Sua conta de acesso à plataforma <strong>Contabilidade 5.0</strong> foi criada com o nível <strong>${nivelDesc}</strong> pela administração (${authUser.getString('name') || 'Diamond Group'}).
                  </p>
                  <p style="font-size: 13px; line-height: 1.6; color: #334155; margin: 0 0 24px 0;">
                    Para acessar pela primeira vez e definir sua senha pessoal com total segurança, clique no botão abaixo:
                  </p>
                  <div style="text-align: center; margin: 24px 0;">
                    <a href="${resetLink}" style="display: inline-block; background: #07132B; color: #D4AF37; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 30px; border-radius: 12px; border: 1px solid #D4AF37;">
                      Definir Minha Senha de Acesso
                    </a>
                  </div>
                  <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 20px;">
                    Link direto: <a href="${resetLink}" style="color: #07132B;">${resetLink}</a>
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
        emailEnviado = true
      } catch (mailErr) {
        console.log('[INCLUIR MANUAL] Aviso ao enviar e-mail de primeiro acesso:', mailErr)
      }

      return e.json(200, {
        success: true,
        usuario: {
          id: record.id,
          name: record.getString('name'),
          email: record.getString('email'),
          nivel_acesso: record.getString('nivel_acesso'),
        },
        email_enviado: emailEnviado,
        message: `Usuário "${nome}" incluído com sucesso no nível ${nivel}.`,
      })
    } catch (err) {
      console.log('[INCLUIR MANUAL] Erro:', err)
      return e.json(500, { error: err.message || 'Falha ao incluir usuário manualmente.' })
    }
  },
  $apis.requireAuth(),
)

/**
 * 6) Migração instantânea de perfil na /minha-conta (Modo Teste)
 * POST /backend/v1/perfis/migrar-analista
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

      authUser.set('perfil', 'contador')
      authUser.set('nivel_acesso', 'analista')
      authUser.set('status_operacao', 'autorizado')
      $app.save(authUser)

      return e.json(200, {
        success: true,
        message: 'Perfil migrado com sucesso para Analista (Modo Teste).',
        perfil: 'contador',
        nivel_acesso: 'analista',
      })
    } catch (err) {
      console.log('[PERFIL] Erro ao migrar para Analista:', err)
      return e.json(500, { error: 'Não foi possível migrar seu perfil. Tente novamente.' })
    }
  },
  $apis.requireAuth(),
)
