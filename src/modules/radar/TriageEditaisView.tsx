import React from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { useApp } from '../../store/AppContext';

export const TriageEditaisView: React.FC = () => {
  const { state, isOrgaoBlocked, toggleLegalOpinionForAcompanhamento } = useApp();

  const editaisInTriage = state.editais.filter(
    (e) =>
      !isOrgaoBlocked(e.orgao).blocked &&
      (state.activeProjectId === 'all' || e.projectIds.includes(state.activeProjectId))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F2744]">Triagem de editais e parecer jurídico</h1>
        <p className="text-sm text-slate-600 mt-1">
          Libere ou suspenda o parecer jurídico por empresa e versão do edital. Nenhuma proposta é habilitada sem parecer liberado.
        </p>
      </div>

      <div className="space-y-4">
        {editaisInTriage.map((ed) => {
          const acomps = state.acompanhamentos.filter((a) => a.editalId === ed.id);
          return (
            <section key={ed.id} className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-[#0F2744]">{ed.codigo}</span>
                  <span className="text-slate-300">·</span>
                  <span className="font-semibold text-slate-900">{ed.orgao}</span>
                  <span className="text-slate-300">·</span>
                  <span className="font-mono text-slate-500">{ed.versaoEdital}</span>
                </div>
                <span className="font-semibold text-[#0F2744]">{ed.situacao}</span>
              </div>
              <p className="text-xs text-slate-700">{ed.objeto}</p>

              {acomps.length === 0 ? (
                <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                  Ainda sem empresa cliente vinculada para emissão de parecer. Vincule no Radar de Editais.
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  {acomps.map((ac) => {
                    const cli = state.clients.find((c) => c.id === ac.clientId);
                    return (
                      <div
                        key={ac.id}
                        className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-900">
                            {cli?.razaoSocial || 'Nicho'} · {ac.lote}
                          </div>
                          <div className="text-slate-600">{ac.proximaAcao}</div>
                          {cli && !cli.operacaoAtiva && (
                            <div className="text-[#B91C1C] font-medium flex items-center gap-1 pt-0.5">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Procuração vencida/revogada: parecer bloqueado até revalidação.</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {ac.parecerJuridicoLiberado ? (
                            <>
                              <span className="inline-flex items-center gap-1 font-semibold text-[#15803D]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Parecer liberado</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleLegalOpinionForAcompanhamento(ac.id, false)}
                                className="h-8 px-2.5 text-[#B91C1C] bg-white border border-[#FECACA] rounded-md"
                              >
                                Suspender
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              disabled={cli ? !cli.operacaoAtiva : false}
                              onClick={() => toggleLegalOpinionForAcompanhamento(ac.id, true)}
                              className="h-8 px-3 font-semibold text-white bg-[#15803D] hover:bg-[#166534] disabled:opacity-40 rounded-md"
                            >
                              Liberar parecer (habilita proposta)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
