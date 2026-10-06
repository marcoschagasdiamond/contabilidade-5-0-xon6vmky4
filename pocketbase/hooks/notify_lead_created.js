/**
 * Hook para notificação por e-mail de novos leads cadastrados no site Contabilidade 5.0
 * Destinatário: marcoschagasdiamond@icloud.com
 */
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const nome = record.getString('nome') || 'Não informado'
    const email = record.getString('email') || 'Não informado'
    const telefone = record.getString('telefone') || 'Não informado'
    const empresa = record.getString('empresa') || 'Não informada'
    const segmento = record.getString('segmento') || 'Não informado'
    const funcionarios = record.getString('funcionarios') || 'Não informado'
    const mensagem = record.getString('mensagem') || ''

    const destinatario = 'marcoschagasdiamond@icloud.com'
    const assunto = 'Novo lead no site — Contabilidade 5.0'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Novo Lead</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <tr>
            <td style="background: linear-gradient(135deg, #0A1A13 0%, #145A32 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">Contabilidade 5.0</h1>
              <p style="color: #2ECC71; font-size: 13px; font-weight: 600; text-transform: uppercase; margin: 6px 0 0 0; letter-spacing: 1px;">Novo Lead Capturado</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 24px;">
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; color: #334155;">
                Um novo contato acabou de solicitar atendimento através do formulário do site:
              </p>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; width: 35%;"><strong>Nome:</strong></td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a; font-weight: 600;">${nome}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"><strong>Empresa:</strong></td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a; font-weight: 600;">${empresa}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"><strong>E-mail:</strong></td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #145A32;"><a href="mailto:${email}" style="color: #145A32; text-decoration: none;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"><strong>Telefone/WhatsApp:</strong></td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a;"><a href="https://wa.me/${telefone.replace(/\\D/g, '')}" style="color: #145A32; font-weight: 600; text-decoration: none;">${telefone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"><strong>Segmento:</strong></td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a;">${segmento}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b;"><strong>Colaboradores:</strong></td>
                  <td style="padding: 12px 16px; font-size: 14px; color: #0f172a;">${funcionarios}</td>
                </tr>
              </table>

              ${
                mensagem
                  ? `
                <div style="background-color: #f1f5f9; border-left: 4px solid #145A32; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                  <strong style="display: block; font-size: 12px; text-transform: uppercase; color: #475569; margin-bottom: 6px;">Mensagem enviada:</strong>
                  <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${mensagem}</p>
                </div>
              `
                  : ''
              }

              <div style="text-align: center; margin-top: 24px;">
                <a href="https://wa.me/${telefone.replace(/\\D/g, '')}" style="display: inline-block; background-color: #2ECC71; color: #0A1A13; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(46,204,113,0.3);">
                  Responder via WhatsApp
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
              Contabilidade 5.0 • Notificação automática da plataforma
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    let senderAddress = 'noreply@goskip.dev'
    let senderName = 'Contabilidade 5.0'
    try {
      const meta = $app.settings().meta
      if (meta && meta.senderAddress) senderAddress = meta.senderAddress
      if (meta && meta.senderName) senderName = meta.senderName
    } catch (_) {}

    const message = new MailerMessage({
      from: {
        address: senderAddress,
        name: senderName,
      },
      to: [{ address: destinatario }],
      subject: assunto,
      html: htmlContent,
    })

    $app.newMailClient().send(message)
    console.log('[NOTIFICAÇÃO LEAD] E-mail enviado com sucesso para:', destinatario)
  } catch (err) {
    console.log('[NOTIFICAÇÃO LEAD] Aviso ao disparar e-mail de lead:', err)
  }
  e.next()
}, 'leads')
