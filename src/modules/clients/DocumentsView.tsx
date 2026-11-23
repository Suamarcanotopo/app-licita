import React from 'react';
import { useApp } from '../../store/AppContext';
import { GROUP_DEFAULT_LABELS } from '../../engine/qualification';
import { DocumentStatus } from '../../types/domain';
import { DocumentStatusText } from '../../components/StatusLabel';

export const DocumentsView: React.FC = () => {
  const {
    state,
    docsPendingOnly,
    setDocsPendingOnly,
    updateLeadDocumentStatus,
    setSelectedLeadId,
    setRoute,
  } = useApp();

  const rows = state.leads
    .filter((l) => state.activeProjectId === 'all' || l.projectId === state.activeProjectId)
    .flatMap((lead) =>
      lead.documents.map((doc) => ({
        lead,
        doc,
      }))
    )
    .filter((item) =>
      docsPendingOnly
        ? item.doc.status === 'Solicitado' || item.doc.status === 'A corrigir'
        : true
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F2744]">Documentos · Controle de habilitação</h1>
          <p className="text-sm text-slate-600 mt-1">
            Status separados (Solicitado, Recebido, Aprovado, A corrigir). Marcar um item como Recebido cancela o lembrete daquele documento.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDocsPendingOnly(!docsPendingOnly)}
          className={`h-9 px-3.5 text-xs font-semibold rounded-md border transition-colors self-start whitespace-nowrap ${
            docsPendingOnly
              ? 'bg-[#0F2744] text-white border-[#0F2744]'
              : 'bg-white text-slate-700 border-[#CBD5E1] hover:border-[#0F2744]'
          }`}
        >
          {docsPendingOnly ? 'Mostrando apenas pendentes' : 'Filtrar pendentes / a corrigir'}
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-slate-600">
              <th className="py-3 px-4 font-semibold">Empresa</th>
              <th className="py-3 px-4 font-semibold">Documento</th>
              <th className="py-3 px-4 font-semibold">Grupo</th>
              <th className="py-3 px-4 font-semibold">Situação</th>
              <th className="py-3 px-4 font-semibold text-right">Atualizar status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ lead, doc }) => (
              <tr key={doc.id} className="hover:bg-slate-50">
                <td className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLeadId(lead.id);
                      setRoute('leads');
                    }}
                    className="font-semibold text-[#0F2744] hover:underline text-left"
                  >
                    {lead.companyName}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-900">{doc.name}</div>
                  {doc.note && <div className="text-[11px] text-slate-500 mt-0.5">{doc.note}</div>}
                </td>
                <td className="py-3 px-4 text-slate-600">{GROUP_DEFAULT_LABELS[doc.group]}</td>
                <td className="py-3 px-4">
                  <DocumentStatusText status={doc.status} />
                </td>
                <td className="py-3 px-4 text-right">
                  <select
                    value={doc.status}
                    onChange={(e) =>
                      updateLeadDocumentStatus(lead.id, doc.id, e.target.value as DocumentStatus)
                    }
                    className="h-8 px-2 border border-[#CBD5E1] rounded bg-white text-xs"
                  >
                    <option value="Solicitado">Solicitado</option>
                    <option value="Recebido">Recebido</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="A corrigir">A corrigir</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
