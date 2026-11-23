import React from 'react';
import { useApp } from '../../store/AppContext';

export const AuditLogView: React.FC = () => {
  const { state, globalSearch } = useApp();
  const q = globalSearch.trim().toLowerCase();

  const entries = state.auditLog.filter((e) => {
    if (!q) return true;
    return `${e.actor} ${e.module} ${e.action} ${e.detail}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0F2744]">Histórico de alterações</h1>
        <p className="text-sm text-slate-600 mt-1">
          Registro cronológico de publicações de funis, conversões, pausas de cadência, validações de procuração e bloqueios do Gate de Conflito.
        </p>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-slate-600">
              <th className="py-3 px-4 font-semibold">Data / Hora</th>
              <th className="py-3 px-4 font-semibold">Responsável</th>
              <th className="py-3 px-4 font-semibold">Módulo</th>
              <th className="py-3 px-4 font-semibold">Evento</th>
              <th className="py-3 px-4 font-semibold">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap tabular-nums">
                  {entry.at}
                </td>
                <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                  {entry.actor}
                </td>
                <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{entry.module}</td>
                <td className="py-3 px-4 font-medium text-[#0F2744] whitespace-nowrap">
                  {entry.action}
                </td>
                <td className="py-3 px-4 text-slate-700">{entry.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
