import { Link } from 'react-router-dom'

export default function CancelamentoNfIbsCbs() {
  // 5 Pilares 5.0 (padrão Diamond Group, sem ícones nos cards)
  const pilaresCancelamento50 = [
    {
      id: 'fato-gerador-entrega',
      badge: 'Pilar 01 • Conformidade Técnica',
      title: 'Fato Gerador na Entrega, não na Emissão',
      description:
        'Tratamento do cancelamento partindo do art. 10 da LC 214/2025: o fato gerador do IBS/CBS é o fornecimento e a entrega do bem ou serviço (hierarquia dPrevEntrega → dhSaiEnt → dhEmi). Nota emitida e cancelada antes da entrega pode não gerar débito — e a operação precisa ser documentada nesse critério.',
    },
    {
      id: 'vinculacao-debito-credito',
      badge: 'Pilar 02 • Segurança Jurídica',
      title: 'Vinculação Débito-Crédito na Apuração Assistida',
      description:
        'Na apuração assistida do CG-IBS as notas das duas empresas são cruzadas em tempo real: o crédito do cliente só existe se o fornecedor pagou o débito correspondente. Revisamos a cadeia cronológica débito-crédito para que o estorno não gere crédito indevido nem perda de crédito legítimo.',
    },
    {
      id: 'estornos-documentacao-correta',
      badge: 'Pilar 03 • Eficiência Fiscal',
      title: 'Estornos, Devoluções e Ajustes de Competência',
      description:
        'Orientação sobre o instrumento correto em cada situação: nota de crédito, Ajuste de Competência com gEstornoCred, devolução formal e distrato de pagamento antecipado com gPagAntecipado para não debitar em dobro. Notas de débito e crédito passam a ser instrumento de apuração.',
    },
    {
      id: 'controle-duplo-regime',
      badge: 'Pilar 04 • Governança Fiscal',
      title: 'Controle Duplo na Transição (ICMS/ISS + IBS/CBS)',
      description:
        'O prazo de cancelamento segue estadual/municipal (ICMS e ISS convivem com o IBS/CBS até 2033). Operação dupla exige controle fino: prazos de UF (24h a 7 dias, com SP admitindo extemporâneo até 480h e RS não admitindo) convivendo com as regras da LC 214/2025 no mesmo fluxo de notas.',
    },
    {
      id: 'blindagem-sancao-66',
      badge: 'Pilar 05 • Blindagem de Risco',
      title: 'Blindagem contra a Sanção de 66% (art. 301)',
      description:
        'Deixar de estornar crédito indevido pode custar 66% do crédito (art. 301 da LC 214/2025). Auditoria da escrituração de estornos e devoluções para impedir que o crédito mantido indevidamente se transforme em autuação com acréscimo monetário.',
    },
  ]

  // Tabela de situações do IBS/CBS (levantamento técnico aprovado)
  const situacoesIbsCbs = [
    {
      situacao: 'a',
      titulo: 'Cancelamento antes da entrega e do pagamento',
      tratamento:
        'Sem fato gerador: a nota emitida e cancelada antes da entrega não nasce para o sistema e o sistema não valida crédito do adquirente.',
    },
    {
      situacao: 'b',
      titulo: 'Após a entrega, antes do pagamento',
      tratamento:
        'O débito já existe (fato gerador consumado na entrega). Ajuste via Ajuste de Competência / gEstornoCred ou nota de crédito.',
    },
    {
      situacao: 'c',
      titulo: 'Após o pagamento',
      tratamento:
        'Art. 45, §13 (LC 227/2026): fornecedor estorna débito ou apropria crédito; adquirente constitui débito ou estorna crédito; o direito a crédito fica condicionado à devolução do valor.',
    },
    {
      situacao: 'd',
      titulo: 'Alíquota mudou entre a emissão e a entrega',
      tratamento:
        'A nota deve ser emitida pela alíquota da data provável de entrega — não pela alíquota vigente na emissão.',
    },
  ]

  // Pontos de atenção (4)
  const pontosAtencao = [
    {
      badge: 'Split Payment',
      texto:
        'O split payment amplifica o custo do cancelamento tardio: o imposto já saiu do caixa na hora do pagamento, e a recuperação depende de ajuste formal posterior.',
    },
    {
      badge: 'Devolução sem nota',
      texto:
        'Devolução sem nota formal nega crédito ao cliente: sem o documento espelhando o retorno do bem, o adquirente perde o crédito na apuração assistida.',
    },
    {
      badge: 'Prazo estadual/municipal',
      texto:
        'O prazo de cancelamento segue estadual/municipal (ICMS/ISS convivem até 2033): a operação dupla exige controle fino na transição, com regras de UF e regras da LC 214/2025 no mesmo fluxo.',
    },
    {
      badge: 'Regime misto/monofásico',
      texto:
        'Empresas de regime misto ou monofásico têm camadas extras no estorno: alíquotas diferenciadas e bases reduzidas precisam ser desfeitas na mesma proporção em que foram debitadas.',
    },
  ]

  return (
    <div className="pt-24 pb-20 bg-white text-slate-800">
      {/* 1. HERO COM GRADIENTE DIAMOND GROUP */}
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
                Cancelamento de NF no IBS/CBS
              </h1>

              <p className="text-xl sm:text-2xl font-semibold text-[#D4AF37] mb-6 tracking-tight">
                Notas canceladas, estornos e devoluções com segurança no sistema atual e na apuração
                assistida.
              </p>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal mb-8 max-w-3xl">
                Como fica o imposto quando a nota fiscal é cancelada, no sistema atual e no IBS/CBS
                (LC 214/2025 e apuração assistida do CG-IBS). No sistema atual, o cancelamento
                &ldquo;desfaz&rdquo; o imposto pela regra escriturária de cada tributo. No IBS/CBS,
                o que importa é se o débito já foi pago e se o bem já foi entregue: a apuração
                assistida cruza as notas das duas empresas em tempo real e o crédito do cliente só
                existe se o fornecedor pagou o débito correspondente.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  to="/diagnostico-360"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-heading font-bold text-sm sm:text-base text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-[0_6px_20px_rgba(212,175,55,0.35)] transition-all duration-200 hover:-translate-y-0.5 text-center"
                >
                  Descubra o impacto no seu caso — Fazer Diagnóstico Gratuito
                </Link>

                <a
                  href="#pilares-cancelamento-50"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-heading font-semibold text-sm sm:text-base text-white border border-white/25 hover:border-white hover:bg-white/10 transition-all duration-200 text-center"
                >
                  Ver 5 Pilares 5.0
                </a>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="rounded-2xl p-6 bg-white/[0.05] border border-[#D4AF37]/40 shadow-2xl backdrop-blur-md">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] block mb-2">
                  Base Legal & Normativa
                </span>
                <ul className="space-y-2 text-xs text-slate-200">
                  <li className="pb-1 border-b border-white/10">
                    LC 214/2025 — art. 10 (fato gerador na entrega)
                  </li>
                  <li className="pb-1 border-b border-white/10">
                    LC 227/2026 — art. 45, §13 (pós-pagamento)
                  </li>
                  <li className="pb-1 border-b border-white/10">
                    LC 214/2025 — art. 301 (sanção de 66%)
                  </li>
                  <li className="pb-1 border-b border-white/10">
                    Apuração assistida do CG-IBS (cruzamento em tempo real)
                  </li>
                  <li className="pb-1 border-b border-white/10">
                    NF-e de estorno, CFOP inversa e finalidade &ldquo;ajuste&rdquo;
                  </li>
                  <li>Prazos de cancelamento estaduais/municipais (ICMS/ISS)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMO É HOJE × COMO FICA NO IBS/CBS */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/40 mb-3">
              Regra Escriturária × Lógica do Sistema Novo
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              Como é hoje e como fica no IBS/CBS
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              A mesma operação desfeita — uma nota cancelada ou uma devolução — tem tratamentos
              completamente diferentes nos dois sistemas.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Como é hoje */}
            <div className="rounded-2xl p-8 bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">
                  Sistema Atual
                </span>
                <h3 className="font-heading font-bold text-xl text-slate-900 mb-5">
                  O cancelamento &ldquo;desfaz&rdquo; o imposto pela escrituração
                </h3>
                <ul className="space-y-4 text-sm text-slate-600 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#D4AF37] font-bold shrink-0">•</span>
                    <span>
                      <strong className="text-slate-800">No prazo regulamentar</strong> (24h a 7
                      dias conforme a UF; SP admite extemporâneo até 480h, RS não admite): o
                      cancelamento elimina o fato gerador.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#D4AF37] font-bold shrink-0">•</span>
                    <span>
                      <strong className="text-slate-800">Fora do prazo</strong>: NF-e de estorno com
                      CFOP inversa e finalidade &ldquo;ajuste&rdquo;.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#D4AF37] font-bold shrink-0">•</span>
                    <span>
                      <strong className="text-slate-800">Cada tributo por si</strong>: PIS/Cofins,
                      ICMS e IPI tratam o efeito na sua própria escrituração, sem vínculo com a nota
                      do cliente.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100 text-xs text-slate-500">
                Consequência prática: o efeito do cancelamento depende da disciplina escriturária de
                cada tributo — e erros de estorno só aparecem na fiscalização.
              </div>
            </div>

            {/* Como fica no IBS/CBS */}
            <div className="rounded-2xl p-8 bg-gradient-to-b from-[#07132B] to-[#0B1E3F] border-2 border-[#D4AF37] shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#D4AF37]">
                    IBS/CBS • LC 214/2025
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-[#D4AF37] text-[#07132B] px-2.5 py-0.5 rounded-full">
                    Padrão Diamond Group
                  </span>
                </div>
                <h3 className="font-heading font-bold text-xl text-white mb-5">
                  O que importa é o débito pago e o bem entregue
                </h3>
                <ol className="space-y-4 text-sm text-slate-200 leading-relaxed">
                  <li className="flex items-start gap-3">
                    <span className="font-heading font-extrabold text-[#D4AF37] shrink-0">1.</span>
                    <span>
                      <strong className="text-white">Fato gerador = fornecimento/entrega</strong>,
                      não emissão (art. 10 da LC 214/2025; hierarquia dPrevEntrega → dhSaiEnt →
                      dhEmi). Nota emitida e cancelada antes da entrega pode não gerar débito.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-heading font-extrabold text-[#D4AF37] shrink-0">2.</span>
                    <span>
                      <strong className="text-white">
                        Crédito do adquirente condicionado ao pagamento do débito pelo fornecedor
                      </strong>{' '}
                      (vinculação cronológica débito-crédito), com o cruzamento das notas das duas
                      empresas em tempo real pela apuração assistida.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-heading font-extrabold text-[#D4AF37] shrink-0">3.</span>
                    <span>
                      <strong className="text-white">
                        Notas de débito e crédito viram instrumento de apuração
                      </strong>
                      : multa/juros, recusa de entrega, redução de valores e distrato de pagamento
                      antecipado (gPagAntecipado para não debitar em dobro).
                    </span>
                  </li>
                </ol>
              </div>
              <div className="mt-8 pt-4 border-t border-white/10 text-xs text-[#D4AF37]">
                Consequência prática: o sistema enxerga as duas pontas da operação — o estorno mal
                feito aparece de imediato, dos dois lados.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TABELA DE SITUAÇÕES */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/40 mb-3">
              Matriz de Decisão
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              Tabela de situações do cancelamento no IBS/CBS
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              O tratamento do cancelamento depende do momento em que ele acontece em relação à
              entrega do bem e ao pagamento.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-[#07132B] text-white">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider w-12">
                    Situação
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider">
                    Momento do cancelamento
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                    Tratamento no IBS/CBS
                  </th>
                </tr>
              </thead>
              <tbody>
                {situacoesIbsCbs.map((s) => (
                  <tr key={s.situacao} className="border-t border-slate-100 bg-white">
                    <td className="px-5 py-4 align-top">
                      <span className="font-heading font-extrabold text-lg text-[#D4AF37]">
                        {s.situacao})
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top text-sm font-semibold text-slate-900">
                      {s.titulo}
                    </td>
                    <td className="px-5 py-4 align-top text-sm text-slate-600 leading-relaxed">
                      {s.tratamento}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CTA intermediário */}
          <div className="mt-10 p-6 sm:p-8 rounded-[20px] bg-gradient-to-r from-[#07132B] via-[#0B1E3F] to-[#07132B] border border-[#D4AF37]/40 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="font-heading font-bold text-base sm:text-lg text-white">
                Descubra o impacto no seu caso
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                O Diagnóstico 360° mapeia notas canceladas, devoluções e estornos da sua operação e
                quantifica o risco no IBS/CBS.
              </p>
            </div>
            <Link
              to="/diagnostico-360"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-heading font-bold text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md transition-all duration-200 hover:-translate-y-0.5 shrink-0 text-center"
            >
              Fazer Diagnóstico Gratuito
            </Link>
          </div>
        </div>
      </section>

      {/* 4. PONTOS DE ATENÇÃO */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 border border-[#D4AF37]/40 mb-3">
              Riscos Operacionais
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight mb-4">
              Pontos de atenção na transição
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Quatro pontos onde o cancelamento mal tratado se transforma em custo, perda de crédito
              ou autuação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pontosAtencao.map((p, idx) => (
              <div
                key={idx}
                className="p-7 rounded-2xl bg-white border border-slate-200 hover:border-[#D4AF37]/60 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#07132B] bg-[#D4AF37]/20 px-2.5 py-1 rounded-full inline-block mb-3 border border-[#D4AF37]/30">
                    {p.badge}
                  </span>
                  <p className="text-sm text-slate-600 leading-relaxed">{p.texto}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sanção 66% */}
          <div className="mt-10 p-6 sm:p-8 rounded-[20px] bg-[#07132B] border-2 border-[#D4AF37] text-white shadow-xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] block mb-2">
              Sanção Expressa em Lei
            </span>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h4 className="font-heading font-bold text-lg sm:text-xl mb-2">
                  Deixar de estornar crédito indevido pode custar 66% do crédito
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                  O art. 301 da LC 214/2025 prevê a penalidade para quem mantém na escrituração
                  crédito que não poderia ter sido mantido — por exemplo, quando o cancelamento ou a
                  devolução exigia o estorno e ele não foi realizado. A blindagem é documental:
                  estorno tempestivo e devolução formalizada.
                </p>
              </div>
              <div className="shrink-0 text-center px-8 py-6 rounded-2xl bg-white/[0.05] border border-[#D4AF37]/40">
                <span className="font-heading font-extrabold text-5xl text-[#D4AF37] block">
                  66%
                </span>
                <span className="text-[11px] uppercase tracking-wider text-slate-400">
                  art. 301 • LC 214/2025
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. OS 5 PILARES 5.0 */}
      <section
        id="pilares-cancelamento-50"
        className="py-20 bg-gradient-to-b from-[#07132B] via-[#0B1E3F] to-[#07132B] text-white relative overflow-hidden border-t-2 border-[#D4AF37]/40"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#D4AF37] bg-white/10 border border-[#D4AF37]/40 mb-4 backdrop-blur-sm">
              Metodologia de Governança
            </span>

            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Os 5 Pilares do Cancelamento de NF 5.0
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Critério técnico, vinculação débito-crédito e blindagem documental em cada estorno,
              devolução ou nota cancelada.
            </p>
          </div>

          {/* Grade de 5 cards com texto 100% visível, sem ícones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pilaresCancelamento50.map((item, idx) => (
              <div
                key={item.id}
                className="group relative p-6 sm:p-7 rounded-[20px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#D4AF37] shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between backdrop-blur-sm"
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
                  <span className="text-[#D4AF37] font-medium">Incluso na Esteira Diamond</span>
                  <span className="text-[11px] font-bold text-white/40">0{idx + 1}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Banner de Chamada Final para o Diagnóstico 360° */}
          <div className="mt-12 p-6 sm:p-8 rounded-[20px] bg-white/[0.03] border border-[#D4AF37]/40 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="font-heading font-bold text-base sm:text-lg text-white">
                Pronto para descobrir o impacto do cancelamento de notas no seu caso?
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Faça o Diagnóstico 360° gratuito e receba o mapa dos riscos e das oportunidades da
                sua operação no IBS/CBS.
              </p>
            </div>

            <Link
              to="/diagnostico-360"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-heading font-bold text-sm text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] shadow-md transition-all duration-200 hover:-translate-y-0.5 shrink-0 text-center"
            >
              Descubra o impacto no seu caso — Fazer Diagnóstico Gratuito
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
