import React from 'react';
import { ArrowRight, Building2, GitBranch, Radar, Users } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { GESTOR_MAP } from '../../data/seedData';

export const ProjectsView: React.FC = () => {
  const {
    state,
    setActiveProjectId,
    setRoute,
    setSelectedFunnelId,
    isOrgaoBlocked,
  } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F2744]">Projetos e nichos</h1>
          <p className="text-sm text-slate-600 mt-1">
            Cada projeto organiza nicho, páginas de vendas, funis, leads por etapa, clientes vinculados e editais acompanhados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveProjectId('all')}
            className={`h-9 px-3 text-xs font-semibold rounded-md border transition-colors ${
              state.activeProjectId === 'all'
                ? 'bg-[#0F2744] text-white border-[#0F2744]'
                : 'bg-white text-slate-700 border-[#E2E8F0] hover:border-[#0F2744]'
            }`}
          >
            Consultar todos os projetos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {state.projects.map((proj) => {
          const isSelected = state.activeProjectId === proj.id;
          const projLeads = state.leads.filter((l) => l.projectId === proj.id);
          const projClients = state.clients.filter((c) => c.projectId === proj.id);
          const projEditais = state.editais.filter(
            (e) => e.projectIds.includes(proj.id) && !isOrgaoBlocked(e.orgao).blocked
          );
          const projAcomps = state.acompanhamentos.filter((a) => a.projectId === proj.id);
          const projPages = state.salesPages.filter((p) => p.projectId === proj.id);

          // Count leads by stage
          const stageMap = new Map<string, number>();
          for (const l of projLeads) {
            stageMap.set(l.stage, (stageMap.get(l.stage) || 0) + 1);
          }

          return (
            <article
              key={proj.id}
              className={`bg-white rounded-lg border transition-colors flex flex-col justify-between ${
                isSelected ? 'border-[#0F2744] ring-1 ring-[#0F2744]' : 'border-[#E2E8F0]'
              }`}
            >
              <div className="p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">
                      Regiões: {proj.regioes.join(', ')}
                    </span>
                    {isSelected && (
                      <span className="text-xs font-semibold text-[#15803D]">Filtro ativo</span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-[#0F2744] mt-1">{proj.nome}</h2>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{proj.descricao}</p>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
                  <div>
                    <div className="text-lg font-display font-bold text-[#0F2744] tabular-nums">
                      {projLeads.length}
                    </div>
                    <div className="text-[11px] text-slate-500">Leads</div>
                  </div>
                  <div>
                    <div className="text-lg font-display font-bold text-[#0F2744] tabular-nums">
                      {projClients.length}
                    </div>
                    <div className="text-[11px] text-slate-500">Empresas</div>
                  </div>
                  <div>
                    <div className="text-lg font-display font-bold text-[#0F2744] tabular-nums">
                      {projEditais.length}
                    </div>
                    <div className="text-[11px] text-slate-500">Editais Radar</div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-500">Responsáveis: </span>
                    <span className="font-medium text-slate-800">
                      {proj.responsaveis.map((r) => GESTOR_MAP[r]?.nome).join(' · ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Funil associado: </span>
                    <span className="font-medium text-slate-800">
                      {state.funnels.find((f) => f.id === proj.funilIds[0])?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Páginas de vendas: </span>
                    <span className="font-medium text-slate-800">
                      {projPages.length > 0 ? projPages.map((p) => p.slug).join(', ') : 'Usa funil compartilhado'}
                    </span>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Leads por etapa:</div>
                    <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-slate-700">
                      {Array.from(stageMap.entries()).map(([stage, count]) => (
                        <span key={stage} className="tabular-nums">
                          {stage}: <strong>{count}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Empresas e acompanhamentos vinculados:</div>
                    <div className="mt-1 space-y-1">
                      {projClients.map((c) => (
                        <div key={c.id} className="flex items-center justify-between text-slate-700">
                          <span className="truncate">{c.razaoSocial}</span>
                          <span className="text-[11px] text-slate-500 shrink-0 ml-2">
                            {c.procuracaoStatus}
                          </span>
                        </div>
                      ))}
                      {projAcomps.length > 0 && (
                        <div className="text-[11px] text-[#0F2744] font-medium">
                          {projAcomps.length} acompanhamento(s) de edital ativo(s)
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-500">Próxima ação: </span>
                    <span className="text-slate-800">{proj.proximaAcao}</span>
                  </div>
                </div>
              </div>

              {/* Action footer */}
              <div className="px-5 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] rounded-b-lg flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveProjectId(proj.id)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md transition-colors whitespace-nowrap"
                >
                  <span>Filtrar painel</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFunnelId(proj.funilIds[0] || 'fun_principal');
                    setRoute('funnels');
                  }}
                  className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-medium text-[#0F2744] bg-white border border-[#E2E8F0] hover:border-[#0F2744] rounded-md whitespace-nowrap"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Funil</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveProjectId(proj.id);
                    setRoute('leads');
                  }}
                  className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-medium text-[#0F2744] bg-white border border-[#E2E8F0] hover:border-[#0F2744] rounded-md whitespace-nowrap"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Leads</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveProjectId(proj.id);
                    setRoute('radar');
                  }}
                  className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-medium text-[#0F2744] bg-white border border-[#E2E8F0] hover:border-[#0F2744] rounded-md whitespace-nowrap"
                >
                  <Radar className="w-3.5 h-3.5" />
                  <span>Radar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveProjectId(proj.id);
                    setRoute('clients');
                  }}
                  className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-medium text-[#0F2744] bg-white border border-[#E2E8F0] hover:border-[#0F2744] rounded-md whitespace-nowrap"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Clientes</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
