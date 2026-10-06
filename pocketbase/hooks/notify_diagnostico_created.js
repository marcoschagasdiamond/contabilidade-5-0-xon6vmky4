/**
 * Hook para notificação por e-mail de novos diagnósticos tributários gerados no site Contabilidade 5.0
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
    const cidade = record.getString('cidade') || 'Não informada'
    const aliquotaISS = record.getFloat('aliquota_iss') || 0
    const rbt12 = record.getFloat('rbt12') || 0
    const folha12 = record.getFloat('folha12') || 0
    const margemLucro = record.getFloat('margem_lucro') || 0
    const regimeRecomendado = record.getString('regime_recomendado') || 'Não informado'
    const economiaAnual = record.getFloat('economia_anual') || 0
    const cargaSimples = record.getFloat('carga_simples') || 0
    const cargaPresumido = record.getFloat('carga_presumido') || 0
    const cargaReal = record.getFloat('carga_real') || 0

    const destinatario = 'marcoschagasdiamond@icloud.com'
    const assunto = 'Novo diagnóstico tributário — Contabilidade 5.0'

    const formatMoney = (val) => {
      try {
        return (
          'R$ ' +
          Number(val).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        )
      } catch (_) {
        return 'R$ ' + val
      }
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Novo Diagnóstico Tributário</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <tr>
            <td style="background: linear-gradient(135deg, #0A1A13 0%, #145A32 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">Contabilidade 5.0</h1>
              <p style="color: #2ECC71; font-size: 13px; font-weight: 600; text-transform: uppercase; margin: 6px 0 0 0; letter-spacing: 1px;">Novo Diagnóstico Tributário Gerado</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 24px;">
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; color: #334155;">
                Um novo diagnóstico fiscal completo foi gerado através da calculadora do site:
              </p>

              <!-- Destaque do Regime e Economia -->
              <div style="background-color: #0A1A13; color: #ffffff; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; border: 1px solid #145A32;">
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #2ECC71; font-weight: 700;">Regime Recomendado</span>
                <h2 style="font-size: 24px; margin: 6px 0 10px 0; color: #ffffff; font-weight: 800;">${regimeRecomendado}</h2>
                <div style="font-size: 13px; color: #cbd5e1;">Economia anual estimada: <strong style="color: #2ECC71; font-size: 16px;">${formatMoney(economiaAnual)}</strong></div>
              </div>
              
              <!-- Dados da Empresa -->
              <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin: 0 0 10px 0;">Dados da Empresa</h3>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; width: 35%;"><strong>Empresa:</strong></td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a; font-weight: 600;">${empresa}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"><strong>Contato:</strong></td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a;">${nome}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"><strong>E-mail:</strong></td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px;"><a href="mailto:${email}" style="color: #145A32; text-decoration: none;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"><strong>WhatsApp:</strong></td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px;"><a href="https://wa.me/${telefone.replace(/\\D/g, '')}" style="color: #145A32; font-weight: 600; text-decoration: none;">${telefone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"><strong>Segmento:</strong></td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a;">${segmento}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-size: 13px; color: #64748b;"><strong>Cidade / ISS:</strong></td>
                  <td style="padding: 10px 14px; font-size: 14px; color: #0f172a; font-weight: 600;">${cidade} ${aliquotaISS > 0 ? `(${aliquotaISS}% ISS)` : ''}</td>
                </tr>
              </table>

              <!-- Parâmetros Financeiros -->
              <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin: 0 0 10px 0;">Parâmetros Financeiros & Projeções</h3>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; width: 45%;"><strong>Faturamento Anual (RBT12):</strong></td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a; font-weight: 600;">${formatMoney(rbt12)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"><strong>Folha 12m (Fator R):</strong></td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a;">${formatMoney(folha12)} ${rbt12 > 0 ? `(${((folha12 / rbt12) * 100).toFixed(1)}%)` : ''}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"><strong>Margem de Lucro:</strong></td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a;">${margemLucro}%</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"><strong>Carga Simples Nacional:</strong></td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a;">${cargaSimples > 0 ? formatMoney(cargaSimples) : 'Inelegível (> 4,8M)'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"><strong>Carga Lucro Presumido:</strong></td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a;">${cargaPresumido > 0 ? formatMoney(cargaPresumido) : 'Inelegível (> 78M)'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-size: 13px; color: #64748b;"><strong>Carga Lucro Real:</strong></td>
                  <td style="padding: 10px 14px; font-size: 14px; color: #0f172a;">${formatMoney(cargaReal)}</td>
                </tr>
              </table>

              <div style="text-align: center; margin-top: 24px;">
                <a href="https://wa.me/${telefone.replace(/\\D/g, '')}?text=${encodeURIComponent('Olá ' + nome + '! Recebemos sua simulação tributária na Contabilidade 5.0 para a ' + empresa + '.')}" style="display: inline-block; background-color: #2ECC71; color: #0A1A13; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(46,204,113,0.3);">
                  Entrar em Contato com a Empresa
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
    console.log('[NOTIFICAÇÃO DIAGNÓSTICO] E-mail enviado com sucesso para:', destinatario)
  } catch (err) {
    console.log('[NOTIFICAÇÃO DIAGNÓSTICO] Aviso ao disparar e-mail de diagnóstico:', err)
  }
  e.next()
}, 'diagnosticos')
