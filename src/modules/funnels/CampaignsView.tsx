import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../../store/AppContext';

export const CampaignsView: React.FC = () => {
  const { state, setLeadsFilterPreset, setRoute } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F2744]">Campanhas e atribuição</h1>
        <p className="text-sm text-slate-600 mt-1">
          Rastreamento de origem combinando página de vendas, campanha UTM e versão publicada do funil.
        </p>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-slate-600">
              <th className="py-3 px-4 font-semibold">Campanha</th>
              <th className="py-3 px-4 font-semibold">Página de origem</th>
              <th className="py-3 px-4 font-semibold">Projeto</th>
              <th className="py-3 px-4 font-semibold">UTM</th>
              <th className="py-3 px-4 font-semibold text-right">Leads</th>
              <th className="py-3 px-4 font-semibold text-right">Reunião / Avanço</th>
              <th className="py-3 px-4 font-semibold text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.salesPages.map((pg) => {
              const proj = state.projects.find((p) => p.id === pg.projectId);
              const leads = state.leads.filter((l) => l.salesPageId === pg.id);
              const advanced = leads.filter(
                (l) => !['Novo', 'Em contato', 'Encerrado'].includes(l.stage)
              ).length;
              return (
                <tr key={pg.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{pg.campaignName}</td>
                  <td className="py-3.5 px-4 font-mono text-[#0F2744]">{pg.slug}</td>
                  <td className="py-3.5 px-4 text-slate-700">{proj?.nome}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    {pg.utmSource} / {pg.utmCampaign}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F2744] tabular-nums">
                    {leads.length}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[#15803D] tabular-nums">
                    {advanced}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setLeadsFilterPreset({ salesPageId: pg.id });
                        setRoute('leads');
                      }}
                      className="inline-flex items-center gap-1 font-semibold text-[#0F2744] hover:underline"
                    >
                      <span>Ver leads</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
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
