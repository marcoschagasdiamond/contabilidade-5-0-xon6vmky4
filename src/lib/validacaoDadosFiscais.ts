import { DadosEmpresaPerfil } from '@/types/dadosEmpresa'
import { validarCNPJ, limparCNPJ } from '@/lib/cnpj'
import { LISTA_UFS_ICMS } from '@/types/calculadoraIbsCbs'

export interface ApontamentoFiscal {
  id: string
  campo?: keyof DadosEmpresaPerfil | string
  titulo: string
  mensagem: string
  tipo: 'erro' | 'aviso'
}

export interface ResultadoValidacaoFiscal {
  errosCampos: Record<string, string>
  avisosCoerencia: ApontamentoFiscal[]
  totalErros: number
  totalAvisos: number
  totalPendencias: number
  temErrosBloqueantes: boolean
}

/**
 * Validação em tempo real para campos individuais
 */
export function validarCnpjInline(valor: string): string | null {
  const limpo = limparCNPJ(valor)
  if (!limpo) {
    return 'CNPJ da empresa é obrigatório'
  }
  if (limpo.length < 14) {
    return 'CNPJ incompleto (deve conter 14 dígitos)'
  }
  if (limpo.length > 14) {
    return 'CNPJ deve conter no máximo 14 dígitos'
  }
  if (!validarCNPJ(valor)) {
    return 'CNPJ inválido (dígitos verificadores incorretos)'
  }
  return null
}

export function validarEmailInline(valor: string): string | null {
  const v = valor?.trim() || ''
  if (!v) {
    return 'E-mail corporativo é obrigatório'
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(v)) {
    return 'Informe um e-mail válido (ex: contato@empresa.com.br)'
  }
  return null
}

export function validarTelefoneInline(valor: string): string | null {
  const digitsOnly = (valor || '').replace(/\D/g, '')
  const cleanDigits = digitsOnly.startsWith('55') ? digitsOnly.slice(2) : digitsOnly
  if (!cleanDigits) {
    return 'Telefone/WhatsApp é obrigatório'
  }
  if (cleanDigits.length < 10) {
    return 'Informe um telefone válido com DDD (mínimo 10 dígitos)'
  }
  return null
}

export function validarUfInline(uf: string): string | null {
  if (!uf) return 'UF de origem é obrigatória'
  const existe = LISTA_UFS_ICMS.some((u) => u.uf === uf)
  if (!existe) return 'UF informada não consta na lista nacional de ICMS'
  return null
}

export function validarPercentualInline(
  valor: number | undefined,
  nomeCampo: string,
): string | null {
  if (valor === undefined || valor === null || isNaN(valor)) return null
  if (valor < 0 || valor > 100) {
    return `${nomeCampo} deve estar entre 0% e 100%`
  }
  return null
}

export function validarValorMonetarioInline(
  valor: number | undefined,
  nomeCampo: string,
): string | null {
  if (valor === undefined || valor === null || isNaN(valor)) return null
  if (valor < 0) {
    return `${nomeCampo} não pode ser um valor negativo`
  }
  return null
}

/**
 * Validação completa de coerência e integridade fiscal dos dados da empresa
 */
export function executarValidacaoFiscal(dados: DadosEmpresaPerfil): ResultadoValidacaoFiscal {
  const errosCampos: Record<string, string> = {}
  const avisosCoerencia: ApontamentoFiscal[] = []

  // 1. Identificação essencial
  if (!dados.nomeContato?.trim()) {
    errosCampos.nomeContato = 'Nome do responsável é obrigatório'
  } else if (dados.nomeContato.trim().length < 3) {
    errosCampos.nomeContato = 'Informe seu nome completo (mínimo 3 caracteres)'
  }

  if (!dados.nomeEmpresa?.trim()) {
    errosCampos.nomeEmpresa = 'Nome da empresa é obrigatório'
  }

  const erroCnpj = validarCnpjInline(dados.cnpj || '')
  if (erroCnpj) {
    errosCampos.cnpj = erroCnpj
  }

  const erroEmail = validarEmailInline(dados.email || '')
  if (erroEmail) {
    errosCampos.email = erroEmail
  }

  const erroTelefone = validarTelefoneInline(dados.telefone || '')
  if (erroTelefone) {
    errosCampos.telefone = erroTelefone
  }

  const erroUf = validarUfInline(dados.ufOrigem || '')
  if (erroUf) {
    errosCampos.ufOrigem = erroUf
  }

  if (!dados.cidade) {
    errosCampos.cidade = 'Cidade para alíquota de ISS é obrigatória'
  }

  if (!dados.segmento) {
    errosCampos.segmento = 'Selecione o segmento principal de atuação'
  }

  // 2. Valores monetários não negativos
  const erroFat = validarValorMonetarioInline(dados.faturamentoMensal, 'Faturamento mensal')
  if (erroFat) errosCampos.faturamentoMensal = erroFat

  const erroFolha = validarValorMonetarioInline(dados.folhaPagamentoMensal, 'Folha de pagamento')
  if (erroFolha) errosCampos.folhaPagamentoMensal = erroFolha

  const erroImob = validarValorMonetarioInline(dados.imobilizadoUltimos5Anos, 'Ativo imobilizado')
  if (erroImob) errosCampos.imobilizadoUltimos5Anos = erroImob

  const erroSaldoCredor = validarValorMonetarioInline(
    dados.saldoCredorAcumulado,
    'Saldo credor acumulado',
  )
  if (erroSaldoCredor) errosCampos.saldoCredorAcumulado = erroSaldoCredor

  if (dados.autosInfracaoAtivos && (dados.autosInfracaoValor ?? 0) < 0) {
    errosCampos.autosInfracaoValor = 'Valor autuado não pode ser negativo'
  }

  // 3. Percentuais individuais 0-100
  const erroCheia = validarPercentualInline(dados.perfilInsumosAliquotaCheia, 'Alíquota cheia')
  if (erroCheia) errosCampos.perfilInsumosAliquotaCheia = erroCheia

  const erroMono = validarPercentualInline(dados.perfilInsumosMonofasicos, 'Insumos monofásicos')
  if (erroMono) errosCampos.perfilInsumosMonofasicos = erroMono

  const erroReduz = validarPercentualInline(
    dados.perfilInsumosAliquotaReduzida,
    'Alíquota reduzida',
  )
  if (erroReduz) errosCampos.perfilInsumosAliquotaReduzida = erroReduz

  const erroComprasSemCred = validarPercentualInline(
    dados.percentualComprasSemCredito,
    'Compras sem crédito',
  )
  if (erroComprasSemCred) errosCampos.percentualComprasSemCredito = erroComprasSemCred

  const erroVendasInter = validarPercentualInline(
    dados.percentualVendasInterestaduais,
    'Vendas interestaduais',
  )
  if (erroVendasInter) errosCampos.percentualVendasInterestaduais = erroVendasInter

  if (dados.perfilRetencaoSplit === 'parcial') {
    const erroSplit = validarPercentualInline(dados.percentualRetencaoSplit, 'Retenção de split')
    if (erroSplit) errosCampos.percentualRetencaoSplit = erroSplit
  }

  // 4. Coerência do Perfil de Insumos (Fase 1)
  const cheia = Number(dados.perfilInsumosAliquotaCheia ?? 0)
  const mono = Number(dados.perfilInsumosMonofasicos ?? 0)
  const reduz = Number(dados.perfilInsumosAliquotaReduzida ?? 0)
  const somaInsumos = Math.round((cheia + mono + reduz) * 100) / 100

  // Se o usuário preencheu e a soma não for 100
  const insumosPreenchidos = cheia > 0 || mono > 0 || reduz > 0
  if (insumosPreenchidos && somaInsumos !== 100) {
    avisosCoerencia.push({
      id: 'perfil_insumos_soma',
      campo: 'perfilInsumos',
      titulo: 'Soma do Perfil de Insumos divergente',
      mensagem: `A soma das 3 faixas de insumos está em ${somaInsumos.toFixed(1)}%. O ideal para a Calculadora e Diagnóstico é fechar exatamente em 100%.`,
      tipo: 'aviso',
    })
  }

  // 5. Coerência de Monofásicos: marcado como 'sim' mas sem categorias
  if (
    dados.presencaMonofasicos &&
    (!dados.categoriasMonofasicos || dados.categoriasMonofasicos.length === 0)
  ) {
    avisosCoerencia.push({
      id: 'monofasicos_sem_categoria',
      campo: 'categoriasMonofasicos',
      titulo: 'Produtos monofásicos sem categoria indicada',
      mensagem:
        'A presença de monofásicos está marcada como ativa, porém nenhuma categoria de produto (combustíveis, bebidas, medicamentos, etc.) foi selecionada.',
      tipo: 'aviso',
    })
  }

  // 6. Coerência de Retenção Split Payment (Fase 2)
  if (dados.perfilRetencaoSplit === 'parcial') {
    const pctSplit = dados.percentualRetencaoSplit ?? 0
    if (pctSplit <= 0 || pctSplit > 100) {
      avisosCoerencia.push({
        id: 'split_parcial_sem_percentual',
        campo: 'percentualRetencaoSplit',
        titulo: 'Split Payment parcial requer percentual estimado',
        mensagem:
          'O perfil de retenção foi configurado como parcial, mas o percentual está zerado ou fora da faixa de 1% a 99%.',
        tipo: 'aviso',
      })
    }
  }

  // 7. Coerência de Vendas Interestaduais + Exportação
  const pctInterestadual = Number(dados.percentualVendasInterestaduais || 0)
  const pctExportacao = Number(dados.percentualExportacao || 0)
  if (pctInterestadual + pctExportacao > 100) {
    avisosCoerencia.push({
      id: 'interestadual_exportacao_excedente',
      campo: 'percentualVendasInterestaduais',
      titulo: 'Soma de interestadual e exportação excede 100%',
      mensagem: `A soma de vendas interestaduais (${pctInterestadual}%) com exportação (${pctExportacao}%) totaliza ${pctInterestadual + pctExportacao}%, excedendo 100% do faturamento.`,
      tipo: 'aviso',
    })
  }

  // 8. Coerência Multi-UF x Número de Filiais / Estabelecimentos (Fase 3)
  const totalUfsOperacao = dados.ufsOperacao ? dados.ufsOperacao.length : 0
  const filiaisCadastradas = Number(dados.numeroFiliais || 1)
  if (totalUfsOperacao > 0 && filiaisCadastradas <= 1) {
    avisosCoerencia.push({
      id: 'multi_uf_sem_filiais',
      campo: 'numeroFiliais',
      titulo: 'Operação Multi-UF com apenas 1 estabelecimento',
      mensagem: `Foram selecionadas ${totalUfsOperacao} UFs adicionais de operação, mas o cadastro consta apenas ${filiaisCadastradas} estabelecimento. Recomenda-se registrar ao menos 1 filial por UF de operação para cálculo correto de DIFAL e domicílio fiscal.`,
      tipo: 'aviso',
    })
  }

  const totalErros = Object.keys(errosCampos).length
  const totalAvisos = avisosCoerencia.length
  const totalPendencias = totalErros + totalAvisos

  return {
    errosCampos,
    avisosCoerencia,
    totalErros,
    totalAvisos,
    totalPendencias,
    temErrosBloqueantes: totalErros > 0,
  }
}
