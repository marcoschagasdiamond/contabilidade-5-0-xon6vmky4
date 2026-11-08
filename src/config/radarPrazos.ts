/**
 * Configuração centralizada de prazos e prorrogações dos cards fixos do
 * Radar de Alertas da Legislação (/legislacao).
 *
 * Regras:
 * 1. Cards com prazo limite (`dataLimiteIso`): quando a data atual passa da data limite,
 *    o status é 'vencido'. Exibe tarja vermelha "Prazo Vencido" e o CTA muda para
 *    "Prazo encerrado — ver próximo passo".
 * 2. Prorrogação manual (`prorrogado: true` e `prorrogadoAte`): quando o flag estiver ativo,
 *    o status é 'prorrogado'. Exibe tarja azul "Prorrogado até DD/MM" e o CTA é reativado
 *    (retorna ao texto original da ação).
 * 3. Cards sem data de vencimento (`tipo: 'marco'`) representam vigências do tipo "a partir de"
 *    (ex.: Imposto Seletivo 2027 e Fase de Teste 2026). NUNCA exibem tarja de vencido.
 *    Podem exibir prorrogação caso no futuro uma normativa adie a vigência.
 * 4. Cards permanentes (`tipo: 'permanente'`), como Cancelamento de NF no IBS/CBS,
 *    nunca vencem por padrão (a menos que explicitamente configurada data limite).
 */

export type TipoCardRadarFixo = 'prazo' | 'marco' | 'permanente'

export type StatusPrazoCard = 'vigente' | 'vencido' | 'prorrogado'

export interface CardRadarPrazoConfig {
  id: string
  tituloIdentificador: string
  tipo: TipoCardRadarFixo
  /**
   * Data-limite no formato ISO YYYY-MM-DD (fim do dia local 23:59:59.999).
   * Opcional para cards do tipo 'marco' e 'permanente'.
   */
  dataLimiteIso?: string
  /**
   * Flag de prorrogação por normativa (alimentação manual pelo analista/admin).
   */
  prorrogado?: boolean
  /**
   * Rótulo de exibição da prorrogação, ex.: "15/12", "30/11", etc.
   * Usado na tarja: "Prorrogado até DD/MM".
   */
  prorrogadoAte?: string
  /**
   * CTA padrão quando vigente ou prorrogado.
   */
  ctaOriginal: string
  /**
   * Rota / link do CTA (mantido idêntico em qualquer status).
   */
  ctaHref: string
  /**
   * CTA quando o prazo expirar sem prorrogação.
   * Padrão pedido: "Prazo encerrado — ver próximo passo".
   */
  ctaVencido?: string
}

export interface EstadoPrazoCard {
  status: StatusPrazoCard
  tarjaTexto: string | null
  ctaTexto: string
  ctaHref: string
  isVencido: boolean
  isProrrogado: boolean
}

/**
 * Tabela mestra de prazos dos 5 cards fixos do Radar de Alertas da Legislação (/legislacao).
 */
export const CONFIG_CARDS_RADAR_FIXOS: Record<string, CardRadarPrazoConfig> = {
  // Card 0: Topo absoluto — Cancelamento de NF no IBS/CBS (Alerta permanente)
  cancelamentoNf: {
    id: 'cancelamentoNf',
    tituloIdentificador: 'Cancelamento de NF no IBS/CBS',
    tipo: 'permanente',
    prorrogado: false,
    prorrogadoAte: undefined,
    ctaOriginal: 'Conhecer o serviço →',
    ctaHref: '/servicos/cancelamento-nf-ibs-cbs',
    ctaVencido: 'Prazo encerrado — ver próximo passo',
  },

  // Card 1: Janela Simples Nacional 30/10 (efeito 1º sem/2027)
  // Data-limite fatal da primeira janela: 2026-10-30
  janelaSimples: {
    id: 'janelaSimples',
    tituloIdentificador: 'Janela de opção da regra híbrida do Simples Nacional',
    tipo: 'prazo',
    dataLimiteIso: '2026-10-30',
    prorrogado: false,
    prorrogadoAte: undefined,
    ctaOriginal: 'Analisar minha transição →',
    ctaHref: '/diagnostico-transicao',
    ctaVencido: 'Prazo encerrado — ver próximo passo',
  },

  // Card 2: Fase de teste 2026 do IBS/CBS (marco: vigência a partir de 2026)
  faseTeste2026: {
    id: 'faseTeste2026',
    tituloIdentificador: 'Fase de teste 2026 do IBS/CBS com alíquota zero',
    tipo: 'marco',
    prorrogado: false,
    prorrogadoAte: undefined,
    ctaOriginal: 'Testar na Calculadora →',
    ctaHref: '/calculadora-ibs-cbs',
    ctaVencido: 'Prazo encerrado — ver próximo passo',
  },

  // Card 3: Imposto Seletivo 2027 (marco: vigência a partir de 2027)
  impostoSeletivo: {
    id: 'impostoSeletivo',
    tituloIdentificador: 'Imposto Seletivo ("imposto do pecado") a partir de 2027',
    tipo: 'marco',
    prorrogado: false,
    prorrogadoAte: undefined,
    ctaOriginal: 'Ver Imposto Seletivo →',
    ctaHref: '/reforma-tributaria',
    ctaVencido: 'Prazo encerrado — ver próximo passo',
  },

  // Card 4: Crédito parcial Simples 2027 (vigência a partir de 2027, mas tem janela de adequação da cadeia)
  // Tratado como prazo para a virada de 2027 (2026-12-31) ou adaptável
  creditoParcialSimples: {
    id: 'creditoParcialSimples',
    tituloIdentificador: 'Crédito parcial de fornecedores do Simples Nacional em 2027',
    tipo: 'prazo',
    dataLimiteIso: '2026-12-31',
    prorrogado: false,
    prorrogadoAte: undefined,
    ctaOriginal: 'Calcular meu crédito →',
    ctaHref: '/calculadora-ibs-cbs',
    ctaVencido: 'Prazo encerrado — ver próximo passo',
  },
}

/**
 * Calcula o estado atual do prazo do card fixo com base na configuração e na data de referência.
 * Permite injetar `dataReferencia` para testes unitários determinísticos.
 */
export function calcularEstadoPrazoCard(
  config: CardRadarPrazoConfig,
  dataReferencia: Date = new Date(),
): EstadoPrazoCard {
  const ctaVencidoPadrao = config.ctaVencido || 'Prazo encerrado — ver próximo passo'

  // Regra 2: Prorrogação ativa por normativa sobrepõe qualquer vencimento
  if (config.prorrogado) {
    const textoAte = config.prorrogadoAte ? ` até ${config.prorrogadoAte}` : ''
    return {
      status: 'prorrogado',
      tarjaTexto: `Prorrogado${textoAte}`,
      ctaTexto: config.ctaOriginal,
      ctaHref: config.ctaHref,
      isVencido: false,
      isProrrogado: true,
    }
  }

  // Regra 4: Tipo 'marco' (ex.: Imposto Seletivo e Fase de teste 2026) e 'permanente'
  // sem data limite NUNCA exibem tarja de vencido.
  if (config.tipo === 'marco' || (config.tipo === 'permanente' && !config.dataLimiteIso)) {
    return {
      status: 'vigente',
      tarjaTexto: null,
      ctaTexto: config.ctaOriginal,
      ctaHref: config.ctaHref,
      isVencido: false,
      isProrrogado: false,
    }
  }

  // Se tiver dataLimiteIso, checar se a data de referência ultrapassou o fim do dia da data-limite
  if (config.dataLimiteIso) {
    // Parser tolerante para "YYYY-MM-DD": considerar final do dia da data-limite (23:59:59.999 local)
    const [anoStr, mesStr, diaStr] = config.dataLimiteIso.split('-')
    const ano = Number(anoStr)
    const mes = Number(mesStr) - 1
    const dia = Number(diaStr)

    const fimDoPrazo = new Date(ano, mes, dia, 23, 59, 59, 999)

    if (dataReferencia.getTime() > fimDoPrazo.getTime()) {
      return {
        status: 'vencido',
        tarjaTexto: 'Prazo Vencido',
        ctaTexto: ctaVencidoPadrao,
        ctaHref: config.ctaHref,
        isVencido: true,
        isProrrogado: false,
      }
    }
  }

  return {
    status: 'vigente',
    tarjaTexto: null,
    ctaTexto: config.ctaOriginal,
    ctaHref: config.ctaHref,
    isVencido: false,
    isProrrogado: false,
  }
}
