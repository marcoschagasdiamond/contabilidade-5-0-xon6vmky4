/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook de Consulta Externa de CNPJ (Contabilidade 5.0)
 *
 * Rota proxy opcional: GET /backend/v1/cnpj/consultar/{cnpj}
 * Consulta prioritariamente a BrasilAPI e, como fallback resiliente, a ReceitaWS.
 * Retorna os dados cadastrais estruturados com CORS habilitado e sem necessidade de chave.
 */

routerAdd('GET', '/backend/v1/cnpj/consultar/{cnpj}', (e) => {
  try {
    const rawCnpj = e.request.pathValue('cnpj') || ''
    const cnpjLimpo = rawCnpj.replace(/\D/g, '')

    if (cnpjLimpo.length !== 14) {
      return e.json(400, {
        sucesso: false,
        erro: 'CNPJ inválido. O documento deve conter exatamente 14 dígitos.',
      })
    }

    // 1. Tentativa principal: BrasilAPI
    try {
      const resBrasil = $http.send({
        url: `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`,
        method: 'GET',
        headers: { Accept: 'application/json' },
        timeout: 10,
      })

      if (resBrasil.statusCode === 200 && resBrasil.json) {
        const dados = resBrasil.json
        return e.json(200, {
          sucesso: true,
          provedor: 'brasilapi',
          dados: {
            cnpj: dados.cnpj || cnpjLimpo,
            razaoSocial: dados.razao_social || '',
            nomeFantasia: dados.nome_fantasia || '',
            situacaoCadastral: dados.descricao_situacao_cadastral || '',
            dataSituacaoCadastral: dados.data_situacao_cadastral || '',
            dataAbertura: dados.data_inicio_atividade || '',
            cnaePrincipalCodigo: dados.cnae_fiscal ? String(dados.cnae_fiscal) : '',
            cnaePrincipalDescricao: dados.cnae_fiscal_descricao || '',
            cnaesSecundarios: Array.isArray(dados.cnaes_secundarios)
              ? dados.cnaes_secundarios.map((c) => ({
                  codigo: String(c.codigo || ''),
                  descricao: c.descricao || '',
                }))
              : [],
            logradouro: dados.logradouro || '',
            numero: dados.numero || '',
            complemento: dados.complemento || '',
            bairro: dados.bairro || '',
            cep: dados.cep ? String(dados.cep).replace(/\D/g, '') : '',
            municipio: dados.municipio || '',
            uf: dados.uf || '',
            telefone: dados.ddd_telefone_1 ? `${dados.ddd_telefone_1}` : '',
            email: dados.email || '',
            capitalSocial: Number(dados.capital_social || 0),
            naturezaJuridica: dados.natureza_juridica || '',
            porte: dados.porte || '',
            qsa: Array.isArray(dados.qsa)
              ? dados.qsa.map((s, idx) => ({
                  id: 'soc_' + idx + '_' + (s.cnpj_cpf_do_socio || s.nome_socio || '').slice(-4),
                  nome: s.nome_socio || '',
                  qualificacao: s.qualificacao_socio || '',
                  cpfCnpj: s.cnpj_cpf_do_socio || '',
                  dataEntrada: s.data_entrada_sociedade || '',
                  faixaEtaria: s.faixa_etaria || '',
                  nomeRepresentanteLegal: s.nome_representante_legal || '',
                  qualificacaoRepresentanteLegal: s.qualificacao_representante_legal || '',
                  paisOrigem: s.pais || '',
                  percentualParticipacao:
                    typeof s.percentual_capital_social === 'number'
                      ? s.percentual_capital_social
                      : undefined,
                  tipoPessoa:
                    s.cnpj_cpf_do_socio && s.cnpj_cpf_do_socio.replace(/\D/g, '').length === 14
                      ? 'PJ'
                      : 'PF',
                }))
              : [],
          },
        })
      } else if (resBrasil.statusCode === 404) {
        return e.json(404, {
          sucesso: false,
          erro: 'CNPJ não encontrado na base de dados da Receita Federal.',
        })
      }
    } catch (errBrasil) {
      console.log('[Proxy CNPJ] Erro na consulta BrasilAPI:', errBrasil)
    }

    // 2. Tentativa intermediária: Minha Receita (Dados Abertos da Receita Federal com QSA completo)
    try {
      const resMinhaReceita = $http.send({
        url: `https://minhareceita.org/${cnpjLimpo}`,
        method: 'GET',
        headers: { Accept: 'application/json' },
        timeout: 10,
      })

      if (resMinhaReceita.statusCode === 200 && resMinhaReceita.json) {
        const dadosM = resMinhaReceita.json
        const qsaM = Array.isArray(dadosM.qsa)
          ? dadosM.qsa.map((s, idx) => ({
              id: 'soc_' + idx + '_' + (s.cnpj_cpf_do_socio || s.nome_socio || '').slice(-4),
              nome: s.nome_socio || '',
              qualificacao: s.qualificacao_socio || '',
              cpfCnpj: s.cnpj_cpf_do_socio || '',
              dataEntrada: s.data_entrada_sociedade || '',
              faixaEtaria: s.faixa_etaria || '',
              nomeRepresentanteLegal: s.nome_representante_legal || '',
              qualificacaoRepresentanteLegal: s.qualificacao_representante_legal || '',
              paisOrigem: s.pais || '',
              percentualParticipacao:
                typeof s.percentual_capital_social === 'number'
                  ? s.percentual_capital_social
                  : undefined,
              tipoPessoa:
                s.cnpj_cpf_do_socio && s.cnpj_cpf_do_socio.replace(/\D/g, '').length === 14
                  ? 'PJ'
                  : 'PF',
            }))
          : []

        return e.json(200, {
          sucesso: true,
          provedor: 'minhareceita',
          dados: {
            cnpj: dadosM.cnpj || cnpjLimpo,
            razaoSocial: dadosM.razao_social || '',
            nomeFantasia: dadosM.nome_fantasia || '',
            situacaoCadastral: dadosM.descricao_situacao_cadastral || '',
            dataSituacaoCadastral: dadosM.data_situacao_cadastral || '',
            dataAbertura: dadosM.data_inicio_atividade || '',
            cnaePrincipalCodigo: dadosM.cnae_fiscal ? String(dadosM.cnae_fiscal) : '',
            cnaePrincipalDescricao: dadosM.cnae_fiscal_descricao || '',
            cnaesSecundarios: Array.isArray(dadosM.cnaes_secundarios)
              ? dadosM.cnaes_secundarios.map((c) => ({
                  codigo: String(c.codigo || ''),
                  descricao: c.descricao || '',
                }))
              : [],
            logradouro: dadosM.logradouro || '',
            numero: dadosM.numero || '',
            complemento: dadosM.complemento || '',
            bairro: dadosM.bairro || '',
            cep: dadosM.cep ? String(dadosM.cep).replace(/\D/g, '') : '',
            municipio: dadosM.municipio || '',
            uf: dadosM.uf || '',
            telefone: dadosM.ddd_telefone_1 ? `${dadosM.ddd_telefone_1}` : '',
            email: dadosM.email || '',
            capitalSocial: Number(dadosM.capital_social || 0),
            naturezaJuridica: dadosM.natureza_juridica || '',
            porte: dadosM.porte || '',
            qsa: qsaM,
          },
        })
      }
    } catch (errMinhaReceita) {
      console.log('[Proxy CNPJ] Erro na consulta Minha Receita:', errMinhaReceita)
    }

    // 3. Fallback: ReceitaWS
    try {
      const resReceita = $http.send({
        url: `https://receitaws.com.br/api/cnpj/${cnpjLimpo}`,
        method: 'GET',
        headers: { Accept: 'application/json' },
        timeout: 12,
      })

      if (resReceita.statusCode === 200 && resReceita.json) {
        const dadosR = resReceita.json
        if (dadosR.status === 'ERROR') {
          return e.json(404, {
            sucesso: false,
            erro: dadosR.message || 'CNPJ não encontrado na base da ReceitaWS.',
          })
        }

        const cnaePrinc =
          Array.isArray(dadosR.atividade_principal) && dadosR.atividade_principal[0]
            ? dadosR.atividade_principal[0]
            : null

        return e.json(200, {
          sucesso: true,
          provedor: 'receitaws',
          dados: {
            cnpj: dadosR.cnpj ? dadosR.cnpj.replace(/\D/g, '') : cnpjLimpo,
            razaoSocial: dadosR.nome || '',
            nomeFantasia: dadosR.fantasia || '',
            situacaoCadastral: dadosR.situacao || '',
            dataSituacaoCadastral: dadosR.data_situacao || '',
            dataAbertura: dadosR.abertura || '',
            cnaePrincipalCodigo: cnaePrinc?.code ? String(cnaePrinc.code).replace(/\D/g, '') : '',
            cnaePrincipalDescricao: cnaePrinc?.text || '',
            cnaesSecundarios: Array.isArray(dadosR.atividades_secundarias)
              ? dadosR.atividades_secundarias.map((c) => ({
                  codigo: String(c.code || '').replace(/\D/g, ''),
                  descricao: c.text || '',
                }))
              : [],
            logradouro: dadosR.logradouro || '',
            numero: dadosR.numero || '',
            complemento: dadosR.complemento || '',
            bairro: dadosR.bairro || '',
            cep: dadosR.cep ? String(dadosR.cep).replace(/\D/g, '') : '',
            municipio: dadosR.municipio || '',
            uf: dadosR.uf || '',
            telefone: dadosR.telefone || '',
            email: dadosR.email || '',
            capitalSocial: Number(dadosR.capital_social || 0),
            naturezaJuridica: dadosR.natureza_juridica || '',
            porte: dadosR.porte || '',
            qsa: Array.isArray(dadosR.qsa)
              ? dadosR.qsa.map((s, idx) => ({
                  id: 'soc_' + idx + '_' + (s.nome || '').slice(-4),
                  nome: s.nome || '',
                  qualificacao: s.qual || '',
                  nomeRepresentanteLegal: s.nome_rep_legal || '',
                  qualificacaoRepresentanteLegal: s.qual_rep_legal || '',
                  paisOrigem: s.pais || '',
                  tipoPessoa:
                    (s.qual || '').toLowerCase().includes('jurídica') ||
                    (s.qual || '').toLowerCase().includes('juridica')
                      ? 'PJ'
                      : 'PF',
                }))
              : [],
          },
        })
      }
    } catch (errReceita) {
      console.log('[Proxy CNPJ] Erro na consulta ReceitaWS:', errReceita)
    }

    return e.json(502, {
      sucesso: false,
      erro: 'Não foi possível consultar os dados do CNPJ no momento. Tente novamente em instantes.',
    })
  } catch (errGeral) {
    console.log('[Proxy CNPJ] Erro fatal no hook:', errGeral)
    return e.json(500, {
      sucesso: false,
      erro: 'Erro interno ao processar a consulta de CNPJ.',
    })
  }
})
