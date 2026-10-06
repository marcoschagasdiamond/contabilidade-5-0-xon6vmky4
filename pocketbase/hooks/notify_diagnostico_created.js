/**
 * Hook para notificação por e-mail de novos diagnósticos tributários gerados no site Contabilidade 5.0
 * Destinatário: marcoschagasdiamond@icloud.com
 * Inclui análise do Novo Sistema Tributário (EC 132/2023, LC 214/2025) e Sistema Atual
 */
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const nome = record.getString('nome') || 'Não informado'
    const email = record.getString('email') || 'Não informado'
    const telefone = record.getString('telefone') || 'Não informado'
    const empresa = record.getString('empresa') || 'Não informada'
    const cnpj = record.getString('cnpj') || 'Não informado'
    const segmento = record.getString('segmento') || 'Não informado'
    const cidade = record.getString('cidade') || 'Não informada'
    const aliquotaISS = record.getFloat('aliquota_iss') || 0
    const rbt12 = record.getFloat('rbt12') || 0
    const folha12 = record.getFloat('folha12') || 0
    const margemLucro = record.getFloat('margem_lucro') || 0
    const anoBase = record.getInt('ano_base') || 2026

    // Regimes recomendados em cada sistema
    const regimeRecomendadoAtual =
      record.getString('sistema_recomendado_atual') ||
      record.getString('regime_recomendado') ||
      'Não informado'
    const regimeRecomendadoNovo =
      record.getString('sistema_recomendado_novo') ||
      record.getString('regime_recomendado') ||
      'Não informado'

    const economiaAnual = record.getFloat('economia_anual') || 0
    const economiaAnualNovo = record.getFloat('economia_anual_novo') || 0

    // Cargas atuais
    const cargaSimples = record.getFloat('carga_simples') || 0
    const cargaPresumido = record.getFloat('carga_presumido') || 0
    const cargaReal = record.getFloat('carga_real') || 0

    // Cargas no novo sistema (IBS/CBS)
    const cargaSimplesNovo = record.getFloat('carga_simples_novo') || 0
    const cargaPresumidoNovo = record.getFloat('carga_presumido_novo') || 0
    const cargaRealNovo = record.getFloat('carga_real_novo') || 0

    const destinatario = 'marcoschagasdiamond@icloud.com'
    const assunto = `Novo diagnóstico tributário (${anoBase} · Reforma Tributária) — Contabilidade 5.0`

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
        <title>Novo Diagnóstico Tributário — Reforma Tributária</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <tr>
            <td style="background: linear-gradient(135deg, #0A1A13 0%, #145A32 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">Contabilidade 5.0</h1>
              <p style="color: #2ECC71; font-size: 13px; font-weight: 600; text-transform: uppercase; margin: 6px 0 0 0; letter-spacing: 1px;">Diagnóstico Baseado no Novo Código Tributário</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 24px;">
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; color: #334155;">
                Um novo diagnóstico fiscal completo foi gerado através da calculadora do site com análise comparativa da <strong>Reforma Tributária (EC 132/2023 · LC 214/2025)</strong> para o ano-base <strong>${anoBase}</strong>:
              </p>

              <!-- Destaque Recomendações dos Sistemas -->
              <div style="background-color: #0A1A13; color: #ffffff; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; border: 1px solid #145A32;">
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #2ECC71; font-weight: 700; display: block; margin-bottom: 6px;">Novo Sistema Tributário (IBS / CBS — Ano ${anoBase})</span>
                <h2 style="font-size: 22px; margin: 4px 0 8px 0; color: #ffffff; font-weight: 800;">${regimeRecomendadoNovo}</h2>
                <p style="font-size: 13px; color: #cbd5e1; margin: 0;">
                  Sistema Atual: <strong>${regimeRecomendadoAtual}</strong>
                </p>
                ${
                  economiaAnualNovo > 0
                    ? `<p style="font-size: 13px; color: #2ECC71; margin: 8px 0 0 0; font-weight: 700;">Economia projetada no Novo Sistema: ${formatMoney(economiaAnualNovo)}/ano</p>`
                    : ''
                }
              </div>

              <!-- Tabela de Dados da Empresa -->
              <h3 style="font-size: 15px; font-weight: 700; color: #0A1A13; border-bottom: 2px solid #2ECC71; padding-bottom: 8px; margin: 0 0 14px 0;">Dados da Empresa</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; width: 35%;"><strong>Empresa:</strong></td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a; font-weight: 600;">${empresa}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"><strong>CNPJ:</strong></td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a; font-weight: 600;">${cnpj}</td>
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
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px;"><a href="https://wa.me/${telefone.replace(/\D/g, '')}" style="color: #145A32; font-weight: 600; text-decoration: none;">${telefone}</a></td>
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

              <!-- Tabela Comparativa de Carga: Sistema Atual vs. Novo Sistema -->
              <h3 style="font-size: 15px; font-weight: 700; color: #0A1A13; border-bottom: 2px solid #2ECC71; padding-bottom: 8px; margin: 0 0 14px 0;">Comparativo Tributário (Ano-Base ${anoBase})</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; width: 45%;"><strong>Faturamento Anual (RBT12):</strong></td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a; font-weight: 600;">${formatMoney(rbt12)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"><strong>Simples Nacional (Novo ${anoBase}):</strong></td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a;">${cargaSimplesNovo > 0 ? formatMoney(cargaSimplesNovo) : cargaSimples > 0 ? formatMoney(cargaSimples) : 'Inelegível (> 4,8M)'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;"><strong>Lucro Presumido (Novo ${anoBase}):</strong></td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a;">${cargaPresumidoNovo > 0 ? formatMoney(cargaPresumidoNovo) : cargaPresumido > 0 ? formatMoney(cargaPresumido) : 'Inelegível (> 78M)'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-size: 13px; color: #64748b;"><strong>Lucro Real (Novo ${anoBase}):</strong></td>
                  <td style="padding: 10px 14px; font-size: 14px; color: #0f172a; font-weight: 600;">${cargaRealNovo > 0 ? formatMoney(cargaRealNovo) : formatMoney(cargaReal)}</td>
                </tr>
              </table>

              <!-- Botão Ação -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-top: 10px;">
                    <a href="https://wa.me/${telefone.replace(/\D/g, '')}" style="background-color: #2ECC71; color: #0A1A13; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 700; display: inline-block;">
                      Contatar Cliente no WhatsApp
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
              Notificação gerada automaticamente pelo sistema Contabilidade 5.0 • EC 132/2023 · LC 214/2025
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
    console.log(
      `E-mail de diagnóstico (Reforma ${anoBase}) enviado com sucesso para ${destinatario}`,
    )
  } catch (err) {
    console.log('Erro ao enviar e-mail de notificação de diagnóstico:', err)
  }
})
