import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react'
import { blogPosts } from '@/data/blogData'

export default function Blog() {
  return (
    <div className="pt-24 pb-20">
      {/* 1. HEADER DO BLOG */}
      <section className="bg-gradient-to-r from-[#0A1A13] via-[#0E3520] to-[#145A32] text-white py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#2ECC71_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="max-w-[1200px] mx-auto relative z-10 text-center">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-white/10 border border-emerald-400/30 mb-4 backdrop-blur-sm">
            Blog & Conteúdo
          </span>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight mb-4">
            Blog
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Insights e novidades do mundo contábil para ajudar você a tomar as melhores decisões
            financeiras e tributárias para sua empresa.
          </p>
        </div>
      </section>

      {/* 2. LISTA DE POSTS */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article
                key={post.slug}
                className="group rounded-[20px] bg-white border border-slate-200 overflow-hidden hover:border-[#2ECC71]/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between"
              >
                <Link to={`/blog/${post.slug}`} className="block">
                  {/* Capa */}
                  <div className="h-52 bg-slate-100 overflow-hidden relative">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#0A1A13]/85 text-emerald-300 backdrop-blur-md border border-white/15">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-6">
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

                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-6">
                      {post.summary}
                    </p>
                  </div>
                </Link>

                {/* Autor e CTA footer */}
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex items-center justify-between">
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
                    className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#2ECC71] group-hover:text-[#0A1A13] flex items-center justify-center transition-colors"
                    aria-label={`Ler post: ${post.title}`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
