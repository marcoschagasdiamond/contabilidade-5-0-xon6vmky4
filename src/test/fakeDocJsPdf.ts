/**
 * Documento jsPDF FALSO para testes sem navegador.
 *
 * Os tipos (`FakeDocJsPdf`, `FakePdfCall`, `FakeGState`) moram em
 * `fakeDocJsPdfTypes.ts` e a implementação em `fakeDocJsPdfImpl.ts`;
 * este módulo é a fachada pública usada pelas suítes.
 */
export type { FakeDocJsPdf, FakePdfCall, FakeGState } from './fakeDocJsPdfTypes'
export { gerarFakeDocJsPdf } from './fakeDocJsPdfImpl'
