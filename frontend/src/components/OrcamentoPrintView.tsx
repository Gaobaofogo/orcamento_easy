import React, { useState, useEffect, useRef } from 'react';
import { Orcamento } from '../types';
import { useAuth } from '../context/AuthContext';
import { Printer, X, FileText, CheckCircle, Clock, AlertTriangle, Building2, Phone, MapPin, Edit2 } from 'lucide-react';
import { formatPhone, formatCNPJ, formatFullDateWithWeekday, numeroPorExtenso } from '../utils/formatters';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import { getOrcamentoFile } from '../services/api';


interface OrcamentoPrintViewProps {
  isOpen: bool;
  orcamento: Orcamento;
  onClose: () => void;
  onStatusChange?: (orcamentoId: string, newStatus: 'Pendente' | 'Aprovado' | 'Recusado' | 'Em Andamento') => void;
}

export const OrcamentoPrintView: React.FC<OrcamentoPrintViewProps> = ({ isOpen, orcamento, onClose, onStatusChange }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log("FUi usado")
      if (e.key === 'Escape') {
	onClose();
      }

    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);
  const { user } = useAuth();

  // Custom Editable Fields for the Quote document
  const [validadeDias, setValidadeDias] = useState<string>('10 dias a contar da data da emissão');
  const [materiaPrimaTexto, setMateriaPrimaTexto] = useState<string>(
    `A ${user?.nomeFantasia || user?.razaoSocial || 'MARCENARIA'} – Móveis Projetados em Geral, sente-se honrada em poder atendê-lo(a), utilizando Fibras de Média Densidade (MDF) da mais alta qualidade disponível no mercado (Duratex, Guararapes e Arauco) com uma infinidade de cores e possibilidades, seguindo detalhadamente as especificações informadas no projeto arquitetônico.\n` +
    `As ferragens utilizadas em todos os projetos são de marcas renomadas na qual se destaca pela durabilidade superior, onde todas as dobradiças possuem amortecedor incorporado para fechamento suave das portas, bem como corrediças reforçadas com resistência até 40kg. Nas portas basculantes são instalados pistões amortecedores proporcionando abertura prática. Instalamos puxadores facetados, cavas, dentre outros, conforme o desejo do cliente.\n` +
    `Realizamos um serviço totalmente artesanal com atenção máxima aos mínimos detalhes, com cortes perfeitos, colagem de fórmica e perfuração que garante ótima fixação, entregando sempre o melhor para o cliente.`
  );
  const [formaPagamentoCartao, setFormaPagamentoCartao] = useState<string>('O Total Geral poderá ser parcelado em até 10 x no Cartão de Crédito;');
  const [formaPagamentoVista, setFormaPagamentoVista] = useState<string>('O valor à vista tem 10% (dez porcento) de desconto.');
  const [prazoEntrega, setPrazoEntrega] = useState<string>('O prazo será à combinar.');
  const [showEditorOptions, setShowEditorOptions] = useState<boolean>(false);

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);
  };

  const handlePrint = async () => {
    const temp_file = await getOrcamentoFile(orcamento.id);

    const url = URL.createObjectURL(temp_file);
    const a = document.createElement('a');
    a.href = url;
    a.download = "Orçamento.pdf";

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Aprovado':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Aprovado</span>;
      case 'Em Andamento':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200"><Clock className="w-3.5 h-3.5 text-sky-600" /> Em Andamento</span>;
      case 'Recusado':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"><AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Recusado</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3.5 h-3.5 text-amber-600" /> Pendente</span>;
    }
  };

  const totalValor = orcamento.valorTotal || (orcamento.itens ? orcamento.itens.reduce((acc, item) => acc + (item.valor || 0), 0) : 0);
  const totalExtenso = numeroPorExtenso(totalValor);

  // Format Orcamento Number e.g. 120/2026
  const anoOrcamento = orcamento.data ? new Date(orcamento.data).getFullYear() : new Date().getFullYear();
  const numeroFormatado = orcamento.id.startsWith('ORC-') ? `${orcamento.id.replace('ORC-', '')}/${anoOrcamento}` : `${orcamento.id}/${anoOrcamento}`;
  const modalRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={handleBackdropClick}>
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-slate-900 shadow-2xl border border-slate-800"
	ref={modalRef}
      >
        
        {/* Top Control Bar (Hidden on Print) */}
	<div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 rounded-t-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Modelo Oficial de Orçamento / Proposta
                {getStatusBadge(orcamento.status)}
              </h2>
              <p className="text-xs text-slate-400">Pronto para impressão em papel A4 e geração de PDF</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEditorOptions(!showEditorOptions)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-orange-400" />
              {showEditorOptions ? 'Ocultar Opções de Edição' : 'Editar Prazos e Condições'}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-orange-400 hover:bg-orange-500 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir / PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status bar inside Modal (Hidden on Print) */}
        {onStatusChange && (
          <div className="p-3 bg-slate-800 border-b border-slate-700 print:hidden flex items-center justify-between text-xs text-slate-300">
            <span>Alterar Status do Orçamento:</span>
            <div className="flex gap-2">
              {(['Pendente', 'Em Andamento', 'Aprovado', 'Recusado'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => onStatusChange(orcamento.id, st)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    orcamento.status === st
                      ? 'bg-orange-400 text-slate-950 shadow-sm'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Optional Customization Panel (Hidden on Print) */}
        {showEditorOptions && (
          <div className="p-4 bg-orange-50/80 border-b border-orange-200 print:hidden space-y-3 text-xs">
            <h4 className="font-bold text-orange-900 uppercase tracking-wider text-[11px]">
              Ajustar Informações do Documento Impresso:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Validade da Proposta:</label>
                <input
                  type="text"
                  value={validadeDias}
                  onChange={(e) => setValidadeDias(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Prazo de Entrega:</label>
                <input
                  type="text"
                  value={prazoEntrega}
                  onChange={(e) => setPrazoEntrega(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Forma de Pagamento (Cartão):</label>
                <input
                  type="text"
                  value={formaPagamentoCartao}
                  onChange={(e) => setFormaPagamentoCartao(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Forma de Pagamento (À vista):</label>
                <input
                  type="text"
                  value={formaPagamentoVista}
                  onChange={(e) => setFormaPagamentoVista(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Texto de Matéria-Prima / Especificações:</label>
              <textarea
                rows={3}
                value={materiaPrimaTexto}
                onChange={(e) => setMateriaPrimaTexto(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
              />
            </div>
          </div>
        )}

        {/* PRINTABLE DOCUMENT AREA */}
        <div className="overflow-y-auto p-8 sm:p-12 print:p-0 bg-white text-slate-900 font-sans leading-relaxed text-sm">
          
          {/* Top Line Separator */}
          <div className="w-full h-1.5 bg-orange-500 mb-6" />

          {/* 1. LOGOMARCA & LOGO BANNER */}
          <div className="text-center mb-6">
            {user?.logomarca ? (
              <div className="flex justify-center mb-2">
                <img src={user.logomarca} alt="Logomarca" className="max-h-24 object-contain" />
              </div>
            ) : (
              <div className="inline-block border-2 border-slate-900 px-6 py-2 rounded-xl mb-2 bg-slate-50">
                <h1 className="text-2xl font-black text-orange-600 tracking-wider uppercase">
                  {user?.nomeFantasia || user?.razaoSocial || 'MARCENARIA'}
                </h1>
              </div>
            )}
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">
              MÓVEIS PROJETADOS EM GERAL
            </p>
          </div>

          {/* Orange Accent Line under Logo */}
          <div className="w-full h-0.5 bg-orange-500/80 mb-6" />

          {/* 2. TÍTULO */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-extrabold text-slate-600 tracking-wider uppercase border-b-2 border-slate-300 inline-block pb-1">
              ORÇAMENTO / PROPOSTA
            </h2>
          </div>

          {/* 3, 4, 5, 6, 7. DADOS DO CLIENTE E DO ORÇAMENTO (QUADRO COM BORDA AZUL) */}
          <div className="border border-sky-700/40 rounded-none mb-6 overflow-hidden text-xs">
            <div className="grid grid-cols-3 divide-x divide-sky-700/30 border-b border-sky-700/30 bg-white">
              <div className="p-2.5">
                <span className="block text-[10px] font-bold text-sky-800 uppercase">Cliente / Contratante</span>
                <span className="font-bold text-slate-900 text-sm">{orcamento.cliente?.nome || 'Cliente não informado'}</span>
              </div>
              <div className="p-2.5">
                <span className="block text-[10px] font-bold text-sky-800 uppercase">Telefone</span>
                <span className="font-bold text-slate-900">{formatPhone(orcamento.cliente?.celular)}</span>
              </div>
              <div className="p-2.5">
                <span className="block text-[10px] font-bold text-sky-800 uppercase">Data da emissão</span>
                <span className="font-bold text-slate-900">{formatFullDateWithWeekday(orcamento.data)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-sky-700/30 bg-white">
              <div className="p-2.5 col-span-2">
                <span className="block text-[10px] font-bold text-sky-800 uppercase">Endereço</span>
                <span className="font-bold text-slate-900">{orcamento.cliente?.apelido || 'Caicó – RN'}</span>
              </div>
              <div className="p-2.5">
                <span className="block text-[10px] font-bold text-sky-800 uppercase">Validade da proposta</span>
                <span className="font-bold text-slate-900">{validadeDias}</span>
              </div>
            </div>
          </div>

          {/* 8. TEXTO BREVE / INTRODUÇÃO */}
          <div className="mb-6 space-y-2 text-xs text-slate-800">
            <p className="font-semibold">Prezado(a) Cliente,</p>
            {orcamento.introducao || user?.introducao ? (
              <div
                className="text-justify leading-relaxed prose prose-slate prose-xs max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(orcamento.introducao || user?.introducao)
                }}
              />
            ) : (
              <p className="text-justify leading-relaxed">
                Vimos por meio deste, apresentar o orçamento/proposta para confecção, fornecimento e instalação de{' '}
                <strong className="uppercase">MÓVEIS PLANEJADOS</strong>
                {orcamento.observacoes ? ` (${orcamento.observacoes})` : ''}, conforme descrição abaixo.
              </p>
            )}
          </div>

          {/* 9 & 10. ESPECIFICAÇÕES TÉCNICAS E MATÉRIA PRIMA */}
          <div className="mb-6 space-y-3">
            <div className="border-b border-sky-700/40 pb-1">
              <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wider">
                ESPECIFICAÇÕES TÉCNICAS
              </h3>
            </div>

            <div>
              <h4 className="text-xs font-bold text-sky-900 uppercase mb-1.5">
                MATÉRIA PRIMA
              </h4>
              <div
                className="text-xs text-slate-700 space-y-2 text-justify leading-relaxed prose prose-slate prose-xs max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(orcamento.materiaPrima || user?.materiaPrima || materiaPrimaTexto)
                }}
              />
            </div>
          </div>

          {/* 11 & 12. AMBIENTE E ESPECIFICAÇÕES DO PROJETO (TABELA DE ITENS COM VALOR POR EXTENSO) */}
          <div className="mb-6 space-y-2">
            <div className="border-b border-sky-700/40 pb-1">
              <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wider">
                AMBIENTE E ESPECIFICAÇÕES DO PROJETO
              </h3>
            </div>

            <div className="border border-sky-700/40 overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-sky-50 text-sky-900 border-b border-sky-700/40 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2 px-3 border-r border-sky-700/30 w-1/3">Local / ambiente</th>
                    <th className="py-2 px-3 border-r border-sky-700/30 w-1/2">O que será feito</th>
                    <th className="py-2 px-3 text-right">Valores</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-700/20">
                  {orcamento.itens && orcamento.itens.length > 0 ? (
                    orcamento.itens.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-2 px-3 border-r border-sky-700/30 font-semibold text-slate-900">
                          {item.local || 'Ambiente'}
                        </td>
                        <td className="py-2 px-3 border-r border-sky-700/30 text-slate-800">
                          <span className="font-medium">{item.servico}</span>
                          {item.descricao && <span className="block text-[11px] text-slate-600 mt-0.5">{item.descricao}</span>}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                          {formatCurrency(item.valor)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-500 italic">
                        Nenhum item adicionado ao orçamento.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  {/* Total Row */}
                  <tr className="border-t border-sky-700/40 bg-sky-50/60 font-bold">
                    <td colSpan={2} className="py-2 px-3 text-right text-sky-900 border-r border-sky-700/30 italic">
                      Total Geral em R$
                    </td>
                    <td className="py-2 px-3 text-right text-slate-900 text-sm font-mono font-black">
                      {formatCurrency(totalValor)}
                    </td>
                  </tr>

                  {/* Valor Por Extenso Row */}
                  <tr className="border-t border-sky-700/40 bg-sky-100/40">
                    <td colSpan={3} className="p-2.5 space-y-1">
                      <span className="block text-[10px] font-bold text-sky-900 uppercase italic">
                        Valor por extenso do Orçamento / Proposta
                      </span>
                      <span className="block font-bold text-sky-900 text-xs">
                        {totalExtenso}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 13. FORMAS DE PAGAMENTO */}
          <div className="mb-6 space-y-1 text-xs">
            <h3 className="font-bold text-sky-900 uppercase tracking-wider mb-1.5">
              FORMAS DE PAGAMENTO
            </h3>
            {orcamento.formaPagamento || user?.formaPagamento ? (
              <div
                className="text-slate-800 text-xs space-y-1 prose prose-slate prose-xs max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(orcamento.formaPagamento || user?.formaPagamento)
                }}
              />
            ) : (
              <ul className="space-y-1 text-slate-800 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-slate-900 font-bold">▪</span>
                  <span>{formaPagamentoCartao}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-900 font-bold">▪</span>
                  <span>{formaPagamentoVista}</span>
                </li>
              </ul>
            )}
          </div>

          {/* 14. PRAZO DE ENTREGA */}
          <div className="mb-8 space-y-1 text-xs">
            <h3 className="font-bold text-sky-900 uppercase tracking-wider mb-1.5">
              PRAZO DE ENTREGA
            </h3>
            <ul className="space-y-1 text-slate-800 pl-1">
              <li className="flex items-start gap-2">
                <span className="text-slate-900 font-bold">▪</span>
                <span>{prazoEntrega}</span>
              </li>
            </ul>
          </div>

          {/* Closing Text & 15. ASSINATURAS */}
          <div className="space-y-8 mt-10">
            <p className="text-center text-xs text-slate-700 italic">
              Sendo assim, as partes estando de acordo, assinam e reconhece a PROPOSTA / ORÇAMENTO como legítimo.
            </p>

            <div className="grid grid-cols-2 gap-8 text-center pt-8 text-xs">
              <div className="space-y-1">
                <div className="w-4/5 mx-auto border-t border-slate-800 mb-2" />
                <p className="font-bold text-slate-900">{orcamento.cliente?.nome || 'Cliente / Contratante'}</p>
                <p className="text-[11px] text-slate-600 font-semibold">Cliente / Contratante</p>
              </div>

              <div className="space-y-1">
                <div className="w-4/5 mx-auto border-t border-slate-800 mb-2" />
                <p className="font-bold text-slate-900">
                  {user?.nome || user?.nomeFantasia || user?.razaoSocial || 'Prestador de Serviço'}
                </p>
                <p className="text-[11px] text-slate-600 font-semibold">Contratado</p>
              </div>
            </div>
          </div>

          {/* 16. RODAPÉ DO DOCUMENTO (ENDEREÇO E TELEFONE DO USUÁRIO) */}
          <div className="mt-12 pt-4 border-t-2 border-orange-500 text-center text-xs font-semibold text-orange-600">
            <p>
              {user?.endereco ? `${user.endereco} – ` : 'Rua Professor Luiz Conrado, 80 - Caicó - RN – '}
              Fone / Whatsapp {formatPhone(user?.telefone || '(84) 99421-8139')}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
