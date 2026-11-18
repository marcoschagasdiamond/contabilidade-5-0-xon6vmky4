/**
 * Rótulos de exibição para o vencedor do comparativo de regimes (Módulo 3 / parecer PDF).
 *
 * O rótulo interno "IBS/CBS" (nome do cenário no motor de cálculo) significa o REGIME REGULAR
 * da empresa já sob o novo sistema — por isso, quando o vencedor é "IBS/CBS", exibimos
 * "Regime Regular (Lucro Presumido sob IBS/CBS)" etc., usando o regime atual da empresa.
 * Contexto: o usuário confundiu o rótulo "IBS/CBS" com "Lucro Presumido".
 *
 * SÓ TEXTO — nenhuma lógica de comparação ou de cálculo é alterada.
 *
 * @param regimeMaisVantajoso valor interno do vencedor (ex.: 'IBS/CBS', 'Simples Nacional')
 * @param regimeAtualEmpresa regime atual da empresa (Módulo 1), para dizer qual dos dois
 */
export function obterRotuloRegimeVencedor(
  regimeMaisVantajoso?: string | null,
  regimeAtualEmpresa?: string | null,
): string {
  if (regimeMaisVantajoso === 'IBS/CBS' || regimeMaisVantajoso === 'IBS / CBS') {
    if (regimeAtualEmpresa === 'Lucro Real') return 'Regime Regular (Lucro Real sob IBS/CBS)'
    if (regimeAtualEmpresa === 'Simples Nacional')
      return 'Regime Regular (equivalente ao Simples Nacional sob IBS/CBS)'
    return 'Regime Regular (Lucro Presumido sob IBS/CBS)'
  }
  return regimeMaisVantajoso || '—'
}
