/**
 * Utilitários para extração, classificação e monitoramento de validade
 * de Consultas & Certidões Fiscais (Etapa 1 da Integração Fiscal).
 *
 * Suporta leitura orientada de arquivos (PDF, CSV, imagens, TXT)
 * sugerindo automaticamente campos-chave via heurísticas de texto e metadados,
 * sem nunca alterar cálculos ou marcar teses do Recuperador.
 *
 * Estruturado com fonte 'manual' vs 'api' para fácil acoplamento
 * de agregador fiscal futuro.
 */

import {
  CertidaoFiscalRegistro,
  TipoCertidaoFiscal,
  SituacaoCertidaoFiscal,
  TIPOS_CERTIDOES_FISCAIS_OPCOES,
  DadosEmpresaPerfil,
} from '@/types/dadosEmpresa'

export interface SugestaoExtracaoCertidao {
  tipo: TipoCertidaoFiscal
  nomeTipo: string
  orgaoEmissor: string
  situacao: SituacaoCertidaoFiscal
  codigoControle?: string
  numeroCertidao?: string
  dataEmissao?: string // YYYY-MM-DD
  dataValidade?: string // YYYY-MM-DD
  cnpjDetectado?: string
  observacoes?: string
  confianca: 'alta' | 'media' | 'baixa'
  sugestoesFase3: {
    autosInfracaoAtivos?: boolean
    dividaAtivaExecucaoFiscal?: boolean
    parcelamentosEmCurso?: boolean
    obrigacoesAcessoriasAtraso?: boolean
  }
}

export type StatusValidadeCertidao = 'valida' | 'proxima_vencimento' | 'vencida' | 'indefinida'

export interface AlertaValidadeCertidao {
  certidao: CertidaoFiscalRegistro
  status: StatusValidadeCertidao
  diasRestantes?: number
  mensagem: string
  nivel: 'sucesso' | 'alerta' | 'perigo' | 'neutro'
}

/**
 * Calcula o status de validade de uma certidão fiscal.
 * - 'vencida': dataValidade < hoje
 * - 'proxima_vencimento': vence em até 30 dias
 * - 'valida': vence em mais de 30 dias
 * - 'indefinida': sem dataValidade informada
 */
export function avaliarValidadeCertidao(
  dataValidade?: string,
  dataReferencia: Date = new Date(),
): { status: StatusValidadeCertidao; diasRestantes?: number; mensagem: string } {
  if (!dataValidade) {
    return {
      status: 'indefinida',
      mensagem: 'Data de validade não informada',
    }
  }

  // Parse no formato YYYY-MM-DD garantindo fuso neutro
  const partes = dataValidade.split('-')
  if (partes.length !== 3) {
    return {
      status: 'indefinida',
      mensagem: 'Data de validade inválida',
    }
  }

  const ano = parseInt(partes[0], 10)
  const mes = parseInt(partes[1], 10) - 1
  const dia = parseInt(partes[2], 10)

  const dataVal = new Date(ano, mes, dia, 23, 59, 59)
  if (isNaN(dataVal.getTime())) {
    return {
      status: 'indefinida',
      mensagem: 'Data de validade inválida',
    }
  }

  const hoje = new Date(
    dataReferencia.getFullYear(),
    dataReferencia.getMonth(),
    dataReferencia.getDate(),
    0,
    0,
    0,
  )

  const diffMs = dataVal.getTime() - hoje.getTime()
  const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diasRestantes < 0) {
    const diasVencidos = Math.abs(diasRestantes)
    return {
      status: 'vencida',
      diasRestantes,
      mensagem: `Vencida há ${diasVencidos} dia${diasVencidos > 1 ? 's' : ''} (${formatarDataBrasileira(dataValidade)})`,
    }
  }

  if (diasRestantes <= 30) {
    return {
      status: 'proxima_vencimento',
      diasRestantes,
      mensagem:
        diasRestantes === 0
          ? 'Vence hoje!'
          : `Vence em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''} (${formatarDataBrasileira(dataValidade)})`,
    }
  }

  return {
    status: 'valida',
    diasRestantes,
    mensagem: `Válida até ${formatarDataBrasileira(dataValidade)} (${diasRestantes} dias restantes)`,
  }
}

/**
 * Avalia todas as certidões e retorna alertas consolidando as que estão vencidas ou próximas do vencimento.
 */
export function obterAlertasValidadeCertidoes(
  certidoes: CertidaoFiscalRegistro[] = [],
): AlertaValidadeCertidao[] {
  return certidoes.map((cert) => {
    const { status, diasRestantes, mensagem } = avaliarValidadeCertidao(cert.dataValidade)

    let nivel: AlertaValidadeCertidao['nivel'] = 'neutro'
    if (status === 'vencida' || cert.situacao === 'positiva' || cert.situacao === 'irregular') {
      nivel = 'perigo'
    } else if (
      status === 'proxima_vencimento' ||
      cert.situacao === 'positiva_efeito_negativa' ||
      cert.situacao === 'com_pendencias'
    ) {
      nivel = 'alerta'
    } else if (
      status === 'valida' &&
      (cert.situacao === 'negativa' || cert.situacao === 'regular')
    ) {
      nivel = 'sucesso'
    }

    return {
      certidao: cert,
      status,
      diasRestantes,
      mensagem,
      nivel,
    }
  })
}

/**
 * Heurística de sugestão de campos baseada no nome do arquivo e em texto extraído
 * (quando arquivo de texto, CSV ou OCR/metadados).
 */
export function sugerirDadosCertidaoPorArquivo(
  nomeArquivo: string,
  textoConteudo: string = '',
  perfilAtual?: Partial<DadosEmpresaPerfil>,
): SugestaoExtracaoCertidao {
  const nomeLower = (nomeArquivo || '').toLowerCase()
  const textoLower = (textoConteudo || '').toLowerCase()
  const combinado = `${nomeLower} ${textoLower}`

  let tipo: TipoCertidaoFiscal = 'outro'
  let situacao: SituacaoCertidaoFiscal = 'negativa'
  let orgaoEmissor = 'Órgão Fiscal'
  let confianca: SugestaoExtracaoCertidao['confianca'] = 'baixa'

  // 1. Identificação do tipo de certidão/documento
  if (
    combinado.includes('federal') ||
    combinado.includes('pgfn') ||
    combinado.includes('rfb') ||
    combinado.includes('receita federal') ||
    combinado.includes('conjunta') ||
    combinado.includes('tributos federais')
  ) {
    tipo = 'cnd_federal'
    orgaoEmissor = 'Receita Federal / PGFN'
    confianca = 'alta'
  } else if (
    combinado.includes('fgts') ||
    combinado.includes('crf') ||
    combinado.includes('caixa')
  ) {
    tipo = 'cnd_fgts'
    orgaoEmissor = 'Caixa Econômica Federal'
    confianca = 'alta'
  } else if (
    combinado.includes('cndt') ||
    combinado.includes('trabalhista') ||
    combinado.includes('tst') ||
    combinado.includes('trabalho')
  ) {
    tipo = 'cndt_trabalhista'
    orgaoEmissor = 'Tribunal Superior do Trabalho (TST)'
    confianca = 'alta'
  } else if (
    combinado.includes('estadual') ||
    combinado.includes('sefaz') ||
    combinado.includes('pge') ||
    combinado.includes('icms')
  ) {
    tipo = 'cnd_estadual'
    orgaoEmissor = perfilAtual?.ufOrigem
      ? `SEFAZ-${perfilAtual.ufOrigem} / PGE`
      : 'SEFAZ Estadual / PGE'
    confianca = 'alta'
  } else if (
    combinado.includes('municipal') ||
    combinado.includes('prefeitura') ||
    combinado.includes('iss') ||
    combinado.includes('mobiliario')
  ) {
    tipo = 'cnd_municipal'
    orgaoEmissor = 'Prefeitura Municipal'
    confianca = 'alta'
  } else if (
    combinado.includes('sintegra') ||
    combinado.includes('ccc') ||
    combinado.includes('inscricao estadual')
  ) {
    tipo = 'consulta_sintegra'
    orgaoEmissor = 'Sintegra / SEFAZ'
    confianca = 'alta'
  } else if (
    combinado.includes('dctf') ||
    combinado.includes('dctfweb') ||
    combinado.includes('declaracao')
  ) {
    tipo = 'declaracao_dctf'
    orgaoEmissor = 'Receita Federal do Brasil'
    confianca = 'alta'
  } else if (
    combinado.includes('cnpj') ||
    combinado.includes('cadastral') ||
    combinado.includes('comprovante')
  ) {
    tipo = 'consulta_receita'
    orgaoEmissor = 'Receita Federal do Brasil'
    confianca = 'media'
  }

  // Se o tipo for padrão, define orgao padrão
  const opcaoTipo = TIPOS_CERTIDOES_FISCAIS_OPCOES.find((o) => o.id === tipo)
  const nomeTipo = opcaoTipo?.rotulo || 'Certidão ou Consulta Fiscal'
  if (orgaoEmissor === 'Órgão Fiscal' && opcaoTipo) {
    orgaoEmissor = opcaoTipo.orgaoPadrao
  }

  // 2. Situação (negativa, positiva com efeito, positiva, pendência)
  if (
    combinado.includes('positiva com efeito') ||
    combinado.includes('com efeitos de negativa') ||
    combinado.includes('efeito de negativa') ||
    combinado.includes('efeitos de negativa') ||
    combinado.includes('exigibilidade suspensa') ||
    combinado.includes('garantido') ||
    combinado.includes('parcelado')
  ) {
    situacao = 'positiva_efeito_negativa'
  } else if (
    combinado.includes('positiva de debitos') ||
    combinado.includes('certidao positiva') ||
    combinado.includes('constam debitos') ||
    combinado.includes('debitos pendentes') ||
    combinado.includes('inadimplente')
  ) {
    situacao = 'positiva'
  } else if (
    combinado.includes('irregular') ||
    combinado.includes('inapta') ||
    combinado.includes('suspensa') ||
    combinado.includes('baixada')
  ) {
    situacao = 'irregular'
  } else if (
    combinado.includes('com pendencia') ||
    combinado.includes('pendencias') ||
    combinado.includes('omissao') ||
    combinado.includes('omissa')
  ) {
    situacao = 'com_pendencias'
  } else if (combinado.includes('regular') || combinado.includes('ativa')) {
    situacao = 'regular'
  } else if (combinado.includes('negativa')) {
    situacao = 'negativa'
  }

  // 3. Extração de Datas (emissão e validade)
  const datasEncontradas = extrairDatasTexto(textoConteudo)
  let dataEmissao: string | undefined
  let dataValidade: string | undefined

  if (datasEncontradas.length >= 2) {
    // Geralmente a primeira é emissão e a segunda é validade
    dataEmissao = datasEncontradas[0]
    dataValidade = datasEncontradas[1]
  } else if (datasEncontradas.length === 1) {
    dataValidade = datasEncontradas[0]
  }

  // Tenta extrair código de controle/autenticidade
  let codigoControle: string | undefined
  const matchControle =
    textoConteudo.match(/(?:c[oó]digo|controle|autenticidade|chave)[:\s]*([A-Z0-9.-]{8,32})/i) ||
    textoConteudo.match(/([A-Z0-9]{4}\.[A-Z0-9]{4}\.[A-Z0-9]{4}\.[A-Z0-9]{4})/i)
  if (matchControle && matchControle[1]) {
    codigoControle = matchControle[1].trim()
  }

  // Tenta extrair CNPJ
  let cnpjDetectado: string | undefined
  const matchCnpj = textoConteudo.match(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/)
  if (matchCnpj) {
    cnpjDetectado = matchCnpj[0]
  }

  // 4. Mapeamento de sugestões não-bloqueantes para a Situação Fiscal (Fase 3)
  const sugestoesFase3: SugestaoExtracaoCertidao['sugestoesFase3'] = {}
  if (situacao === 'positiva') {
    sugestoesFase3.dividaAtivaExecucaoFiscal = true
  }
  if (situacao === 'positiva_efeito_negativa') {
    sugestoesFase3.parcelamentosEmCurso = true
  }
  if (situacao === 'com_pendencias' || tipo === 'declaracao_dctf') {
    if (combinado.includes('omiss') || combinado.includes('atraso')) {
      sugestoesFase3.obrigacoesAcessoriasAtraso = true
    }
  }

  return {
    tipo,
    nomeTipo,
    orgaoEmissor,
    situacao,
    codigoControle,
    dataEmissao,
    dataValidade,
    cnpjDetectado,
    confianca,
    sugestoesFase3,
  }
}

/**
 * Busca datas no formato DD/MM/AAAA ou DD-MM-AAAA e retorna em formato ISO YYYY-MM-DD.
 */
export function extrairDatasTexto(texto: string): string[] {
  if (!texto) return []
  const regexData = /\b(\d{2})[/\.-](\d{2})[/\.-](\d{4})\b/g
  const datas: string[] = []
  let match: RegExpExecArray | null

  while ((match = regexData.exec(texto)) !== null) {
    const dia = parseInt(match[1], 10)
    const mes = parseInt(match[2], 10)
    const ano = parseInt(match[3], 10)

    if (mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31 && ano >= 2000 && ano <= 2100) {
      const mesStr = mes.toString().padStart(2, '0')
      const diaStr = dia.toString().padStart(2, '0')
      const iso = `${ano}-${mesStr}-${diaStr}`
      if (!datas.includes(iso)) {
        datas.push(iso)
      }
    }
  }

  return datas
}

export function formatarDataBrasileira(dataIso?: string): string {
  if (!dataIso) return '-'
  const partes = dataIso.split('-')
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`
  }
  return dataIso
}

export function formatarSituacaoCertidao(situacao: SituacaoCertidaoFiscal): {
  rotulo: string
  corBadge: string
} {
  switch (situacao) {
    case 'negativa':
      return {
        rotulo: 'Negativa (Regular)',
        corBadge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      }
    case 'positiva_efeito_negativa':
      return {
        rotulo: 'Positiva c/ Efeito de Negativa',
        corBadge: 'bg-blue-50 text-blue-800 border-blue-300',
      }
    case 'positiva':
      return {
        rotulo: 'Positiva (Com Débitos)',
        corBadge: 'bg-rose-50 text-rose-800 border-rose-300',
      }
    case 'com_pendencias':
      return {
        rotulo: 'Com Pendências Cadastrais',
        corBadge: 'bg-amber-50 text-amber-800 border-amber-300',
      }
    case 'regular':
      return {
        rotulo: 'Regular / Ativa',
        corBadge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      }
    case 'irregular':
      return {
        rotulo: 'Irregular / Suspensa',
        corBadge: 'bg-rose-50 text-rose-800 border-rose-300',
      }
    default:
      return {
        rotulo: 'Consultada',
        corBadge: 'bg-slate-50 text-slate-800 border-slate-300',
      }
  }
}
