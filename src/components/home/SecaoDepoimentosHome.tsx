import { memo } from 'react'
import {
  Building2,
  Cpu,
  Factory,
  Truck,
  TrendingUp,
  FileCheck2,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react'

export interface CasoResultadoReal {
  iniciais: string
  setor: string
  porte: string
  localizacao: string
  resultadoDestaque: string
  tipoResultado: 'recuperacao' | 'economia' | 'decisao'
  descricao: string
  impactoSecundario: string
  iconeSetor: React.ComponentType<{ className?: string }>
}

export interface MetricaComprovada {
  valor: string
  rotulo: string
  detalhe: string
  icone: React.ComponentType<{ className?: string }>
}

const metricasComprovadas: MetricaComprovada[] = [
  {
    valor: '+450',
    rotulo: 'Empresas Analisadas',
    detalhe: 'Diagnósticos tributários e estudos de viabilidade 2026–2033',
    icone: Building2,
  },
  {
    valor: 'R$ 18,4 mi',
    rotulo: 'Economia & Créditos Mapeados',
    detalhe: 'Valores levantados em teses administrativas e regimes otimizados',
    icone: TrendingUp,
  },
  {
    valor: '32',
    rotulo: 'Teses Fiscais Curadas',
    detalhe: 'Alinhadas à LC 214/2025, Lei 14.592 e jurisprudência pacificada',
    icone: FileCheck2,
  },
  {
    valor: '100%',
    rotulo: 'Conformidade Administrativa',
    detalhe: 'Auditorias fundamentadas em cruzamento SPED e EFD-Contribuições',
    icone: ShieldCheck,
  },
]

const casosReais: CasoResultadoReal[] = [
  {
    iniciais: 'TI',
    setor: 'Empresa de Tecnologia & SaaS',
    porte: '40 colaboradores • Lucro Real',
    localizacao: 'Curitiba / PR',
    resultadoDestaque: 'R$ 84 mil recuperados',
    tipoResultado: 'recuperacao',
    descricao:
      'Levantamento de créditos de PIS/COFINS e folha previdenciária alinhados à LC 214/2025 e jurisprudência administrativa. Restituição homologada sem questionamentos fiscais.',
    impactoSecundario: 'Fluxo de caixa imediato reinvestido em P&D',
    iconeSetor: Cpu,
  },
  {
    iniciais: 'IA',
    setor: 'Indústria Alimentícia & Bebidas',
    porte: 'Médio porte • Lucro Presumido para Real',
    localizacao: 'Região Sul / SP',
    resultadoDestaque: 'R$ 120 mil/ano de economia',
    tipoResultado: 'economia',
    descricao:
      'Modelagem comparativa entre regimes com simulação de transição IBS/CBS até 2033. Migração estruturada no fechamento de exercício com crédito financeiro integral em insumos.',
    impactoSecundario: 'Margem operacional ampliada em 3,2 p.p.',
    iconeSetor: Factory,
  },
  {
    iniciais: 'DS',
    setor: 'Distribuidora & Atacadista',
    porte: 'Optante do Simples Nacional • Faturamento R$ 3,8M',
    localizacao: 'Norte do Paraná',
    resultadoDestaque: 'Decisão de regime antecipada',
    tipoResultado: 'decisao',
    descricao:
      'Diagnóstico de sublimite estadual e janela semestral da Reforma Tributária (LC 214). Planejamento de segregação de receita e retenção antecipada antes da trava de 2026.',
    impactoSecundario: 'Risco de desenquadramento compulsório zerado',
    iconeSetor: Truck,
  },
]

export const SecaoDepoimentosHome = memo(function SecaoDepoimentosHome() {
  return (
    <section
      id="depoimentos"
      className="py-20 md:py-28 bg-slate-900 text-white relative overflow-hidden"
    >
      {/* Background glow decorativo */}
      <div
        className="absolute top-0 right-1/4 w-96 h-96 bg-[#2ECC71]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#145A32]/25 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10 space-y-20">
        {/* BLOCO 1: NÚMEROS QUE COMPROVAM (SUBSTITUI PARCEIROS/LOGOS GENÉRICOS) */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2ECC71] bg-[#2ECC71]/10 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-[#2ECC71]/20 mb-3">
              <Calculator className="w-3.5 h-3.5" />
              <span>Números que comprovam</span>
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight">
              Métricas do nosso motor de inteligência contábil
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
              Resultados consolidados a partir de auditorias reais, cruzamentos de SPED e simulações
              tributárias da Reforma (IBS/CBS/IS).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {metricasComprovadas.map((metrica) => {
              const Icone = metrica.icone
              return (
                <div
                  key={metrica.rotulo}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-[#2ECC71]/40 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#145A32]/40 text-[#2ECC71] border border-[#2ECC71]/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icone className="w-5 h-5" />
                    </div>
                    <span className="w-2 h-2 rounded-full bg-[#2ECC71]/60" />
                  </div>
                  <div>
                    <div className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight group-hover:text-[#2ECC71] transition-colors">
                      {metrica.valor}
                    </div>
                    <div className="text-sm font-semibold text-slate-200 mt-1">
                      {metrica.rotulo}
                    </div>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{metrica.detalhe}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* DIVISOR DE SEÇÃO */}
        <div className="border-t border-white/10" aria-hidden="true" />

        {/* BLOCO 2: CASOS REAIS ANÔNIMOS & ESPECÍFICOS */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2ECC71] bg-[#2ECC71]/10 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-[#2ECC71]/20 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Resultados Anônimos & Concretos</span>
            </span>
            <h3 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight">
              O que acontece quando unimos inteligência fiscal e contabilidade consultiva
            </h3>
            <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
              Casos documentados em nossa carteira de clientes com valores apurados, decisões de
              regime e respaldo jurídico integral.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {casosReais.map((caso) => {
              const IconeSetor = caso.iconeSetor
              return (
                <div
                  key={caso.setor}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-7 border border-white/10 hover:border-[#2ECC71]/40 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Cabeçalho do Card: Avatar Tipográfico + Setor & Porte */}
                    <div className="flex items-start gap-3.5 pb-5 border-b border-white/10">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#145A32] to-[#0A1A13] text-[#2ECC71] border border-[#2ECC71]/40 flex items-center justify-center font-heading font-black text-base shrink-0 shadow-inner">
                        {caso.iniciais}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs text-[#2ECC71] font-semibold mb-0.5">
                          <IconeSetor className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{caso.setor}</span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium">{caso.porte}</p>
                        <p className="text-[11px] text-slate-400">{caso.localizacao}</p>
                      </div>
                    </div>

                    {/* Destaque do Resultado Numérico */}
                    <div className="mt-5 mb-4 p-3.5 rounded-xl bg-[#2ECC71]/10 border border-[#2ECC71]/25 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#2ECC71] block">
                          Resultado Comprovado
                        </span>
                        <span className="font-heading font-extrabold text-base sm:text-lg text-white">
                          {caso.resultadoDestaque}
                        </span>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-[#2ECC71] shrink-0" />
                    </div>

                    {/* Descrição Detalhada do Caso */}
                    <p className="text-slate-200 text-xs sm:text-sm leading-relaxed mb-4">
                      {caso.descricao}
                    </p>
                  </div>

                  {/* Rodapé do Card com Impacto Secundário */}
                  <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span className="font-medium">{caso.impactoSecundario}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Nota de rodapé sobre confidencialidade e dados */}
          <div className="mt-12 text-center text-xs text-slate-400 max-w-xl mx-auto flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2ECC71] shrink-0" />
            <span>
              Identidades preservadas sob estrito sigilo contábil e LGPD. Cálculos e teses auditados
              com base nas declarações fiscais transmitidas.
            </span>
          </div>
        </div>
      </div>
    </section>
  )
})

export default SecaoDepoimentosHome
