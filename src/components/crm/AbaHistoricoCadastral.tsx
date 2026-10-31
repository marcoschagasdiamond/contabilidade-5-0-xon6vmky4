import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { HistoricoDadosEmpresaRegistro } from '@/types/historicoDadosEmpresa'

interface AbaHistoricoCadastralProps {
  historico: HistoricoDadosEmpresaRegistro[]
  carregando?: boolean
  onAtualizar?: () => void
}

export function AbaHistoricoCadastral({
  historico,
  carregando = false,
  onAtualizar,
}: AbaHistoricoCadastralProps) {
  if (carregando) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-xs text-slate-500">
        Carregando histórico de auditoria cadastral...
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[#D4AF37] bg-[#07132B] uppercase tracking-wider mb-1">
            Registro Imutável de Conformidade
          </div>
          <h2 className="font-heading font-extrabold text-lg text-[#07132B]">
            Histórico de Alterações de Dados da Empresa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rastro completo de cada edição cadastral realizada: o que mudou (de → para), data/hora,
            autor e nível de acesso.
          </p>
        </div>

        {onAtualizar && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAtualizar}
            className="text-xs font-bold border-slate-300 text-slate-700 rounded-xl self-start sm:self-auto"
          >
            Atualizar Rastro
          </Button>
        )}
      </div>

      {historico.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
          <p className="text-sm font-bold text-slate-700">
            Nenhum ajuste cadastral registrado ainda
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Quando o cliente ou técnico utilizar o botão "Corrigir dados" para alterar razão social,
            CNPJ, contatos ou localização, o histórico de auditoria imutável aparecerá listado aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {historico.map((item, idx) => {
            const dataFormatada = item.created
              ? new Date(item.created).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : 'Data não informada'

            return (
              <div
                key={item.id || idx}
                className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-5 space-y-3.5 hover:border-[#D4AF37]/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-[#07132B] text-[#D4AF37] hover:bg-[#07132B] font-bold text-[11px] px-2.5 py-0.5">
                      {dataFormatada}
                    </Badge>
                    <span className="text-xs font-bold text-slate-900">
                      Autor: {item.autor_nome}
                    </span>
                    {item.autor_nivel && (
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-bold text-slate-600 border-slate-300 px-2 py-0.2"
                      >
                        {item.autor_nivel}
                      </Badge>
                    )}
                    {item.autor_email && (
                      <span className="text-[11px] text-slate-500 font-mono">
                        ({item.autor_email})
                      </span>
                    )}
                  </div>

                  {item.origem_ajuste && (
                    <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Origem: {item.origem_ajuste.replace('botao_corrigir_dados_', 'Módulo ')}
                    </span>
                  )}
                </div>

                {item.descricao && (
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {item.descricao}
                  </p>
                )}

                {/* TABELA DE ALTERAÇÕES DE -> PARA */}
                {Array.isArray(item.alteracoes_json) && item.alteracoes_json.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#07132B] text-white text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3 font-bold">Campo Alterado</th>
                          <th className="py-2.5 px-3 font-bold text-rose-300">
                            Valor Anterior (De)
                          </th>
                          <th className="py-2.5 px-3 font-bold text-emerald-300">
                            Valor Novo (Para)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {item.alteracoes_json.map((alt, aIdx) => (
                          <tr key={aIdx} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 font-bold text-slate-800">
                              {alt.rotulo || alt.campo}
                            </td>
                            <td className="py-2 px-3 text-slate-600 line-through decoration-rose-400 bg-rose-50/30">
                              {alt.valorAnteriorFormatado || String(alt.valorAnterior || 'Vazio')}
                            </td>
                            <td className="py-2 px-3 text-emerald-800 font-bold bg-emerald-50/30">
                              {alt.valorNovoFormatado || String(alt.valorNovo || '')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
