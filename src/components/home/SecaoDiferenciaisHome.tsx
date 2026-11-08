import { memo } from 'react'
import { ShieldCheck, TrendingUp, Cpu, Clock, Award, Lock } from 'lucide-react'

export interface DiferencialItem {
  icone: React.ComponentType<{ className?: string }>
  titulo: string
  descricao: string
}

const diferenciais: DiferencialItem[] = [
  {
    icone: ShieldCheck,
    titulo: 'Rigor & Conformidade Absoluta',
    descricao:
      'Garantia de conformidade com todas as obrigações acessórias federais, estaduais e municipais.',
  },
  {
    icone: TrendingUp,
    titulo: 'Planejamento Ativo de Lucro',
    descricao:
      'Não apenas registramos o passado; desenhamos estratégias contábeis para maximizar o resultado futuro.',
  },
  {
    icone: Cpu,
    titulo: 'Plataforma 100% em Nuvem',
    descricao:
      'Acesse seus relatórios, impostos e documentos contábeis de qualquer lugar, 24 horas por dia.',
  },
  {
    icone: Clock,
    titulo: 'Atendimento Rápido e Dedicado',
    descricao:
      'Sem robôs genéricos. Você conta com um contador sênior responsável diretamente pela sua conta.',
  },
  {
    icone: Award,
    titulo: 'Especialistas por Segmento',
    descricao:
      'Equipes especializadas em serviços, comércio, tecnologia, saúde, holdings e indústria.',
  },
  {
    icone: Lock,
    titulo: 'Segurança da Informação',
    descricao:
      'Protocolos bancários de criptografia e conformidade rigorosa com a Lei Geral de Proteção de Dados (LGPD).',
  },
]

export const SecaoDiferenciaisHome = memo(function SecaoDiferenciaisHome() {
  return (
    <section className="py-20 md:py-28 bg-white border-y border-slate-100">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-[#2ECC71]/10 px-3 py-1.5 rounded-full inline-block mb-3">
            Por que a Contabilidade 5.0
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight">
            A união entre precisão contábil e inteligência estratégica
          </h2>
          <p className="mt-4 text-slate-600 text-base leading-relaxed">
            Deixamos a contabilidade burocrática para trás. Construímos uma parceria que protege e
            alavanca o seu caixa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {diferenciais.map((item) => {
            const Icone = item.icone
            return (
              <div
                key={item.titulo}
                className="flex items-start gap-4 p-6 rounded-2xl bg-slate-50/60 border border-slate-100 hover:border-[#2ECC71]/30 hover:bg-white transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#145A32] text-[#2ECC71] flex items-center justify-center shrink-0 shadow-sm">
                  <Icone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900 mb-1.5">
                    {item.titulo}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.descricao}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
})

export default SecaoDiferenciaisHome
