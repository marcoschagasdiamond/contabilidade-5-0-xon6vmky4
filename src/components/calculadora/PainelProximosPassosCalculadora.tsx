import React from 'react'

export type ModuloCalculadoraId =
  | 'modulo1'
  | 'modulo2'
  | 'modulo3'
  | 'modulo4'
  | 'modulo5'
  | 'modulo6'
  | 'desoneracao'

export interface BotaoProximoPasso {
  label: string
  moduloId: ModuloCalculadoraId
  destaque?: boolean
  subtitulo?: string
}

export interface PainelProximosPassosCalculadoraProps {
  /** Identificador do módulo onde o painel está inserido */
  moduloAtual: ModuloCalculadoraId
  /** Callback para navegar entre módulos na Calculadora */
  onNavegarModulo: (moduloId: ModuloCalculadoraId) => void
  /**
   * Status de preenchimento dos campos essenciais do Módulo 1:
   * faturamento > 0, ano da transição definido e regime atual selecionado
   */
  configuracoesPreenchidas?: boolean
  /** Lista dos campos faltantes quando incompleto */
  camposFaltantes?: string[]
}

/**
 * Painel "Próximos Passos" para orientar usuários novos na Calculadora IBS/CBS.
 * Padrão Diamond Group: Navy (#07132B) e Dourado (#D4AF37), SEM ÍCONES (regra estrita).
 */
export function PainelProximosPassosCalculadora({
  moduloAtual,
  onNavegarModulo,
  configuracoesPreenchidas = true,
  camposFaltantes = [],
}: PainelProximosPassosCalculadoraProps) {
  // Configuração por módulo atual
  const ehModulo1 = moduloAtual === 'modulo1'

  // Caso específico do Módulo 1 (Configurações)
  if (ehModulo1) {
    if (!configuracoesPreenchidas) {
      // Estado INCOMPLETO do Módulo 1
      return (
        <div
          role="region"
          aria-label="Próximos Passos - Campos Pendentes"
          className="mt-10 p-6 sm:p-7 rounded-2xl bg-[#07132B] text-white border-2 border-amber-500/60 shadow-xl relative overflow-hidden"
        >
          <div
            className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative z-10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  Próximos Passos • Configurações Pendentes
                </span>
                <h3 className="text-lg sm:text-xl font-heading font-black text-white">
                  Preencha os Campos Essenciais para Liberar a Análise
                </h3>
              </div>
              <span className="text-xs text-amber-300 font-semibold self-start sm:self-auto">
                Módulo 1 • Base do Motor Fiscal
              </span>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed max-w-3xl">
              Para calcular o impacto da CBS e do IBS e desbloquear a comparação de regimes em tempo
              real, é necessário preencher os campos essenciais abaixo neste Módulo 1:
            </p>

            {camposFaltantes.length > 0 && (
              <div className="p-4 rounded-xl bg-white/5 border border-amber-500/30 space-y-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wide block">
                  O que falta preencher:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-200 list-disc pl-5">
                  {camposFaltantes.map((campo, index) => (
                    <li key={index} className="leading-relaxed">
                      <strong className="text-white">{campo}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-slate-400 leading-relaxed">
              Dica: Role para cima e preencha os parâmetros acima (ou clique em &ldquo;Restaurar
              Padrões Oficiais&rdquo; no topo deste módulo para carregar valores de referência).
            </p>
          </div>
        </div>
      )
    }

    // Estado COMPLETO do Módulo 1 (ordem solicitada exata):
    // 1. "Ir para a Calculadora Simples" (destaque)
    // 2. "Comparativo de Regimes"
    // 3. "Split Payment & Créditos"
    // 4. "Dashboard & Assistente"
    const botoesM1: BotaoProximoPasso[] = [
      {
        label: 'Ir para a Calculadora Simples',
        moduloId: 'modulo2',
        destaque: true,
        subtitulo: 'Apurar operação unitária e emissão da nota fiscal',
      },
      {
        label: 'Comparativo de Regimes',
        moduloId: 'modulo3',
        destaque: false,
        subtitulo: 'Lucro Real, Presumido, Simples e IVA Dual',
      },
      {
        label: 'Split Payment & Créditos',
        moduloId: 'modulo4',
        destaque: false,
        subtitulo: 'Simulador de créditos das 18 categorias e fluxo de caixa',
      },
      {
        label: 'Dashboard & Assistente',
        moduloId: 'modulo6',
        destaque: false,
        subtitulo: 'KPIs consolidados, cronograma e agente tributário',
      },
    ]

    return (
      <div
        role="region"
        aria-label="Próximos Passos da Calculadora"
        className="mt-10 p-6 sm:p-7 rounded-2xl bg-[#07132B] text-white border-2 border-[#D4AF37] shadow-xl relative overflow-hidden"
      >
        <div
          className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 w-64 h-64 bg-[#2ECC71]/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-mono">
                Próximos Passos • Guia da Calculadora
              </span>
              <h3 className="text-lg sm:text-xl font-heading font-black text-white">
                Configurações Preenchidas com Sucesso
              </h3>
            </div>
            <span className="text-xs text-emerald-400 font-semibold self-start sm:self-auto font-mono">
              Módulo 1 Concluído • Parâmetros Propagados
            </span>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed max-w-3xl">
            Seus dados essenciais de faturamento, ano da transição e regime tributário já foram
            propagados para toda a calculadora. Escolha abaixo o próximo passo da sua análise:
          </p>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {botoesM1.map((btn) => (
              <button
                key={btn.moduloId}
                type="button"
                onClick={() => onNavegarModulo(btn.moduloId)}
                className={`p-3.5 rounded-xl font-heading font-black text-xs text-left transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between gap-1.5 border shadow-md ${
                  btn.destaque
                    ? 'bg-[#D4AF37] text-[#07132B] border-[#D4AF37] hover:bg-[#c49f2e]'
                    : 'bg-[#0D1D3A] text-white border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#122448]'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="block text-[11px] font-mono uppercase tracking-wider opacity-75">
                    {btn.destaque ? 'Recomendado' : 'Módulo'}
                  </span>
                  <span className="block text-xs sm:text-sm font-extrabold leading-tight">
                    {btn.label}
                  </span>
                </div>
                {btn.subtitulo && (
                  <span
                    className={`block text-[10px] leading-tight mt-1 font-normal ${
                      btn.destaque ? 'text-[#07132B]/85' : 'text-slate-300'
                    }`}
                  >
                    {btn.subtitulo}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Demais módulos (2, 3, 4, 5, 6) com sequência contextual
  const sequenciaPorModulo: Record<
    Exclude<ModuloCalculadoraId, 'modulo1'>,
    {
      etapaConcluidaNumero: string
      etapaConcluidaNome: string
      proximaEtapaNome: string
      proximaEtapaDescricao: string
      botoes: BotaoProximoPasso[]
    }
  > = {
    modulo2: {
      etapaConcluidaNumero: '02',
      etapaConcluidaNome: 'Calculadora Simples',
      proximaEtapaNome: 'Comparativo de Regimes',
      proximaEtapaDescricao:
        'Você já apurou o imposto unitário por fora. O próximo passo da sequência é confrontar o impacto financeiro do Lucro Real, Presumido, Simples e IVA Dual.',
      botoes: [
        {
          label: 'Ir para o Comparativo de Regimes',
          moduloId: 'modulo3',
          destaque: true,
          subtitulo: 'Apurar IRPJ, CSLL, PIS, COFINS, ICMS, ISS e IVA Dual',
        },
        {
          label: 'Simulador de Créditos',
          moduloId: 'modulo4',
          destaque: false,
          subtitulo: 'Ver créditos das 18 categorias de insumos',
        },
        {
          label: 'Dashboard Executivo',
          moduloId: 'modulo6',
          destaque: false,
          subtitulo: 'Ver gráficos consolidados e assistente de IA',
        },
        {
          label: 'Revisar Configurações',
          moduloId: 'modulo1',
          destaque: false,
          subtitulo: 'Ajustar alíquotas e faturamento base',
        },
      ],
    },
    modulo3: {
      etapaConcluidaNumero: '03',
      etapaConcluidaNome: 'Comparativo de Regimes',
      proximaEtapaNome: 'Split Payment & Simulador de Créditos',
      proximaEtapaDescricao:
        'Comparativo de regimes concluído. O próximo passo é analisar como a não-cumulatividade irrestrita nas 18 categorias de despesas e a retenção do Split Payment impactam o caixa da sua empresa.',
      botoes: [
        {
          label: 'Ir para Split Payment & Créditos',
          moduloId: 'modulo4',
          destaque: true,
          subtitulo: 'Simular ganho de créditos nas 18 categorias de despesa',
        },
        {
          label: 'Cronograma da Transição',
          moduloId: 'modulo5',
          destaque: false,
          subtitulo: 'Curva de transição 2026-2033 ano a ano',
        },
        {
          label: 'Dashboard Executivo',
          moduloId: 'modulo6',
          destaque: false,
          subtitulo: 'Ver parecer técnico e indicadores finais',
        },
        {
          label: 'Calculadora Simples',
          moduloId: 'modulo2',
          destaque: false,
          subtitulo: 'Revisar apuração unitária da nota fiscal',
        },
      ],
    },
    modulo4: {
      etapaConcluidaNumero: '04',
      etapaConcluidaNome: 'Simulador de Créditos',
      proximaEtapaNome: 'Transição 2026-2033',
      proximaEtapaDescricao:
        'Créditos e Split Payment calculados. O próximo passo é acompanhar o cronograma gradual da transição constitucional (2026 a 2033) e estimar os anos críticos para o seu setor.',
      botoes: [
        {
          label: 'Ir para o Cronograma de Transição',
          moduloId: 'modulo5',
          destaque: true,
          subtitulo: 'Evolução ano a ano até a extinção de PIS, COFINS, ICMS e ISS',
        },
        {
          label: 'Dashboard Executivo',
          moduloId: 'modulo6',
          destaque: false,
          subtitulo: 'Consolidação executiva completa da simulação',
        },
        {
          label: 'Comparativo de Regimes',
          moduloId: 'modulo3',
          destaque: false,
          subtitulo: 'Revisar matriz comparativa entre os regimes',
        },
        {
          label: 'Configurações Base',
          moduloId: 'modulo1',
          destaque: false,
          subtitulo: 'Revisar alíquotas e faturamento do Módulo 1',
        },
      ],
    },
    modulo5: {
      etapaConcluidaNumero: '05',
      etapaConcluidaNome: 'Transição 2026-2033',
      proximaEtapaNome: 'Dashboard Executivo & Assistente',
      proximaEtapaDescricao:
        'Cronograma e curva de transição analisados. O próximo passo da esteira é o Dashboard Executivo, com todos os KPIs consolidados, gráficos comparativos e o Assistente Tributário de IA.',
      botoes: [
        {
          label: 'Ir para o Dashboard & Assistente',
          moduloId: 'modulo6',
          destaque: true,
          subtitulo: 'KPIs consolidados, dossiê em PDF e assistente de IA',
        },
        {
          label: 'Simulador de Créditos',
          moduloId: 'modulo4',
          destaque: false,
          subtitulo: 'Revisar despesas e insumos creditáveis',
        },
        {
          label: 'Comparativo de Regimes',
          moduloId: 'modulo3',
          destaque: false,
          subtitulo: 'Revisar economia entre regimes tributários',
        },
        {
          label: 'Calculadora Simples',
          moduloId: 'modulo2',
          destaque: false,
          subtitulo: 'Revisar cálculo de saída da nota fiscal',
        },
      ],
    },
    modulo6: {
      etapaConcluidaNumero: '06',
      etapaConcluidaNome: 'Dashboard Executivo',
      proximaEtapaNome: 'Simulação de Desoneração (Folha & Exportação)',
      proximaEtapaDescricao:
        'Você concluiu os módulos centrais da Calculadora IBS/CBS. O próximo passo é simular as desonerações da Folha de Pagamento (CPRB) e Imunidade de Exportação de Serviços (LC 214/2025 art. 46).',
      botoes: [
        {
          label: 'Simulação de Desoneração',
          moduloId: 'desoneracao',
          destaque: true,
          subtitulo: 'Folha de pagamento (CPRB) e imunidade na exportação',
        },
        {
          label: 'Revisar Configurações (Módulo 1)',
          moduloId: 'modulo1',
          destaque: false,
          subtitulo: 'Alterar faturamento, ano de transição ou regime atual',
        },
        {
          label: 'Comparativo de Regimes (Módulo 3)',
          moduloId: 'modulo3',
          destaque: false,
          subtitulo: 'Revisar margens, presunção e alíquotas por regime',
        },
        {
          label: 'Transição 2026-2033 (Módulo 5)',
          moduloId: 'modulo5',
          destaque: false,
          subtitulo: 'Curva de transição e estoque de transição',
        },
      ],
    },
    desoneracao: {
      etapaConcluidaNumero: '★',
      etapaConcluidaNome: 'Simulação de Desoneração',
      proximaEtapaNome: 'Dashboard Executivo & Conclusão',
      proximaEtapaDescricao:
        'Simulações de CPRB e imunidade de exportação concluídas. Agora você pode emitir o dossiê oficial em PDF, salvar esta simulação ou revisar os regimes e créditos.',
      botoes: [
        {
          label: 'Dashboard Executivo',
          moduloId: 'modulo6',
          destaque: true,
          subtitulo: 'Ver gráficos consolidados e assistente de IA',
        },
        {
          label: 'Comparativo de Regimes',
          moduloId: 'modulo3',
          destaque: false,
          subtitulo: 'Revisar impacto no Simples, Presumido e Real',
        },
        {
          label: 'Cronograma da Transição',
          moduloId: 'modulo5',
          destaque: false,
          subtitulo: 'Acompanhar alíquotas de 2026 a 2033',
        },
        {
          label: 'Revisar Configurações',
          moduloId: 'modulo1',
          destaque: false,
          subtitulo: 'Ajustar parâmetros de faturamento e setor',
        },
      ],
    },
  }

  const infoAtual = sequenciaPorModulo[moduloAtual as Exclude<ModuloCalculadoraId, 'modulo1'>]

  return (
    <div
      role="region"
      aria-label="Próximos Passos da Calculadora"
      className="mt-10 p-6 sm:p-7 rounded-2xl bg-[#07132B] text-white border-2 border-[#D4AF37] shadow-xl relative overflow-hidden"
    >
      <div
        className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-64 h-64 bg-[#2ECC71]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-mono">
              Próximos Passos • Sequência da Calculadora
            </span>
            <h3 className="text-lg sm:text-xl font-heading font-black text-white">
              Próximo Passo: {infoAtual.proximaEtapaNome}
            </h3>
          </div>
          <span className="text-xs text-slate-300 font-semibold self-start sm:self-auto font-mono">
            Módulo {infoAtual.etapaConcluidaNumero} Concluído
          </span>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed max-w-3xl">
          {infoAtual.proximaEtapaDescricao}
        </p>

        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {infoAtual.botoes.map((btn) => (
            <button
              key={btn.moduloId}
              type="button"
              onClick={() => onNavegarModulo(btn.moduloId)}
              className={`p-3.5 rounded-xl font-heading font-black text-xs text-left transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between gap-1.5 border shadow-md ${
                btn.destaque
                  ? 'bg-[#D4AF37] text-[#07132B] border-[#D4AF37] hover:bg-[#c49f2e]'
                  : 'bg-[#0D1D3A] text-white border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#122448]'
              }`}
            >
              <div className="space-y-0.5">
                <span className="block text-[11px] font-mono uppercase tracking-wider opacity-75">
                  {btn.destaque ? 'Recomendado' : 'Navegar'}
                </span>
                <span className="block text-xs sm:text-sm font-extrabold leading-tight">
                  {btn.label}
                </span>
              </div>
              {btn.subtitulo && (
                <span
                  className={`block text-[10px] leading-tight mt-1 font-normal ${
                    btn.destaque ? 'text-[#07132B]/85' : 'text-slate-300'
                  }`}
                >
                  {btn.subtitulo}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
