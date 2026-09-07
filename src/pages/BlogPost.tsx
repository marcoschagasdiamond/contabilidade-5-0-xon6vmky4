import React from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Calendar, Clock, ArrowLeft, Share2, CheckCircle2, Bookmark, Sparkles } from 'lucide-react'
import { blogPosts } from '@/data/blogData'

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()

  // Encontra o post pelo slug ou usa o default se não encontrar
  const post = blogPosts.find((p) => p.slug === slug)

  if (!post) {
    return <Navigate to="/blog" replace />
  }

  return (
    <div className="pt-24 pb-20 bg-white">
      {/* 1. TOPO DO ARTIGO */}
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 pt-10">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#145A32] hover:text-[#2ECC71] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para todos os artigos
        </Link>

        <div>
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#145A32] bg-[#A3E4D7]/30 border border-[#2ECC71]/30 mb-4">
            {post.category}
          </span>

          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-[42px] leading-tight text-slate-900 tracking-tight mb-6">
            {post.title}
          </h1>

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
        <div className="rounded-[20px] overflow-hidden shadow-lg border border-slate-200 mb-10">
          <img src={post.coverImage} alt={post.title} className="w-full h-[380px] object-cover" />
        </div>

        {/* CONTEÚDO DO ARTIGO */}
        <div className="space-y-6 text-slate-700 text-base sm:text-lg leading-relaxed font-normal">
          {post.content.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>

        {/* BOX DE DESTAQUE / CONSULTORIA */}
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
                Nossos contadores e consultores tributários realizam um diagnóstico sem custos para
                identificar economias e adequar seu regime com total segurança jurídica.
              </p>
              <a
                href="/#contato"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#0A1A13] bg-[#2ECC71] hover:bg-[#27AE60] shadow-md transition-all duration-200 btn-press"
              >
                Falar com nossos especialistas
              </a>
            </div>
          </div>
        </div>

        {/* POSTS RELACIONADOS */}
        <div className="mt-16 pt-12 border-t border-slate-200">
          <h3 className="font-heading font-bold text-2xl text-slate-900 mb-6">
            Outros artigos recomendados
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {blogPosts
              .filter((p) => p.slug !== post.slug)
              .slice(0, 2)
              .map((related) => (
                <Link
                  key={related.slug}
                  to={`/blog/${related.slug}`}
                  className="p-5 rounded-xl border border-slate-200 hover:border-[#2ECC71] hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[11px] font-semibold text-[#145A32] uppercase tracking-wider block mb-1">
                      {related.category}
                    </span>
                    <h4 className="font-heading font-bold text-base text-slate-900 group-hover:text-[#145A32] transition-colors line-clamp-2 mb-2">
                      {related.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{related.summary}</p>
                  </div>
                  <span className="text-xs font-semibold text-[#2ECC71] mt-4 flex items-center gap-1">
                    Ler artigo completo →
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
