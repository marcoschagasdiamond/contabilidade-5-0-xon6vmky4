import React, { useMemo } from 'react'
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { useDadosEmpresa } from '@/context/DadosEmpresaContext'
import { obterRotaInicialDiagnostico } from '@/types/dadosEmpresa'
import {
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  Share2,
  Sparkles,
  Calculator,
  Tag,
  BookOpen,
  CheckCircle2,
  Layers,
} from 'lucide-react'
import { blogPosts } from '@/data/blogData'

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { temDadosSalvos } = useDadosEmpresa()

  // Encontra o post pelo slug
  const post = blogPosts.find((p) => p.slug === slug)

  // Identificar posts da mesma série para navegação sequencial
  const seriesPosts = useMemo(() => {
    if (!post?.series) return []
    return blogPosts
      .filter((p) => p.series === post.series)
      .sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0))
  }, [post?.series])

  // Artigos relacionados (mesma categoria ou série)
  const relatedPosts = useMemo(() => {
    if (!post) return []
    return blogPosts
      .filter((p) => p.slug !== post.slug)
      .sort((a, b) => {
        if (a.series === post.series && b.series !== post.series) return -1
        if (a.category === post.category && b.category !== post.category) return -1
        return 0
      })
      .slice(0, 3)
  }, [post])

  if (!post) {
    return <Navigate to="/blog" replace />
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: post.title,
          text: post.summary,
          url: window.location.href,
        })
        .catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link do artigo copiado para a área de transferência!')
    }
  }

  return (
    <div className="pt-24 pb-20 bg-white">
      {/* 1. TOPO DO ARTIGO */}
      <div className="max-w-[840px] mx-auto px-4 sm:px-6 pt-10">
        {/* Breadcrumb e botão voltar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#145A32] hover:text-[#2ECC71] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para todos os artigos
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors"
            title="Compartilhar este artigo"
          >
            <Share2 className="w-3.5 h-3.5" />
            Compartilhar
          </button>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-[#A3E4D7]/30 border border-[#2ECC71]/30">
              {post.category}
            </span>

            {post.series && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/50 shadow-sm">
                Parte {post.seriesOrder || '•'} • {post.series}
              </span>
            )}
          </div>

          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-[42px] leading-tight text-slate-900 tracking-tight mb-4">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium mb-6">
            {post.summary}
          </p>

          {/* Dados do Autor e Data */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-200 mb-8">
            <div className="flex items-center gap-3">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-[#2ECC71]"
              />
              <div>
                <p className="font-semibold text-slate-900 text-sm">{post.author.name}</p>
                <p className="text-xs text-slate-500">{post.author.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#2ECC71]" />
                {post.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                {post.readTime}
              </span>
            </div>
          </div>
        </div>

        {/* IMAGEM DE CAPA */}
        <div className="rounded-[20px] overflow-hidden shadow-lg border border-slate-200 mb-10 relative">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-[360px] sm:h-[420px] object-cover"
          />
        </div>

        {/* BOX NAVEGAÇÃO DA SÉRIE (SE FIZER PARTE DE UMA SÉRIE) */}
        {post.series && seriesPosts.length > 1 && (
          <div className="mb-10 p-5 sm:p-6 rounded-2xl bg-[#07132B] text-white border border-[#D4AF37]/30 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="font-heading font-bold text-base text-white">
                Índice da {post.series}
              </h3>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Acompanhe a série completa de artigos sobre as mudanças trazidas pela EC 132/2023 e LC
              214/2025:
            </p>
            <div className="space-y-2">
              {seriesPosts.map((sp) => {
                const isCurrent = sp.slug === post.slug
                return (
                  <Link
                    key={sp.slug}
                    to={`/blog/${sp.slug}`}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs sm:text-sm transition-all ${
                      isCurrent
                        ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/60 text-[#D4AF37] font-bold'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 line-clamp-1">
                      <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] shrink-0 font-bold">
                        {sp.seriesOrder}
                      </span>
                      <span className="truncate">{sp.title}</span>
                    </div>
                    {isCurrent ? (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#D4AF37] text-[#07132B] shrink-0 ml-2 font-black">
                        Lendo agora
                      </span>
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* CONTEÚDO DO ARTIGO */}
        <div className="space-y-6 text-slate-700 text-base sm:text-lg leading-relaxed font-normal">
          {post.content.map((paragraph, idx) => {
            // Destaque visual caso o parágrafo comece com item numérico ou módulo
            const isNumbered = /^[0-9]\. |^Módulo [0-9]|^Fase [0-9]/.test(paragraph)

            if (isNumbered) {
              const colonIndex = paragraph.indexOf(':')
              if (colonIndex !== -1) {
                const titlePart = paragraph.slice(0, colonIndex + 1)
                const textPart = paragraph.slice(colonIndex + 1)

                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-50 border-l-4 border-[#2ECC71] border-y border-r border-slate-200"
                  >
                    <strong className="text-slate-900 font-bold block mb-1">{titlePart}</strong>
                    <span className="text-slate-700">{textPart}</span>
                  </div>
                )
              }
            }

            return <p key={idx}>{paragraph}</p>
          })}
        </div>

        {/* TAGS DO ARTIGO */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
              <Tag className="w-3.5 h-3.5" />
              Tópicos relacionados:
            </span>
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* BOX DE DESTAQUE / CTA PERSONALIZADO DO ARTIGO */}
        {post.cta ? (
          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-[#07132B] via-[#0E2442] to-[#14345C] text-white border border-[#D4AF37]/40 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                {post.cta.badge && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#07132B] bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] mb-3">
                    {post.cta.badge}
                  </span>
                )}
                <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-white mb-2">
                  {post.cta.title}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                  {post.cta.description}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 w-full sm:w-auto">
                <Link
                  to={post.cta.buttonLink}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-[#07132B] bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] hover:brightness-110 shadow-lg transition-all"
                >
                  <span>{post.cta.buttonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {post.cta.secondaryLink && (
                  <Link
                    to={post.cta.secondaryLink.href}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition-all text-center"
                  >
                    {post.cta.secondaryLink.text}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* CTA PADRÃO DE CONSULTORIA */
          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#2ECC71] text-[#0A1A13] flex items-center justify-center shrink-0 shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xl text-slate-900 mb-2">
                  Deseja avaliar o impacto dessa mudança na sua empresa?
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  Nossos analistas e consultores tributários realizam um diagnóstico sem custos para
                  identificar economias e adequar seu regime com total segurança jurídica.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={obterRotaInicialDiagnostico(temDadosSalvos)}
                    onClick={(e) => {
                      e.preventDefault()
                      navigate(obterRotaInicialDiagnostico(temDadosSalvos))
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-md transition-all duration-200 btn-press"
                  >
                    Fazer Diagnóstico Gratuito
                  </a>
                  <a
                    href="/#contato"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all duration-200"
                  >
                    Falar com nossos especialistas
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* POSTS RELACIONADOS */}
        <div className="mt-16 pt-12 border-t border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading font-bold text-2xl text-slate-900">Artigos recomendados</h3>
            <Link
              to="/blog"
              className="text-xs font-semibold text-[#145A32] hover:text-[#2ECC71] transition-colors"
            >
              Ver todos ({blogPosts.length}) →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedPosts.map((related) => (
              <Link
                key={related.slug}
                to={`/blog/${related.slug}`}
                className="p-5 rounded-2xl border border-slate-200 hover:border-[#2ECC71] hover:shadow-md transition-all group flex flex-col justify-between bg-white"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[10px] font-bold text-[#145A32] uppercase tracking-wider block">
                      {related.category}
                    </span>
                    {related.seriesOrder && (
                      <span className="text-[10px] font-bold text-[#D4AF37] bg-[#07132B] px-1.5 py-0.2 rounded">
                        #{related.seriesOrder}
                      </span>
                    )}
                  </div>
                  <h4 className="font-heading font-bold text-sm text-slate-900 group-hover:text-[#145A32] transition-colors line-clamp-2 mb-2 leading-snug">
                    {related.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {related.summary}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#2ECC71] mt-4 flex items-center gap-1">
                  Ler artigo →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
