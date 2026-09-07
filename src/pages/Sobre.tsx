import React from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Target,
  Eye,
  Heart,
  ArrowRight,
  Sparkles,
  Award,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'

export default function Sobre() {
  const team = [
    {
      name: 'Dr. Marcos Chagas',
      role: 'Sócio Fundador',
      avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=101',
      bio: 'Contador e advogado tributarista com mais de 20 anos de experiência estruturando negócios e defesas fiscais complexas para empresas em todo o país.',
    },
    {
      name: 'Dra. Patrícia Lima',
      role: 'Diretora de Contabilidade',
      avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=102',
      bio: 'Especialista em auditoria e normas IFRS pelo CRC-SP. Lidera a equipe de escrituração avançada e governança contábil para negócios em crescimento.',
    },
    {
      name: 'Caio Andrade',
      role: 'Head de Tecnologia',
      avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=103',
      bio: 'Engenheiro de software e entusiasta de dados, responsável pela integração das APIs bancárias, automações de notas e painéis em tempo real.',
    },
    {
      name: 'Fernanda Souza',
      role: 'Gerente de Relacionamento',
      avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=104',
      bio: 'Foco total no sucesso do cliente. Garante que cada empresa tenha atendimento ágil, humanizado e soluções ágeis no dia a dia da operação.',
    },
  ]

  return (
    <div className="pt-24 pb-20">
      {/* 1. HEADER COM GRADIENTE VERDE */}
      <section className="bg-gradient-to-r from-[#0A1A13] via-[#0E3520] to-[#145A32] text-white py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#2ECC71_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="max-w-[1200px] mx-auto relative z-10 text-center">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-white/10 border border-emerald-400/30 mb-4 backdrop-blur-sm">
            Sobre Nós
          </span>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight mb-6">
            A Contabilidade 5.0 em detalhes
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Conheça a história, o propósito e as pessoas dedicadas a transformar a contabilidade de
            empresas em um motor de inteligência e segurança tributária.
          </p>
        </div>
      </section>

      {/* 2. HISTÓRIA EM 2 COLUNAS */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-[#A3E4D7]/30 border border-[#2ECC71]/30 mb-3">
                Nossa Trajetória
              </span>
              <h2 className="font-heading font-bold text-3xl text-slate-900 tracking-tight mb-6">
                Construída sobre solidez contábil e impulsionada pela inovação contínua
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed text-base">
                <p>
                  A Contabilidade 5.0 foi fundada com a convicção de que nenhuma empresa moderna
                  deve perder noites de sono por burocracias fiscais ou surpresas tributárias. Ao
                  longo de mais de 15 anos no mercado corporativo, acompanhamos a transformação da
                  economia e percebemos que o modelo tradicional de escritório contábil já não
                  atendia o ritmo das empresas dinâmicas.
                </p>
                <p>
                  Decidimos dar um passo além: combinamos o rigor técnico da legislação brasileira
                  com sistemas integrados de automação, leitura de XMLs, conciliação bancária
                  inteligente e relatórios gerenciais claros.
                </p>
                <p>
                  Hoje atendemos centenas de companhias em todo o Brasil — desde scale-ups de
                  tecnologia até indústrias e redes varejistas — sempre mantendo o calor do contato
                  humano e a proximidade de quem se importa de verdade com o resultado do cliente.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[24px] overflow-hidden shadow-xl border border-slate-200">
                <img
                  src="https://img.usecurling.com/p/800/600?q=modern%20meeting%20financial%20consulting&color=emerald"
                  alt="Reunião de consultoria estratégica da Contabilidade 5.0"
                  className="w-full h-[400px] object-cover"
                />
              </div>
              {/* Badge flutuante */}
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 max-w-xs hidden sm:block">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-[#2ECC71]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-xl text-slate-900 block">
                      100%
                    </span>
                    <span className="text-xs text-slate-500">Conformidade e Sigilo LGPD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MISSÃO, VISÃO E VALORES */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="font-heading font-bold text-3xl text-slate-900 mb-3">
              Nossos Pilares Fundamentais
            </h2>
            <p className="text-slate-600 text-sm">
              O que nos move e orienta cada decisão diária em prol dos nossos clientes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Missão */}
            <div className="p-8 rounded-[20px] bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#145A32] mb-6">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-bold text-xl text-slate-900 mb-3">Missão</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Simplificar a contabilidade com tecnologia e atendimento humano, ajudando empresas a
                crescer com segurança e clareza.
              </p>
            </div>

            {/* Visão */}
            <div className="p-8 rounded-[20px] bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#145A32] mb-6">
                <Eye className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-bold text-xl text-slate-900 mb-3">Visão</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Ser a contabilidade de referência para o negócio digital no Brasil.
              </p>
            </div>

            {/* Valores */}
            <div className="p-8 rounded-[20px] bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#145A32] mb-6">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-bold text-xl text-slate-900 mb-3">Valores</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Transparência, proximidade e inovação.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SEÇÃO DE EQUIPE */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-[#A3E4D7]/30 border border-[#2ECC71]/30 mb-3">
              Liderança e Especialistas
            </span>
            <h2 className="font-heading font-bold text-3xl text-slate-900 tracking-tight mb-3">
              Conheça quem cuida do seu negócio
            </h2>
            <p className="text-slate-600 text-base">
              Profissionais experientes, titulados e apaixonados por números e crescimento
              empresarial.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member) => (
              <div
                key={member.name}
                className="rounded-2xl border border-slate-200 overflow-hidden bg-white hover:border-[#2ECC71]/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 flex flex-col"
              >
                <div className="h-56 bg-slate-100 overflow-hidden relative">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-lg text-slate-900 mb-1">
                      {member.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#145A32] uppercase tracking-wider mb-3">
                      {member.role}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">{member.bio}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CTA FINAL */}
      <section className="py-16 bg-gradient-to-r from-[#0A1A13] to-[#145A32] text-white">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl mb-4">Ainda tem dúvidas?</h2>
          <p className="text-slate-300 text-base max-w-xl mx-auto mb-8">
            Descubra como podemos customizar a contabilidade da sua empresa e reduzir a sua carga
            tributária dentro da lei.
          </p>
          <a
            href="/#contato"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-heading font-semibold text-base text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 btn-press"
          >
            Fale com um Especialista
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </a>
        </div>
      </section>
    </div>
  )
}
