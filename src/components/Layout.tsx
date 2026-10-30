import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import {
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Instagram,
  Linkedin,
  Facebook,
  MessageCircle,
  ArrowRight,
  Shield,
  FileCheck,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import { ModalMigrarParaAnalista } from '@/components/ModalMigrarParaAnalista'
import {
  listarNotificacoesTributarias,
  marcarNotificacaoComoLida,
  NotificacaoTributaria,
} from '@/services/radarTributario'

export default function Layout() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [modalMigrarAberto, setModalMigrarAberto] = useState(false)
  const [isMobileUserSectionOpen, setIsMobileUserSectionOpen] = useState(true)
  const [notificacoesRadar, setNotificacoesRadar] = useState<NotificacaoTributaria[]>([])
  const userMenuRef = useRef<HTMLDivElement>(null)
  const userMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, isAdmin, isMaster, isEmpresario, logout } = useAuth()
  const { temDadosSalvos } = useDadosEmpresa()

  const nomeExibicao = (user as any)?.name || user?.email?.split('@')[0] || 'Usuário'
  const badgePerfilTexto = isEmpresario ? 'Empresário' : 'Analista'

  const handleLogout = () => {
    setIsMobileMenuOpen(false)
    setIsUserMenuOpen(false)
    logout()
    navigate('/')
  }

  const handleMouseEnterUserMenu = () => {
    if (userMenuTimeoutRef.current) {
      clearTimeout(userMenuTimeoutRef.current)
      userMenuTimeoutRef.current = null
    }
    setIsUserMenuOpen(true)
  }

  const handleMouseLeaveUserMenu = () => {
    if (userMenuTimeoutRef.current) {
      clearTimeout(userMenuTimeoutRef.current)
    }
    userMenuTimeoutRef.current = setTimeout(() => {
      setIsUserMenuOpen(false)
    }, 180)
  }

  const handleToolNav = (e: React.MouseEvent<HTMLAnchorElement>, destino: string) => {
    e.preventDefault()
    setIsMobileMenuOpen(false)
    setIsUserMenuOpen(false)
    if (!temDadosSalvos) {
      // Leva ao formulário de dados da empresa com retorno configurado
      navigate(`/dados-empresa?destino=${encodeURIComponent(destino)}`)
    } else {
      navigate(destino)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsUserMenuOpen(false)
  }, [location.pathname])

  // Carregar notificações do Radar Tributário
  useEffect(() => {
    let montado = true
    const carregar = async () => {
      try {
        const notifs = await listarNotificacoesTributarias()
        if (montado) setNotificacoesRadar(notifs)
      } catch (err) {
        console.warn('Erro ao listar notificações no Layout:', err)
      }
    }
    carregar()
    return () => {
      montado = false
    }
  }, [location.pathname])

  // Quando o usuário abre /legislacao, zera os alertas não vistos marcando as notificações como lidas
  useEffect(() => {
    if (location.pathname.startsWith('/legislacao')) {
      const naoLidasAtuais = notificacoesRadar.filter((n) => !n.lida)
      if (naoLidasAtuais.length > 0) {
        // Atualiza estado local imediatamente para zerar o badge
        setNotificacoesRadar((prev) => prev.map((n) => ({ ...n, lida: true })))
        // Persiste a leitura das notificações no backend
        naoLidasAtuais.forEach((notif) => {
          marcarNotificacaoComoLida(notif.id).catch((err) => {
            console.warn('[Layout] Erro ao marcar notificação como lida na /legislacao:', err)
          })
        })
      }
    }
  }, [location.pathname, notificacoesRadar])

  const naoLidas = notificacoesRadar.filter((n) => !n.lida).length

  // Close desktop dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (userMenuTimeoutRef.current) {
        clearTimeout(userMenuTimeoutRef.current)
      }
    }
  }, [isUserMenuOpen])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    setIsMobileMenuOpen(false)
    setIsUserMenuOpen(false)

    if (location.pathname === '/') {
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      navigate(`/#${targetId}`)
    }
  }

  // Handle hash scrolling on page load
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      setTimeout(() => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }, [location])

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-800 antialiased selection:bg-[#2ECC71] selection:text-slate-900">
      {/* HEADER */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0A140F]/95 shadow-lg backdrop-blur-md py-3 border-b border-white/10'
            : 'bg-[#0A140F]/85 backdrop-blur-sm py-4 border-b border-white/5'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* LOGO */}
          <Link
            to="/"
            className="flex items-center gap-3 group text-white focus:outline-none shrink-0"
            aria-label="Contabilidade 5.0 - Página Inicial"
          >
            <div className="relative w-10 h-10 flex items-center justify-center transition-transform duration-300 group-hover:rotate-12">
              {/* Hexagon shape with upward arrow */}
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full fill-[#145A32] stroke-[#2ECC71] stroke-[6] drop-shadow-[0_0_12px_rgba(46,204,113,0.4)]"
              >
                <polygon points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25" />
              </svg>
              <TrendingUp className="w-5 h-5 text-[#2ECC71] absolute stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
                Contabilidade <span className="text-[#2ECC71]">5.0</span>
              </span>
              <span className="text-[10px] tracking-wider text-slate-400 uppercase font-medium">
                Digital & Estratégica
              </span>
            </div>
          </Link>

          {/* DESKTOP NAV: Início, Serviços, Reforma Tributária, Calculadora IBS/CBS, Recuperador, Diagnóstico, Legislação */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-6">
            <Link
              to="/"
              className={`nav-link-hover text-sm font-medium transition-colors ${
                location.pathname === '/' && !location.hash
                  ? 'text-[#2ECC71] font-semibold active'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              Início
            </Link>
            <Link
              to="/servicos"
              className={`nav-link-hover text-sm font-medium transition-colors ${
                location.pathname.startsWith('/servicos')
                  ? 'text-[#2ECC71] font-semibold active'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              Serviços
            </Link>
            <Link
              to="/reforma-tributaria"
              className={`nav-link-hover text-sm font-medium transition-colors ${
                location.pathname.startsWith('/reforma-tributaria')
                  ? 'text-[#2ECC71] font-semibold active'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              Reforma Tributária
            </Link>
            <a
              href="/calculadora-ibs-cbs"
              onClick={(e) => handleToolNav(e, '/calculadora-ibs-cbs')}
              className={`nav-link-hover text-sm font-medium transition-colors ${
                location.pathname === '/calculadora-ibs-cbs'
                  ? 'text-[#2ECC71] font-semibold active'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              Calculadora IBS/CBS
            </a>
            <a
              href="/recuperador-creditos"
              onClick={(e) => handleToolNav(e, '/recuperador-creditos')}
              className={`nav-link-hover text-sm font-medium transition-colors ${
                location.pathname === '/recuperador-creditos'
                  ? 'text-[#2ECC71] font-semibold active'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              Recuperador de Créditos
            </a>
            <a
              href="/diagnosticos"
              onClick={(e) => handleToolNav(e, '/diagnosticos')}
              className={`nav-link-hover text-sm font-medium transition-colors ${
                location.pathname.startsWith('/diagnostico')
                  ? 'text-[#2ECC71] font-semibold active'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              Diagnóstico
            </a>
            <Link
              to="/legislacao"
              className={`nav-link-hover text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
                location.pathname.startsWith('/legislacao')
                  ? 'text-[#D4AF37] font-semibold active'
                  : 'text-slate-200 hover:text-[#D4AF37]'
              }`}
            >
              <span>Legislação</span>
              {naoLidas > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold bg-[#D4AF37] text-[#07132B]">
                  {naoLidas}
                </span>
              )}
            </Link>
          </nav>

          {/* CTA BUTTON & AUTH / USER DROPDOWN (DESKTOP) */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {isAuthenticated ? (
              /* MENU DO USUÁRIO SUSPENSO (DROPDOWN) - PADRÃO VISUAL DIAMOND GROUP, SEM ÍCONES */
              <div
                ref={userMenuRef}
                className="relative"
                onMouseEnter={handleMouseEnterUserMenu}
                onMouseLeave={handleMouseLeaveUserMenu}
              >
                {/* GATILHO: NOME DO USUÁRIO */}
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white border transition-all ${
                    isUserMenuOpen
                      ? 'bg-[#07132B] border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                      : 'bg-white/10 hover:bg-white/15 border-white/10'
                  }`}
                >
                  <span className="max-w-[140px] truncate">{nomeExibicao}</span>
                  <span
                    className={`text-[10px] text-[#D4AF37] transition-transform duration-200 ${
                      isUserMenuOpen ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {/* PAINEL SUSPENSO (DROPDOWN) */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full pt-2 w-64 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="rounded-2xl bg-[#07132B] border border-[#D4AF37]/40 shadow-[0_12px_36px_rgba(0,0,0,0.65)] p-4 text-white">
                      {/* CABEÇALHO DO PAINEL: NOME + BADGE DO PERFIL */}
                      <div className="pb-3 border-b border-white/10 space-y-1.5">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium block">
                          Conta Conectada
                        </span>
                        <div className="font-heading font-bold text-sm text-white truncate">
                          {nomeExibicao}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isEmpresario
                                ? 'bg-amber-500/20 text-[#D4AF37] border border-[#D4AF37]/40'
                                : 'bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/40'
                            }`}
                          >
                            Perfil: {badgePerfilTexto}
                          </span>
                          {isAdmin && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37] text-[#07132B]">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>

                      {/* LINKS DO MENU DO USUÁRIO */}
                      <div className="py-2.5 space-y-1 text-xs">
                        {/* Se perfil Empresário, incluir também botão de texto 'Migrar para Analista' */}
                        {isEmpresario && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false)
                              setModalMigrarAberto(true)
                            }}
                            className="w-full text-left py-2 px-3 rounded-xl font-bold text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] transition-colors shadow-sm mb-1"
                          >
                            Migrar para Analista (Modo Teste)
                          </button>
                        )}

                        {!isEmpresario && (
                          <Link
                            to="/crm"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block py-2 px-3 rounded-lg text-[#D4AF37] hover:text-white hover:bg-white/10 transition-colors font-bold"
                          >
                            CRM & Carteira (Fase 3)
                          </Link>
                        )}
                        <Link
                          to="/carteira"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block py-2 px-3 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors font-medium"
                        >
                          Carteira de Clientes
                        </Link>
                        <Link
                          to="/clientes"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block py-2 px-3 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors font-medium"
                        >
                          Meus Clientes
                        </Link>
                        <Link
                          to="/mercado-creditos"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block py-2 px-3 rounded-lg text-[#D4AF37] hover:text-white hover:bg-white/10 transition-colors font-semibold"
                        >
                          Mercado de Créditos
                        </Link>
                        <Link
                          to="/planos"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block py-2 px-3 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors font-medium"
                        >
                          Planos
                        </Link>
                        <Link
                          to="/agendamento"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block py-2 px-3 rounded-lg text-[#D4AF37] hover:text-white hover:bg-white/10 transition-colors font-semibold"
                        >
                          Agendar Reunião
                        </Link>
                        <Link
                          to="/minha-conta"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block py-2 px-3 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors font-medium"
                        >
                          Minha Conta
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block py-2 px-3 rounded-lg text-[#D4AF37] hover:bg-white/10 transition-colors font-semibold"
                          >
                            {isMaster ? 'Painel Master (Dr. Marco)' : 'Painel Administrativo'}
                          </Link>
                        )}
                      </div>

                      {/* SEPARADOR FINO */}
                      <div className="border-t border-white/10 my-1" />

                      {/* SAIR */}
                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left py-2 px-3 rounded-lg text-xs font-semibold text-red-300 hover:text-red-200 hover:bg-red-500/15 transition-colors"
                        >
                          Sair
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center px-3 py-2 text-xs font-medium text-slate-200 hover:text-white transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  to="/cadastro"
                  className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold text-[#07132B] bg-white/90 hover:bg-white transition-all shadow-sm"
                >
                  Criar conta
                </Link>
              </div>
            )}
          </div>

          {/* MOBILE MENU TOGGLE */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Abrir menu de navegação"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* MOBILE SLIDE-OVER MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div className="relative w-4/5 max-w-sm h-full bg-[#0A1A13] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl z-10 animate-slide-down overflow-y-auto">
            <div>
              {/* Header inside drawer */}
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-[#2ECC71]" />
                  <span className="font-heading font-bold text-lg text-white">
                    Contabilidade <span className="text-[#2ECC71]">5.0</span>
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* MENU DO USUÁRIO MOBILE (QUANDO LOGADO) - PARTE DO PAINEL LATERAL, ACIONADO POR TOQUE */}
              {isAuthenticated && (
                <div className="mt-4 p-4 rounded-2xl bg-[#07132B] border border-[#D4AF37]/40 shadow-lg text-white">
                  <button
                    type="button"
                    onClick={() => setIsMobileUserSectionOpen(!isMobileUserSectionOpen)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">
                        Usuário Conectado
                      </span>
                      <span className="font-heading font-bold text-sm text-white block truncate max-w-[190px]">
                        {nomeExibicao}
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isEmpresario
                            ? 'bg-amber-500/20 text-[#D4AF37] border border-[#D4AF37]/40'
                            : 'bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/40'
                        }`}
                      >
                        Perfil: {badgePerfilTexto}
                      </span>
                    </div>
                    <span className="text-xs text-[#D4AF37] font-bold">
                      {isMobileUserSectionOpen ? '▲' : '▼'}
                    </span>
                  </button>

                  {isMobileUserSectionOpen && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-1 text-xs">
                      {isEmpresario && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMobileMenuOpen(false)
                            setModalMigrarAberto(true)
                          }}
                          className="w-full text-center py-2 px-3 rounded-xl font-bold text-[#07132B] bg-[#D4AF37] hover:bg-[#c49f2e] transition-colors shadow-sm mb-2"
                        >
                          Migrar para Analista (Modo Teste)
                        </button>
                      )}

                      {!isEmpresario && (
                        <Link
                          to="/crm"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block py-2 px-3 rounded-lg text-[#D4AF37] hover:text-white hover:bg-white/10 transition-colors font-bold"
                        >
                          CRM & Carteira (Fase 3)
                        </Link>
                      )}
                      <Link
                        to="/carteira"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block py-2 px-3 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors font-medium"
                      >
                        Carteira de Clientes
                      </Link>
                      <Link
                        to="/clientes"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block py-2 px-3 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors font-medium"
                      >
                        Meus Clientes
                      </Link>
                      <Link
                        to="/mercado-creditos"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block py-2 px-3 rounded-lg text-[#D4AF37] hover:text-white hover:bg-white/10 transition-colors font-semibold"
                      >
                        Mercado de Créditos
                      </Link>
                      <Link
                        to="/planos"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block py-2 px-3 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors font-medium"
                      >
                        Planos
                      </Link>
                      <Link
                        to="/agendamento"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block py-2 px-3 rounded-lg text-[#D4AF37] hover:text-white hover:bg-white/10 transition-colors font-semibold"
                      >
                        Agendar Reunião
                      </Link>
                      <Link
                        to="/minha-conta"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block py-2 px-3 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors font-medium"
                      >
                        Minha Conta
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block py-2 px-3 rounded-lg text-[#D4AF37] hover:bg-white/10 transition-colors font-semibold"
                        >
                          {isMaster ? 'Painel Master (Dr. Marco)' : 'Painel Administrativo'}
                        </Link>
                      )}

                      <div className="border-t border-white/10 my-1" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left py-2 px-3 rounded-lg text-xs font-semibold text-red-300 hover:text-red-200 hover:bg-red-500/15 transition-colors"
                      >
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Links Principais Mobile: Início, Serviços, Reforma Tributária, Calculadora IBS/CBS, Recuperador, Diagnóstico, Legislação */}
              <div className="flex flex-col gap-3 mt-6">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-base font-medium py-2 border-b border-white/5 ${
                    location.pathname === '/' && !location.hash
                      ? 'text-[#2ECC71] font-bold'
                      : 'text-slate-200 hover:text-[#2ECC71]'
                  }`}
                >
                  Início
                </Link>
                <Link
                  to="/servicos"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-base font-medium py-2 border-b border-white/5 ${
                    location.pathname.startsWith('/servicos')
                      ? 'text-[#2ECC71] font-bold'
                      : 'text-slate-200 hover:text-[#2ECC71]'
                  }`}
                >
                  Serviços
                </Link>
                <Link
                  to="/reforma-tributaria"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-base font-medium py-2 border-b border-white/5 ${
                    location.pathname.startsWith('/reforma-tributaria')
                      ? 'text-[#2ECC71] font-bold'
                      : 'text-slate-200 hover:text-[#2ECC71]'
                  }`}
                >
                  Reforma Tributária
                </Link>
                <a
                  href="/calculadora-ibs-cbs"
                  onClick={(e) => handleToolNav(e, '/calculadora-ibs-cbs')}
                  className={`text-base font-medium py-2 border-b border-white/5 ${
                    location.pathname === '/calculadora-ibs-cbs'
                      ? 'text-[#2ECC71] font-bold'
                      : 'text-slate-200 hover:text-[#2ECC71]'
                  }`}
                >
                  Calculadora IBS/CBS
                </a>
                <a
                  href="/recuperador-creditos"
                  onClick={(e) => handleToolNav(e, '/recuperador-creditos')}
                  className={`text-base font-medium py-2 border-b border-white/5 ${
                    location.pathname === '/recuperador-creditos'
                      ? 'text-[#2ECC71] font-bold'
                      : 'text-slate-200 hover:text-[#2ECC71]'
                  }`}
                >
                  Recuperador de Créditos
                </a>
                <a
                  href="/diagnosticos"
                  onClick={(e) => handleToolNav(e, '/diagnosticos')}
                  className={`text-base font-medium py-2 border-b border-white/5 ${
                    location.pathname.startsWith('/diagnostico')
                      ? 'text-[#2ECC71] font-bold'
                      : 'text-slate-200 hover:text-[#2ECC71]'
                  }`}
                >
                  Diagnóstico
                </a>
                <Link
                  to="/legislacao"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-base font-medium py-2 border-b border-white/5 flex items-center justify-between ${
                    location.pathname.startsWith('/legislacao')
                      ? 'text-[#D4AF37] font-bold'
                      : 'text-slate-200 hover:text-[#D4AF37]'
                  }`}
                >
                  <span>Legislação</span>
                  {naoLidas > 0 && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold bg-[#D4AF37] text-[#07132B]">
                      {naoLidas}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* Bottom action inside mobile drawer */}
            {!isAuthenticated && (
              <div className="pt-6 border-t border-white/10 flex flex-col gap-3 mt-6">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-xl text-center font-semibold text-xs text-white bg-white/10 border border-white/15"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/cadastro"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-xl text-center font-semibold text-xs text-[#07132B] bg-white"
                  >
                    Criar Conta
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE MIGRAÇÃO PARA ANALISTA (MODO TESTE) */}
      <ModalMigrarParaAnalista
        aberto={modalMigrarAberto}
        aoFechar={() => setModalMigrarAberto(false)}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 min-h-screen">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="bg-[#0A1A13] text-white pt-16 pb-12 border-t border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Col 1: Brand & Social */}
            <div>
              <Link to="/" className="flex items-center gap-3 mb-4 group">
                <div className="w-9 h-9 flex items-center justify-center transition-transform group-hover:rotate-12">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full fill-[#145A32] stroke-[#2ECC71] stroke-[6]"
                  >
                    <polygon points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25" />
                  </svg>
                  <TrendingUp className="w-4 h-4 text-[#2ECC71] absolute stroke-[2.5]" />
                </div>
                <span className="font-heading font-extrabold text-xl tracking-tight text-white">
                  Contabilidade <span className="text-[#2ECC71]">5.0</span>
                </span>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Tecnologia e expertise para o seu negócio crescer com segurança e conformidade
                fiscal.
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-3">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#0077b5] hover:border-[#0077b5] hover:scale-110 transition-all duration-200"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-slate-300 hover:text-white hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:border-transparent hover:scale-110 transition-all duration-200"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#1877F2] hover:border-[#1877F2] hover:scale-110 transition-all duration-200"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://wa.me/551140028922"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#25D366] hover:border-[#25D366] hover:scale-110 transition-all duration-200"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <h3 className="font-heading font-semibold text-base text-white tracking-wide mb-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2ECC71]"></span>
                Links Rápidos
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    to="/"
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#2ECC71]" />
                    Início
                  </Link>
                </li>
                <li>
                  <Link
                    to="/servicos"
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#2ECC71]" />
                    Serviços
                  </Link>
                </li>
                <li>
                  <Link
                    to="/reforma-tributaria"
                    className="text-slate-400 hover:text-[#F59E0B] transition-colors flex items-center gap-1.5 font-medium"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#F59E0B]" />
                    Reforma Tributária
                  </Link>
                </li>
                <li>
                  <a
                    href="/calculadora-ibs-cbs"
                    onClick={(e) => handleToolNav(e, '/calculadora-ibs-cbs')}
                    className="text-slate-400 hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Calculadora IBS/CBS
                  </a>
                </li>
                <li>
                  <Link
                    to="/legislacao"
                    className="text-slate-400 hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 font-medium"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Legislação da Reforma
                  </Link>
                </li>
                <li>
                  <a
                    href="/recuperador-creditos"
                    onClick={(e) => handleToolNav(e, '/recuperador-creditos')}
                    className="text-slate-400 hover:text-[#2ECC71] transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#2ECC71]" />
                    Recuperador de Créditos
                  </a>
                </li>
                <li>
                  <a
                    href="/diagnosticos"
                    onClick={(e) => handleToolNav(e, '/diagnosticos')}
                    className="text-slate-400 hover:text-[#2ECC71] transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#2ECC71]" />
                    Diagnóstico Tributário (Hub)
                  </a>
                </li>
                <li>
                  <a
                    href="/#depoimentos"
                    onClick={(e) => handleNavClick(e, 'depoimentos')}
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#2ECC71]" />
                    Depoimentos
                  </a>
                </li>
                <li>
                  <a
                    href="/#contato"
                    onClick={(e) => handleNavClick(e, 'contato')}
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#2ECC71]" />
                    Contato
                  </a>
                </li>
                <li>
                  <Link
                    to="/planos"
                    className="text-slate-400 hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 font-medium"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Planos & Preços (Modo Teste)
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blog"
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 font-medium"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#2ECC71]" />
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    to="/politica-de-privacidade"
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Shield className="w-3.5 h-3.5 text-slate-500" />
                    Política de Privacidade
                  </Link>
                </li>
                <li>
                  <Link
                    to="/termos-de-uso"
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                    Termos de Uso
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Contact Info */}
            <div>
              <h3 className="font-heading font-semibold text-base text-white tracking-wide mb-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2ECC71]"></span>
                Atendimento
              </h3>
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
                  <span>Av. Paulista, 1000 — São Paulo/SP</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#2ECC71] shrink-0" />
                  <a href="tel:+551140028922" className="hover:text-white transition-colors">
                    +55 (11) 4002-8922
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#2ECC71] shrink-0" />
                  <a
                    href="mailto:contato@contabilidade5.com.br"
                    className="hover:text-white transition-colors"
                  >
                    contato@contabilidade5.com.br
                  </a>
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span>Horário: Seg a Sex, 8h às 18h</span>
                <div className="flex items-center gap-3">
                  {!isEmpresario && (
                    <>
                      <Link
                        to="/carteira"
                        className="text-slate-400 hover:text-[#D4AF37] transition-colors underline"
                      >
                        Carteira Consolidada
                      </Link>
                      <span>•</span>
                      <Link
                        to="/clientes"
                        className="text-slate-400 hover:text-[#D4AF37] transition-colors underline"
                      >
                        Clientes
                      </Link>
                      <span>•</span>
                    </>
                  )}
                  <Link
                    to="/dados-empresa"
                    className="text-slate-400 hover:text-[#D4AF37] transition-colors underline"
                  >
                    Dados da Empresa
                  </Link>
                  <span>•</span>
                  <Link
                    to="/minha-conta"
                    className="text-slate-400 hover:text-[#2ECC71] transition-colors underline"
                  >
                    Área do Cliente
                  </Link>
                  <span>•</span>
                  <Link
                    to="/admin"
                    className="text-slate-400 hover:text-[#2ECC71] transition-colors underline"
                  >
                    Painel Admin
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright bar */}
          <div className="pt-8 border-t border-white/10 text-center text-xs text-slate-400">
            <p>© 2025 Contabilidade 5.0 — Todos os direitos reservados. CNPJ 00.000.000/0001-00</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
