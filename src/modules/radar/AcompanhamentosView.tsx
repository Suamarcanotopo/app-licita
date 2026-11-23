import React from 'react';
import { Building2 } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { GESTOR_MAP } from '../../data/seedData';

export const AcompanhamentosView: React.FC = () => {
  const { state, setSelectedClientId, setRoute } = useApp();

  const items = state.acompanhamentos.filter(
    (a) => state.activeProjectId === 'all' || a.projectId === state.activeProjectId
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F2744]">Acompanhamentos por nicho e cliente</h1>
          <p className="text-sm text-slate-600 mt-1">
            Cada vínculo entre edital verificado e cliente mantém seu próprio lote, responsável, parecer jurídico e próxima ação.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRoute('radar')}
          className="h-9 px-3.5 text-xs font-semibold text-white bg-[#15803D] rounded-md whitespace-nowrap self-start"
        >
          Vincular novo edital no Radar
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-slate-600">
              <th className="py-3 px-4 font-semibold">Edital / Órgão</th>
              <th className="py-3 px-4 font-semibold">Nicho e Cliente</th>
              <th className="py-3 px-4 font-semibold">Lote e compatibilidade</th>
              <th className="py-3 px-4 font-semibold">Responsável / Próxima ação</th>
              <th className="py-3 px-4 font-semibold">Parecer / Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((ac) => {
              const ed = state.editais.find((e) => e.id === ac.editalId);
              const cli = state.clients.find((c) => c.id === ac.clientId);
              const proj = state.projects.find((p) => p.id === ac.projectId);
              return (
                <tr key={ac.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-[#0F2744]">{ed?.codigo}</div>
                    <div className="text-slate-700">{ed?.orgao}</div>
                    <div className="text-[11px] font-mono text-slate-500">Prazo: {ed?.prazoIso}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-500">{proj?.nome}</div>
                    {cli && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClientId(cli.id);
                          setRoute('clients');
                        }}
                        className="inline-flex items-center gap-1 font-semibold text-[#0F2744] hover:underline mt-0.5"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{cli.razaoSocial}</span>
                      </button>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-900">{ac.lote}</div>
                    <div className="text-slate-600 mt-0.5">{ac.motivoCompatibilidade}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">{GESTOR_MAP[ac.responsavel]?.nome}</div>
                    <div className="text-slate-600 mt-0.5">{ac.proximaAcao}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div
                      className={`font-semibold ${
                        ac.parecerJuridicoLiberado ? 'text-[#15803D]' : 'text-[#B45309]'
                      }`}
                    >
                      {ac.status}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Proposta: {ac.propostaHabilitada ? 'Habilitada' : 'Bloqueada sem parecer'}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
