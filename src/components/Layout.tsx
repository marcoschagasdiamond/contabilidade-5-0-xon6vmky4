import React, { useState, useEffect } from 'react'
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

export default function Layout() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    setIsMobileMenuOpen(false)

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
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* LOGO */}
          <Link
            to="/"
            className="flex items-center gap-3 group text-white focus:outline-none"
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

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-7">
            <a
              href="/#inicio"
              onClick={(e) => handleNavClick(e, 'inicio')}
              className="nav-link-hover text-sm font-medium text-slate-200 hover:text-white transition-colors"
            >
              Início
            </a>
            <a
              href="/#servicos"
              onClick={(e) => handleNavClick(e, 'servicos')}
              className="nav-link-hover text-sm font-medium text-slate-200 hover:text-white transition-colors"
            >
              Serviços
            </a>
            <Link
              to="/reforma-tributaria"
              className={`nav-link-hover text-sm font-medium transition-colors flex items-center gap-1.5 ${
                location.pathname.startsWith('/reforma-tributaria')
                  ? 'text-[#F59E0B] font-semibold active'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
              Reforma Tributária
            </Link>
            <Link
              to="/dados-empresa"
              className={`nav-link-hover text-sm font-medium transition-colors flex items-center gap-1.5 ${
                location.pathname === '/dados-empresa'
                  ? 'text-[#D4AF37] font-semibold active'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              Dados da Empresa
            </Link>
            <Link
              to="/calculadora-ibs-cbs"
              className={`nav-link-hover text-sm font-medium transition-colors flex items-center gap-1.5 ${
                location.pathname === '/calculadora-ibs-cbs'
                  ? 'text-[#D4AF37] font-semibold active'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              Calculadora IBS/CBS
            </Link>
            <Link
              to="/diagnostico"
              className={`nav-link-hover text-sm font-medium transition-colors flex items-center gap-1.5 ${
                location.pathname === '/diagnostico'
                  ? 'text-[#2ECC71] font-semibold active'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ECC71] animate-pulse" />
              Diagnóstico Tributário
            </Link>
            <a
              href="/#sobre"
              onClick={(e) => handleNavClick(e, 'sobre')}
              className="nav-link-hover text-sm font-medium text-slate-200 hover:text-white transition-colors"
            >
              Sobre Nós
            </a>
            <a
              href="/#depoimentos"
              onClick={(e) => handleNavClick(e, 'depoimentos')}
              className="nav-link-hover text-sm font-medium text-slate-200 hover:text-white transition-colors"
            >
              Depoimentos
            </a>
            <Link
              to="/blog"
              className={`nav-link-hover text-sm font-medium transition-colors ${
                location.pathname.startsWith('/blog')
                  ? 'text-[#2ECC71] font-semibold active'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              Blog
            </Link>
            <a
              href="/#contato"
              onClick={(e) => handleNavClick(e, 'contato')}
              className="nav-link-hover text-sm font-medium text-slate-200 hover:text-white transition-colors"
            >
              Contato
            </a>
          </nav>

          {/* CTA BUTTON */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="/#contato"
              onClick={(e) => handleNavClick(e, 'contato')}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-[0_4px_14px_rgba(46,204,113,0.35)] hover:shadow-[0_6px_20px_rgba(46,204,113,0.5)] transition-all duration-200 hover:-translate-y-0.5 btn-press"
            >
              Fale com um Especialista
            </a>
          </div>

          {/* MOBILE MENU TOGGLE */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Abrir menu de navegação"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* MOBILE SLIDE-OVER MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div className="relative w-4/5 max-w-sm h-full bg-[#0A1A13] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl z-10 animate-slide-down">
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

              {/* Links */}
              <div className="flex flex-col gap-4 mt-6">
                <a
                  href="/#inicio"
                  onClick={(e) => handleNavClick(e, 'inicio')}
                  className="text-base font-medium text-slate-200 hover:text-[#2ECC71] py-2 border-b border-white/5"
                >
                  Início
                </a>
                <a
                  href="/#servicos"
                  onClick={(e) => handleNavClick(e, 'servicos')}
                  className="text-base font-medium text-slate-200 hover:text-[#2ECC71] py-2 border-b border-white/5"
                >
                  Serviços
                </a>
                <Link
                  to="/reforma-tributaria"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-base font-medium py-2 border-b border-white/5 flex items-center gap-2 ${
                    location.pathname.startsWith('/reforma-tributaria')
                      ? 'text-[#F59E0B] font-bold'
                      : 'text-slate-200 hover:text-[#F59E0B]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                  Reforma Tributária
                </Link>
                <Link
                  to="/dados-empresa"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-base font-medium py-2 border-b border-white/5 flex items-center gap-2 ${
                    location.pathname === '/dados-empresa'
                      ? 'text-[#D4AF37] font-bold'
                      : 'text-slate-200 hover:text-[#D4AF37]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  Dados da Empresa
                </Link>
                <Link
                  to="/calculadora-ibs-cbs"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-base font-medium py-2 border-b border-white/5 flex items-center gap-2 ${
                    location.pathname === '/calculadora-ibs-cbs'
                      ? 'text-[#D4AF37] font-bold'
                      : 'text-slate-200 hover:text-[#D4AF37]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  Calculadora IBS/CBS
                </Link>
                <Link
                  to="/diagnostico"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-base font-medium py-2 border-b border-white/5 flex items-center gap-2 ${
                    location.pathname === '/diagnostico'
                      ? 'text-[#2ECC71] font-bold'
                      : 'text-slate-200 hover:text-[#2ECC71]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#2ECC71]" />
                  Diagnóstico Tributário
                </Link>
                <a
                  href="/#sobre"
                  onClick={(e) => handleNavClick(e, 'sobre')}
                  className="text-base font-medium text-slate-200 hover:text-[#2ECC71] py-2 border-b border-white/5"
                >
                  Sobre Nós
                </a>
                <a
                  href="/#depoimentos"
                  onClick={(e) => handleNavClick(e, 'depoimentos')}
                  className="text-base font-medium text-slate-200 hover:text-[#2ECC71] py-2 border-b border-white/5"
                >
                  Depoimentos
                </a>
                <Link
                  to="/blog"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-base font-medium text-slate-200 hover:text-[#2ECC71] py-2 border-b border-white/5"
                >
                  Blog
                </Link>
                <a
                  href="/#contato"
                  onClick={(e) => handleNavClick(e, 'contato')}
                  className="text-base font-medium text-slate-200 hover:text-[#2ECC71] py-2 border-b border-white/5"
                >
                  Contato
                </a>
              </div>
            </div>

            {/* Bottom action */}
            <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
              <a
                href="/#contato"
                onClick={(e) => handleNavClick(e, 'contato')}
                className="w-full py-3 px-4 rounded-xl text-center font-semibold text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-md transition-all"
              >
                Fale com um Especialista
              </a>
              <p className="text-center text-xs text-slate-400">
                Atendimento consultivo em até 24h
              </p>
            </div>
          </div>
        </div>
      )}

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
                  <a
                    href="/#inicio"
                    onClick={(e) => handleNavClick(e, 'inicio')}
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#2ECC71]" />
                    Início
                  </a>
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
                  <Link
                    to="/dados-empresa"
                    className="text-slate-400 hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 font-medium"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Dados da Empresa
                  </Link>
                </li>
                <li>
                  <Link
                    to="/calculadora-ibs-cbs"
                    className="text-slate-400 hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 font-medium"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Calculadora IBS/CBS
                  </Link>
                </li>
                <li>
                  <Link
                    to="/diagnostico"
                    className="text-slate-400 hover:text-[#2ECC71] transition-colors flex items-center gap-1.5 font-medium"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#2ECC71]" />
                    Diagnóstico Tributário
                  </Link>
                </li>
                <li>
                  <Link
                    to="/sobre"
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#2ECC71]" />
                    Sobre Nós
                  </Link>
                </li>
                <li>
                  <a
                    href="/#depoimentos"
                    onClick={(e) => handleNavClick(e, 'depoimentos')}
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#2ECC71]" />
                    Depoimentos
                  </a>
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
                <Link
                  to="/admin"
                  className="text-slate-400 hover:text-[#2ECC71] transition-colors underline"
                >
                  Painel Admin
                </Link>
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
