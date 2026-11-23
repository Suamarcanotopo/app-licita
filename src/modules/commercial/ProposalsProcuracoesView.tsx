import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FilePenLine,
  FileSignature,
  FileText,
  Palette,
  Save,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { ProcuracaoStatusText } from '../../components/StatusLabel';
import { DOC_TYPE_LABELS } from '../../engine/documentCanvas';
import { DocumentBrandIdentity, DocumentTemplate } from '../../types/domain';

type ModuleTab = 'canvas_envios' | 'propostas' | 'procuracoes' | 'modelos_identidade';

export const ProposalsProcuracoesView: React.FC = () => {
  const {
    state,
    updateProcuracaoStatus,
    updateClientProcuracaoStatus,
    setSelectedLeadId,
    setSelectedClientId,
    setRoute,
    prepareDocumentFromLead,
    openDocumentCanvas,
    simulateSignProcuracaoDocument,
    updateDocumentBrandStandard,
    updateDocumentTemplate,
    setDefaultTemplateId,
  } = useApp();

  const [activeTab, setActiveTab] = useState<ModuleTab>('canvas_envios');

  const projectLeads = state.leads.filter(
    (l) => state.activeProjectId === 'all' || l.projectId === state.activeProjectId
  );
  const [launcherLeadId, setLauncherLeadId] = useState<string>(
    projectLeads[0]?.id || state.leads[0]?.id || ''
  );

  // Sync launcher lead if active project changes
  const effectiveLauncherLeadId = projectLeads.some((l) => l.id === launcherLeadId)
    ? launcherLeadId
    : projectLeads[0]?.id || state.leads[0]?.id || '';

  // Brand identity editor state
  const [brandDraft, setBrandDraft] = useState<DocumentBrandIdentity>(state.documentBrandStandard);
  React.useEffect(() => {
    setBrandDraft(state.documentBrandStandard);
  }, [state.documentBrandStandard]);

  // Template editor state
  const [editingTemplateId, setEditingTemplateId] = useState<string>(
    state.documentTemplates[0]?.id || ''
  );
  const selectedTemplate =
    state.documentTemplates.find((t) => t.id === editingTemplateId) || state.documentTemplates[0];
  const [templateDraft, setTemplateDraft] = useState<DocumentTemplate | null>(
    selectedTemplate || null
  );

  React.useEffect(() => {
    if (selectedTemplate) {
      setTemplateDraft(structuredClone(selectedTemplate));
    }
  }, [selectedTemplate?.id, state.documentTemplates]);

  const projectCanvasDocs = state.canvasDocuments.filter((doc) => {
    if (state.activeProjectId === 'all') return true;
    const lead = state.leads.find((l) => l.id === doc.leadId);
    return !lead || lead.projectId === state.activeProjectId;
  });

  const sentQueueDocs = projectCanvasDocs.filter((d) => d.inSentQueue);
  const draftPrepDocs = projectCanvasDocs.filter((d) => !d.inSentQueue);

  const leadsWithProcuracaoStage = state.leads.filter(
    (l) =>
      (state.activeProjectId === 'all' || l.projectId === state.activeProjectId) &&
      (l.procuracaoStatus !== 'Não iniciada' ||
        l.stage === 'Proposta' ||
        l.stage === 'Procuração pendente')
  );

  const clients = state.clients.filter(
    (c) => state.activeProjectId === 'all' || c.projectId === state.activeProjectId
  );

  const validatedCount = state.clients.filter(
    (c) => c.procuracaoStatus === 'Assinada e validada'
  ).length;

  const procuracaoTemplates = state.documentTemplates.filter((t) => t.type === 'procuracao');
  const minutaTemplates = state.documentTemplates.filter((t) => t.type === 'minuta');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F2744]">Propostas e procurações</h1>
          <p className="text-sm text-slate-600 mt-1">
            Canvas unificado de documentos, fila de envios confirmados, controle de parecer jurídico e padrões visuais/modelos.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-600 tabular-nums flex flex-wrap items-center gap-3">
          <span>
            Fila de envios: <strong className="text-[#0F2744]">{sentQueueDocs.length}</strong>
          </span>
          <span className="text-slate-300">·</span>
          <span>
            Em preparação: <strong className="text-[#B45309]">{draftPrepDocs.length}</strong>
          </span>
          <span className="text-slate-300">·</span>
          <span className="font-semibold text-[#15803D]">
            Marco v0.3: {validatedCount} de 3 procurações validadas
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#E2E8F0] flex gap-5 overflow-x-auto text-xs">
        {(
          [
            ['canvas_envios', `Canvas e fila de envios (${projectCanvasDocs.length})`],
            ['propostas', `Propostas e pareceres (${state.proposals.length})`],
            ['procuracoes', 'Procurações e vigência'],
            ['modelos_identidade', 'Modelos e identidade padrão'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`pb-2.5 font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === key
                ? 'border-[#0F2744] text-[#0F2744]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ==================== TAB 1: CANVAS E FILA DE ENVIOS ==================== */}
      {activeTab === 'canvas_envios' && (
        <div className="space-y-6">
          {/* Quick Canvas Launcher */}
          <section className="bg-white border border-[#E2E8F0] rounded-lg p-4 space-y-3 text-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-[#0F2744]">
                  Preparar novo documento no Canvas
                </h2>
                <p className="text-slate-600 mt-0.5">
                  Conectado ao mesmo Canvas de Documentos da aba Documentos da ficha do lead. O envio só entra na fila após confirmação.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={effectiveLauncherLeadId}
                  onChange={(e) => setLauncherLeadId(e.target.value)}
                  className="h-9 px-2.5 border border-[#CBD5E1] rounded-md bg-white font-medium text-slate-800 max-w-[260px]"
                  aria-label="Selecionar empresa / lead"
                >
                  {projectLeads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.companyName} ({l.contactName})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!effectiveLauncherLeadId}
                  onClick={() => prepareDocumentFromLead(effectiveLauncherLeadId, 'documento_livre')}
                  className="inline-flex items-center gap-1.5 h-9 px-3 font-semibold text-[#0F2744] bg-white border border-[#CBD5E1] hover:border-[#0F2744] rounded-md"
                >
                  <FilePenLine className="w-3.5 h-3.5" />
                  <span>+ Criar documento</span>
                </button>
                <button
                  type="button"
                  disabled={!effectiveLauncherLeadId}
                  onClick={() => prepareDocumentFromLead(effectiveLauncherLeadId, 'procuracao')}
                  className="inline-flex items-center gap-1.5 h-9 px-3 font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md"
                >
                  <FileSignature className="w-3.5 h-3.5" />
                  <span>+ Enviar procuração</span>
                </button>
                <button
                  type="button"
                  disabled={!effectiveLauncherLeadId}
                  onClick={() => prepareDocumentFromLead(effectiveLauncherLeadId, 'minuta')}
                  className="inline-flex items-center gap-1.5 h-9 px-3 font-semibold text-white bg-[#0F2744] hover:bg-[#163459] rounded-md"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>+ Enviar minuta</span>
                </button>
              </div>
            </div>
          </section>

          {/* Fila de envios (confirmados) */}
          <section className="bg-white border border-[#E2E8F0] rounded-lg">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-[#0F2744]">
                  Fila de envios e histórico emitido ({sentQueueDocs.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Apenas documentos confirmados no Canvas entram aqui. Minutas para comentários e procurações para assinatura aparecem com estados distintos e snapshots imutáveis.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-slate-600">
                    <th className="py-3 px-4 font-semibold">ID e versão emitida</th>
                    <th className="py-3 px-4 font-semibold">Empresa / Tipo</th>
                    <th className="py-3 px-4 font-semibold">Estado no histórico</th>
                    <th className="py-3 px-4 font-semibold">Emitido em</th>
                    <th className="py-3 px-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sentQueueDocs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        Nenhum documento confirmado na fila de envios ainda.
                      </td>
                    </tr>
                  ) : (
                    sentQueueDocs.map((doc) => {
                      const emittedVer = doc.emittedSnapshot?.versionLabel || doc.currentVersion;
                      const isSigned = doc.status === 'Procuração assinada (simulada)';
                      const isAwaitingSignature =
                        doc.status === 'Procuração enviada para assinatura';
                      const isMinutaComments = doc.status === 'Minuta enviada para comentários';
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-[#0F2744]">{doc.id}</div>
                            <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                              {emittedVer} · {doc.emittedSnapshot ? 'Snapshot congelado' : 'Ativo'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">
                              {doc.emittedSnapshot?.fields.razaoSocial?.value || doc.companyName}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {DOC_TYPE_LABELS[doc.type]} · {doc.title}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {isSigned ? (
                              <span className="inline-flex items-center gap-1.5 font-semibold text-[#15803D]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{doc.status}</span>
                              </span>
                            ) : isAwaitingSignature ? (
                              <span className="inline-flex items-center gap-1.5 font-semibold text-[#B45309]">
                                <FileSignature className="w-3.5 h-3.5" />
                                <span>{doc.status}</span>
                              </span>
                            ) : isMinutaComments ? (
                              <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F2744]">
                                <Send className="w-3.5 h-3.5" />
                                <span>{doc.status}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                                <FileText className="w-3.5 h-3.5" />
                                <span>
                                  {doc.status}
                                  {doc.sendPurpose ? ` (${doc.sendPurpose})` : ''}
                                </span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600">
                            {doc.emittedAt || doc.updatedAt}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex flex-wrap items-center justify-end gap-2">
                              {isAwaitingSignature && (
                                <button
                                  type="button"
                                  onClick={() => simulateSignProcuracaoDocument(doc.id)}
                                  className="inline-flex items-center gap-1 h-8 px-2.5 font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md"
                                >
                                  <FileCheck2 className="w-3.5 h-3.5" />
                                  <span>Simular assinatura</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openDocumentCanvas(doc.id)}
                                className="inline-flex items-center gap-1 h-8 px-2.5 font-semibold text-[#0F2744] bg-white border border-[#CBD5E1] hover:border-[#0F2744] rounded-md"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Abrir no Canvas</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Em preparação / rascunhos (fora da fila de envios) */}
          <section className="bg-white border border-[#E2E8F0] rounded-lg">
            <div className="px-5 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-sm font-semibold text-[#0F2744]">
                Em preparação e rascunhos — fora da fila de envios ({draftPrepDocs.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Documentos abertos pelos atalhos permanecem aqui em preparação até que a equipe confirme o envio dentro do Canvas.
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {draftPrepDocs.length === 0 ? (
                <div className="p-5 text-xs text-slate-500">
                  Nenhum documento em preparação no momento.
                </div>
              ) : (
                draftPrepDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono font-bold text-[#0F2744]">{doc.id}</span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono font-semibold text-slate-700">
                          {doc.currentVersion}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="font-semibold text-slate-900">{doc.companyName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span>{DOC_TYPE_LABELS[doc.type]}</span>
                        <span>·</span>
                        <span>{doc.title}</span>
                        <span>·</span>
                        <span className="font-semibold text-[#B45309]">{doc.status}</span>
                        <span>·</span>
                        <span>Atualizado em {doc.updatedAt}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLeadId(doc.leadId);
                          setRoute('leads');
                        }}
                        className="h-8 px-2.5 text-slate-600 border border-[#CBD5E1] rounded-md hover:border-slate-400"
                      >
                        Ficha do lead
                      </button>
                      <button
                        type="button"
                        onClick={() => openDocumentCanvas(doc.id)}
                        className="inline-flex items-center gap-1.5 h-8 px-3 font-semibold text-white bg-[#0F2744] hover:bg-[#163459] rounded-md"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir no Canvas</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {/* ==================== TAB 2: PROPOSTAS E PARECERES ==================== */}
      {activeTab === 'propostas' && (
        <section className="bg-white border border-[#E2E8F0] rounded-lg">
          <div className="px-5 py-4 border-b border-[#E2E8F0]">
            <h2 className="text-sm font-semibold text-[#0F2744]">
              Propostas vinculadas a certames (gate de parecer jurídico)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-slate-600">
                  <th className="py-3 px-4 font-semibold">Empresa</th>
                  <th className="py-3 px-4 font-semibold">Edital e versão</th>
                  <th className="py-3 px-4 font-semibold">Valor estimado / proposta</th>
                  <th className="py-3 px-4 font-semibold">Parecer jurídico</th>
                  <th className="py-3 px-4 font-semibold">Situação da proposta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.proposals.map((prop) => {
                  const cli = state.clients.find((c) => c.id === prop.clientId);
                  const ed = state.editais.find((e) => e.id === prop.editalId);
                  return (
                    <tr key={prop.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {cli?.razaoSocial || prop.clientId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-semibold text-[#0F2744]">
                          {ed?.codigo || prop.editalId}
                        </div>
                        <div className="text-[11px] text-slate-500">{prop.editalVersao}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-800">
                        {prop.valorProposta}
                      </td>
                      <td className="py-3.5 px-4">
                        {prop.parecerJuridicoLiberado ? (
                          <span className="inline-flex items-center gap-1 font-medium text-[#15803D]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Liberado para esta versão</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-[#B91C1C]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Pendente de parecer</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{prop.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ==================== TAB 3: PROCURAÇÕES E VIGÊNCIA ==================== */}
      {activeTab === 'procuracoes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white border border-[#E2E8F0] rounded-lg">
            <div className="px-5 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-sm font-semibold text-[#0F2744]">
                Leads em fase de proposta / procuração
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {leadsWithProcuracaoStage.map((l) => (
                <div key={l.id} className="p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLeadId(l.id);
                        setRoute('leads');
                      }}
                      className="font-semibold text-[#0F2744] hover:underline text-left"
                    >
                      {l.companyName}
                    </button>
                    <ProcuracaoStatusText status={l.procuracaoStatus} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => prepareDocumentFromLead(l.id, 'procuracao')}
                      className="inline-flex items-center gap-1.5 h-8 px-3 font-semibold text-[#0F2744] bg-white border border-[#CBD5E1] hover:border-[#0F2744] rounded-md"
                    >
                      <FileSignature className="w-3.5 h-3.5" />
                      <span>Preparar procuração no Canvas</span>
                    </button>
                    {l.procuracaoStatus !== 'Assinada e validada' && (
                      <button
                        type="button"
                        onClick={() => updateProcuracaoStatus(l.id, 'Assinada e validada', '2027-11-23')}
                        className="inline-flex items-center gap-1.5 h-8 px-3 font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Simular procuração validada</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLeadId(l.id);
                        setRoute('leads');
                      }}
                      className="h-8 px-2.5 text-slate-700 border border-[#CBD5E1] rounded-md"
                    >
                      Abrir ficha
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-[#E2E8F0] rounded-lg">
            <div className="px-5 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-sm font-semibold text-[#0F2744]">
                Controle de vigência de procurações (Clientes)
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {clients.map((c) => (
                <div key={c.id} className="p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClientId(c.id);
                        setRoute('clients');
                      }}
                      className="font-semibold text-[#0F2744] hover:underline text-left"
                    >
                      {c.razaoSocial}
                    </button>
                    <ProcuracaoStatusText status={c.procuracaoStatus} />
                  </div>
                  <div className="text-slate-600">
                    Vigência: <span className="font-mono">{c.procuracaoValidUntil || '—'}</span> · Operação:{' '}
                    <strong className={c.operacaoAtiva ? 'text-[#15803D]' : 'text-[#B91C1C]'}>
                      {c.operacaoAtiva ? 'Ativa' : 'Interrompida (sem representação válida)'}
                    </strong>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {!c.operacaoAtiva ? (
                      <button
                        type="button"
                        onClick={() =>
                          updateClientProcuracaoStatus(c.id, 'Assinada e validada', '2027-11-23')
                        }
                        className="h-8 px-3 font-semibold text-white bg-[#15803D] rounded-md"
                      >
                        Revalidar procuração
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateClientProcuracaoStatus(c.id, 'Revogada')}
                        className="inline-flex items-center gap-1 h-8 px-2.5 text-[#B91C1C] border border-[#FECACA] rounded-md"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Simular revogação</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ==================== TAB 4: MODELOS E IDENTIDADE PADRÃO ==================== */}
      {activeTab === 'modelos_identidade' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-xs">
          {/* Left: Default Shortcuts + Default Brand Standard */}
          <div className="lg:col-span-5 space-y-5">
            {/* Default templates configuration */}
            <section className="bg-white border border-[#E2E8F0] rounded-lg p-4 space-y-3.5">
              <div>
                <h2 className="text-sm font-semibold text-[#0F2744]">
                  Modelos padrão dos atalhos da ficha do lead
                </h2>
                <p className="text-slate-500 mt-0.5">
                  Define qual modelo é carregado por "+ Enviar procuração" e "+ Enviar minuta". Se removido, o Canvas exibe o aviso de padrão ausente com "Escolher outro modelo" e "Criar do zero".
                </p>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  Modelo padrão de Procuração
                </label>
                <select
                  value={state.defaultTemplateIds.procuracao || ''}
                  onChange={(e) =>
                    setDefaultTemplateId('procuracao', e.target.value ? e.target.value : null)
                  }
                  className="w-full h-9 px-2.5 border border-[#CBD5E1] rounded-md bg-white"
                >
                  <option value="">
                    -- Sem modelo padrão (testar fluxo de padrão ausente) --
                  </option>
                  {procuracaoTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  Modelo padrão de Minuta
                </label>
                <select
                  value={state.defaultTemplateIds.minuta || ''}
                  onChange={(e) =>
                    setDefaultTemplateId('minuta', e.target.value ? e.target.value : null)
                  }
                  className="w-full h-9 px-2.5 border border-[#CBD5E1] rounded-md bg-white"
                >
                  <option value="">
                    -- Sem modelo padrão (testar fluxo de padrão ausente) --
                  </option>
                  {minutaTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* Brand Standard Identity */}
            <section className="bg-white border border-[#E2E8F0] rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-[#0F2744]" />
                <h2 className="text-sm font-semibold text-[#0F2744]">
                  Identidade visual padrão vigente
                </h2>
              </div>
              <p className="text-slate-500">
                Aplicada automaticamente a novos documentos. Alterações aqui <strong>não</strong> modificam versões já emitidas na fila de envios.
              </p>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Logo / Marca no cabeçalho
                  </label>
                  <input
                    type="text"
                    value={brandDraft.logoText}
                    onChange={(e) => setBrandDraft({ ...brandDraft, logoText: e.target.value })}
                    className="w-full h-8 px-2.5 border border-[#CBD5E1] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Subtítulo da marca
                  </label>
                  <input
                    type="text"
                    value={brandDraft.logoSubtext}
                    onChange={(e) => setBrandDraft({ ...brandDraft, logoSubtext: e.target.value })}
                    className="w-full h-8 px-2.5 border border-[#CBD5E1] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Cabeçalho institucional
                  </label>
                  <input
                    type="text"
                    value={brandDraft.headerText}
                    onChange={(e) => setBrandDraft({ ...brandDraft, headerText: e.target.value })}
                    className="w-full h-8 px-2.5 border border-[#CBD5E1] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Rodapé institucional
                  </label>
                  <input
                    type="text"
                    value={brandDraft.footerText}
                    onChange={(e) => setBrandDraft({ ...brandDraft, footerText: e.target.value })}
                    className="w-full h-8 px-2.5 border border-[#CBD5E1] rounded"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => updateDocumentBrandStandard(brandDraft)}
                  className="inline-flex items-center gap-1.5 h-9 px-4 font-semibold text-white bg-[#0F2744] hover:bg-[#163459] rounded-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar padrão visual vigente</span>
                </button>
              </div>
            </section>
          </div>

          {/* Right: Template Editor */}
          <section className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-lg p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-[#0F2744]">
                  Editor de modelos (preserva documentos já emitidos)
                </h2>
                <p className="text-slate-500 mt-0.5">
                  Alterar texto ou cláusulas de um modelo afeta apenas novos documentos preparados a partir de agora.
                </p>
              </div>
              <select
                value={editingTemplateId}
                onChange={(e) => setEditingTemplateId(e.target.value)}
                className="h-9 px-2.5 border border-[#CBD5E1] rounded-md bg-white font-semibold text-[#0F2744]"
              >
                {state.documentTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({DOC_TYPE_LABELS[t.type]})
                  </option>
                ))}
              </select>
            </div>

            {templateDraft && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Nome do modelo
                    </label>
                    <input
                      type="text"
                      value={templateDraft.name}
                      onChange={(e) =>
                        setTemplateDraft({ ...templateDraft, name: e.target.value })
                      }
                      className="w-full h-8 px-2.5 border border-[#CBD5E1] rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Título padrão na folha A4
                    </label>
                    <input
                      type="text"
                      value={templateDraft.defaultTitle}
                      onChange={(e) =>
                        setTemplateDraft({ ...templateDraft, defaultTitle: e.target.value })
                      }
                      className="w-full h-8 px-2.5 border border-[#CBD5E1] rounded"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Texto principal (variáveis suportadas: {'{{razaoSocial}}'}, {'{{cnpj}}'}, {'{{poderes}}'}, {'{{vigencia}}'}, {'{{editalCodigo}}'})
                  </label>
                  <textarea
                    rows={4}
                    value={templateDraft.defaultBody}
                    onChange={(e) =>
                      setTemplateDraft({ ...templateDraft, defaultBody: e.target.value })
                    }
                    className="w-full p-2.5 border border-[#CBD5E1] rounded leading-relaxed"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-600">
                    Cláusulas do modelo ({templateDraft.clauses.length})
                  </div>
                  {templateDraft.clauses.map((cl, idx) => (
                    <div
                      key={cl.id}
                      className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1.5"
                    >
                      <input
                        type="text"
                        value={cl.title}
                        onChange={(e) => {
                          const next = [...templateDraft.clauses];
                          next[idx] = { ...cl, title: e.target.value };
                          setTemplateDraft({ ...templateDraft, clauses: next });
                        }}
                        className="w-full h-8 px-2 bg-white border border-[#CBD5E1] rounded font-semibold text-[#0F2744]"
                      />
                      <textarea
                        rows={2}
                        value={cl.content}
                        onChange={(e) => {
                          const next = [...templateDraft.clauses];
                          next[idx] = { ...cl, content: e.target.value };
                          setTemplateDraft({ ...templateDraft, clauses: next });
                        }}
                        className="w-full p-2 bg-white border border-[#CBD5E1] rounded leading-relaxed"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => updateDocumentTemplate(templateDraft)}
                  className="inline-flex items-center gap-1.5 h-9 px-4 font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar alterações do modelo</span>
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
