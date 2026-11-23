import React from 'react';
import { useApp } from '../../store/AppContext';
import { PATH_LABELS } from '../../engine/qualification';
import { FunnelPathId } from '../../types/domain';

export const IndicatorsView: React.FC = () => {
  const { state } = useApp();

  const leads = state.leads.filter(
    (l) => state.activeProjectId === 'all' || l.projectId === state.activeProjectId
  );

  const triageLeads = leads.filter((l) => typeof l.triageMinutesActual === 'number');
  const avgTriageMinutes =
    triageLeads.length > 0
      ? Math.round(
          triageLeads.reduce((acc, l) => acc + (l.triageMinutesActual || 0), 0) /
            triageLeads.length
        )
      : 15;

  const validatedProcuracoes = state.clients.filter(
    (c) => c.procuracaoStatus === 'Assinada e validada'
  ).length;

  const releasedOpinions = state.acompanhamentos.filter((a) => a.parecerJuridicoLiberado).length;

  const byStage = new Map<string, number>();
  for (const l of leads) {
    byStage.set(l.stage, (byStage.get(l.stage) || 0) + 1);
  }

  const byIntent = new Map<FunnelPathId, number>();
  for (const l of leads) {
    byIntent.set(l.intent, (byIntent.get(l.intent) || 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F2744]">Indicadores comerciais e tempo jurídico</h1>
        <p className="text-sm text-slate-600 mt-1">
          Acompanhamento de conversão por origem, minutos efetivos de triagem (meta 15 min), pareceres liberados e progresso rumo ao marco das 3 procurações validadas.
        </p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
          <div className="text-xs text-slate-500">Total de leads no recorte</div>
          <div className="text-2xl font-display font-bold text-[#0F2744] mt-1 tabular-nums">
            {leads.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {leads.filter((l) => l.noReturnYet).length} aguardando 1ª abordagem
          </div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
          <div className="text-xs text-slate-500">Tempo efetivo médio de triagem</div>
          <div className="text-2xl font-display font-bold text-[#0F2744] mt-1 font-mono tabular-nums">
            {avgTriageMinutes} min
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Referência inicial: 15 min por edital</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
          <div className="text-xs text-slate-500">Pareceres jurídicos liberados</div>
          <div className="text-2xl font-display font-bold text-[#15803D] mt-1 tabular-nums">
            {releasedOpinions} / {state.acompanhamentos.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Obrigatório antes de habilitar proposta</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
          <div className="text-xs text-slate-500">Marco v0.3 · Procurações validadas</div>
          <div className="text-2xl font-display font-bold text-[#15803D] mt-1 tabular-nums">
            {validatedProcuracoes} / 3
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {validatedProcuracoes >= 3
              ? 'Marco atingido · expansão liberada'
              : `Faltam ${3 - validatedProcuracoes} para expansão operacional`}
          </div>
        </div>
      </div>

      {/* Distribution grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[#0F2744]">Distribuição de leads por etapa</h2>
          <div className="space-y-2.5 text-xs">
            {Array.from(byStage.entries()).map(([stage, count]) => (
              <div key={stage} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-700 font-medium">{stage}</span>
                  <span className="font-mono font-semibold text-[#0F2744] tabular-nums">{count}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0F2744]"
                    style={{ width: `${Math.round((count / Math.max(leads.length, 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[#0F2744]">Distribuição por caminho do funil</h2>
          <div className="space-y-2.5 text-xs">
            {(Object.keys(PATH_LABELS) as FunnelPathId[]).map((pid) => {
              const count = byIntent.get(pid) || 0;
              return (
                <div key={pid} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-700 font-medium">{PATH_LABELS[pid]}</span>
                    <span className="font-mono font-semibold text-[#15803D] tabular-nums">{count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#15803D]"
                      style={{ width: `${Math.round((count / Math.max(leads.length, 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
