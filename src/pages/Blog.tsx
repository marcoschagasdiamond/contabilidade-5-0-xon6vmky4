import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  ArrowRight,
  BookOpen,
  Sparkles,
  Calculator,
  Search,
  Filter,
  CheckCircle2,
} from 'lucide-react'
import { blogPosts } from '@/data/blogData'

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Obter categorias únicas
  const categories = useMemo(() => {
    const cats = Array.from(new Set(blogPosts.map((p) => p.category)))
    return ['todos', 'Série Reforma Tributária 2026', ...cats]
  }, [])

  // Filtragem
  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post) => {
      const matchCategory =
        selectedCategory === 'todos'
          ? true
          : selectedCategory === 'Série Reforma Tributária 2026'
            ? post.series === 'Série Reforma Tributária 2026'
            : post.category === selectedCategory

      const matchSearch =
        searchTerm.trim() === ''
          ? true
          : post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.tags?.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))

      return matchCategory && matchSearch
    })
  }, [selectedCategory, searchTerm])

  // Post em destaque principal (o artigo de apresentação da Calculadora ou o primeiro da série)
  const featuredPost = useMemo(() => {
    return (
      blogPosts.find((p) => p.slug === 'apresentamos-a-calculadora-ibs-cbs-simule-o-impacto') ||
      blogPosts[0]
    )
  }, [])

  return (
    <div className="pt-24 pb-20 bg-slate-50 min-h-screen">
      {/* 1. HEADER DO BLOG */}
      <section className="bg-gradient-to-r from-[#0A1A13] via-[#0E3520] to-[#145A32] text-white py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#2ECC71_1px,transparent_1px)] [background-size:20px_20px]" />

        {/* Glow ambient */}
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-[#2ECC71]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1200px] mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-white/10 border border-emerald-400/30 mb-4 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#2ECC71]" />
            <span>Conteúdo Consultivo & Inteligência Fiscal</span>
          </div>

          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight mb-4">
            Blog Contabilidade <span className="text-[#2ECC71]">5.0</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal mb-8">
            Insights estratégicos, análises da Reforma Tributária 2026 e orientações práticas para
            proteger o caixa e impulsionar a lucratividade da sua empresa.
          </p>

          {/* Destaque rápido da Série Reforma */}
          <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 max-w-xl mx-auto text-xs sm:text-sm">
            <span className="font-bold text-[#D4AF37] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
              Especial Reforma 2026:
            </span>
            <span className="text-slate-200">
              5 novos artigos publicados com simulações e calculadora interativa
            </span>
            <Link
              to="/calculadora-ibs-cbs"
              className="font-semibold text-[#2ECC71] hover:underline flex items-center gap-1"
            >
              Calculadora IBS/CBS →
            </Link>
          </div>
        </div>
      </section>

      {/* 2. BANNER DESTAQUE FIXO: APRESENTAÇÃO DA CALCULADORA IBS/CBS */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 -mt-8 relative z-20">
        <div className="rounded-2xl bg-gradient-to-r from-[#07132B] via-[#0E2442] to-[#14345C] text-white p-6 sm:p-8 shadow-2xl border border-[#D4AF37]/40 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#D4AF37] text-[#07132B]">
                Artigo em Destaque
              </span>
              <span className="text-xs text-slate-300">Série Reforma Tributária 2026</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-heading font-extrabold text-white mb-2 leading-tight">
              {featuredPost.title}
            </h2>
            <p className="text-sm text-slate-300 line-clamp-2 mb-4 leading-relaxed">
              {featuredPost.summary}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                {featuredPost.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {featuredPost.readTime}
              </span>
              <span className="text-slate-300 font-medium">Por {featuredPost.author.name}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
            <Link
              to={`/blog/${featuredPost.slug}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-[#07132B] bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] hover:brightness-110 shadow-lg transition-all"
            >
              <span>Ler Artigo do Simulador</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/calculadora-ibs-cbs"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
            >
              <Calculator className="w-4 h-4 text-[#D4AF37]" />
              <span>Abrir Calculadora Direto</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. FILTROS E BUSCA */}
      <section className="pt-14 pb-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            {/* Categorias Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat
                const isSeries = cat === 'Série Reforma Tributária 2026'

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? isSeries
                          ? 'bg-[#07132B] text-[#D4AF37] shadow-sm border border-[#D4AF37]/40'
                          : 'bg-[#145A32] text-white shadow-sm'
                        : isSeries
                          ? 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSeries ? '★ ' + cat : cat === 'todos' ? 'Todos os artigos' : cat}
                  </button>
                )
              })}
            </div>

            {/* Input de Busca */}
            <div className="relative w-full md:w-64 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar artigos..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent bg-slate-50"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. LISTA DE POSTS */}
      <section className="pb-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-heading font-bold text-lg text-slate-800 mb-1">
                Nenhum artigo encontrado
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Tente ajustar os filtros ou a palavra-chave pesquisada.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('todos')
                  setSearchTerm('')
                }}
                className="px-4 py-2 text-xs font-semibold text-[#145A32] bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => {
                const isReforma = post.category === 'Reforma Tributária' || post.series
                const isSeries = !!post.series

                return (
                  <article
                    key={post.slug}
                    className={`group rounded-[20px] bg-white border overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between ${
                      isSeries
                        ? 'border-emerald-200/80 hover:border-[#D4AF37]/70'
                        : 'border-slate-200 hover:border-[#2ECC71]/50'
                    }`}
                  >
                    <Link to={`/blog/${post.slug}`} className="block flex-1 flex flex-col">
                      {/* Capa */}
                      <div className="h-52 bg-slate-100 overflow-hidden relative">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />

                        {/* Badges superiores */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#0A1A13]/90 text-emerald-300 backdrop-blur-md border border-white/15">
                            {post.category}
                          </span>
                          {post.series && (
                            <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/50 shadow-sm">
                              Parte {post.seriesOrder || '•'} • Série 2026
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Conteúdo */}
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#2ECC71]" />
                            {post.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {post.readTime}
                          </span>
                        </div>

                        <h2 className="font-heading font-bold text-xl text-slate-900 group-hover:text-[#145A32] transition-colors line-clamp-2 mb-3">
                          {post.title}
                        </h2>

                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4 flex-1">
                          {post.summary}
                        </p>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Autor e CTA footer */}
                    <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div className="text-xs">
                          <p className="font-semibold text-slate-800">{post.author.name}</p>
                          <p className="text-slate-500 text-[11px]">{post.author.role}</p>
                        </div>
                      </div>

                      <Link
                        to={`/blog/${post.slug}`}
                        className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#2ECC71] group-hover:text-[#0A1A13] flex items-center justify-center transition-colors shrink-0"
                        aria-label={`Ler post: ${post.title}`}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* 5. SEÇÃO DE RECURSOS DA REFORMA TRIBUTÁRIA NO RODAPÉ DO BLOG */}
      <section className="bg-white py-16 border-t border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-emerald-50 border border-emerald-200 mb-2">
              Ecossistema Completo
            </span>
            <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900">
              Ferramentas interativas para a Reforma Tributária
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              Além dos artigos do blog, explore nossas calculadoras, comparadores e relatórios
              executivos atualizados com a LC 214/2025.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link
              to="/calculadora-ibs-cbs"
              className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/40 border border-amber-200/80 hover:shadow-lg transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-[#07132B] flex items-center justify-center font-bold mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <Calculator className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-lg text-slate-900 mb-1 group-hover:text-amber-800 transition-colors">
                Calculadora IBS/CBS 2026–2033
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                6 módulos com alíquotas oficiais (26,50%), comparativo dos 4 regimes, simulador de
                créditos e cronograma.
              </p>
              <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                Acessar calculadora gratuita →
              </span>
            </Link>

            <Link
              to="/reforma-tributaria"
              className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 hover:shadow-lg transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#07132B] text-[#D4AF37] flex items-center justify-center font-bold mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-lg text-slate-900 mb-1 group-hover:text-[#07132B] transition-colors">
                Hub Reforma Tributária
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                9 submódulos detalhados: visão geral, calendário, dicionário de mnemônicos, mapa de
                setores e exceções.
              </p>
              <span className="text-xs font-bold text-[#07132B] flex items-center gap-1">
                Explorar hub da reforma →
              </span>
            </Link>

            <Link
              to="/diagnostico"
              className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/80 hover:shadow-lg transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#2ECC71] text-[#0A1A13] flex items-center justify-center font-bold mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-lg text-slate-900 mb-1 group-hover:text-[#145A32] transition-colors">
                Diagnóstico Tributário Completo
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Simule em 4 etapas qual o melhor regime (Simples, Presumido ou Real) considerando a
                transição para o IVA Dual.
              </p>
              <span className="text-xs font-bold text-[#145A32] flex items-center gap-1">
                Fazer diagnóstico sem custos →
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
