import React from 'react';
import { Globe, Lock } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { ProcuracaoStatusText } from '../../components/StatusLabel';

export const ClientTendersView: React.FC = () => {
  const { state, setSelectedClientId, setRoute } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F2744]">Licitações do cliente · Visão operacional e futuro portal</h1>
        <p className="text-sm text-slate-600 mt-1">
          Acompanhamento consolidado por cliente ativo e prévia da arquitetura do futuro portal autenticado <span className="font-mono">clientes.jjlicita.com.br</span>.
        </p>
      </div>

      {/* Clients tenders cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {state.clients.map((cli) => {
          const acomps = state.acompanhamentos.filter((a) => a.clientId === cli.id);
          return (
            <section key={cli.id} className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClientId(cli.id);
                      setRoute('clients');
                    }}
                    className="text-sm font-bold text-[#0F2744] hover:underline text-left"
                  >
                    {cli.razaoSocial}
                  </button>
                  <div className="text-slate-500 mt-0.5">
                    Interlocutor: {cli.interlocutorAtual} · {cli.municipio}/{cli.uf}
                  </div>
                </div>
                <ProcuracaoStatusText status={cli.procuracaoStatus} />
              </div>

              <div className="divide-y divide-slate-100 border-t border-slate-100 pt-2">
                {acomps.length === 0 ? (
                  <p className="py-2 text-slate-500">Sem licitações vinculadas no momento.</p>
                ) : (
                  acomps.map((ac) => {
                    const ed = state.editais.find((e) => e.id === ac.editalId);
                    return (
                      <div key={ac.id} className="py-2.5 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold text-[#0F2744]">
                            {ed?.codigo} · {ed?.orgao}
                          </span>
                          <span className="font-medium text-slate-700">{ac.status}</span>
                        </div>
                        <div className="text-slate-600">{ac.lote} — {ac.proximaAcao}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Future Client Portal Architecture Card */}
      <section className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 text-xs">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0F2744]">
          <Globe className="w-4 h-4" />
          <span>Futuro Portal Autenticado · clientes.jjlicita.com.br (entrega posterior)</span>
        </div>
        <p className="text-slate-600 leading-relaxed">
          Após o marco das três procurações validadas, cada empresa cliente receberá acesso isolado para acompanhar o andamento dos seus próprios editais, enviar documentos diretamente para os 4 grupos de habilitação e assinar procurações e propostas pela plataforma.
        </p>
        <div className="flex flex-wrap gap-4 pt-1 text-slate-700">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#0F2744]" />
            <span>Isolamento por empresa (CNPJ)</span>
          </span>
          <span>· Envio de documentos por grupo</span>
          <span>· Assinatura eletrônica de procuração</span>
          <span>· Histórico de editais sem exposição de dados internos jurídicos</span>
        </div>
      </section>
    </div>
  );
};
