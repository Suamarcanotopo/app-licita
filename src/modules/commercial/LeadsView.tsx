import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CalendarPlus,
  CheckCircle2,
  Columns3,
  ExternalLink,
  FileCheck2,
  FilePenLine,
  FileSignature,
  FileText,
  List,
  MessageSquareReply,
  Plus,
  RotateCcw,
  X,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { GESTOR_MAP } from '../../data/seedData';
import { GROUP_DEFAULT_LABELS, PATH_LABELS } from '../../engine/qualification';
import { DOC_TYPE_LABELS } from '../../engine/documentCanvas';
import {
  DocumentStatus,
  FunnelPathId,
  GestorId,
  Lead,
  LeadStage,
  QualificationGroupKey,
} from '../../types/domain';
import {
  DocumentStatusText,
  ProcuracaoStatusText,
  SemaphoreIndicator,
} from '../../components/StatusLabel';

const PIPELINE_STAGES: LeadStage[] = [
  'Novo',
  'Em contato',
  'Respondeu',
  'Documentos solicitados',
  'Reunião agendada',
  'Proposta',
  'Procuração pendente',
  'Procuração assinada e validada',
  'Cliente ativo',
];

export const LeadsView: React.FC = () => {
  const {
    state,
    globalSearch,
    selectedLeadId,
    setSelectedLeadId,
    setSelectedClientId,
    setRoute,
    leadsFilterPreset,
    setLeadsFilterPreset,
    updateLeadStage,
    reopenLead,
    simulateLeadReply,
    scheduleMeeting,
    updateLeadTriageMinutes,
    updateLeadDocumentStatus,
    addLeadDocument,
    updateProcuracaoStatus,
    markAcceptance,
    prepareDocumentFromLead,
    openDocumentCanvas,
  } = useApp();

  const [viewType, setViewType] = useState<'table' | 'kanban'>('table');
  const [originFilter, setOriginFilter] = useState<string>(leadsFilterPreset.salesPageId || 'all');
  const [intentFilter, setIntentFilter] = useState<string>('all');
  const [bottleneckFilter, setBottleneckFilter] = useState<string>('all');
  const [procuracaoFilter, setProcuracaoFilter] = useState<string>('all');
  const [deadlineFilter, setDeadlineFilter] = useState<string>('all');
  const [noReturnOnly, setNoReturnOnly] = useState<boolean>(!!leadsFilterPreset.noReturnOnly);

  // Sync preset when triggered from Overview KPI
  React.useEffect(() => {
    if (leadsFilterPreset.noReturnOnly !== undefined) {
      setNoReturnOnly(leadsFilterPreset.noReturnOnly);
    }
    if (leadsFilterPreset.salesPageId) {
      setOriginFilter(leadsFilterPreset.salesPageId);
    }
  }, [leadsFilterPreset]);

  // Drawer tabs & forms
  const [drawerTab, setDrawerTab] = useState<'resumo' | 'respostas' | 'documentos' | 'reuniao' | 'historico'>('resumo');
  const [replyText, setReplyText] = useState('Recebi o diagnóstico, podemos conversar amanhã às 10h.');
  const [closeReason, setCloseReason] = useState('');
  const [showCloseBox, setShowCloseBox] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [newDocName, setNewDocName] = useState('');
  const [newDocGroup, setNewDocGroup] = useState<QualificationGroupKey>('comprovacao_tecnica');
  const [triageInput, setTriageInput] = useState<string>('');

  // Meeting scheduling form
  const [meetTitle, setMeetTitle] = useState('');
  const [meetAgenda, setMeetAgenda] = useState('');
  const [meetDate, setMeetDate] = useState('2026-11-26');
  const [meetTime, setMeetTime] = useState('10:30');
  const [includeRibamar, setIncludeRibamar] = useState(true);
  const [includeRibamarJr, setIncludeRibamarJr] = useState(false);

  const selectedLead: Lead | undefined = state.leads.find((l) => l.id === selectedLeadId);

  React.useEffect(() => {
    if (selectedLead) {
      setTriageInput(String(selectedLead.triageMinutesActual ?? 15));
      setMeetTitle(`Alinhamento inicial · ${selectedLead.companyName}`);
      setMeetAgenda(`Retomar ${selectedLead.qualification.marcioResumeTopic}.`);
      if (
        selectedLead.qualification.availableCount === 3 &&
        selectedLead.qualification.bottleneckGroup === 'comprovacao_tecnica'
      ) {
        markAcceptance('t4TechBottleneckWithThreeGreens', true);
      }
    }
  }, [selectedLead?.id]);

  const filteredLeads = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    return state.leads.filter((l) => {
      if (state.activeProjectId !== 'all' && l.projectId !== state.activeProjectId) return false;
      if (originFilter !== 'all' && l.salesPageId !== originFilter) return false;
      if (intentFilter !== 'all' && l.intent !== intentFilter) return false;
      if (bottleneckFilter !== 'all' && l.qualification.bottleneckGroup !== bottleneckFilter) return false;
      if (procuracaoFilter !== 'all' && l.procuracaoStatus !== procuracaoFilter) return false;
      if (noReturnOnly && (!l.noReturnYet || l.stage === 'Encerrado')) return false;
      if (deadlineFilter === 'com_edital' && !l.editalDeadline) return false;
      if (deadlineFilter === 'urgente' && (!l.editalDeadline || l.editalDeadline > '2026-12-01')) return false;
      if (q) {
        const hay = `${l.companyName} ${l.contactName} ${l.campaign} ${l.salesPageUrl} ${l.editalCode || ''} ${l.qualification.bottleneckLabel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    state.leads,
    state.activeProjectId,
    originFilter,
    intentFilter,
    bottleneckFilter,
    procuracaoFilter,
    deadlineFilter,
    noReturnOnly,
    globalSearch,
  ]);

  const clearFilters = () => {
    setOriginFilter('all');
    setIntentFilter('all');
    setBottleneckFilter('all');
    setProcuracaoFilter('all');
    setDeadlineFilter('all');
    setNoReturnOnly(false);
    setLeadsFilterPreset({});
  };

  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    const partners: GestorId[] = ['marcio'];
    if (includeRibamar) partners.push('ribamar');
    if (includeRibamarJr) partners.push('ribamar_jr');
    scheduleMeeting({
      leadId: selectedLead.id,
      title: meetTitle,
      agenda: meetAgenda,
      dateIso: meetDate,
      time: meetTime,
      participants: partners,
      durationMinutes: selectedLead.intent === 'ja_tenho_edital' ? 20 : 40,
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F2744]">CRM · Leads e passagem para cliente</h1>
          <p className="text-sm text-slate-600 mt-1">
            Primeira abordagem conduzida por Márcio, participação dos sócios pós-agendamento e ativação mediante procuração validada.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-md self-start">
          <button
            type="button"
            onClick={() => setViewType('table')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              viewType === 'table' ? 'bg-white text-[#0F2744] shadow-xs' : 'text-slate-600'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Tabela ({filteredLeads.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewType('kanban')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              viewType === 'kanban' ? 'bg-white text-[#0F2744] shadow-xs' : 'text-slate-600'
            }`}
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span>Quadro por etapa</span>
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-3.5 flex flex-wrap items-center gap-2.5 text-xs">
        <select
          value={originFilter}
          onChange={(e) => setOriginFilter(e.target.value)}
          className="h-8 px-2.5 border border-[#E2E8F0] rounded-md bg-white"
          aria-label="Filtrar por origem"
        >
          <option value="all">Todas as origens</option>
          {state.salesPages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>

        <select
          value={intentFilter}
          onChange={(e) => setIntentFilter(e.target.value)}
          className="h-8 px-2.5 border border-[#E2E8F0] rounded-md bg-white"
          aria-label="Filtrar por intenção"
        >
          <option value="all">Todas as intenções</option>
          {(Object.keys(PATH_LABELS) as FunnelPathId[]).map((id) => (
            <option key={id} value={id}>
              {PATH_LABELS[id]}
            </option>
          ))}
        </select>

        <select
          value={bottleneckFilter}
          onChange={(e) => setBottleneckFilter(e.target.value)}
          className="h-8 px-2.5 border border-[#E2E8F0] rounded-md bg-white"
          aria-label="Filtrar por gargalo"
        >
          <option value="all">Todos os gargalos</option>
          {(Object.keys(GROUP_DEFAULT_LABELS) as QualificationGroupKey[]).map((gk) => (
            <option key={gk} value={gk}>
              {GROUP_DEFAULT_LABELS[gk]}
            </option>
          ))}
        </select>

        <select
          value={deadlineFilter}
          onChange={(e) => setDeadlineFilter(e.target.value)}
          className="h-8 px-2.5 border border-[#E2E8F0] rounded-md bg-white"
          aria-label="Filtrar por prazo"
        >
          <option value="all">Qualquer prazo</option>
          <option value="com_edital">Com prazo de edital</option>
          <option value="urgente">Edital urgente (&lt; 7 dias)</option>
        </select>

        <select
          value={procuracaoFilter}
          onChange={(e) => setProcuracaoFilter(e.target.value)}
          className="h-8 px-2.5 border border-[#E2E8F0] rounded-md bg-white"
          aria-label="Filtrar por procuração"
        >
          <option value="all">Todas as procurações</option>
          <option value="Não iniciada">Não iniciada</option>
          <option value="Pendente de assinatura">Pendente de assinatura</option>
          <option value="Assinada e validada">Assinada e validada</option>
          <option value="Vencida">Vencida</option>
          <option value="Revogada">Revogada</option>
        </select>

        <label className="inline-flex items-center gap-1.5 px-2 text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={noReturnOnly}
            onChange={(e) => setNoReturnOnly(e.target.checked)}
          />
          <span>Somente sem retorno</span>
        </label>

        <button
          type="button"
          onClick={clearFilters}
          className="ml-auto text-xs font-semibold text-[#0F2744] hover:underline"
        >
          Limpar filtros
        </button>
      </div>

      {/* TABLE VIEW */}
      {viewType === 'table' ? (
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-slate-600">
                <th className="py-3 px-4 font-semibold">Empresa / Contato</th>
                <th className="py-3 px-4 font-semibold">Origem / Versão</th>
                <th className="py-3 px-4 font-semibold">Intenção / Prazo</th>
                <th className="py-3 px-4 font-semibold">Gargalo e grupos</th>
                <th className="py-3 px-4 font-semibold">Etapa</th>
                <th className="py-3 px-4 font-semibold">Procuração</th>
                <th className="py-3 px-4 font-semibold text-right">Próx. retorno</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhum lead encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const proj = state.projects.find((p) => p.id === lead.projectId);
                  const bStatus = lead.qualification.bottleneckGroup
                    ? lead.qualification.groups[lead.qualification.bottleneckGroup]
                    : 'verde';
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => {
                        setSelectedLeadId(lead.id);
                        setDrawerTab('resumo');
                      }}
                      className={`cursor-pointer transition-colors ${
                        selectedLeadId === lead.id ? 'bg-[#EEF3F9]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{lead.companyName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {lead.contactName} · {lead.porte} · {proj?.nome}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">
                          {lead.salesPageId === 'pg_industria' ? 'Página A · Indústria' : 'Página B · Edital'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          v{lead.funnelVersion} · {lead.campaign.split('·')[0].trim()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800">{PATH_LABELS[lead.intent]}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
                          {lead.editalDeadline ? `Prazo: ${lead.editalDeadline}` : lead.qualification.commercialPriority}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {lead.qualification.bottleneckLabel}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <SemaphoreIndicator status={bStatus} />
                          <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                            ({lead.qualification.availableCount}/4)
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0F2744]">{lead.stage}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {lead.cadencePaused ? 'Cadência pausada' : 'Cadência ativa'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <ProcuracaoStatusText status={lead.procuracaoStatus} />
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <div className={lead.noReturnYet ? 'text-[#B91C1C] font-semibold' : 'text-slate-700'}>
                          {lead.nextReturnAt.split('-').reverse().join('/')}
                        </div>
                        {lead.noReturnYet && (
                          <div className="text-[11px] text-[#B91C1C]">Sem retorno</div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* KANBAN VIEW BY STAGE */
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {PIPELINE_STAGES.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => l.stage === stage);
              return (
                <div
                  key={stage}
                  className="w-[260px] bg-white border border-[#E2E8F0] rounded-lg flex flex-col shrink-0"
                >
                  <div className="px-3.5 py-2.5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#0F2744] truncate">{stage}</span>
                    <span className="text-xs font-mono text-slate-500 tabular-nums">
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="p-2.5 space-y-2.5 min-h-[180px]">
                    {stageLeads.map((lead) => (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => {
                          setSelectedLeadId(lead.id);
                          setDrawerTab('resumo');
                        }}
                        className="w-full text-left p-3 border border-[#E2E8F0] hover:border-[#0F2744] rounded-md bg-white transition-colors space-y-1.5"
                      >
                        <div className="text-xs font-semibold text-slate-900 leading-snug">
                          {lead.companyName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {PATH_LABELS[lead.intent]} · {lead.porte}
                        </div>
                        <div className="text-[11px] font-medium text-[#0F2744]">
                          Gargalo: {lead.qualification.bottleneckLabel}
                        </div>
                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span>{lead.salesPageId === 'pg_industria' ? 'Página A' : 'Página B'}</span>
                          <span className="font-mono tabular-nums">
                            {lead.qualification.availableCount}/4
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LEAD DETAIL DRAWER */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setSelectedLeadId(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl border-l border-[#E2E8F0] flex flex-col">
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-[#E2E8F0] px-5 py-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{state.projects.find((p) => p.id === selectedLead.projectId)?.nome}</span>
                  <span>·</span>
                  <span className="font-mono">Funil v{selectedLead.funnelVersion}</span>
                  <span>·</span>
                  <span>
                    {selectedLead.salesPageId === 'pg_industria' ? 'Página A' : 'Página B'}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#0F2744] mt-0.5 truncate">
                  {selectedLead.companyName}
                </h2>
                <div className="text-xs text-slate-600 mt-0.5">
                  {selectedLead.contactName} · {selectedLead.contactChannel}: {selectedLead.contactValue} · Porte: {selectedLead.porte}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeadId(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-md"
                aria-label="Fechar ficha do lead"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stage Selector & Quick Actions Bar */}
            <div className="px-5 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center gap-2 text-xs">
              <label className="font-medium text-slate-600">Etapa:</label>
              <select
                value={selectedLead.stage}
                onChange={(e) => updateLeadStage(selectedLead.id, e.target.value as LeadStage)}
                className="h-8 px-2.5 bg-white border border-[#CBD5E1] rounded-md font-semibold text-[#0F2744]"
              >
                {[...PIPELINE_STAGES, 'Encerrado' as LeadStage].map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              {selectedLead.stage !== 'Encerrado' ? (
                <button
                  type="button"
                  onClick={() => setShowCloseBox((v) => !v)}
                  className="inline-flex items-center gap-1 h-8 px-2.5 text-[#B91C1C] bg-white border border-[#FECACA] rounded-md font-medium"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Encerrar</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="Motivo para reabrir..."
                    className="h-8 px-2 border border-[#CBD5E1] rounded-md bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      reopenLead(selectedLead.id, reopenReason);
                      setReopenReason('');
                    }}
                    className="inline-flex items-center gap-1 h-8 px-2.5 text-white bg-[#0F2744] rounded-md font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reabrir</span>
                  </button>
                </div>
              )}

              {selectedLead.clientId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClientId(selectedLead.clientId!);
                    setSelectedLeadId(null);
                    setRoute('clients');
                  }}
                  className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 font-semibold text-white bg-[#15803D] rounded-md"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Abrir ficha operacional do cliente</span>
                </button>
              )}
            </div>

            {showCloseBox && selectedLead.stage !== 'Encerrado' && (
              <div className="px-5 py-3 bg-[#FEF2F2] border-b border-[#FECACA] flex flex-wrap items-center gap-2 text-xs">
                <input
                  type="text"
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  placeholder="Informe o motivo do encerramento..."
                  className="flex-1 min-w-[200px] h-8 px-2.5 bg-white border border-[#FECACA] rounded-md"
                />
                <button
                  type="button"
                  onClick={() => {
                    updateLeadStage(selectedLead.id, 'Encerrado', closeReason);
                    setShowCloseBox(false);
                    setCloseReason('');
                  }}
                  className="h-8 px-3 font-semibold text-white bg-[#B91C1C] rounded-md"
                >
                  Confirmar encerramento
                </button>
              </div>
            )}

            {/* Drawer Sub-tabs */}
            <div className="px-5 pt-3 border-b border-[#E2E8F0] flex gap-4 overflow-x-auto text-xs">
              {(
                [
                  ['resumo', 'Resumo e Qualificação'],
                  ['respostas', 'Respostas (v' + selectedLead.funnelVersion + ')'],
                  [
                    'documentos',
                    `Documentos (${
                      selectedLead.documents.length +
                      state.canvasDocuments.filter((d) => d.leadId === selectedLead.id).length
                    })`,
                  ],
                  ['reuniao', 'Reunião e Sócios'],
                  ['historico', `Histórico (${selectedLead.history.length})`],
                ] as const
              ).map(([tabKey, tabLabel]) => (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setDrawerTab(tabKey)}
                  className={`pb-2.5 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    drawerTab === tabKey
                      ? 'border-[#0F2744] text-[#0F2744]'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tabLabel}
                </button>
              ))}
            </div>

            {/* Drawer Body */}
            <div className="p-5 space-y-5 flex-1 text-xs">
              {drawerTab === 'resumo' && (
                <>
                  {/* Critical Bottleneck Highlight */}
                  <div className="p-4 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-[#0F2744]">
                        Semáforo de qualificação ({selectedLead.qualification.availableCount} de 4 grupos disponíveis declarados)
                      </span>
                      <span className="font-semibold text-[#B91C1C]">
                        Gargalo: {selectedLead.qualification.bottleneckLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(Object.keys(GROUP_DEFAULT_LABELS) as QualificationGroupKey[]).map((gk) => {
                        const isBottleneck = selectedLead.qualification.bottleneckGroup === gk;
                        return (
                          <div
                            key={gk}
                            className={`p-3 bg-white rounded border ${
                              isBottleneck ? 'border-[#DC2626]' : 'border-[#E2E8F0]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[11px] font-medium text-slate-600">
                                {GROUP_DEFAULT_LABELS[gk]}
                              </span>
                              {isBottleneck && (
                                <span className="text-[10px] font-semibold text-[#B91C1C]">
                                  Gargalo principal
                                </span>
                              )}
                            </div>
                            <div className="mt-1">
                              <SemaphoreIndicator status={selectedLead.qualification.groups[gk]} verbose />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200">
                      <div>
                        <span className="text-slate-500 block">Prontidão documental</span>
                        <span className="font-semibold text-slate-900">
                          {selectedLead.qualification.documentReadiness}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Prioridade comercial</span>
                        <span className="font-semibold text-slate-900">
                          {selectedLead.qualification.commercialPriority}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Parecer jurídico</span>
                        <span className="font-semibold text-slate-900">
                          {selectedLead.qualification.legalReviewStatus}
                        </span>
                      </div>
                    </div>

                    {selectedLead.qualification.legalAlerts.map((al, i) => (
                      <div key={i} className="pt-2 text-[#B45309] font-medium flex items-start gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{al}</span>
                      </div>
                    ))}
                  </div>

                  {/* Edital triage actual minutes (Section 5) */}
                  {selectedLead.intent === 'ja_tenho_edital' && (
                    <div className="p-4 border border-[#E2E8F0] rounded-lg space-y-2.5">
                      <div className="font-semibold text-[#0F2744]">
                        Triagem do edital (referência 15 min) · Serviço de revisão completa é contratado
                      </div>
                      <div className="text-slate-600">
                        Edital: <strong>{selectedLead.editalCode || 'Não informado'}</strong> · Lote:{' '}
                        <strong>{selectedLead.editalLot || 'A confirmar'}</strong> · Prazo:{' '}
                        <strong className="font-mono">{selectedLead.editalDeadline || 'A confirmar'}</strong>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <label className="text-slate-600">Minutos efetivos registrados:</label>
                        <input
                          type="number"
                          min={1}
                          max={240}
                          value={triageInput}
                          onChange={(e) => setTriageInput(e.target.value)}
                          className="w-20 h-8 px-2 border border-[#CBD5E1] rounded font-mono tabular-nums"
                        />
                        <button
                          type="button"
                          onClick={() => updateLeadTriageMinutes(selectedLead.id, Number(triageInput) || 15)}
                          className="h-8 px-3 font-semibold text-white bg-[#0F2744] rounded-md"
                        >
                          Salvar tempo efetivo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Cadence & Lead Reply Simulator (Acceptance Test 5) */}
                  <div className="p-4 border border-[#E2E8F0] rounded-lg space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#0F2744]">
                        Cadência comercial e resposta do lead
                      </span>
                      <span
                        className={`font-semibold ${
                          selectedLead.cadencePaused ? 'text-[#15803D]' : 'text-[#B45309]'
                        }`}
                      >
                        {selectedLead.cadencePaused ? 'Cadência pausada' : 'Lembrete ativo pendente'}
                      </span>
                    </div>
                    {selectedLead.cadencePaused ? (
                      <p className="text-slate-600">
                        Motivo da pausa: {selectedLead.cadencePauseReason || 'Pausada pelo andamento.'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-slate-600">
                          Simule uma resposta do lead para confirmar que o próximo lembrete automático é pausado imediatamente.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="flex-1 h-9 px-3 border border-[#CBD5E1] rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => simulateLeadReply(selectedLead.id, replyText)}
                            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md whitespace-nowrap"
                          >
                            <MessageSquareReply className="w-3.5 h-3.5" />
                            <span>Simular resposta do lead</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Procuração & Operational Activation Gate (Acceptance Test 9) */}
                  <div className="p-4 border border-[#E2E8F0] rounded-lg space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-[#0F2744]">
                        Procuração e ativação da operação do cliente
                      </span>
                      <ProcuracaoStatusText status={selectedLead.procuracaoStatus} />
                    </div>
                    <p className="text-slate-600">
                      A procuração precisa estar <strong>assinada e validada</strong> para abrir a operação em Clientes. Se vencida ou revogada, novas ações de representação são interrompidas.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateProcuracaoStatus(selectedLead.id, 'Pendente de assinatura')}
                        className="h-8 px-3 font-medium text-[#0F2744] bg-white border border-[#CBD5E1] hover:border-[#0F2744] rounded-md"
                      >
                        Enviar minuta (Pendente)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateProcuracaoStatus(selectedLead.id, 'Assinada e validada', '2027-11-23')}
                        className="inline-flex items-center gap-1.5 h-8 px-3 font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Validar procuração assinada</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateProcuracaoStatus(selectedLead.id, 'Revogada')}
                        className="h-8 px-3 font-medium text-[#B91C1C] bg-white border border-[#FECACA] rounded-md"
                      >
                        Simular revogação
                      </button>
                    </div>
                  </div>
                </>
              )}

              {drawerTab === 'respostas' && (
                <div className="space-y-3">
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-slate-600">
                    Registro preservado com as perguntas e regras da <strong>versão v{selectedLead.funnelVersion}</strong> do funil. Origem: <span className="font-mono">{selectedLead.salesPageUrl}</span> ({selectedLead.campaign}).
                  </div>
                  <div className="divide-y divide-slate-100 border border-[#E2E8F0] rounded-lg">
                    {selectedLead.stepsSnapshot.map((st, idx) => (
                      <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-slate-600">{st.title}</span>
                        <span className="font-semibold text-slate-900">{st.answerLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {drawerTab === 'documentos' && (() => {
                const leadCanvasDocs = state.canvasDocuments.filter(
                  (d) => d.leadId === selectedLead.id
                );
                return (
                <div className="space-y-5">
                  {/* Three Canvas Document Preparation Shortcuts */}
                  <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-3">
                    <div>
                      <div className="text-xs font-bold text-[#0F2744]">
                        Preparar documento no Canvas (lead e empresa já vinculados)
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Cada atalho abre o Canvas de revisão e edição com os dados deste cliente. A fila de envios permanece intacta até a confirmação dentro do Canvas.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => prepareDocumentFromLead(selectedLead.id, 'documento_livre')}
                        className="inline-flex items-center gap-1.5 h-9 px-3 font-semibold text-[#0F2744] bg-white border border-[#CBD5E1] hover:border-[#0F2744] rounded-md transition-colors"
                      >
                        <FilePenLine className="w-3.5 h-3.5" />
                        <span>+ Criar documento</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => prepareDocumentFromLead(selectedLead.id, 'procuracao')}
                        className="inline-flex items-center gap-1.5 h-9 px-3 font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md transition-colors"
                      >
                        <FileSignature className="w-3.5 h-3.5" />
                        <span>+ Enviar procuração</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => prepareDocumentFromLead(selectedLead.id, 'minuta')}
                        className="inline-flex items-center gap-1.5 h-9 px-3 font-semibold text-white bg-[#0F2744] hover:bg-[#163459] rounded-md transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>+ Enviar minuta</span>
                      </button>
                    </div>
                  </div>

                  {/* Linked Canvas Documents */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#0F2744]">
                        Documentos no Canvas desta empresa ({leadCanvasDocs.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLeadId(null);
                          setRoute('proposals');
                        }}
                        className="text-[11px] font-semibold text-[#0F2744] hover:underline"
                      >
                        Ver em Propostas e procurações
                      </button>
                    </div>
                    {leadCanvasDocs.length === 0 ? (
                      <div className="p-3.5 border border-[#E2E8F0] rounded-lg text-slate-500">
                        Nenhum documento preparado no Canvas para este lead. Use um dos três atalhos acima para iniciar.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-[#E2E8F0] rounded-lg">
                        {leadCanvasDocs.map((cdoc) => (
                          <div
                            key={cdoc.id}
                            className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono font-bold text-[#0F2744]">
                                  {cdoc.id}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className="font-mono font-semibold text-slate-700">
                                  {cdoc.currentVersion}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className="font-semibold text-slate-900 truncate">
                                  {cdoc.title}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                                <span>{DOC_TYPE_LABELS[cdoc.type]}</span>
                                <span>·</span>
                                <span
                                  className={
                                    cdoc.inSentQueue
                                      ? 'font-semibold text-[#15803D]'
                                      : 'font-medium text-[#B45309]'
                                  }
                                >
                                  {cdoc.status}
                                </span>
                                <span>·</span>
                                <span>
                                  {cdoc.inSentQueue
                                    ? 'Na fila de envios'
                                    : 'Preparação (fora da fila de envios)'}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => openDocumentCanvas(cdoc.id)}
                              className="inline-flex items-center justify-center gap-1.5 h-8 px-3 font-semibold text-[#0F2744] bg-white border border-[#CBD5E1] hover:border-[#0F2744] rounded-md shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Abrir no Canvas</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Existing Habilitation Checklist Documents */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-[#0F2744]">
                      Checklist de habilitação e certidões ({selectedLead.documents.length})
                    </h3>
                    <p className="text-slate-600">
                      Separe documentos solicitados, recebidos, aprovados e a corrigir. Marcar um item como <strong>Recebido</strong> cancela automaticamente o lembrete daquele documento.
                    </p>
                    <div className="divide-y divide-slate-100 border border-[#E2E8F0] rounded-lg">
                      {selectedLead.documents.length === 0 ? (
                        <div className="p-4 text-slate-500">Nenhum documento solicitado ainda.</div>
                      ) : (
                      selectedLead.documents.map((doc) => (
                        <div key={doc.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="font-semibold text-slate-900">{doc.name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {GROUP_DEFAULT_LABELS[doc.group]} · Atualizado em {doc.updatedAt}
                            </div>
                            {doc.note && <div className="text-[11px] text-slate-600 mt-0.5">{doc.note}</div>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <DocumentStatusText status={doc.status} />
                            <select
                              value={doc.status}
                              onChange={(e) =>
                                updateLeadDocumentStatus(
                                  selectedLead.id,
                                  doc.id,
                                  e.target.value as DocumentStatus
                                )
                              }
                              className="h-8 px-2 border border-[#CBD5E1] rounded bg-white text-xs"
                              aria-label={`Status de ${doc.name}`}
                            >
                              <option value="Solicitado">Solicitado</option>
                              <option value="Recebido">Recebido</option>
                              <option value="Aprovado">Aprovado</option>
                              <option value="A corrigir">A corrigir</option>
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add document */}
                  <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      placeholder="Solicitar novo documento..."
                      className="flex-1 h-9 px-3 bg-white border border-[#CBD5E1] rounded-md"
                    />
                    <select
                      value={newDocGroup}
                      onChange={(e) => setNewDocGroup(e.target.value as QualificationGroupKey)}
                      className="h-9 px-2 bg-white border border-[#CBD5E1] rounded-md"
                    >
                      {(Object.keys(GROUP_DEFAULT_LABELS) as QualificationGroupKey[]).map((g) => (
                        <option key={g} value={g}>
                          {GROUP_DEFAULT_LABELS[g]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        addLeadDocument(selectedLead.id, newDocName, newDocGroup);
                        setNewDocName('');
                      }}
                      className="inline-flex items-center justify-center gap-1 h-9 px-3 font-semibold text-white bg-[#0F2744] rounded-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Solicitar</span>
                    </button>
                  </div>
                  </div>
                </div>
                );
              })()}

              {drawerTab === 'reuniao' && (
                <form onSubmit={handleScheduleMeeting} className="space-y-4">
                  <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-slate-700">
                    <strong>Regra operacional:</strong> Márcio conduz toda primeira abordagem humana. Após o agendamento, adicione <strong>José Ribamar</strong>, <strong>José Ribamar Júnior</strong> ou ambos conforme disponibilidade.
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Título da reunião</label>
                    <input
                      type="text"
                      required
                      value={meetTitle}
                      onChange={(e) => setMeetTitle(e.target.value)}
                      className="w-full h-9 px-3 border border-[#CBD5E1] rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Pauta objetiva</label>
                    <textarea
                      rows={2}
                      required
                      value={meetAgenda}
                      onChange={(e) => setMeetAgenda(e.target.value)}
                      className="w-full p-2.5 border border-[#CBD5E1] rounded-md"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Data</label>
                      <input
                        type="date"
                        value={meetDate}
                        onChange={(e) => setMeetDate(e.target.value)}
                        className="w-full h-9 px-2.5 border border-[#CBD5E1] rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Horário</label>
                      <input
                        type="time"
                        value={meetTime}
                        onChange={(e) => setMeetTime(e.target.value)}
                        className="w-full h-9 px-2.5 border border-[#CBD5E1] rounded-md font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="font-semibold text-[#0F2744]">Participantes da reunião</div>
                    <label className="flex items-center gap-2 text-slate-600">
                      <input type="checkbox" checked disabled />
                      <span>Márcio (responsável pela primeira abordagem — fixo)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                      <input
                        type="checkbox"
                        checked={includeRibamar}
                        onChange={(e) => setIncludeRibamar(e.target.checked)}
                      />
                      <span>José Ribamar (Sócio · Jurídico e Licitações)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                      <input
                        type="checkbox"
                        checked={includeRibamarJr}
                        onChange={(e) => setIncludeRibamarJr(e.target.checked)}
                      />
                      <span>José Ribamar Júnior (Sócio · Operações e Estratégia)</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 h-10 px-4 font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    <span>Agendar reunião e cancelar lembretes comerciais</span>
                  </button>

                  {/* Existing meetings for this lead */}
                  {state.meetings.filter((m) => m.leadId === selectedLead.id).length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="font-semibold text-[#0F2744]">Reuniões vinculadas na agenda</div>
                      {state.meetings
                        .filter((m) => m.leadId === selectedLead.id)
                        .map((m) => (
                          <div key={m.id} className="p-3 border border-[#E2E8F0] rounded-md">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900">{m.title}</span>
                              <span className="font-mono text-[#0F2744] tabular-nums">{m.dateTime}</span>
                            </div>
                            <p className="text-slate-600 mt-1">{m.agenda}</p>
                            <div className="text-[11px] text-slate-500 mt-1">
                              Participantes: {m.participants.map((p) => GESTOR_MAP[p]?.nome).join(' · ')}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </form>
              )}

              {drawerTab === 'historico' && (
                <div className="space-y-2.5">
                  {selectedLead.history.map((ev) => (
                    <div key={ev.id} className="p-3 border border-[#E2E8F0] rounded-md">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-semibold text-[#0F2744]">{ev.actor}</span>
                        <span className="font-mono tabular-nums">{ev.at}</span>
                      </div>
                      <p className="text-slate-700 mt-1">{ev.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
