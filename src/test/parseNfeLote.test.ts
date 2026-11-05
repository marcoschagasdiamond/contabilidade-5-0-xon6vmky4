import { describe, it, expect } from 'vitest'
import { parseNfeXmlUnica, agregarLoteNfe, construirResultadoParsingLoteNfe } from './parseNfeLote'
import { DADOS_EMPRESA_PADRAO } from '@/types/dadosEmpresa'

const XML_NFE_VALIDA_SAIDA = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260112345678000190550010000000011000000010" versao="4.00">
      <ide>
        <natOp>VENDA DE MERCADORIA</natOp>
        <tpNF>1</tpNF>
        <dEmi>2026-03-15</dEmi>
        <nNF>1</nNF>
        <serie>1</serie>
      </ide>
      <emit>
        <CNPJ>12345678000190</CNPJ>
        <xNome>EMPRESA MODELO LTDA</xNome>
        <enderEmit><UF>SP</UF></enderEmit>
      </emit>
      <dest>
        <CNPJ>98765432000199</CNPJ>
        <xNome>CLIENTE RJ SA</xNome>
        <enderDest><UF>RJ</UF></enderDest>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>PROD-01</cProd>
          <xProd>REFRIGERANTE LATA 350ML</xProd>
          <NCM>22021000</NCM>
          <CFOP>6102</CFOP>
          <uCom>UN</uCom>
          <qCom>100</qCom>
          <vUnCom>5.00</vUnCom>
          <vProd>500.00</vProd>
        </prod>
        <imposto>
          <ICMS><ICMS00><CST>00</CST><vBC>500.00</vBC><vICMS>60.00</vICMS></ICMS00></ICMS>
          <PIS><PISAliq><CST>04</CST><vBC>500.00</vBC><vPIS>0.00</vPIS></PISAliq></PIS>
          <COFINS><COFINSAliq><CST>04</CST><vBC>500.00</vBC><vCOFINS>0.00</vCOFINS></COFINSAliq></COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vProd>500.00</vProd>
          <vNF>500.00</vNF>
          <vICMS>60.00</vICMS>
          <vPIS>0.00</vPIS>
          <vCOFINS>0.00</vCOFINS>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`

const XML_NFE_VALIDA_ENTRADA = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260199999999000190550010000000021000000020" versao="4.00">
      <ide>
        <natOp>COMPRA DE INSUMOS</natOp>
        <tpNF>0</tpNF>
        <dEmi>2026-03-20</dEmi>
        <nNF>2</nNF>
        <serie>1</serie>
      </ide>
      <emit>
        <CNPJ>99999999000190</CNPJ>
        <xNome>FORNECEDOR SP</xNome>
        <enderEmit><UF>SP</UF></enderEmit>
      </emit>
      <dest>
        <CNPJ>12345678000190</CNPJ>
        <xNome>EMPRESA MODELO LTDA</xNome>
        <enderDest><UF>SP</UF></enderDest>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>INS-01</cProd>
          <xProd>INSUMO BÁSICO INDUSTRIAL</xProd>
          <NCM>84818099</NCM>
          <CFOP>1101</CFOP>
          <uCom>UN</uCom>
          <qCom>10</qCom>
          <vUnCom>20.00</vUnCom>
          <vProd>200.00</vProd>
        </prod>
        <imposto>
          <ICMS><ICMS00><CST>00</CST><vBC>200.00</vBC><vICMS>36.00</vICMS></ICMS00></ICMS>
          <PIS><PISAliq><CST>50</CST><vBC>200.00</vBC><vPIS>3.30</vPIS></PISAliq></PIS>
          <COFINS><COFINSAliq><CST>50</CST><vBC>200.00</vBC><vCOFINS>15.20</vCOFINS></COFINSAliq></COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vProd>200.00</vProd>
          <vNF>200.00</vNF>
          <vICMS>36.00</vICMS>
          <vPIS>3.30</vPIS>
          <vCOFINS>15.20</vCOFINS>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`

describe('Parser de NF-e em XML (unitário)', () => {
  it('extrai corretamente uma NF-e de saída interestadual com item monofásico', () => {
    const nota = parseNfeXmlUnica(XML_NFE_VALIDA_SAIDA, 'nfe_saida_01.xml')
    expect(nota.tipoOperacao).toBe('saida')
    expect(nota.numero).toBe('1')
    expect(nota.dataEmissao).toBe('2026-03-15')
    expect(nota.emitenteUf).toBe('SP')
    expect(nota.destinatarioUf).toBe('RJ')
    expect(nota.isInterestadual).toBe(true)
    expect(nota.valorNota).toBe(500)
    expect(nota.itens.length).toBe(1)

    const item = nota.itens[0]
    expect(item.ncm).toBe('22021000')
    expect(item.cfop).toBe('6102')
    expect(item.cstPis).toBe('04')
    expect(item.isMonofasicoPisCofins).toBe(true)
  })

  it('extrai corretamente uma NF-e de entrada com CST 50 gerador de crédito', () => {
    const nota = parseNfeXmlUnica(XML_NFE_VALIDA_ENTRADA, 'nfe_entrada_01.xml')
    expect(nota.tipoOperacao).toBe('entrada')
    expect(nota.valorNota).toBe(200)
    expect(nota.itens.length).toBe(1)
    const item = nota.itens[0]
    expect(item.cstPis).toBe('50')
    expect(item.geraCreditoEntrada).toBe(true)
  })

  it('lança erro ao tentar parsear XML corrompido ou que não seja NF-e', () => {
    expect(() => parseNfeXmlUnica('<xml>invalido</xml>', 'corrompido.xml')).toThrow(
      /não é uma NF-e válida/,
    )
    expect(() => parseNfeXmlUnica('', 'vazio.xml')).toThrow(/vazio/)
  })

  it('agrega lote com entradas e saídas e gera comparativo com fonte mestra', () => {
    const notaSaida = parseNfeXmlUnica(XML_NFE_VALIDA_SAIDA, 's1.xml')
    const notaEntrada = parseNfeXmlUnica(XML_NFE_VALIDA_ENTRADA, 'e1.xml')

    const perfil = { ...DADOS_EMPRESA_PADRAO, faturamentoMensal: 100000 }
    const agregados = agregarLoteNfe([notaSaida, notaEntrada], [], perfil)

    expect(agregados.totalNotasProcessadas).toBe(2)
    expect(agregados.totalNotasSaida).toBe(1)
    expect(agregados.totalNotasEntrada).toBe(1)
    expect(agregados.faturamentoTotalSaidas).toBe(500)
    expect(agregados.comprasTotaisEntradas).toBe(200)
    expect(agregados.percentualVendasInterestaduais).toBe(100)
    expect(agregados.presencaMonofasicos).toBe(true)
    expect(agregados.ncmsConsolidados.length).toBe(2)

    const resultado = construirResultadoParsingLoteNfe(
      agregados,
      [notaSaida, notaEntrada],
      'lote_teste.zip',
      1024,
      perfil,
    )

    expect(resultado.valido).toBe(true)
    expect(resultado.camposSugeridos.faturamentoMensal).toBe(500)
    expect(resultado.camposSugeridos.percentualVendasInterestaduais).toBe(100)
    expect(resultado.camposSugeridos.presencaMonofasicos).toBe(true)
    expect(resultado.camposComparativo.length).toBeGreaterThanOrEqual(3)
  })
})
