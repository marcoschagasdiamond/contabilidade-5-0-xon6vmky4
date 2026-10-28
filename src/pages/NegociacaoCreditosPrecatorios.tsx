import React from 'react'
import { Link } from 'react-router-dom'
import { AVISO_LEGAL_CREDITOS } from '@/types/creditos'

export default function NegociacaoCreditosPrecatorios() {
  // 5 Pilares 5.0 (padrão Diamond Group, sem ícones nos cards)
  const pilaresCreditos50 = [
    {
      id: 'due-diligence-pericial',
      badge: 'Pilar 01 • Rigor Pericial',
      title: 'Due Diligence e Auditoria Processual Completa',
      description:
        'Auditoria milimétrica da certidão de trânsito em julgado, titularidade da cadeia de cessões, verificação de impugnações fiscais, precatórios alimentares vs. comuns e inexistência de penhoras judiciais que possam contaminar a liquidação do ativo.',
    },
    {
      id: 'governanca-seguranca-juridica',
      badge: 'Pilar 02 • Segurança Jurídica',
      title: 'Governança Jurídica e Conformidade Rígida',
      description:
        'Conformidade integral com a Constituição Federal (art. 100), Resolução CNJ nº 303 e normas fazendárias. Alinhamento explícito à vedação da Lei nº 8.213/1991 (art. 114) e clareza de que o cessionário não herda a superpreferência constitucional.',
    },
    {
      id: 'precificacao-desagio-tecnico',
      badge: 'Pilar 03 • Valuation Racional',
      title: 'Precificação com Deságio Técnico Realista',
      description:
        'Cálculo de deságio fundamentado no orçamento do ente devedor (União, Estado ou Município), ordem cronológica do tribunal, expectativa temporal de liquidação orçamentária e taxa Selic esperada, garantindo rentabilidade sem precificação especulativa.',
    },
    {
      id: 'esteira-estruturada-pgfn-sefaz',
      badge: 'Pilar 04 • Eficiência Fiscal',
      title: 'Esteira de Compensação Direta (PGFN / SEFAZ / Prefeituras)',
      description:
        'Utilização estratégica do ativo para quitação de parcelamentos tributários, amortização de dívida ativa securitizada ou compra de bens públicos em leilões, conforme autorizado pelas Emendas Constitucionais nº 113 e nº 114.',
    },
    {
      id: 'custodia-intermediacao-sigilosa',
      badge: 'Pilar 05 • Sigilo Corporativo',
      title: 'Custódia, Intermediação Segura e Sigilo Absoluto',
      description:
        'Mesa de negociação neutra e consultiva. Dados dos cedentes e adquirentes preservados sob sigilo contratual estrito, contratos de cessão lavrados por escritura pública e liquidação financeira garantida contra a formalização em cartório e habilitação no processo judicial.',
    },
  ]

  // Benefícios para Compradores e Vendedores
  const beneficios = [
    {
      badge: 'Para Compradores',
      title: 'Redução Expressiva de Passivos Tributários',
      desc: 'Empresas com débitos federais, estaduais ou municipais podem compensar dívidas ou quitar parcelamentos adquirindo créditos homologados com deságio atrativo, gerando economia financeira imediata no caixa.',
    },
    {
      badge: 'Para Vendedores',
      title: 'Liquidez Imediata sem Espera na Fila dos Tribunais',
      desc: 'Monetize precatórios e direitos creditórios expedidos sem aguardar os anos de pagamento orçamentário dos entes públicos. Receba o valor à vista negociando seu crédito na mesa institucional.',
    },
    {
      badge: 'Para Investidores',
      title: 'Rentabilidade Acima do CDI com Lastro Soberano',
      desc: 'Ativos judiciais transitados em julgado com garantia constitucional representam uma das classes de ativos alternativos mais seguras e rentáveis para diversificação patrimonial e family offices.',
    },
    {
      badge: 'Segurança Contábil',
      title: 'Contabilização Correta e Ganho de Capital Líquido',
      desc: 'Nossa equipe de tributaristas e analistas sênior orienta o correto tratamento fiscal (PIS/Cofins, IRPJ/CSLL) e lançamento contábil da aquisição e compensação do direito creditório.',
    },
  ]

  // Comparativo Tradicional x 5.0
  const comparativoTradicional = [
    'Intermediários desconhecidos cobrando comissões abusivas sem análise pericial prévia',
    'Risco de comprar títulos penhorados, créditos previdenciários vedados por lei ou precatórios anulados',
    'Sem laudo de cálculo atualizado ou estimativa real de quando o ente público incluirá no orçamento',
    'Contratos frágeis de gaveta sem notificação formal ao juízo da execução e ao ente público devedor',
  ]

  const comparativo50 = [
    'Mesa técnica de tributaristas e peritos da Contabilidade 5.0 (Diamond Group) com due diligence completa',
    'Filtro rigoroso de legalidade: respeito ao art. 114 da Lei 8.213 e conformidade com a Resolução CNJ 303',
    'Cálculo pericial atualizado com base na tabela do tribunal de origem e histórico orçamentário do devedor',
    'Cessão formalizada por escritura pública, habilitação judicial nos autos e liquidação simultânea segura',
  ]

  // 4 Passos do Processo
  const passosProcesso = [
    {
      numero: '01',
      titulo: 'Cadastramento & Análise Preliminar',
      descricao:
        'Vendedor ou comprador publica seu anúncio no Mercado de Créditos. Nossa mesa técnica realiza a triagem de documentos, tribunal de origem e valor nominal.',
    },
    {
      numero: '02',
      titulo: 'Due Diligence Jurídica & Cálculo Pericial',
      descricao:
        'Checagem minuciosa de trânsito em julgado, certidões negativas de penhora, cadeia de cessões e atualização monetária pelo índice oficial do ente.',
    },
    {
      numero: '03',
      titulo: 'Conexão das Partes & Proposta com Deságio',
      descricao:
        'Aproximação institucional com preservação de sigilo entre cedente e cessionário, alinhamento de deságio e elaboração da minuta de escritura de cessão.',
    },
    {
      numero: '04',
      titulo: 'Escritura Pública, Habilitação & Liquidação',
      descricao:
        'Lavratura da cessão em cartório de notas, protocolo imediato de habilitação no tribunal e liberação dos recursos com segurança e recibo formal.',
    },
  ]

  return (
    <div className="pt-24 pb-20 bg-white text-slate-800">
      {/* 1. HERO COM GRADIENTE DIAMOND GROUP (#07132B / #0B1E3F / #07132B) */}
      <section className="bg-gradient-to-r from-[#07132B] via-[#0B1E3F] to-[#07132B] text-white py-20 px-4 sm:px-6 relative overflow-hidden border-b border-[#D4AF37]/30">
        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="mb-6">
            <Link
              to="/servicos"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#D4AF37] hover:text-white transition-colors"
            >
              ← Voltar para Todos os Serviços
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/40 mb-5 backdrop-blur-sm">
                <span>Serviço Estratégico • Diamond Group</span>
              </div>

              <h1 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight mb-4 leading-tight">
                Negociação de Créditos Tributários, Direitos Creditórios e Precatórios
              </h1>

              <p className="text-xl sm:text-2xl font-semibold text-[#D4AF37] mb-6 tracking-tight">
                Esferas Federal, Estadual e Municipal com Auditoria Pericial & Segurança Jurídica.
              </p>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal mb-8 max-w-3xl">
                Intermediação especializada de ativos judiciais transitados em julgado, precatórios
                (alimentares e comuns), RPVs, saldos credores de ICMS de incentivos, créditos de
                IBS/CBS, PIS/Cofins e créditos contra o Fisco. Conectamos empresas que precisam
                quitar ou compensar tributos com deságio a credores que buscam liquidez financeira à
                vista.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  to="/mercado-creditos"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-heading font-bold text-sm sm:text-base text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-[0_6px_20px_rgba(212,175,55,0.35)] transition-all duration-200 hover:-translate-y-0.5 text-center"
                >
                  Acessar Vitrine Mercado de Créditos
                </Link>

                <a
                  href="#pilares-creditos-50"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-heading font-semibold text-sm sm:text-base text-white border border-white/25 hover:border-white hover:bg-white/10 transition-all duration-200 text-center"
                >
                  Ver 5 Pilares 5.0
                </a>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="rounded-2xl p-6 bg-white/[0.05] border border-[#D4AF37]/40 shadow-2xl backdrop-blur-md">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] block mb-2">
                  Ativos Negociáveis
                </span>
                <ul className="space-y-2 text-xs text-slate-200">
                  <li className="pb-1 border-b border-white/10">Precatórios Federais (TRFs)</li>
                  <li className="pb-1 border-b border-white/10">Precatórios Estaduais (TJs)</li>
                  <li className="pb-1 border-b border-white/10">Precatórios Municipais</li>
                  <li className="pb-1 border-b border-white/10">
                    RPVs (Requisições de Pequeno Valor)
                  </li>
                  <li className="pb-1 border-b border-white/10">
                    Créditos de PIS / Cofins e ICMS Incentivos
                  </li>
                  <li className="pb-1 border-b border-white/10">
                    Novos Créditos de IBS / CBS (LC 214/2025)
                  </li>
                  <li>Dívida Ativa Securitizada</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AVISO LEGAL OBRIGATÓRIO (DESTAQUE MÁXIMO PREVISTO NO ESCOPO) */}
      <section className="bg-amber-500/10 border-b border-[#D4AF37]/40 py-6 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#07132B] border border-[#D4AF37]/50 text-white text-xs sm:text-sm leading-relaxed shadow-md">
            <strong className="text-[#D4AF37] uppercase tracking-wide block mb-1">
              Aviso Legal e Regulatório Obrigatório:
            </strong>
            <p className="text-slate-200">{AVISO_LEGAL_CREDITOS}</p>
          </div>
        </div>
      </section>

      {/* 2. BENEFÍCIOS ESTRATÉGICOS (4) - PADRÃO DIAMOND GROUP SEM ÍCONES */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/40 mb-3">
              Rentabilidade & Solvência
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              Vantagens para Compradores, Vendedores e Investidores
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Transformamos direitos creditórios judiciais em soluções financeiras de alto impacto
              com due diligence completa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {beneficios.map((b, idx) => (
              <div
                key={idx}
                className="p-7 rounded-2xl bg-white border border-slate-200 hover:border-[#D4AF37]/60 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 px-2.5 py-1 rounded-full inline-block mb-3 border border-[#D4AF37]/30">
                    {b.badge}
                  </span>
                  <h3 className="font-heading font-bold text-lg sm:text-xl text-slate-900 mb-2.5">
                    {b.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. COMPARATIVO TRADICIONAL × CONTABILIDADE 5.0 (DIAMOND GROUP) */}
      <section className="py-20 bg-[#07132B] text-white relative overflow-hidden border-y border-[#D4AF37]/30">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/40 mb-3">
              Mitigação de Riscos
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Mercado Informal × Intermediação Diamond 5.0
            </h2>
            <p className="text-base text-slate-300 leading-relaxed">
              Negociar precatórios sem assessoria contábil e pericial gera perdas financeiras graves
              e bloqueios processuais. Veja a diferença:
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Tradicional */}
            <div className="rounded-2xl p-8 bg-white/[0.04] border border-rose-500/30 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-rose-400 block mb-2">
                  Mercado Informal / Intermediários
                </span>
                <h3 className="font-heading font-bold text-xl text-white mb-6">
                  Prática Amadora & Insegurança
                </h3>
                <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
                  {comparativoTradicional.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 pt-4 border-t border-white/10 text-xs text-rose-300/80">
                Risco: nulidade da cessão, rejeição da compensação pela PGFN e perda do capital
                investido.
              </div>
            </div>

            {/* Diamond 5.0 */}
            <div className="rounded-2xl p-8 bg-gradient-to-b from-white/[0.09] to-white/[0.04] border-2 border-[#D4AF37] flex flex-col justify-between shadow-2xl relative">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-[#D4AF37] text-[#07132B] text-[11px] font-bold uppercase tracking-wider shadow">
                Padrão Diamond Group
              </div>
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-[#D4AF37] block mb-2">
                  Metodologia Institucional
                </span>
                <h3 className="font-heading font-bold text-xl text-white mb-6">
                  Contabilidade 5.0 • Mesa Especializada
                </h3>
                <ul className="space-y-4 text-xs sm:text-sm text-slate-200">
                  {comparativo50.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-[#D4AF37] font-bold shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 pt-4 border-t border-white/10 text-xs text-[#D4AF37]">
                Resultado: liquidação tempestiva, segurança jurídica irrestrita e economia
                tributária homologada.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ETAPAS DO PROCESSO (4 PASSOS) */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/40 mb-3">
              Fluxo Estruturado
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              Como funciona a negociação na esteira 5.0
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Processo em 4 etapas lineares para assegurar integridade jurídica e agilidade de
              liquidação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {passosProcesso.map((p, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#D4AF37]/60 hover:bg-slate-50/80 transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="font-heading font-extrabold text-2xl text-[#D4AF37] block mb-2">
                    {p.numero}
                  </span>
                  <h3 className="font-heading font-bold text-base text-slate-900 mb-2">
                    {p.titulo}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{p.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. OS 5 PILARES 5.0 (NO FINAL DA PÁGINA, PADRÃO DIAMOND GROUP SEM ÍCONES) */}
      <section
        id="pilares-creditos-50"
        className="py-20 bg-gradient-to-b from-[#07132B] via-[#0B1E3F] to-[#07132B] text-white relative overflow-hidden border-t-2 border-[#D4AF37]/40"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#D4AF37] bg-white/10 border border-[#D4AF37]/40 mb-4 backdrop-blur-sm">
              Metodologia de Governança
            </span>

            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Os 5 Pilares da Negociação de Créditos 5.0
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Rigor técnico, conformidade legal e auditoria que blindam sua empresa em cada
              transação de cessão.
            </p>
          </div>

          {/* Grade de 5 cards com texto 100% visível, sem ícones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pilaresCreditos50.map((item, idx) => {
              const isSpanAcross = idx === 3 && pilaresCreditos50.length === 5

              return (
                <div
                  key={item.id}
                  className={`group relative p-6 sm:p-7 rounded-[20px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#D4AF37] shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between backdrop-blur-sm ${
                    isSpanAcross ? 'lg:col-span-1' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                        {item.badge}
                      </span>
                      <span className="text-[11px] font-bold text-[#D4AF37]/80">5.0</span>
                    </div>

                    <h3 className="font-heading font-bold text-lg text-white mb-3 group-hover:text-[#D4AF37] transition-colors leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[#D4AF37] font-medium">Incluso na Mesa Diamond</span>
                    <span className="text-[11px] font-bold text-white/40">0{idx + 1}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Banner de Chamada para a Vitrine */}
          <div className="mt-12 p-6 sm:p-8 rounded-[20px] bg-white/[0.03] border border-[#D4AF37]/40 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="font-heading font-bold text-base sm:text-lg text-white">
                Pronto para consultar ativos disponíveis ou anunciar um crédito?
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Acesse agora a vitrine Mercado de Créditos ou cadastre sua oferta com total sigilo.
              </p>
            </div>

            <Link
              to="/mercado-creditos"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-heading font-bold text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md transition-all duration-200 hover:-translate-y-0.5 shrink-0 text-center"
            >
              Abrir Mercado de Créditos
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
