import React, { useState } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { FunnelPathId, QualificationGroupKey } from '../../types/domain';
import { PATH_LABELS } from '../../engine/qualification';
import { SemaphoreIndicator } from '../../components/StatusLabel';

export const QualificationRulesView: React.FC = () => {
  const { state, selectedFunnelId, updateFunnelDraftQualConfig, setRoute } = useApp();
  const funnel = state.funnels.find((f) => f.id === selectedFunnelId) || state.funnels[0];
  const [cfg, setCfg] = useState(funnel.draft.qualificationConfig);

  React.useEffect(() => {
    setCfg(funnel.draft.qualificationConfig);
  }, [funnel.id, funnel.draft.createdAt]);

  const toggleHighPriorityIntent = (id: FunnelPathId) => {
    const exists = cfg.priorityThresholds.highPriorityIntents.includes(id);
    setCfg({
      ...cfg,
      priorityThresholds: {
        ...cfg.priorityThresholds,
        highPriorityIntents: exists
          ? cfg.priorityThresholds.highPriorityIntents.filter((x) => x !== id)
          : [...cfg.priorityThresholds.highPriorityIntents, id],
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F2744]">Qualificação · Regras por versão</h1>
          <p className="text-sm text-slate-600 mt-1">
            Configure no rascunho ({funnel.draft.version}) os quatro grupos documentais, a regra do gargalo técnico crítico e os alertas jurídicos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateFunnelDraftQualConfig(funnel.id, cfg)}
            className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar regras no rascunho</span>
          </button>
          <button
            type="button"
            onClick={() => setRoute('funnels')}
            className="h-9 px-3 text-xs font-semibold text-[#0F2744] bg-white border border-[#E2E8F0] hover:border-[#0F2744] rounded-md whitespace-nowrap"
          >
            Ir para Construtor de Funis
          </button>
        </div>
      </div>

      {/* Legend of the 4 semantic states (color + text label) */}
      <section className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3">
        <h2 className="text-sm font-semibold text-[#0F2744]">
          Estados de qualificação (sem média numérica de habilitação)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(['verde', 'amarelo', 'vermelho', 'cinza'] as const).map((st) => (
            <div key={st} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
              <SemaphoreIndicator status={st} verbose />
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600">
          Na página pública, a contagem descreve apenas o que a empresa declarou (ex.: "Você declarou ter 3 de 4 grupos disponíveis"). Prontidão documental, prioridade comercial e parecer jurídico são avaliados separadamente.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 4 Groups Configuration */}
        <section className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#0F2744]">Os 4 grupos de avaliação</h2>
          <div className="space-y-3 text-xs">
            {(Object.keys(cfg.groupLabels) as QualificationGroupKey[]).map((key) => (
              <div key={key} className="space-y-1">
                <label className="block font-medium text-slate-700">
                  {key === 'comprovacao_tecnica'
                    ? 'Grupo crítico · Comprovação técnica'
                    : `Grupo · ${key}`}
                </label>
                <input
                  type="text"
                  value={cfg.groupLabels[key]}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      groupLabels: { ...cfg.groupLabels, [key]: e.target.value },
                    })
                  }
                  className="w-full h-9 px-3 border border-[#CBD5E1] rounded-md"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Critical Bottleneck & Legal Rules */}
        <section className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 text-xs">
          <h2 className="text-sm font-semibold text-[#0F2744]">
            Regras de gargalo, prioridade comercial e alertas jurídicos
          </h2>

          <div className="space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={cfg.technicalIsCriticalWhenApplicable}
                onChange={(e) =>
                  setCfg({ ...cfg, technicalIsCriticalWhenApplicable: e.target.checked })
                }
                className="mt-0.5"
              />
              <span>
                <strong className="text-slate-900">Comprovação técnica é grupo crítico:</strong>{' '}
                destacar pendência técnica como gargalo principal mesmo quando os outros 3 grupos estiverem verdes.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={cfg.prioritizeUrgentEditalWithPartialDocs}
                onChange={(e) =>
                  setCfg({ ...cfg, prioritizeUrgentEditalWithPartialDocs: e.target.checked })
                }
                className="mt-0.5"
              />
              <span>
                <strong className="text-slate-900">Edital urgente no topo da fila:</strong>{' '}
                permite triagem de 15 min com prioridade comercial alta mesmo com avaliação documental parcial.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={cfg.meEppFiscalFavorableRule}
                onChange={(e) => setCfg({ ...cfg, meEppFiscalFavorableRule: e.target.checked })}
                className="mt-0.5"
              />
              <span>
                <strong className="text-slate-900">Tratamento favorecido ME/EPP:</strong>{' '}
                com pendência fiscal + porte ME ou EPP, indicar que o advogado verificará a aplicabilidade ao caso.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={cfg.flagUnknownPorteAndMeiReview}
                onChange={(e) =>
                  setCfg({ ...cfg, flagUnknownPorteAndMeiReview: e.target.checked })
                }
                className="mt-0.5"
              />
              <span>
                <strong className="text-slate-900">Conferência de porte MEI / Não sei:</strong>{' '}
                direcionar automaticamente MEI sem enquadramento confirmado e porte desconhecido para conferência.
              </span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="font-semibold text-[#0F2744]">Intenções com prioridade comercial imediata</div>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(PATH_LABELS) as FunnelPathId[]).map((pid) => (
                <label key={pid} className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cfg.priorityThresholds.highPriorityIntents.includes(pid)}
                    onChange={() => toggleHighPriorityIntent(pid)}
                  />
                  <span>{PATH_LABELS[pid]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[#15803D]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              As alterações salvas aqui valem imediatamente no modo "Testar (Rascunho)" e serão versionadas ao publicar.
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};
