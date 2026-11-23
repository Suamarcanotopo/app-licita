import React, { useState } from 'react';
import { Bell, CheckCircle2, Copy, MessageSquareReply } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { GESTOR_MAP } from '../../data/seedData';

export const CadencesView: React.FC = () => {
  const {
    state,
    simulateLeadReply,
    simulateCadenceNotification,
    updateLeadDocumentStatus,
    showToast,
  } = useApp();

  const [selectedSimLeadId, setSelectedSimLeadId] = useState<string>(
    state.leads.find((l) => !l.cadencePaused)?.id || state.leads[0]?.id || ''
  );

  const targetLead = state.leads.find((l) => l.id === selectedSimLeadId) || state.leads[0];
  const pendingDoc = targetLead?.documents.find((d) => d.status === 'Solicitado');

  const renderMessage = (template: string) => {
    if (!targetLead) return template;
    return template
      .replace('{{contato}}', targetLead.contactName)
      .replace('{{empresa}}', targetLead.companyName)
      .replace('{{edital}}', targetLead.editalCode || 'PE em triagem')
      .replace('{{prazo}}', targetLead.editalDeadline || 'prazo a confirmar')
      .replace('{{oferta}}', targetLead.offerSummary)
      .replace('{{territorio}}', targetLead.territory)
      .replace('{{gargalo}}', targetLead.qualification.bottleneckLabel);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F2744]">Cadências e mensagens</h1>
        <p className="text-sm text-slate-600 mt-1">
          Regras por rota (edital, delegação, pendência documental, aprendizado e oportunidades). Nenhuma mensagem sai externamente nesta prévia.
        </p>
      </div>

      {/* Live Event Reaction Simulator */}
      <section className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#0F2744]">
              Simulador de paradas automáticas (sem envio externo)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Teste como a resposta do lead pausa a cadência e como documento recebido cancela o lembrete daquele item.
            </p>
          </div>
          <select
            value={selectedSimLeadId}
            onChange={(e) => setSelectedSimLeadId(e.target.value)}
            aria-label="Selecionar lead para simulação de cadência"
            className="h-9 px-3 text-xs bg-white border border-[#CBD5E1] rounded-md font-medium"
          >
            {state.leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.companyName} ({l.cadencePaused ? 'Pausada' : 'Cadência ativa'})
              </option>
            ))}
          </select>
        </div>

        {targetLead && (
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="font-semibold text-slate-900">
                {targetLead.companyName} · Etapa: {targetLead.stage}
              </div>
              <div className={targetLead.cadencePaused ? 'text-[#15803D] font-semibold' : 'text-[#B45309] font-semibold'}>
                {targetLead.cadencePaused
                  ? `Cadência pausada: ${targetLead.cadencePauseReason || 'Pausada'}`
                  : 'Próximo lembrete comercial agendado e ativo'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  simulateLeadReply(targetLead.id, 'Obrigado Márcio, podemos falar hoje à tarde.')
                }
                className="inline-flex items-center gap-1.5 h-9 px-3.5 font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md whitespace-nowrap"
              >
                <MessageSquareReply className="w-3.5 h-3.5" />
                <span>Simular resposta do lead</span>
              </button>

              {pendingDoc && (
                <button
                  type="button"
                  onClick={() => updateLeadDocumentStatus(targetLead.id, pendingDoc.id, 'Recebido')}
                  className="inline-flex items-center gap-1.5 h-9 px-3 font-semibold text-[#0F2744] bg-white border border-[#CBD5E1] hover:border-[#0F2744] rounded-md whitespace-nowrap"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                  <span>Receber doc: {pendingDoc.name.slice(0, 22)}...</span>
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 5 Cadence Routes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {state.cadences.map((cad) => {
          const previewMsg = renderMessage(cad.messageTemplate);
          return (
            <article
              key={cad.id}
              className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#0F2744]">{cad.routeLabel}</h3>
                  <span className="font-mono text-slate-500">{cad.delay}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Gatilho</span>
                    <span className="font-medium text-slate-800">{cad.trigger}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Condição</span>
                    <span className="font-medium text-slate-800">{cad.condition}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Responsável</span>
                    <span className="font-medium text-slate-800">{GESTOR_MAP[cad.owner]?.nome}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Regra de parada</span>
                    <span className="font-medium text-[#15803D]">{cad.stopRule}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-slate-800 leading-relaxed">
                  {previewMsg}
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(previewMsg).catch(() => {});
                    showToast('Mensagem copiada para a área de transferência.');
                  }}
                  className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold text-[#0F2744] bg-white border border-[#CBD5E1] hover:border-[#0F2744] rounded-md"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar mensagem</span>
                </button>
                <button
                  type="button"
                  onClick={() => simulateCadenceNotification(cad.id, targetLead?.id)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-slate-700 bg-white border border-[#E2E8F0] hover:border-[#0F2744] rounded-md"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Simular notificação interna</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
