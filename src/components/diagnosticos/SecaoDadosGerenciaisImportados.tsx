import React from 'react'
import { Link } from 'react-router-dom'
import type { DadosEmpresaPerfil, DocumentoFiscalImportadoReferencia } from '@/types/dadosEmpresa'
import { formatarMoeda } from '@/lib/calculadoraUtils'

interface SecaoDadosGerenciaisImportadosProps {
  dadosEmpresa?: DadosEmpresaPerfil | null
  documentoFiscal?: DocumentoFiscalImportadoReferencia | null
  nomeEmpresa?: string
  className?: string
}

export function SecaoDadosGerenciaisImportados({
  dadosEmpresa,
  documentoFiscal,
  nomeEmpresa,
  className = '',
}: SecaoDadosGerenciaisImportadosProps) {
  const doc = documentoFiscal ?? dadosEmpresa?.documentoFiscalImportado
  const agregados = doc?.agregadosContabeis
  const totaisFiscais = doc?.totaisFiscais

  // Se não houver documento importado ou nenhum dado gerencial persistido, exibe aviso discreto de dados manuais
  const temDadosGerenciais =
    Boolean(doc) &&
    (Boolean(
      agregados &&
      ((agregados.ativoTotal ?? 0) > 0 ||
        (agregados.passivoTotal ?? 0) > 0 ||
        (agregados.patrimonioLiquido ?? 0) !== 0 ||
        (agregados.cmvCsp ?? 0) > 0 ||
        (agregados.lucroLiquido ?? 0) !== 0 ||
        (agregados.receitaBruta ?? 0) > 0 ||
        (agregados.despesasOperacionais ?? 0) > 0),
    ) ||
      Boolean(
        totaisFiscais &&
        ((totaisFiscais.faturamentoPeriodo ?? 0) > 0 ||
          (totaisFiscais.comprasTotais ?? 0) > 0 ||
          (totaisFiscais.comprasComCredito ?? 0) > 0 ||
          (totaisFiscais.saldoCredorAcumulado ?? 0) > 0 ||
          (totaisFiscais.receitaInterestadual ?? 0) > 0 ||
          (totaisFiscais.receitaExportacao ?? 0) > 0),
      ))

  const formatarData = (iso?: string) => {
    if (!iso) return '—'
    try {
      const d = new Date(iso)
      if (isNaN(d.getTime())) return iso
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return iso
    }
  }

  if (!temDadosGerenciais || !doc) {
    return (
      <div
        className={`p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
          <span>
            <strong>Dados Gerenciais dos Documentos:</strong> Nenhum balancete ou EFD foi importado
            para esta empresa. As análises utilizam os valores informados manualmente no cadastro da
            Fonte Mestra.
          </span>
        </div>
        <Link
          to="/dados-empresa"
          className="shrink-0 font-bold text-[#07132B] hover:text-[#D4AF37] underline transition-colors"
        >
          Importar balancete ou EFD →
        </Link>
      </div>
    )
  }

  const rotuloTipoDoc =
    doc.tipo === 'balancete'
      ? 'Balancete Contábil'
      : doc.tipo === 'efd_contribuicoes'
        ? 'EFD Contribuições'
        : doc.tipo === 'efd_icms_ipi'
          ? 'EFD ICMS/IPI'
          : doc.tipo === 'cnae_secundario'
            ? 'CNAE Secundário'
            : doc.tipo === 'consulta_cnpj'
              ? 'Consulta CNPJ'
              : doc.nomeTipo || 'Documento Fiscal'

  return (
    <div
      className={`bg-white rounded-[24px] p-6 sm:p-8 border border-slate-200 shadow-md space-y-6 ${className}`}
    >
      {/* CABEÇALHO DA SEÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase bg-[#07132B] text-[#D4AF37] border border-[#D4AF37]/30">
              ORIGEM REAL • SPED & BALANCETE
            </span>
            <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
              DOCUMENTO IMPORTADO
            </span>
            {nomeEmpresa && (
              <span className="text-[11px] font-medium text-slate-500">• {nomeEmpresa}</span>
            )}
          </div>
          <h3 className="text-xl font-heading font-extrabold text-[#07132B] mt-1.5">
            Dados Gerenciais dos Documentos Importados
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Agregados contábeis e fiscais extraídos com fidelidade documental dos arquivos
            escriturados da empresa.
          </p>
        </div>

        <Link
          to="/dados-empresa"
          className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-[#07132B] hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5"
        >
          <span>Gerenciar Documentos</span>
          <span>→</span>
        </Link>
      </div>

      {/* METADADOS DO DOCUMENTO PRINCIPAL / ORIGEM */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 via-slate-50/80 to-amber-50/40 border border-slate-200/90 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#07132B] text-[#D4AF37] font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
              {doc.tipo === 'balancete' ? 'BAL' : 'EFD'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-slate-800 text-sm">{doc.nomeArquivo}</strong>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#07132B] text-[#D4AF37]">
                  {rotuloTipoDoc}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Importado em <strong>{formatarData(doc.dataImportacao)}</strong>
                {doc.periodoInicio && doc.periodoFim ? (
                  <span>
                    {' '}
                    • Período de escrituração: <strong>{doc.periodoInicio}</strong> a{' '}
                    <strong>{doc.periodoFim}</strong>
                  </span>
                ) : null}
                {doc.linhasLidas ? (
                  <span> • {doc.linhasLidas.toLocaleString('pt-BR')} linhas lidas</span>
                ) : null}
              </p>
            </div>
          </div>

          {doc.camposPreenchidos && doc.camposPreenchidos.length > 0 && (
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Campos Vinculados
              </span>
              <span className="font-mono text-xs font-bold text-slate-700">
                {doc.camposPreenchidos.length} parâmetro(s) na Fonte Mestra
              </span>
            </div>
          )}
        </div>
      </div>

      {/* BLOCO (A): QUADRO GERENCIAL CONTÁBIL (BALANCETE) */}
      {agregados && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
              <h4 className="text-sm font-heading font-extrabold text-[#07132B] uppercase tracking-wide">
                Quadro Gerencial Contábil (Balancete)
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Arquivo: <strong className="text-slate-700">{doc.nomeArquivo}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {/* Ativo Total */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 uppercase font-semibold block text-[10px]">
                Ativo Total
              </span>
              <strong className="text-slate-800 text-sm font-mono block mt-0.5">
                {agregados.ativoTotal ? formatarMoeda(agregados.ativoTotal) : '—'}
              </strong>
              <span className="text-[10px] text-slate-500 block mt-1">
                Bens & Direitos Escriturados
              </span>
            </div>

            {/* Passivo Total */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 uppercase font-semibold block text-[10px]">
                Passivo Total
              </span>
              <strong className="text-slate-800 text-sm font-mono block mt-0.5">
                {agregados.passivoTotal ? formatarMoeda(agregados.passivoTotal) : '—'}
              </strong>
              <span className="text-[10px] text-slate-500 block mt-1">Obrigações & Exigíveis</span>
            </div>

            {/* Patrimônio Líquido */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 uppercase font-semibold block text-[10px]">
                Patrimônio Líquido (PL)
              </span>
              <strong
                className={`text-sm font-mono block mt-0.5 ${
                  (agregados.patrimonioLiquido ?? 0) >= 0 ? 'text-slate-800' : 'text-rose-600'
                }`}
              >
                {agregados.patrimonioLiquido !== undefined
                  ? formatarMoeda(agregados.patrimonioLiquido)
                  : '—'}
              </strong>
              <span className="text-[10px] text-slate-500 block mt-1">
                Capital Social & Reservas
              </span>
            </div>

            {/* CMV / CSP */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 uppercase font-semibold block text-[10px]">
                Custos (CMV / CSP)
              </span>
              <strong className="text-slate-800 text-sm font-mono block mt-0.5">
                {agregados.cmvCsp ? formatarMoeda(agregados.cmvCsp) : '—'}
              </strong>
              <span className="text-[10px] text-slate-500 block mt-1">
                Custo Mercadorias / Serviços
              </span>
            </div>

            {/* Lucro Líquido */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 uppercase font-semibold block text-[10px]">
                Resultado / Lucro Líquido
              </span>
              <strong
                className={`text-sm font-mono block mt-0.5 ${
                  (agregados.lucroLiquido ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {agregados.lucroLiquido !== undefined ? formatarMoeda(agregados.lucroLiquido) : '—'}
              </strong>
              <span className="text-[10px] text-slate-500 block mt-1">
                {(agregados.lucroLiquido ?? 0) >= 0 ? 'Superávit apurado' : 'Prejuízo acumulado'}
              </span>
            </div>
          </div>

          {/* Dados secundários do balancete (se houver receita bruta / despesas) */}
          {(agregados.receitaBruta || agregados.despesasOperacionais) && (
            <div className="flex flex-wrap gap-2 text-xs text-slate-700 pt-1">
              {agregados.receitaBruta ? (
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 font-mono">
                  Receita Bruta Escriturada:{' '}
                  <strong>{formatarMoeda(agregados.receitaBruta)}</strong>
                </span>
              ) : null}
              {agregados.despesasOperacionais ? (
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 font-mono">
                  Despesas Operacionais:{' '}
                  <strong>{formatarMoeda(agregados.despesasOperacionais)}</strong>
                </span>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* BLOCO (B): TOTAIS DAS EFDs (QUANDO HOUVER) */}
      {totaisFiscais && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#07132B]" />
              <h4 className="text-sm font-heading font-extrabold text-[#07132B] uppercase tracking-wide">
                Totais Fiscais Escriturados (EFD SPED)
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Escrituração Fiscal Digital
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Faturamento Período */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 uppercase font-semibold block text-[10px]">
                Faturamento no Período
              </span>
              <strong className="text-slate-800 text-sm font-mono block mt-0.5">
                {totaisFiscais.faturamentoPeriodo
                  ? formatarMoeda(totaisFiscais.faturamentoPeriodo)
                  : '—'}
              </strong>
              <span className="text-[10px] text-slate-500 block mt-1">
                Receita bruta das operações
              </span>
            </div>

            {/* Compras com Crédito */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 uppercase font-semibold block text-[10px]">
                Compras com Crédito Escriturado
              </span>
              <strong className="text-slate-800 text-sm font-mono block mt-0.5">
                {totaisFiscais.comprasComCredito
                  ? formatarMoeda(totaisFiscais.comprasComCredito)
                  : '—'}
              </strong>
              <span className="text-[10px] text-slate-500 block mt-1">
                Base geradora de créditos
              </span>
            </div>

            {/* Saldo Credor Acumulado */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 uppercase font-semibold block text-[10px]">
                Saldo Credor Acumulado
              </span>
              <strong className="text-slate-800 text-sm font-mono block mt-0.5">
                {totaisFiscais.saldoCredorAcumulado
                  ? formatarMoeda(totaisFiscais.saldoCredorAcumulado)
                  : '—'}
              </strong>
              <span className="text-[10px] text-slate-500 block mt-1">
                Estoque de créditos tributários
              </span>
            </div>

            {/* Operações Interestaduais */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 uppercase font-semibold block text-[10px]">
                Vendas Interestaduais
              </span>
              <strong className="text-slate-800 text-sm font-mono block mt-0.5">
                {totaisFiscais.receitaInterestadual
                  ? formatarMoeda(totaisFiscais.receitaInterestadual)
                  : totaisFiscais.percentualVendasInterestaduais
                    ? `${totaisFiscais.percentualVendasInterestaduais}%`
                    : '—'}
              </strong>
              <span className="text-[10px] text-slate-500 block mt-1">
                {totaisFiscais.percentualVendasInterestaduais
                  ? `${totaisFiscais.percentualVendasInterestaduais}% do faturamento`
                  : 'Operações interestaduais'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* BLOCO (C): LISTA DE DOCUMENTOS E RASTREABILIDADE */}
      <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <strong className="text-slate-700 uppercase tracking-wider text-[11px]">
            Documento de Escrituração Vinculado
          </strong>
          <span className="text-[10px] text-slate-500">Validação & Fidelidade Documental</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1 text-slate-600 border-t border-slate-200/60 pt-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-800">{doc.nomeArquivo}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-700 font-semibold">
              {rotuloTipoDoc}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Processado em {formatarData(doc.dataImportacao)}
            {doc.cnpjArquivo ? ` • CNPJ do Arquivo: ${doc.cnpjArquivo}` : ''}
          </div>
        </div>
      </div>
    </div>
  )
}
