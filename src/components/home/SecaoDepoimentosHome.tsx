import { memo } from 'react'
import { Star } from 'lucide-react'

export interface DepoimentoItem {
  nome: string
  cargo: string
  empresa: string
  texto: string
  avaliacao: number
  foto: string
}

const depoimentos: DepoimentoItem[] = [
  {
    nome: 'Carlos Eduardo Mendes',
    cargo: 'CEO & Fundador',
    empresa: 'Nexxus Tecnologia S/A',
    texto:
      'A migração do Lucro Presumido para o Lucro Real conduzida pela Contabilidade 5.0 reduziu nossa carga tributária em mais de 28% no primeiro ano. O atendimento é impecável.',
    avaliacao: 5,
    foto: 'https://img.usecurling.com/ppl/medium?gender=male&seed=12',
  },
  {
    nome: 'Mariana Silveira',
    cargo: 'Diretora Financeira',
    empresa: 'Grupo Vértice Logística',
    texto:
      'Com o BPO Financeiro e a contabilidade consultiva integrados, passamos a fechar o balancete no 3º dia útil de cada mês. Ganhamos uma clareza de caixa que nunca tivemos.',
    avaliacao: 5,
    foto: 'https://img.usecurling.com/ppl/medium?gender=female&seed=34',
  },
  {
    nome: 'Roberto Albuquerque',
    cargo: 'Sócio-Administrador',
    empresa: 'Clínica Albuquerque Saúde',
    texto:
      'O trabalho de recuperação de tributos federais nos restituiu mais de R$ 340 mil pagos indevidamente nos últimos 5 anos. Tudo com total respaldo legal e transparência.',
    avaliacao: 5,
    foto: 'https://img.usecurling.com/ppl/medium?gender=male&seed=56',
  },
]

export const SecaoDepoimentosHome = memo(function SecaoDepoimentosHome() {
  return (
    <section
      id="depoimentos"
      className="py-20 md:py-28 bg-slate-900 text-white relative overflow-hidden"
    >
      {/* Decorative gradient blur */}
      <div
        className="absolute top-0 right-1/4 w-96 h-96 bg-[#2ECC71]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#145A32]/20 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#2ECC71] bg-[#2ECC71]/10 px-3 py-1.5 rounded-full inline-block mb-3 border border-[#2ECC71]/20">
            Quem confia em nós
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            Resultados reais para empresários que pensam no futuro
          </h2>
          <p className="mt-4 text-slate-300 text-base leading-relaxed">
            Mais de 450 empresas confiam sua saúde fiscal e contábil à metodologia da Contabilidade
            5.0.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {depoimentos.map((dep) => (
            <div
              key={dep.nome}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-[#2ECC71]/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 mb-6 text-amber-400">
                  {Array.from({ length: dep.avaliacao }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                  ))}
                </div>
                <p className="text-slate-200 text-sm leading-relaxed italic mb-8">
                  &ldquo;{dep.texto}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-[#2ECC71]/30 aspect-square">
                  <img
                    src={dep.foto}
                    alt={dep.nome}
                    width={48}
                    height={48}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover aspect-square"
                  />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-white">{dep.nome}</h3>
                  <p className="text-xs text-slate-400">{dep.cargo}</p>
                  <p className="text-xs text-[#2ECC71] font-medium">{dep.empresa}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
})

export default SecaoDepoimentosHome
