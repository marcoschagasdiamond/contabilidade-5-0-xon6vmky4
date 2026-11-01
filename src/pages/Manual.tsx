import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { SECOES_MANUAL } from '@/data/manualData'
import { gerarManualPDF } from '@/lib/pdfManualSistema'
import { useToast } from '@/hooks/use-toast'

type PerfilFiltro = 'todos' | 'empresario' | 'analista' | 'admin'

export default function Manual() {
  const { user, nivelAcesso } = useAuth()
  const { toast } = useToast()

  // Determinar perfil sugerido com base no login
  const perfilInicial: PerfilFiltro = useMemo(() => {
    if (nivelAcesso === 'master' || nivelAcesso === 'admin') return 'todos'
    if (nivelAcesso === 'analista') return 'analista'
    return 'empresario'
  }, [nivelAcesso])

  const [filtroPerfil, setFiltroPerfil] = useState<PerfilFiltro>(perfilInicial)
  const [secaoAtiva, setSecaoAtiva] = useState<string>(SECOES_MANUAL[0].id)
  const [menuMobileAberto, setMenuMobileAberto] = useState<boolean>(false)
  const [gerandoPdf, setGerandoPdf] = useState<boolean>(false)

  // Filtrar seções pelo perfil selecionado
  const secoesFiltradas = useMemo(() => {
    if (filtroPerfil === 'todos') return SECOES_MANUAL
    return SECOES_MANUAL.filter((secao) => {
      if (filtroPerfil === 'empresario') return secao.perfis.includes('empresario')
      if (filtroPerfil === 'analista')
        return secao.perfis.includes('analista') || secao.perfis.includes('empresario')
      if (filtroPerfil === 'admin') return true
      return true
    })
  }, [filtroPerfil])

  // Ajustar seção ativa caso o filtro mude e a seção suma
  useEffect(() => {
    if (!secoesFiltradas.some((s) => s.id === secaoAtiva)) {
      if (secoesFiltradas.length > 0) {
        setSecaoAtiva(secoesFiltradas[0].id)
      }
    }
  }, [secoesFiltradas, secaoAtiva])

  // Observador de scroll para destacar a seção ativa no desktop
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160
      for (const secao of secoesFiltradas) {
        const el = document.getElementById(secao.id)
        if (el) {
          const top = el.offsetTop
          const height = el.offsetHeight
          if (scrollPosition >= top && scrollPosition < top + height) {
            setSecaoAtiva(secao.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [secoesFiltradas])

  const scrollToSecao = (id: string) => {
    setSecaoAtiva(id)
    setMenuMobileAberto(false)
    const el = document.getElementById(id)
    if (el) {
      const yOffset = -90
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  const handleBaixarPdf = () => {
    try {
      setGerandoPdf(true)
      const secoesParaPdf = secoesFiltradas.map((s) => ({
        id: s.id,
        titulo: s.titulo,
        subtitulo: s.subtitulo,
        conteudo: s.conteudo,
        itensDestaque: s.itensDestaque,
        tabela: s.tabela,
      }))

      gerarManualPDF({
        perfilFiltro: filtroPerfil,
        secoes: secoesParaPdf,
        usuarioNome: user?.name || user?.email || 'Usuário Diamond Group',
        perfilUsuario: nivelAcesso || 'empresario',
      })

      toast({
        title: 'Manual gerado com sucesso',
        description: 'O arquivo PDF foi gerado no navegador e salvo no seu computador.',
      })
    } catch (err) {
      console.error('Erro ao gerar manual em PDF:', err)
      toast({
        title: 'Falha na geração do PDF',
        description: 'Ocorreu um erro ao compilar o manual em PDF. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setGerandoPdf(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#07132B] text-slate-100 selection:bg-[#D4AF37]/30 selection:text-white">
      {/* HEADER PRINCIPAL PADRÃO DIAMOND GROUP (SEM ÍCONES) */}
      <section className="relative pt-28 pb-14 px-4 sm:px-6 lg:px-8 border-b border-[#D4AF37]/30 overflow-hidden bg-gradient-to-b from-[#0A1A13] via-[#07132B] to-[#07132B]">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#145A32] blur-3xl" />
          <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-[#D4AF37] blur-3xl opacity-30" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Breadcrumb discreto */}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono uppercase tracking-wider mb-4">
            <Link to="/" className="hover:text-[#D4AF37] transition-colors">
              Início
            </Link>
            <span className="text-[#D4AF37]">•</span>
            <span className="text-white font-semibold">Manual do Sistema</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 uppercase">
                DIAMOND GROUP • MANUAL OFICIAL OPERACIONAL
              </div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight leading-tight">
                Manual do Sistema Contabilidade <span className="text-[#2ECC71]">5.0</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                Guia completo e estruturado por perfil de acesso (Empresário, Analista, Admin e
                Master). Documentação oficial cobrindo site, trilha de diagnósticos 00–06,
                Calculadora IBS/CBS, Recuperador de Créditos, Legislação, Relatórios, CRM e Back
                Office.
              </p>
            </div>

            {/* AÇÕES DE TOPO: FILTROS DE PERFIL E BOTÃO DE PDF */}
            <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={handleBaixarPdf}
                disabled={gerandoPdf}
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-[#07132B] bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] hover:brightness-110 shadow-lg shadow-[#D4AF37]/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {gerandoPdf ? 'Gerando manual em PDF...' : 'Baixar manual em PDF'}
              </button>
            </div>
          </div>

          {/* BARRA DE FILTRO POR PERFIL */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-[#D4AF37]">
                Visualização por perfil:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltroPerfil('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  filtroPerfil === 'todos'
                    ? 'bg-[#D4AF37] text-[#07132B] shadow-sm'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                Todos os Perfis (Geral)
              </button>
              <button
                type="button"
                onClick={() => setFiltroPerfil('empresario')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  filtroPerfil === 'empresario'
                    ? 'bg-[#D4AF37] text-[#07132B] shadow-sm'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                Empresário / Cliente (R$ 127/mês)
              </button>
              <button
                type="button"
                onClick={() => setFiltroPerfil('analista')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  filtroPerfil === 'analista'
                    ? 'bg-[#D4AF37] text-[#07132B] shadow-sm'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                Analista (R$ 347/mês)
              </button>
              <button
                type="button"
                onClick={() => setFiltroPerfil('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  filtroPerfil === 'admin'
                    ? 'bg-[#D4AF37] text-[#07132B] shadow-sm'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                Admin & Master
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTROLE MOBILE: DRAWER / ACCORDION DE SEÇÕES */}
      <div className="lg:hidden sticky top-[72px] z-30 bg-[#07132B]/95 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={() => setMenuMobileAberto(!menuMobileAberto)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/10 border border-[#D4AF37]/30 text-xs font-bold text-white tracking-wide"
        >
          <span>Navegar por Seções ({secoesFiltradas.length} tópicos)</span>
          <span className="text-[#D4AF37]">{menuMobileAberto ? '▲ Fechar' : '▼ Abrir'}</span>
        </button>

        {menuMobileAberto && (
          <div className="mt-2 p-3 rounded-xl bg-[#0A1A13] border border-white/15 max-h-[60vh] overflow-y-auto space-y-1">
            {secoesFiltradas.map((secao) => (
              <button
                key={secao.id}
                type="button"
                onClick={() => scrollToSecao(secao.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                  secaoAtiva === secao.id
                    ? 'bg-[#D4AF37] text-[#07132B] font-bold'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {secao.titulo}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CORPO DO MANUAL: SIDEBAR NAVEGÁVEL + CONTEÚDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* SIDEBAR FIXA EM DESKTOP */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-28 space-y-4">
            <div className="p-4 rounded-2xl bg-[#0A1A13] border border-[#D4AF37]/30 shadow-xl">
              <div className="pb-3 border-b border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] block">
                  Índice Geral do Manual
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Exibindo {secoesFiltradas.length} seções ativas
                </span>
              </div>

              <nav className="mt-3 space-y-1 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
                {secoesFiltradas.map((secao) => {
                  const isActive = secaoAtiva === secao.id
                  return (
                    <button
                      key={secao.id}
                      type="button"
                      onClick={() => scrollToSecao(secao.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex flex-col gap-0.5 ${
                        isActive
                          ? 'bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#07132B] font-bold shadow-md shadow-[#D4AF37]/15 translate-x-1'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="truncate leading-snug">{secao.titulo}</span>
                      <span
                        className={`text-[10px] truncate ${
                          isActive ? 'text-[#07132B]/80 font-medium' : 'text-slate-400'
                        }`}
                      >
                        {secao.subtitulo}
                      </span>
                    </button>
                  )
                })}
              </nav>

              <div className="pt-3 mt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleBaixarPdf}
                  disabled={gerandoPdf}
                  className="w-full text-center py-2 px-3 rounded-lg text-xs font-bold text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] transition-colors shadow-sm disabled:opacity-50"
                >
                  {gerandoPdf ? 'Gerando PDF...' : 'Baixar manual completo (PDF)'}
                </button>
              </div>
            </div>
          </aside>

          {/* ÁREA DE CONTEÚDO DAS SEÇÕES */}
          <main className="lg:col-span-8 space-y-12">
            {secoesFiltradas.map((secao) => (
              <section
                key={secao.id}
                id={secao.id}
                className="scroll-mt-24 p-6 sm:p-8 rounded-2xl bg-[#0A1A13]/80 border border-white/10 hover:border-[#D4AF37]/40 transition-all shadow-xl"
              >
                {/* CABEÇALHO DA SEÇÃO */}
                <div className="pb-4 border-b border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#D4AF37]">
                      Seção Documentada
                    </span>

                    {/* BADGES DOS PERFIS */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {secao.perfis.map((p) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-white/5 text-slate-300 border border-white/10"
                        >
                          {p === 'empresario'
                            ? 'Empresário'
                            : p === 'analista'
                              ? 'Analista'
                              : p === 'admin'
                                ? 'Admin'
                                : 'Master'}
                        </span>
                      ))}
                    </div>
                  </div>

                  <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-white tracking-tight">
                    {secao.titulo}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#D4AF37] font-medium leading-relaxed">
                    {secao.subtitulo}
                  </p>
                </div>

                {/* TEXTO CORRIDO E LISTAS COM MARCADORES PADRONIZADOS */}
                <div className="mt-5 space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  {secao.conteudo.map((p, idx) => {
                    const isBullet = p.startsWith('• ')
                    if (isBullet) {
                      const semBullet = p.slice(2)
                      const partes = semBullet.split(': ')
                      const rotulo = partes.length > 1 ? partes[0] : null
                      const textoResto = partes.length > 1 ? partes.slice(1).join(': ') : semBullet

                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-[#D4AF37]/30 transition-colors"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0 mt-2" />
                          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                            {rotulo && (
                              <strong className="text-white font-semibold mr-1.5">{rotulo}:</strong>
                            )}
                            <span className="text-slate-300">{textoResto}</span>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <p key={idx} className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {p}
                      </p>
                    )
                  })}
                </div>

                {/* TABELA OPCIONAL (EX: TABELA DE PERFIS) */}
                {secao.tabela && (
                  <div className="mt-6 overflow-x-auto rounded-xl border border-white/15">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-[#07132B] text-white uppercase text-[10px] tracking-wider font-bold border-b border-white/10">
                        <tr>
                          {secao.tabela.cabecalhos.map((c, idx) => (
                            <th key={idx} className="py-3 px-3.5">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {secao.tabela.linhas.map((linha, lIdx) => (
                          <tr
                            key={lIdx}
                            className={lIdx % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'}
                          >
                            {linha.map((celula, cIdx) => (
                              <td
                                key={cIdx}
                                className={`py-3 px-3.5 align-top ${
                                  cIdx === 0
                                    ? 'font-bold text-white whitespace-nowrap'
                                    : cIdx === 1
                                      ? 'text-[#2ECC71] font-semibold whitespace-nowrap'
                                      : 'text-slate-300'
                                }`}
                              >
                                {celula}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ITENS DE DESTAQUE / CARDS DA SEÇÃO */}
                {secao.itensDestaque && secao.itensDestaque.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                      Pontos Estratégicos & Regras Operacionais:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {secao.itensDestaque.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#D4AF37]/30 transition-colors space-y-1"
                        >
                          <span className="text-xs font-bold text-[#D4AF37] block">
                            {item.rotulo}
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed font-normal">
                            {item.descricao}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ))}

            {/* QUADRO DE ENCERRAMENTO COM DOWNLOAD DO PDF */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#07132B] via-[#0E2442] to-[#14345C] border border-[#D4AF37]/40 shadow-2xl text-center space-y-4">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 uppercase">
                DOCUMENTO EXECUTIVO OFICIAL
              </span>
              <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-white">
                Deseja salvar ou imprimir este manual completo?
              </h3>
              <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-300 leading-relaxed">
                Você pode baixar a versão integral diagramada no padrão executivo Diamond Group em
                formato PDF, ideal para leitura offline, treinamento de analistas e apresentação a
                clientes.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleBaixarPdf}
                  disabled={gerandoPdf}
                  className="px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-[#07132B] bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] hover:brightness-110 shadow-lg shadow-[#D4AF37]/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {gerandoPdf ? 'Gerando arquivo PDF...' : 'Baixar manual completo em PDF'}
                </button>
                <Link
                  to="/diagnosticos"
                  className="px-5 py-3.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
                >
                  Ir para a Trilha de Diagnósticos
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
