import { describe, it, expect } from 'vitest'
import { parseSpedFaturamento, isConteudoSped } from '../lib/ingestaoFaturamento'
import { DADOS_EMPRESA_PADRAO } from '../types/dadosEmpresa'

// SPED sintético mínimo — EFD Contribuições, BLOCO A (serviços).
// Leiaute oficial A100: |A100|IND_OPER|IND_EMIS|COD_PART|COD_SIT|SER|SUB|
//   NUM_DOC|CHV_NFSE|DT_DOC|DT_EXE_SERV|VL_DOC|IND_PGTO|  (VL_DOC = campo 12)
const spedBlocoA = [
  '|0000|005|0|0||01012024|31012024|EMPRESA SERVICOS TESTE LTDA|12345678000195|SP|3550308||01|1|',
  '|0001|0|',
  '|0140|0001|MATRIZ SP|12345678000195|SP||3550308|||',
  '|A010|12345678000195|1|',
  // Serviço PRESTADO (IND_OPER=1): VL_DOC em parts[11]
  '|A100|1|1||00|||||01012024||80000,00|0|',
  '|A170|1|SRV001|CONSULTORIA TECNICA|50000,00|0|||01|50000,00|1,65|825,00|01|50000,00|7,60|3800,00|',
  '|A170|2|SRV002|DESENVOLVIMENTO DE SISTEMAS|30000,00|0|||01|30000,00|1,65|495,00|01|30000,00|7,60|2280,00|',
  // Serviço CONTRATADO (IND_OPER=0): vai para compras, não receita
  '|A100|0|1||00|||||15012024||12000,00|0|',
  '|A170|1|SRV003|MANUTENCAO EQUIPAMENTOS|12000,00|0|||01|12000,00|1,65|198,00|01|12000,00|7,60|912,00|',
  // Documento cancelado (COD_SIT=02): não soma
  '|A100|1|1||02|||||20012024||5000,00|0|',
  '|M001|0|',
  '|M100|101|0|50000,00|1,65|0|825,00|0|825,00|0|0|825,00|01|',
  '|M200|92000,00|92000,00|0|0|0|0|0|0|0|0|0|',
  '|9900|12345678000195|50|',
  '|9999|17|',
].join('\n')

// SPED sintético mínimo — EFD Contribuições, BLOCO C (mercadorias).
// Igual ao caso do teste existente de parseSpedFiscal (regressão).
const spedBlocoC = [
  '|0000|005|0|0||01012024|31012024|EMPRESA MODELO CONTABIL LTDA|12345678000195|SP|3550308||01|1|',
  '|0001|0|',
  '|0140|0001|MATRIZ SP|12345678000195|SP||3550308|||',
  '|C010|12345678000195|1|',
  '|C100|1|0|FORN01|55|00|1|1001|25012024|25012024|100000,00|0||0|100000,00|0|0|0|100000,00|0|0|0|0|0|0|0|',
  '|C170|1|P001|GASOLINA ADITIVADA|1000|UN|50000,00|0|0|010|5102|101|0|0|0|0|0|0|0|0|0|0|0|0|04|0,00|0,00|0,00|04|0,00|0,00|0,00|',
  '|C170|2|P002|BEBIDA ENERGETICA|500|UN|30000,00|0|0|010|6102|101|0|0|0|0|0|0|0|0|0|0|0|0|01|30000,00|1,65|495,00|01|30000,00|7,60|2280,00|',
  '|C170|3|P003|PRODUTO ISENTO|200|UN|20000,00|0|0|040|5102|101|0|0|0|0|0|0|0|0|0|0|0|0|06|0,00|0,00|0,00|06|0,00|0,00|0,00|',
  '|M001|0|',
  '|M100|101|0|50000,00|1,65|0|825,00|0|825,00|0|0|825,00|01|',
  '|M200|100000,00|100000,00|0|0|0|0|0|0|0|0|0|',
  '|9999|13|',
].join('\n')

describe('ingestaoFaturamento - roteamento e ingestão de SPED', () => {
  it('isConteudoSped reconhece linhas de registro SPED e rejeita CSV comum', () => {
    expect(isConteudoSped(spedBlocoA)).toBe(true)
    expect(isConteudoSped('data;valor\n2024-01;1000\n2024-02;2000')).toBe(false)
  })

  it('Bloco A (serviços): faturamento > 0 — correção do índice VL_DOC', () => {
    const res = parseSpedFaturamento(spedBlocoA, 'efd_servicos.txt', DADOS_EMPRESA_PADRAO)
    expect(res.sucesso).toBe(true)
    // A100 prestado: 80000 + 5000 cancelado (excluído) => 80000; contratado 12000 vai para compras
    expect(res.receitaTotal).toBe(80000)
    expect(res.tipoFonte).toBe('sped')
    expect(res.avisos.length).toBe(0)
    expect(res.periodoInicio).toBe('01012024')
    expect(res.periodoFim).toBe('31012024')
  })

  it('Bloco C (regressão): mesmos valores de antes da correção', () => {
    const res = parseSpedFaturamento(spedBlocoC, 'efd_mercadorias.txt', DADOS_EMPRESA_PADRAO)
    expect(res.sucesso).toBe(true)
    expect(res.receitaTotal).toBe(100000)
    expect(res.tipoFonte).toBe('sped')
    if (res.sped) {
      expect(res.sped.detalhes.receitaInterestadual).toBe(30000)
      expect(res.sped.detalhes.percentualVendasInterestaduais).toBe(30)
    }
  })

  it('SPED sem receita extraível: aviso PT-BR e sucesso=false (nada gravado)', () => {
    const spedSemReceita = [
      '|0000|005|0|0||01012024|31012024|EMPRESA SEM RECEITA LTDA|12345678000195|SP|3550308||01|1|',
      '|0001|0|',
      '|A010|12345678000195|1|',
      // Só serviço CONTRATADO (entrada) — nada de prestação
      '|A100|0|1||00|||||15012024||12000,00|0|',
      '|M001|0|',
      '|9999|8|',
    ].join('\n')
    const res = parseSpedFaturamento(spedSemReceita, 'efd_vazio.txt', DADOS_EMPRESA_PADRAO)
    expect(res.sucesso).toBe(false)
    expect(res.receitaTotal).toBe(0)
    expect(res.erro).toContain('Não foi possível extrair receita')
    expect(res.avisos.join(' ')).toContain('Nada será gravado')
  })
})
