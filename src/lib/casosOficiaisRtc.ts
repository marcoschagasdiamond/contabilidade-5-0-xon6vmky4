import { calcularResultadosSimulacao } from '@/lib/calculoSimulacaoIbsCbs'
import type { ParametrosSimulacaoCalculadora } from '@/types/simulacaoCalculadora'
import {
  CONFIGURACOES_PADRAO,
  type AnoTransicaoIbsCbs,
  type ConfiguracoesGerais,
} from '@/types/calculadoraIbsCbs'
import { TABELA_CURADA_NCM } from '@/data/tabelaNcmLc214'

/**
 * Casos-oficiais do exemplos.md — Calculadora RTC Regime Regular v1.6.1, Receita Federal (MIT)
 * (github.com/ReceitaFederal/calculadora-rtc-regime-regular)
 *
 * Os 4 casos abaixo rodam a lógica de cálculo EXISTENTE da Calculadora IBS/CBS deste
 * sistema via `calcularResultadosSimulacao` — o mesmo caminho usado pela tela.
 * NENHUMA fórmula foi alterada: divergência é destacada em vermelho na /validacao-rtc
 * (pode ser achado fiscal real, ex. diferença de vigência/ano — não é bug da página).
 */

export interface ItemConferenciaRtc {
  rotulo: string
  esperadoOficial: number
  obtidoNosso: number
  bate: boolean
}

export interface CasoOficialRtc {
  numero: number
  titulo: string
  descricao: string
  codigo: string // NCM ou NBS
  cClassTrib: string
  baseCalculo: number
  itens: ItemConferenciaRtc[]
  bate: boolean
  memoriaOficial: string[]
  memoriaNosso: string[]
}

// Fase de transição referencial dos casos oficiais (dhFatoGerador 2027-03-10):
// alíquotas nominais informadas na operação: CBS 8.8 | IBS UF 0.05 | IBS Mun 0.05 → IBS total 0.1
export const FASE_CASOS = {
  anoOperacao: 2027 as Exclude<AnoTransicaoIbsCbs, 'atual'>,
  cbsPadrao: 8.8,
  ibsPadrao: 0.1,
  totalIvaDual: 8.9,
}

const CONFIG_BASE: ConfiguracoesGerais = {
  ...CONFIGURACOES_PADRAO,
  anoTransicao: FASE_CASOS.anoOperacao,
  cbsPadrao: FASE_CASOS.cbsPadrao,
  ibsPadrao: FASE_CASOS.ibsPadrao,
  totalIvaDual: FASE_CASOS.totalIvaDual,
}

function baseParametros(): ParametrosSimulacaoCalculadora {
  return {
    config: { ...CONFIG_BASE },
    valorOperacao: 0,
    regimeOperacao: 'padrao',
    percentualComprasVendasSimples: 0,
    percentualComprasVendasComparativo: 0,
    faturamentoMensal: 0,
    tipoAtividade: 'servico',
    subatividadeServico: 'servico_comum',
    subatividadeIndustria: 'industria_comum',
    subatividadeComercio: 'varejo_comum',
    aliquotaImpostoSeletivo: 10,
    proporcaoServicoMisto: 50,
    folhaPagamentoMensal: 0,
    margemLucroEstimada: 20,
    despesasComCreditosMensais: 0,
    percentualExportacao: 0,
    ufOrigem: 'SP',
    despesasCreditos: [],
    faturamentoAnualProjetado: 0,
    setorTransicao: 'servico',
    periodoDashboard: 'mensal',
    regimeAtualFiltro: 'Lucro Presumido',
    anoOperacao: FASE_CASOS.anoOperacao,
  }
}

const r2 = (v: number) => Math.round(v * 100) / 100
const bate2 = (a: number, b: number) => r2(a) === r2(b)

/** Executa os 4 casos-oficiais usando a calculadora existente. */
export function executarCasosOficiaisRtc(): CasoOficialRtc[] {
  return [caso1(), caso2(), caso3(), caso4()]
}

// ----------------------------------------------------------------------------
// CASO 1 — Arroz: NCM 10063021, cClassTrib 200003, redução 100% (cesta básica), base 100
// Oficial: alíquota zero → vIBS 0.00 e vCBS 0.00
// ----------------------------------------------------------------------------
function caso1(): CasoOficialRtc {
  const parametros: ParametrosSimulacaoCalculadora = {
    ...baseParametros(),
    valorOperacao: 100,
    tipoAtividade: 'comercio',
    regimeOperacao: 'cesta_basica_nacional',
  }
  const r = calcularResultadosSimulacao(parametros).resultadoSimples

  const itens: ItemConferenciaRtc[] = [
    { rotulo: 'vCBS', esperadoOficial: 0, obtidoNosso: r.debitoCbs, bate: bate2(r.debitoCbs, 0) },
    {
      rotulo: 'vIBS (UF+Mun)',
      esperadoOficial: 0,
      obtidoNosso: r.debitoIbs,
      bate: bate2(r.debitoIbs, 0),
    },
  ]

  return {
    numero: 1,
    titulo: 'Arroz — Cesta Básica Nacional (redução 100%)',
    descricao: 'NCM 10063021 · cClassTrib 200003 · base de cálculo R$ 100,00',
    codigo: '10063021',
    cClassTrib: '200003',
    baseCalculo: 100,
    itens,
    bate: itens.every((i) => i.bate),
    memoriaOficial: [
      'pRedAliq 100,00% → pAliqEfet CBS 0,00% e IBS 0,00% (arts. 8º, 129 e 146 LC 214/2025)',
      'vIBS 0.00 · vCBS 0.00',
    ],
    memoriaNosso: [
      `aliquotaCbsAplicada ${r.aliquotaCbsAplicada}% · aliquotaIbsAplicada ${r.aliquotaIbsAplicada}%`,
      `vCBS ${r.debitoCbs.toFixed(2)} · vIBS ${r.debitoIbs.toFixed(2)}`,
    ],
  }
}

// ----------------------------------------------------------------------------
// CASO 2 — Cerveja: NCM 22030000, cClassTrib 000001, com Imposto Seletivo
// Oficial: vIS 15.00 (base IS 150 × adValorem 10%); base IBS/CBS = 150 + 15 = 165
//          vCBS 165 × 8.8% = 14.52 · vIBSUF 165 × 0.05% = 0.0825 → 0.08 · vIBSMun 0.08 → vIBS 0.16
// No nosso motor, o IS é apurado no caminho do Módulo 3 (comparativo), sobre o
// faturamento interno tributável. Passamos faturamentoMensal = 150 (a base do IS)
// com subatividade produto_imposto_seletivo e alíquota IS 10% → esperamos 15.00.
// A base IBS/CBS do caso (165) vai no Módulo 2 (valorOperacao) → vCBS 14.52 e vIBS 0.16.
// ----------------------------------------------------------------------------
function caso2(): CasoOficialRtc {
  const parametros: ParametrosSimulacaoCalculadora = {
    ...baseParametros(),
    valorOperacao: 165,
    faturamentoMensal: 150,
    tipoAtividade: 'industria',
    subatividadeIndustria: 'produto_imposto_seletivo',
    regimeOperacao: 'padrao',
  }
  const resultado = calcularResultadosSimulacao(parametros)
  const r = resultado.resultadoSimples
  const isComparativo = resultado.resultadoComparativo.ibsCbs.impostoSeletivo

  const vIbsOficial = 0.16
  const vCbsOficial = 14.52
  const vIsOficial = 15

  const itens: ItemConferenciaRtc[] = [
    {
      rotulo: 'vIS',
      esperadoOficial: vIsOficial,
      obtidoNosso: isComparativo,
      bate: bate2(isComparativo, vIsOficial),
    },
    {
      rotulo: 'vCBS',
      esperadoOficial: vCbsOficial,
      obtidoNosso: r.debitoCbs,
      bate: bate2(r.debitoCbs, vCbsOficial),
    },
    {
      rotulo: 'vIBS (UF+Mun)',
      esperadoOficial: vIbsOficial,
      obtidoNosso: r.debitoIbs,
      bate: bate2(r.debitoIbs, vIbsOficial),
    },
  ]

  return {
    numero: 2,
    titulo: 'Cerveja — com Imposto Seletivo',
    descricao:
      'NCM 22030000 · cClassTrib 000001 · base do IS R$ 150,00 · impostoInformado R$ 15,00 · base IBS/CBS = base IS + IS = R$ 165,00',
    codigo: '22030000',
    cClassTrib: '000001',
    baseCalculo: 165,
    itens,
    bate: itens.every((i) => i.bate),
    memoriaOficial: [
      'vIS = 150 × adValorem 10% = 15.00',
      'gIBSUF: pAliqEfet 0.05 → vIBSUF 0.08 · gIBSMun: 0.08 → vIBS 0.16',
      'gCBS: pCBS 8.8 → vCBS = 165 × 8.8% = 14.52',
    ],
    memoriaNosso: [
      `IS (comparativo, faturamento interno 150 × 10%): R$ ${isComparativo.toFixed(2)}`,
      `aliquotaCbsAplicada ${r.aliquotaCbsAplicada}% → vCBS ${r.debitoCbs.toFixed(2)}`,
      `aliquotaIbsAplicada ${r.aliquotaIbsAplicada}% → vIBS ${r.debitoIbs.toFixed(2)}`,
    ],
  }
}

// ----------------------------------------------------------------------------
// CASO 3 — Educação: NBS 122011200, cClassTrib 200028, redução 60%, base 1200
// Oficial: vIBS 0.48 (0.24 UF + 0.24 Mun) e vCBS 42.24
// ----------------------------------------------------------------------------
function caso3(): CasoOficialRtc {
  const parametros: ParametrosSimulacaoCalculadora = {
    ...baseParametros(),
    valorOperacao: 1200,
    tipoAtividade: 'servico',
    subatividadeServico: 'saude_educacao',
    regimeOperacao: 'educacao_ensino',
  }
  const r = calcularResultadosSimulacao(parametros).resultadoSimples

  const vIbsOficial = 0.48
  const vCbsOficial = 42.24

  const itens: ItemConferenciaRtc[] = [
    {
      rotulo: 'vIBS (UF+Mun)',
      esperadoOficial: vIbsOficial,
      obtidoNosso: r.debitoIbs,
      bate: bate2(r.debitoIbs, vIbsOficial),
    },
    {
      rotulo: 'vCBS',
      esperadoOficial: vCbsOficial,
      obtidoNosso: r.debitoCbs,
      bate: bate2(r.debitoCbs, vCbsOficial),
    },
  ]

  return {
    numero: 3,
    titulo: 'Educação — Redução de 60%',
    descricao: 'NBS 122011200 · cClassTrib 200028 · base de cálculo R$ 1.200,00 · redução 60%',
    codigo: '122011200',
    cClassTrib: '200028',
    baseCalculo: 1200,
    itens,
    bate: itens.every((i) => i.bate),
    memoriaOficial: [
      'gIBSUF: pRedAliq 60.00 → pAliqEfet 0.02 → vIBSUF 0.24 · gIBSMun: vIBSMun 0.24 → vIBS 0.48',
      'gCBS: pRedAliq 60.00 → pAliqEfet 3.52 → vCBS 42.24',
    ],
    memoriaNosso: [
      `aliquotaCbsAplicada ${r.aliquotaCbsAplicada}% → vCBS ${r.debitoCbs.toFixed(2)}`,
      `aliquotaIbsAplicada ${r.aliquotaIbsAplicada}% → vIBS ${r.debitoIbs.toFixed(2)}`,
    ],
  }
}

// ----------------------------------------------------------------------------
// CASO 4 — Verificação de consistência: NCM 02013000 NÃO vinculada ao cClassTrib 200035
// Oficial: estadoItem INCONSISTENCIA_ENTRADA com erro REG-011.
// Nossa base curada não faz vínculo NCM↔cClassTrib: batemos quando a NCM também não está
// vinculada na TABELA_CURADA_NCM (consistência esperada entre os dois lados).
// ----------------------------------------------------------------------------
function caso4(): CasoOficialRtc {
  const ncmNaBase = TABELA_CURADA_NCM.some((n) => n.codigoLimpo === '02013000')
  const esperadoOficial = 1 // 1 = oficial retorna INCONSISTENCIA_ENTRADA (REG-011)
  // Nosso lado: 1 = NCM também sem vínculo na base curada (consistente com o oficial)
  const nossoValor = ncmNaBase ? 0 : 1

  const itens: ItemConferenciaRtc[] = [
    {
      rotulo: 'NCM 02013000 sem vínculo com cClassTrib 200035 (REG-011)',
      esperadoOficial,
      obtidoNosso: nossoValor,
      bate: nossoValor === esperadoOficial,
    },
  ]

  return {
    numero: 4,
    titulo: 'Verificação de consistência — NCM não vinculada',
    descricao:
      'NCM 02013000 · cClassTrib 200035 · base de cálculo R$ 80,00 · oficial espera erro REG-011',
    codigo: '02013000',
    cClassTrib: '200035',
    baseCalculo: 80,
    itens,
    bate: itens.every((i) => i.bate),
    memoriaOficial: ['estadoItem INCONSISTENCIA_ENTRADA · erro REG-011 "NCM não vinculada"'],
    memoriaNosso: ncmNaBase
      ? ['TABELA_CURADA_NCM contém 02013000 — divergente da base oficial da RTC']
      : ['TABELA_CURADA_NCM não contém 02013000 — consistente com a base oficial da RTC'],
  }
}
