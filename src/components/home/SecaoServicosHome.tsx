import { memo } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Calculator,
  ShieldCheck,
  Building2,
  LineChart,
  Users,
  Briefcase,
  GraduationCap,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

export interface ServicoItem {
  icone: React.ComponentType<{ className?: string }>
  titulo: string
  descricao: string
  destaque?: string
  link?: string
}

const servicos: ServicoItem[] = [
  {
    icone: FileText,
    titulo: 'Contabilidade Consultiva',
    descricao:
      'Demonstrações financeiras mensais com relatórios executivos e indicadores estratégicos para tomada de decisão fundamentada.',
    link: '/servicos/contabilidade-digital',
  },
  {
    icone: Calculator,
    titulo: 'Planejamento Tributário',
    descricao:
      'Diagnóstico completo e comparativo entre regimes para reduzir a carga fiscal dentro da estrita legalidade.',
    destaque: 'Mais procurado',
    link: '/servicos/assessoria-tributaria',
  },
  {
    icone: ShieldCheck,
    titulo: 'Recuperação de Créditos',
    descricao:
      'Auditoria dos últimos 5 anos para identificar e restituir tributos recolhidos a maior na via administrativa.',
    destaque: 'Foco em caixa',
    link: '/servicos/negociacao-creditos-precatorios',
  },
  {
    icone: Building2,
    titulo: 'Abertura & Legalização',
    descricao:
      'Constituição rápida, alteração contratual e obtenção de todas as licenças e certidões necessárias para operar.',
    link: '/servicos/bpo-contabil',
  },
  {
    icone: LineChart,
    titulo: 'BPO Financeiro',
    descricao:
      'Gestão terceirizada do contas a pagar, contas a receber e conciliação bancária diária com visão em tempo real.',
    link: '/servicos/consultoria-financeira',
  },
  {
    icone: Users,
    titulo: 'Departamento Pessoal 100% Digital',
    descricao:
      'Folha de pagamento, eSocial, admissões, rescisões e gestão de benefícios com precisão e pontualidade.',
    link: '/servicos/departamento-pessoal',
  },
  {
    icone: Briefcase,
    titulo: 'Planejamento Sucessório',
    descricao:
      'Estruturação patrimonial e governança familiar para perpetuar o patrimônio com segurança jurídica e tributária.',
    link: '/servicos/planejamento-sucessorio',
  },
  {
    icone: GraduationCap,
    titulo: 'Treinamento & Capacitação',
    descricao:
      'Cursos executivos e workshops in company para capacitar lideranças em gestão fiscal, custos e governança.',
    link: '/servicos/treinamento-capacitacao',
  },
]

export const SecaoServicosHome = memo(function SecaoServicosHome() {
  return (
    <section id="servicos" className="py-20 md:py-28 bg-slate-50/70">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-[#2ECC71]/10 px-3 py-1.5 rounded-full inline-block mb-3">
            O que fazemos
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight">
            Soluções completas para cada fase do seu negócio
          </h2>
          <p className="mt-4 text-slate-600 text-base leading-relaxed">
            Combinamos inteligência contábil, rigor tributário e ferramentas digitais para otimizar
            a operação e a rentabilidade da sua empresa.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {servicos.map((servico) => {
            const Icone = servico.icone
            return (
              <div
                key={servico.titulo}
                className="group relative bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-[#2ECC71]/50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#145A32]/5 group-hover:bg-[#145A32] text-[#145A32] group-hover:text-[#2ECC71] flex items-center justify-center transition-colors">
                      <Icone className="w-6 h-6" />
                    </div>
                    {servico.destaque && (
                      <span className="text-[11px] font-semibold text-[#145A32] bg-[#2ECC71]/15 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#2ECC71]" />
                        {servico.destaque}
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-lg text-slate-900 mb-2 group-hover:text-[#145A32] transition-colors">
                    {servico.titulo}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">{servico.descricao}</p>
                </div>

                {servico.link ? (
                  <Link
                    to={servico.link}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#145A32] group-hover:text-[#2ECC71] transition-colors pt-2 border-t border-slate-100"
                  >
                    <span>Saiba mais</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 pt-2 border-t border-slate-100">
                    Consulte nossos especialistas
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/servicos"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-[#145A32] transition-colors shadow-sm"
          >
            Ver catálogo completo de serviços
            <ArrowRight className="w-4 h-4 text-[#2ECC71]" />
          </Link>
        </div>
      </div>
    </section>
  )
})

export default SecaoServicosHome
