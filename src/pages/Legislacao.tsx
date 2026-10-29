import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  pesquisarLegislacao,
  ItemLegislacao,
  dispararVarreduraRadar,
  listarParametrosTributarios,
  ParametroTributario,
  listarNotificacoesTributarias,
  marcarNotificacaoComoLida,
  NotificacaoTributaria,
} from '@/services/radarTributario'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { CardExplicacaoLegislacao } from '@/components/legislacao/CardExplicacaoLegislacao'
import { derivarChaveNorma } from '@/services/explicadorLegislacao'

export default function Legislacao() {
  const { toast } = useToast()
  const [busca, setBusca] = useState('')
  const [filtroTributo, setFiltroTributo] = useState('TODOS')
  const [filtroAno, setFiltroAno] = useState('TODOS')
  const [filtroTipo, setFiltroTipo] = useState('todos')

  const [itens, setItens] = useState<ItemLegislacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [sincronizando, setSincronizando] = useState(false)
  const [parametrosRadar, setParametrosRadar] = useState<ParametroTributario[]>([])
  const [carregandoParametros, setCarregandoParametros] = useState(true)
  const [notificacoesRadar, setNotificacoesRadar] = useState<NotificacaoTributaria[]>([])
  const [carregandoNotificacoes, setCarregandoNotificacoes] = useState(true)

  const carregarParametros = async () => {
    try {
      setCarregandoParametros(true)
      const params = await listarParametrosTributarios()
      setParametrosRadar(params || [])
    } catch (err) {
      console.warn('Erro ao carregar parâmetros tributários no Radar da Legislação:', err)
    } finally {
      setCarregandoParametros(false)
    }
  }

  const carregarNotificacoesEMarcarLidas = async () => {
    try {
      setCarregandoNotificacoes(true)
      const notifs = await listarNotificacoesTributarias()
      setNotificacoesRadar(notifs || [])

      // Marca como lidas todas as não lidas ao abrir a página
      const naoLidas = (notifs || []).filter((n) => !n.lida)
      if (naoLidas.length > 0) {
        // Marca imediatamente no estado local
        setNotificacoesRadar((prev) => prev.map((n) => ({ ...n, lida: true })))
        // Atualiza persistência no backend de forma assíncrona
        naoLidas.forEach((n) => {
          marcarNotificacaoComoLida(n.id).catch((err) => {
            console.warn('[Legislacao] Erro ao marcar notificação como lida:', err)
          })
        })
      }
    } catch (err) {
      console.warn('Erro ao carregar notificações do Radar na Legislação:', err)
    } finally {
      setCarregandoNotificacoes(false)
    }
  }

  useEffect(() => {
    carregarParametros()
    carregarNotificacoesEMarcarLidas()
  }, [])

  const carregarDados = async () => {
    try {
      setCarregando(true)
      const res = await pesquisarLegislacao({
        q: busca,
        tributo: filtroTributo,
        ano: filtroAno,
        tipo: filtroTipo,
      })
      setItens(res.itens || [])
    } catch (err) {
      console.warn('Erro ao carregar legislação:', err)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarDados()
    }, 250)
    return () => clearTimeout(timer)
  }, [busca, filtroTributo, filtroAno, filtroTipo])

  const handleForcarVarredura = async () => {
    try {
      setSincronizando(true)
      const res = await dispararVarreduraRadar()
      if (res.sucesso) {
        toast({
          title: 'Varredura Concluída',
          description: `Fontes oficiais consultadas. ${res.novosEncontrados || 0} novo(s) parâmetro(s) processados.`,
        })
        carregarDados()
        carregarParametros()
        carregarNotificacoesEMarcarLidas()
      } else {
        toast({
          title: 'Aviso de Sincronização',
          description: 'A varredura foi executada e a base de normas permanece atualizada.',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Erro na varredura',
        description: err?.message || 'Falha ao consultar fontes oficiais remotas.',
        variant: 'destructive',
      })
    } finally {
      setSincronizando(false)
    }
  }

  // Lista fixa de Jurisprudência-Chave para Recuperação de Créditos (STF / STJ)
  const JURISPRUDENCIAS_CHAVE_RECUPERACAO = [
    {
      id: 'tese-re-592616-tema-118',
      tributo: 'PIS/Cofins',
      tribunal: 'STF',
      teseNumero: 'RE 592.616 / STF (Tema 118 RG)',
      dataJulgamento: '21/10/2026',
      resumo:
        'O ISS não integra a base de cálculo do PIS e da Cofins. O Plenário do STF pacificou a exclusão do imposto municipal sob repercussão geral, permitindo o levantamento e a repetição/compensação de indébitos fiscais.',
      impactoEconomico:
        'Empresas de Serviços e prestadores sujeitos ao ISS e Lucro Presumido/Real.',
      linkOficial: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=118',
      teseRecuperadorId: 'tese_pis_iss_servicos',
      ementa:
        'Recurso Extraordinário 592.616 (Tema 118 da Repercussão Geral): o ISSQN destacado na nota de prestação de serviços não compõe o faturamento nem a receita bruta da empresa prestadora, não podendo compor a base de cálculo da contribuição ao PIS/Pasep e da Cofins.',
      ano: 2026,
    },
    {
      id: 'tese-re-574706-re-594339-tema-69',
      tributo: 'PIS/Cofins',
      tribunal: 'STF',
      teseNumero: 'RE 574.706 e RE 594.339 / STF (Tema 69 RG)',
      dataJulgamento: '13/05/2021',
      resumo:
        'ICMS na base do PIS/Cofins: o ICMS destacado nas notas fiscais não integra a base de cálculo do PIS e da Cofins (Tese do Século). Modulação definida a partir de 15/03/2017, com reafirmação plena no RE 594.339.',
      impactoEconomico:
        'Comércio, Indústria, Transporte e contribuintes do ICMS no Lucro Real ou Presumido.',
      linkOficial: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=69',
      teseRecuperadorId: 'tese_pis_icms_base',
      ementa:
        'Recurso Extraordinário 574.706 e RE 594.339 (Tema 69 RG): o valor arrecadado a título de ICMS não se incorpora ao patrimônio do contribuinte e não consubstancia faturamento, motivo pelo qual é inconstitucional a sua inclusão na base de incidência do PIS e da Cofins.',
      ano: 2021,
    },
    {
      id: 'tese-stj-tema-1182-resp-1945110',
      tributo: 'ICMS',
      tribunal: 'STJ',
      teseNumero: 'Tema 1182 / STJ (REsp 1.945.110/RN)',
      dataJulgamento: '26/04/2023',
      resumo:
        'ICMS do crédito presumido e benefícios fiscais: exclusão de benefícios fiscais estaduais (crédito presumido, isenção e redução) da base de cálculo do PIS/Cofins e IRPJ/CSLL, observados os ditames da LC 160/2017.',
      impactoEconomico:
        'Indústrias e distribuidoras beneficiárias de incentivos de ICMS estaduais.',
      linkOficial:
        'https://processo.stj.jus.br/repetitivos/temas_repetitivos/pesquisa.jsp?novaConsulta=true&tipo_pesquisa=T&cod_tema_inicial=1182&cod_tema_final=1182',
      teseRecuperadorId: 'tese_pis_subvencao_icms',
      ementa:
        'Tema Repetitivo 1.182 do Superior Tribunal de Justiça: impossibilidade de exigência de demonstração prévia de concessão de estímulo à implantação/expansão de empreendimento para fruição da exclusão de benefícios de ICMS das bases de tributos federais.',
      ano: 2023,
    },
    {
      id: 'tese-stj-tema-77-resp-1075508',
      tributo: 'IPI',
      tribunal: 'STJ',
      teseNumero: 'Tema 77 / STJ (REsp 1.075.508/SC)',
      dataJulgamento: '24/06/2009',
      resumo:
        'Insumos IPI: direito ao creditamento do IPI relativo à aquisição de matérias-primas e insumos empregados na fabricação de produtos isentos ou sujeitos à alíquota zero, em respeito à não cumulatividade e art. 11 da Lei 9.779/1999.',
      impactoEconomico: 'Indústrias de transformação e montagem com etapas ou saídas desoneradas.',
      linkOficial:
        'https://processo.stj.jus.br/repetitivos/temas_repetitivos/pesquisa.jsp?novaConsulta=true&tipo_pesquisa=T&cod_tema_inicial=77&cod_tema_final=77',
      teseRecuperadorId: 'tese_pis_insumos_presumido',
      ementa:
        'Recurso Especial 1.075.508/SC julgado sob a sistemática do art. 543-C do CPC (Tema 77/STJ): é legítimo o creditamento de IPI na entrada de insumos aplicados em produtos desonerados ou à alíquota zero.',
      ano: 2009,
    },
  ]

  // Lista fixa de Legislação-Chave por Tributo do Sistema Tributário Nacional
  const LEGISLACOES_CHAVE_POR_TRIBUTO = [
    {
      tributo: 'ICMS',
      titulo: 'Lei Complementar nº 87/1996 (Lei Kandir)',
      tipo: 'Lei Complementar',
      numero: '87/1996',
      ano: 1996,
      orgao: 'Congresso Nacional',
      ementa:
        'Norma geral do ICMS no território nacional. Disciplina hipóteses de incidência, base de cálculo, não incidência em exportações, diferencial de alíquotas e compensação de créditos.',
      linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp87.htm',
      destaqueItem: 'Regra matriz nacional do ICMS e desoneração de exportações',
    },
    {
      tributo: 'ICMS',
      titulo: 'Lei Complementar nº 190/2022 (DIFAL ICMS)',
      tipo: 'Lei Complementar',
      numero: '190/2022',
      ano: 2022,
      orgao: 'Congresso Nacional',
      ementa:
        'Regulamenta o Diferencial de Alíquota do ICMS nas operações e prestações interestaduais destinadas a consumidor final não contribuinte (e-commerce e vendas B2C interestaduais).',
      linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp190.htm',
      destaqueItem: 'EC 87/2015 e partilha federativa da venda a consumidor final',
    },
    {
      tributo: 'IPI',
      titulo: 'Decreto nº 7.212/2010 (RIPI - Regulamento do IPI)',
      tipo: 'Decreto Federal',
      numero: '7.212/2010',
      ano: 2010,
      orgao: 'Presidência da República',
      ementa:
        'Consolidação do Regulamento do Imposto sobre Produtos Industrializados. Estabelece fatos geradores, equiparações industriais, regimes de suspensão e créditos da Tabela TIPI.',
      linkOficial: 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/decreto/d7212.htm',
      destaqueItem: 'Regulamento oficial completo e classificação fiscal TIPI',
    },
    {
      tributo: 'PIS/Cofins',
      titulo: 'Lei nº 10.637/2002 (PIS) e Lei nº 10.833/2003 (Cofins)',
      tipo: 'Legislação Federal Ordinária',
      numero: '10.637/02 e 10.833/03',
      ano: 2003,
      orgao: 'Presidência da República',
      ementa:
        'Instituem o regime de não-cumulatividade do PIS/Pasep (1,65%) e da Cofins (7,6%), definindo rol de insumos, créditos de depreciação, regimes monofásicos e alíquota zero.',
      linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10833.htm',
      destaqueItem: 'Regime não cumulativo do Lucro Real e tomada de créditos',
    },
    {
      tributo: 'PIS/Cofins',
      titulo: 'Instrução Normativa RFB nº 2.121/2022',
      tipo: 'Instrução Normativa',
      numero: '2.121/2022',
      ano: 2022,
      orgao: 'Receita Federal do Brasil (RFB)',
      ementa:
        'Consolidação das normas gerais de apuração, recolhimento, retenções e tomada de créditos de PIS/Pasep e Cofins em todo o território nacional.',
      linkOficial: 'https://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=127926',
      destaqueItem: 'Manual e regulamento consolidado de créditos fiscais da Receita',
    },
    {
      tributo: 'ISS',
      titulo: 'Lei Complementar nº 116/2003 (Lei Geral do ISSQN)',
      tipo: 'Lei Complementar',
      numero: '116/2003',
      ano: 2003,
      orgao: 'Congresso Nacional',
      ementa:
        'Estatuto nacional do ISSQN com Lista de Serviços Anexa, fixação de alíquota mínima (2%) e máxima (5%), local da prestação e vedações a benefícios fiscais predatórios.',
      linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm',
      destaqueItem: 'Lista de 40 subitens e competência tributária municipal',
    },
    {
      tributo: 'IRPJ',
      titulo: 'Lei nº 12.973/2014 (Adequação aos Padrões IFRS)',
      tipo: 'Lei Ordinária',
      numero: '12.973/2014',
      ano: 2014,
      orgao: 'Presidência da República',
      ementa:
        'Marco fiscal da contabilidade brasileira: alinha o IRPJ e a CSLL aos padrões internacionais IFRS, extingue o RTT, regulamenta subvenções de investimento (art. 30) e lucros no exterior.',
      linkOficial: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12973.htm',
      destaqueItem: 'Harmonização societária e fiscal IFRS para Lucro Real e Presumido',
    },
    {
      tributo: 'IRPJ',
      titulo: 'Decreto nº 9.580/2018 (RIR/2018 - Regulamento do IR)',
      tipo: 'Decreto Federal',
      numero: '9.580/2018',
      ano: 2018,
      orgao: 'Presidência da República',
      ementa:
        'Regulamenta a tributação, a fiscalização, a arrecadação e a administração do Imposto sobre a Renda de Pessoas Jurídicas (Lucro Real, Presumido, Arbitrado e Retenções).',
      linkOficial: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/decreto/d9580.htm',
      destaqueItem: 'Regulamento do Imposto de Renda em vigor na Receita Federal',
    },
    {
      tributo: 'CSLL',
      titulo: 'Lei nº 7.689/1988 (Instituição da CSLL)',
      tipo: 'Lei Ordinária',
      numero: '7.689/1988',
      ano: 1988,
      orgao: 'Presidência da República',
      ementa:
        'Institui a Contribuição Social sobre o Lucro Líquido das pessoas jurídicas e define as adições, exclusões e compensações de bases negativas na seguridade social.',
      linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/l7689.htm',
      destaqueItem: 'Norma instituidora e regras de apuração da base da CSLL',
    },
    {
      tributo: 'INSS',
      titulo: 'Lei nº 8.212/1991 (Lei Orgânica da Seguridade Social)',
      tipo: 'Lei Ordinária',
      numero: '8.212/1991',
      ano: 1991,
      orgao: 'Presidência da República',
      ementa:
        'Plano de Custeio da Previdência Social. Define as contribuições patronais (20%), RAT/FAP, contribuição de terceiros/sistema S e retenção de 11% sobre cessão de mão de obra.',
      linkOficial: 'https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm',
      destaqueItem: 'Pilar da contribuição previdenciária patronal e retenções',
    },
    {
      tributo: 'INSS',
      titulo: 'Lei nº 12.546/2011 (CPRB - Desoneração da Folha)',
      tipo: 'Lei Ordinária',
      numero: '12.546/2011',
      ano: 2011,
      orgao: 'Presidência da República',
      ementa:
        'Regime de Contribuição Previdenciária sobre a Receita Bruta (CPRB) em substituição aos 20% patronais, com regras de transição vigentes e impactos na folha.',
      linkOficial: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12546.htm',
      destaqueItem: 'Desoneração da folha por setor econômico e alíquotas substitutivas',
    },
  ]

  // Divisão: Legislações Chave da Reforma (Fixas) vs Outras Normas Encontradas
  const normasChave = itens.filter((i) => i.destaque)
  const outrasNormas = itens.filter((i) => !i.destaque)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Banner Hero Superior - Padrão Visual Diamond Group (Navy #07132B, Dourado #D4AF37, SEM ícones) */}
      <section className="bg-[#07132B] text-white pt-24 pb-16 px-4 sm:px-6 relative overflow-hidden border-b-2 border-[#D4AF37]/50 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-[1200px] mx-auto relative space-y-4">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/40 tracking-wider uppercase">
            Radar Tributário • Portal de Legislação Oficial
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight text-white max-w-3xl">
            Repositório & Pesquisa de <span className="text-[#D4AF37]">Legislação Tributária</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            Acompanhamento centralizado das normas, acórdãos e resoluções da Reforma Tributária (EC
            132/2023, LC 214/2025, PLN 24/2026 e deliberações TCU/Senado). Busca automatizada
            integrada às APIs abertas do Senado Federal e LexML.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleForcarVarredura}
              disabled={sincronizando}
              className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] font-bold text-xs h-10 px-4 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>
                {sincronizando ? 'Consultando APIs Oficiais...' : 'Atualizar Radar Agora'}
              </span>
            </Button>
            <Link
              to="/calculadora-ibs-cbs"
              className="inline-flex items-center justify-center text-xs font-bold h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/20 transition-all"
            >
              Ir para Calculadora IBS/CBS
            </Link>
          </div>
        </div>
      </section>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 mt-8 space-y-10">
        {/* QUADRO DE GRANDE DESTAQUE: RADAR DE ALERTAS & ALÍQUOTAS CBS/IBS (Padrão Diamond Group, sem ícones) */}
        <section aria-labelledby="titulo-radar-alertas">
          <div className="rounded-2xl border-2 border-[#D4AF37] bg-gradient-to-br from-[#07132B] via-[#0A1A38] to-[#07132B] text-white p-6 sm:p-8 shadow-[0_12px_40px_rgba(7,19,43,0.55)] relative overflow-hidden">
            {/* Efeitos de luz sutil no fundo */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#2ECC71]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative space-y-6">
              {/* Topo do Quadro: Tag e Título */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/30">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-[#D4AF37] text-[#07132B]">
                      Radar de Alertas • Reforma Tributária
                    </span>
                    <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-white/10 text-[#D4AF37] border border-[#D4AF37]/40">
                      Monitoramento Oficial CBS & IBS
                    </span>
                  </div>
                  <h2
                    id="titulo-radar-alertas"
                    className="text-xl sm:text-2xl lg:text-3xl font-heading font-extrabold tracking-tight text-white"
                  >
                    Alíquotas de Referência Vigentes e Propostas
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                    Parâmetros oficiais apurados pelos órgãos competentes (TCU, Senado Federal e
                    Comitê Gestor) para o período de transição da EC 132/2023 e LC 214/2025.
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Link
                    to="/calculadora-ibs-cbs"
                    className="inline-flex items-center justify-center text-xs font-bold px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Simular na Calculadora IBS/CBS
                  </Link>
                </div>
              </div>

              {/* Cards das Alíquotas CBS e IBS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* CARD 1: CBS (Contribuição sobre Bens e Serviços - Federal) */}
                {(() => {
                  const paramCbs = parametrosRadar.find(
                    (p) => p.tributo === 'CBS' && p.ano === 2027,
                  ) ||
                    parametrosRadar.find((p) => p.tributo === 'CBS') || {
                      ano: 2027,
                      tributo: 'CBS',
                      aliquota: 11.3468,
                      situacao: 'proposta' as const,
                      fonte: 'TCU - Sessão Plenária de 28/10/2026 (Processo TC 018.945/2026-8)',
                      data: '2026-10-28',
                      detalhes:
                        'O Tribunal de Contas da União (TCU) aprovou o cálculo da alíquota de referência da CBS em 11,3468% para 2027. O Senado Federal tem até 15/12/2026 para fixar por Resolução.',
                    }

                  const isFixada = paramCbs.situacao === 'fixada'
                  const formatData = paramCbs.data
                    ? new Date(paramCbs.data).toLocaleDateString('pt-BR')
                    : '28/10/2026'

                  return (
                    <div className="rounded-xl bg-white/5 border border-[#D4AF37]/50 p-5 sm:p-6 space-y-4 hover:bg-white/[0.08] transition-all">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-extrabold text-base sm:text-lg text-white">
                            {paramCbs.tributo} • Ano {paramCbs.ano}
                          </span>
                          <span className="text-[11px] font-mono text-slate-300">
                            (Esfera Federal)
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                            isFixada
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                              : 'bg-amber-500/20 text-[#D4AF37] border border-[#D4AF37]/40'
                          }`}
                        >
                          Situação: {isFixada ? 'Fixada' : 'Proposta'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl sm:text-4xl lg:text-5xl font-mono font-extrabold text-[#D4AF37] tracking-tight">
                            {paramCbs.aliquota.toFixed(4)}%
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            alíquota de referência
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-medium pt-1">
                          {paramCbs.detalhes ||
                            `Alíquota de referência calculada para ${paramCbs.tributo} com vigência prevista a partir de ${paramCbs.ano}.`}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs text-slate-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-slate-400 font-medium">Fonte Oficial:</span>
                          <span className="font-mono text-[#D4AF37] text-right font-semibold">
                            {paramCbs.fonte}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-400 font-medium">Data do Parâmetro:</span>
                          <span className="font-mono text-slate-200 font-semibold">
                            {formatData}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* CARD 2: IBS (Imposto sobre Bens e Serviços - Estados e Municípios) */}
                {(() => {
                  const paramIbs = parametrosRadar.find(
                    (p) => p.tributo === 'IBS' && p.ano === 2027,
                  ) ||
                    parametrosRadar.find((p) => p.tributo === 'IBS') || {
                      ano: 2027,
                      tributo: 'IBS',
                      aliquota: 0.1,
                      situacao: 'fixada' as const,
                      fonte: 'LC 214/2025 art. 348 e ADCT art. 128 (Senado / Comitê Gestor)',
                      data: '2025-01-15',
                      detalhes:
                        'Alíquota de teste compensável estadual e municipal de 0,10% (0,05% Estados e 0,05% Municípios) para o ano de 2027, com compensação na CBS ou recolhimento oficial.',
                    }

                  const isFixada = paramIbs.situacao === 'fixada'
                  const formatData = paramIbs.data
                    ? new Date(paramIbs.data).toLocaleDateString('pt-BR')
                    : '15/01/2025'

                  return (
                    <div className="rounded-xl bg-white/5 border border-[#D4AF37]/50 p-5 sm:p-6 space-y-4 hover:bg-white/[0.08] transition-all">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-extrabold text-base sm:text-lg text-white">
                            {paramIbs.tributo} • Ano {paramIbs.ano}
                          </span>
                          <span className="text-[11px] font-mono text-slate-300">
                            (Estados & Municípios)
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                            isFixada
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                              : 'bg-amber-500/20 text-[#D4AF37] border border-[#D4AF37]/40'
                          }`}
                        >
                          Situação: {isFixada ? 'Fixada' : 'Proposta'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl sm:text-4xl lg:text-5xl font-mono font-extrabold text-[#D4AF37] tracking-tight">
                            {paramIbs.aliquota.toFixed(2)}%
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            alíquota de teste compensável
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-medium pt-1">
                          {paramIbs.detalhes ||
                            `Alíquota oficial de teste de ${paramIbs.tributo} para ${paramIbs.ano}, nos termos da Lei Complementar nº 214/2025.`}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs text-slate-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-slate-400 font-medium">Fonte Oficial:</span>
                          <span className="font-mono text-[#D4AF37] text-right font-semibold">
                            {paramIbs.fonte}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-400 font-medium">Data do Parâmetro:</span>
                          <span className="font-mono text-slate-200 font-semibold">
                            {formatData}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* SEÇÃO INTERNA EM GRANDE DESTAQUE: ALERTAS E NOTIFICAÇÕES DO RADAR TRIBUTÁRIO */}
              <div className="pt-2 border-t border-[#D4AF37]/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
                    <h3 className="font-heading font-bold text-base sm:text-lg text-white">
                      Alertas Recentes do Radar Tributário
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-[#D4AF37]">
                    {carregandoNotificacoes
                      ? 'Consultando avisos...'
                      : `${notificacoesRadar.length} alerta(s) registrado(s)`}
                  </span>
                </div>

                {carregandoNotificacoes ? (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-slate-400 font-mono">
                    Carregando avisos do Radar...
                  </div>
                ) : notificacoesRadar.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-slate-400 font-mono">
                    Nenhum alerta tributário pendente. Acompanhamento automático ativo às
                    segundas-feiras.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {notificacoesRadar.map((notif) => {
                      const dataFormatada = notif.created
                        ? new Date(notif.created).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : ''

                      return (
                        <div
                          key={notif.id}
                          className="rounded-xl bg-white/[0.07] hover:bg-white/[0.10] border border-[#D4AF37]/40 p-4 sm:p-5 flex flex-col justify-between space-y-3 shadow-md transition-all"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {notif.tributo && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#D4AF37] text-[#07132B]">
                                    {notif.tributo}
                                    {notif.ano ? ` • ${notif.ano}` : ''}
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white/10 text-slate-200 border border-white/20">
                                  {notif.tipo === 'aliquota_nova'
                                    ? 'Nova Alíquota Detectada'
                                    : notif.tipo === 'alerta_senado'
                                      ? 'Alerta do Senado'
                                      : notif.tipo === 'tese_jurisprudencia'
                                        ? 'Jurisprudência Favorável'
                                        : 'Legislação Nova'}
                                </span>
                              </div>

                              {dataFormatada && (
                                <span className="text-[11px] font-mono text-slate-400">
                                  {dataFormatada}
                                </span>
                              )}
                            </div>

                            <h4 className="font-heading font-bold text-sm sm:text-base text-white leading-snug">
                              {notif.titulo}
                            </h4>

                            {typeof notif.aliquota === 'number' && (
                              <div className="inline-flex items-baseline gap-1.5 px-2.5 py-1 rounded-lg bg-[#07132B] border border-[#D4AF37]/40">
                                <span className="text-xs text-slate-400 font-mono">
                                  Alíquota apurada:
                                </span>
                                <span className="text-base font-mono font-extrabold text-[#D4AF37]">
                                  {notif.aliquota.toFixed(4)}%
                                </span>
                              </div>
                            )}

                            <p className="text-xs text-slate-200 leading-relaxed font-normal">
                              {notif.mensagem}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            {notif.fonte ? (
                              <span className="text-[11px] text-[#D4AF37] font-mono font-medium">
                                Fonte: {notif.fonte}
                              </span>
                            ) : (
                              <span />
                            )}
                            {notif.tipo === 'tese_jurisprudencia' || notif.link_acao ? (
                              <Link
                                to={notif.link_acao || '/recuperador-creditos'}
                                className="inline-flex items-center text-[11px] font-bold text-[#D4AF37] hover:underline"
                              >
                                Recuperar este crédito →
                              </Link>
                            ) : (
                              <Link
                                to="/calculadora-ibs-cbs"
                                className="inline-flex items-center text-[11px] font-bold text-[#D4AF37] hover:underline"
                              >
                                Aplicar na Calculadora →
                              </Link>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Rodapé informativo do Radar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-white/10 text-[11px] text-slate-400 font-mono">
                <span>
                  Sincronização: monitoramento semanal automático integrado com TCU, Senado e LexML.
                </span>
                <span className="text-[#D4AF37]">
                  Parâmetros refletidos automaticamente na Calculadora IBS/CBS.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* BARRA DE BUSCA E FILTROS */}
        <Card className="border-slate-200 shadow-md bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-[#07132B]">
              Filtros de Pesquisa Normativa
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Campo de Busca Livre */}
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Termo de Busca (Número, Ementa ou Assunto)
                </label>
                <Input
                  type="text"
                  placeholder="Ex: CBS, 11,3468, LC 214, crédito presumido..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              {/* Filtro: Tributo */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Tributo</label>
                <Select value={filtroTributo} onValueChange={setFiltroTributo}>
                  <SelectTrigger className="h-10 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos os tributos</SelectItem>
                    <SelectItem value="ICMS">ICMS</SelectItem>
                    <SelectItem value="IPI">IPI</SelectItem>
                    <SelectItem value="PIS/Cofins">PIS/Cofins</SelectItem>
                    <SelectItem value="ISS">ISS</SelectItem>
                    <SelectItem value="IRPJ">IRPJ</SelectItem>
                    <SelectItem value="CSLL">CSLL</SelectItem>
                    <SelectItem value="INSS">INSS</SelectItem>
                    <SelectItem value="IBS">IBS</SelectItem>
                    <SelectItem value="CBS">CBS</SelectItem>
                    <SelectItem value="GERAL">Geral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro: Ano */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Ano da Norma
                </label>
                <Select value={filtroAno} onValueChange={setFiltroAno}>
                  <SelectTrigger className="h-10 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos os anos</SelectItem>
                    <SelectItem value="2027">2027 (Transição CBS)</SelectItem>
                    <SelectItem value="2026">2026 (Fixação e Teste)</SelectItem>
                    <SelectItem value="2025">2025 (LC 214)</SelectItem>
                    <SelectItem value="2023">2023 (EC 132)</SelectItem>
                    <SelectItem value="2022">2022 (LC 190 / IN 2121)</SelectItem>
                    <SelectItem value="2018">2018 (RIR/2018)</SelectItem>
                    <SelectItem value="2014">2014 (Lei 12.973)</SelectItem>
                    <SelectItem value="2011">2011 (CPRB / Lei 12.546)</SelectItem>
                    <SelectItem value="2010">2010 (RIPI)</SelectItem>
                    <SelectItem value="2003">2003 (LC 116 / Lei 10.833)</SelectItem>
                    <SelectItem value="2002">2002 (Lei 10.637)</SelectItem>
                    <SelectItem value="1996">1996 (LC 87 Kandir)</SelectItem>
                    <SelectItem value="1995">1995 (Lei 9.249)</SelectItem>
                    <SelectItem value="1991">1991 (Lei 8.212)</SelectItem>
                    <SelectItem value="1988">1988 (Lei 7.689)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtro: Tipo de Ato */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="font-semibold text-slate-500 mr-2">Tipo de Ato:</span>
              {[
                { id: 'todos', label: 'Todos os tipos' },
                { id: 'emenda', label: 'Emenda Constitucional' },
                { id: 'complementar', label: 'Lei Complementar' },
                { id: 'projeto', label: 'Projetos de Lei / PLN' },
                { id: 'resolucao', label: 'Resoluções do Senado' },
                { id: 'acordao', label: 'Acórdão / TCU' },
                { id: 'jurisprudencia', label: 'Jurisprudência / Teses' },
              ].map((tp) => (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => setFiltroTipo(tp.id)}
                  className={`px-3 py-1 rounded-full font-medium transition-all ${
                    filtroTipo === tp.id
                      ? 'bg-[#07132B] text-[#D4AF37] font-bold shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tp.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO FIXA: JURISPRUDÊNCIA-CHAVE PARA RECUPERAÇÃO DE CRÉDITOS (PADRÃO DIAMOND GROUP, SEM ÍCONES) */}
        <section aria-labelledby="titulo-jurisprudencia-chave" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-[#D4AF37] gap-2">
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/40 mb-1">
                Teses Vinculantes STF & STJ • Repercussão Geral
              </div>
              <h2
                id="titulo-jurisprudencia-chave"
                className="text-xl sm:text-2xl lg:text-3xl font-heading font-extrabold text-[#07132B]"
              >
                Jurisprudência-Chave para Recuperação de Créditos
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-[#07132B] text-[#D4AF37] px-3 py-1.5 rounded-xl border border-[#D4AF37]/40">
                4 teses geradoras de crédito
              </span>
              <Link
                to="/recuperador-creditos"
                className="hidden sm:inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2e] text-[#07132B] shadow-sm transition-all"
              >
                Abrir Recuperador de Créditos →
              </Link>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
            Teses tributárias pacificadas nos Tribunais Superiores com efeito vinculante ou
            repercussão geral favorável ao contribuinte. As teses abaixo geram direito líquido e
            certo ao levantamento e recuperação de indébito dos últimos 60 meses com atualização
            oficial pela taxa SELIC.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {JURISPRUDENCIAS_CHAVE_RECUPERACAO.map((tese) => {
              return (
                <div
                  key={tese.id}
                  className="rounded-2xl border-2 border-[#07132B]/15 hover:border-[#D4AF37] bg-white p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#07132B] text-[#D4AF37]">
                          Tributo: {tese.tributo}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {tese.tribunal}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        Julgamento: {tese.dataJulgamento}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#07132B] leading-snug">
                        {tese.teseNumero}
                      </h3>
                      <p className="text-[11px] font-mono text-[#D4AF37] font-semibold mt-0.5">
                        {tese.impactoEconomico}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
                        Resumo da Tese:
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {tese.resumo}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                      <Link
                        to={`/recuperador-creditos?tese=${encodeURIComponent(tese.teseRecuperadorId)}`}
                        className="font-heading font-bold text-xs text-[#07132B] hover:text-[#D4AF37] bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-[#D4AF37]/50 transition-colors"
                      >
                        Recuperar este crédito →
                      </Link>

                      <a
                        href={tese.linkOficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-slate-600 hover:text-[#07132B] underline decoration-1 underline-offset-2 transition-colors"
                      >
                        Ver acórdão oficial no {tese.tribunal}
                      </a>
                    </div>

                    {/* Botão e Bloco "Gerar Explicação" em Linguagem Leiga (com cache) */}
                    <CardExplicacaoLegislacao
                      norma={{
                        chave_norma: derivarChaveNorma({
                          id: tese.id,
                          titulo: tese.teseNumero,
                          tributo: tese.tributo,
                          ano: tese.ano,
                        }),
                        titulo: tese.teseNumero,
                        ementa: `${tese.resumo} Fundamento: ${tese.ementa}`,
                        tipo: `Jurisprudência / ${tese.tribunal}`,
                        numero: tese.teseNumero,
                        ano: tese.ano,
                        tributo: tese.tributo,
                        orgao: tese.tribunal,
                        link_oficial: tese.linkOficial,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* SEÇÃO 1: LEGISLAÇÃO-CHAVE DA REFORMA TRIBUTÁRIA (FIXA E OBRIGATÓRIA) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-[#D4AF37]">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#D4AF37]">
                Marco Legal Fundamental
              </span>
              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#07132B]">
                Legislação-Chave da Reforma Tributária
              </h2>
            </div>
            <span className="text-xs font-mono font-bold bg-[#07132B] text-white px-3 py-1 rounded-lg">
              {normasChave.length} normas fundamentais
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {normasChave.map((norma) => (
              <div
                key={norma.id}
                className="bg-white rounded-2xl border-2 border-slate-200 hover:border-[#D4AF37] shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#07132B] text-[#D4AF37]">
                      {norma.tipo}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {norma.dataPublicacao}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-base text-[#07132B] leading-tight">
                    {norma.titulo}
                  </h3>

                  <p className="text-xs text-slate-500 font-medium">
                    Órgão: <span className="text-slate-700 font-semibold">{norma.orgao}</span>
                  </p>

                  <p className="text-xs text-slate-600 leading-relaxed pt-1">{norma.ementa}</p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] font-bold text-[#07132B]">
                      Tributo: {norma.tributo}
                    </span>
                    <a
                      href={norma.linkOficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#07132B] hover:text-[#D4AF37] underline decoration-1 underline-offset-2 transition-colors"
                    >
                      Acessar Texto Oficial →
                    </a>
                  </div>

                  {/* Botão e Bloco "Gerar Explicação" — Reforma Tributária */}
                  <CardExplicacaoLegislacao
                    norma={{
                      chave_norma: derivarChaveNorma(norma),
                      titulo: norma.titulo,
                      ementa: norma.ementa,
                      tipo: norma.tipo,
                      numero: norma.numero,
                      ano: norma.ano,
                      tributo: norma.tributo,
                      orgao: norma.orgao,
                      link_oficial: norma.linkOficial,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEÇÃO 2: LEGISLAÇÃO-CHAVE POR TRIBUTO (SISTEMA TRIBUTÁRIO ATUAL / ESTATUTOS) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-slate-300">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                Estatutos & Legislação Estruturante
              </span>
              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#07132B]">
                Legislação-Chave por Tributo
              </h2>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-800 text-white px-3 py-1 rounded-lg">
              {
                LEGISLACOES_CHAVE_POR_TRIBUTO.filter((item) => {
                  if (filtroTributo === 'TODOS' || filtroTributo === 'GERAL') return true
                  return item.tributo.toUpperCase() === filtroTributo.toUpperCase()
                }).length
              }{' '}
              normas de referência
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Consulte os marcos regulatórios consolidados dos tributos vigentes (ICMS, IPI,
            PIS/Cofins, ISS, IRPJ, CSLL e INSS), incluindo a Lei Kandir (LC 87/96), Lei 12.973/2014,
            regulamentos e leis de apuração aplicáveis à rotina fiscal das empresas.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LEGISLACOES_CHAVE_POR_TRIBUTO.filter((item) => {
              if (filtroTributo === 'TODOS' || filtroTributo === 'GERAL') return true
              return item.tributo.toUpperCase() === filtroTributo.toUpperCase()
            }).map((item, idx) => (
              <div
                key={`${item.tributo}-${idx}`}
                className="bg-white rounded-xl border border-slate-200 hover:border-[#D4AF37] shadow-sm hover:shadow-md transition-all p-4 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#07132B] text-[#D4AF37]">
                      {item.tributo}
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-slate-500">
                      Ano: {item.ano}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-sm text-[#07132B] leading-snug">
                    {item.titulo}
                  </h3>

                  <div className="text-[11px] font-semibold text-[#D4AF37] bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    {item.destaqueItem}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pt-1">{item.ementa}</p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-medium text-slate-500">{item.orgao}</span>
                    <a
                      href={item.linkOficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#07132B] hover:text-[#D4AF37] underline decoration-1 underline-offset-2 transition-colors"
                    >
                      Texto Integral →
                    </a>
                  </div>

                  {/* Botão e Bloco "Gerar Explicação" — Legislação-Chave por Tributo */}
                  <CardExplicacaoLegislacao
                    compacto
                    norma={{
                      chave_norma: derivarChaveNorma({
                        titulo: item.titulo,
                        numero: item.numero,
                        ano: item.ano,
                        tributo: item.tributo,
                      }),
                      titulo: item.titulo,
                      ementa: item.ementa,
                      tipo: item.tipo,
                      numero: item.numero,
                      ano: item.ano,
                      tributo: item.tributo,
                      orgao: item.orgao,
                      link_oficial: item.linkOficial,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEÇÃO 3: RESULTADOS DE BUSCA / OUTRAS MATÉRIAS ENCONTRADAS */}
        {outrasNormas.length > 0 && (
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h2 className="text-lg sm:text-xl font-heading font-bold text-[#07132B]">
                Outras Normas & Proposições Relacionadas
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {outrasNormas.length} resultado(s)
              </span>
            </div>

            <div className="space-y-3">
              {outrasNormas.map((norma) => (
                <div
                  key={norma.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-all space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-bold text-sm text-[#07132B]">{norma.titulo}</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {norma.dataPublicacao}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{norma.ementa}</p>
                  <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-100">
                    <span className="text-slate-500 text-[11px]">
                      {norma.orgao} • {norma.tributo}
                    </span>
                    <a
                      href={norma.linkOficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#07132B] hover:text-[#D4AF37] underline"
                    >
                      Ver documento
                    </a>
                  </div>

                  {/* Botão e Bloco "Gerar Explicação" — Resultados de Busca Automática / LexML / Senado */}
                  <CardExplicacaoLegislacao
                    norma={{
                      chave_norma: derivarChaveNorma(norma),
                      titulo: norma.titulo,
                      ementa: norma.ementa,
                      tipo: norma.tipo,
                      numero: norma.numero,
                      ano: norma.ano,
                      tributo: norma.tributo,
                      orgao: norma.orgao,
                      link_oficial: norma.linkOficial,
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {carregando && (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            Carregando repositório de legislação...
          </div>
        )}
      </main>
    </div>
  )
}
