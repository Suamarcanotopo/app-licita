import React from 'react';
import {
  ArrowRight,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  GitBranch,
  ListChecks,
  Radar,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { GESTOR_MAP } from '../../data/seedData';
import { PATH_LABELS } from '../../engine/qualification';
import { SemaphoreIndicator } from '../../components/StatusLabel';

export const OverviewView: React.FC = () => {
  const {
    state,
    setRoute,
    setLeadsFilterPreset,
    setTasksOverdueOnly,
    setDocsPendingOnly,
    setRadarUrgentOnly,
    setSelectedLeadId,
    openVisitorMode,
    isOrgaoBlocked,
  } = useApp();

  const matchesProject = (projectId: string) =>
    state.activeProjectId === 'all' || projectId === state.activeProjectId;

  const filteredLeads = state.leads.filter((l) => matchesProject(l.projectId));
  const filteredTasks = state.tasks.filter((t) => matchesProject(t.projectId));
  const filteredMeetings = state.meetings.filter(
    (m) => m.status === 'Agendada' && matchesProject(m.projectId)
  );
  const eligibleEditais = state.editais.filter(
    (e) =>
      !isOrgaoBlocked(e.orgao).blocked &&
      e.situacao !== 'Encerrado' &&
      (state.activeProjectId === 'all' || e.projectIds.includes(state.activeProjectId))
  );

  const leadsNoReturn = filteredLeads.filter((l) => l.noReturnYet && l.stage !== 'Encerrado');
  const tasksOverdue = filteredTasks.filter((t) => t.overdue && !t.done);
  const editaisNearDeadline = eligibleEditais.filter((e) => e.prazoIso <= '2026-12-05');
  const pendingDocs = filteredLeads.flatMap((l) =>
    l.documents.filter((d) => d.status === 'Solicitado' || d.status === 'A corrigir')
  );
  const validatedProcuracoesCount = state.clients.filter(
    (c) => c.procuracaoStatus === 'Assinada e validada'
  ).length;

  const kpis = [
    {
      label: 'Leads sem retorno',
      value: leadsNoReturn.length,
      sub: 'Aguardando 1ª abordagem (Márcio)',
      tone: leadsNoReturn.length > 0 ? 'text-[#B91C1C]' : 'text-[#15803D]',
      icon: Users,
      onClick: () => {
        setLeadsFilterPreset({ noReturnOnly: true });
        setRoute('leads');
      },
    },
    {
      label: 'Tarefas vencidas',
      value: tasksOverdue.length,
      sub: 'Ações imediatas na agenda',
      tone: tasksOverdue.length > 0 ? 'text-[#B91C1C]' : 'text-[#15803D]',
      icon: Clock,
      onClick: () => {
        setTasksOverdueOnly(true);
        setRoute('tasks');
      },
    },
    {
      label: 'Editais com prazo próximo',
      value: editaisNearDeadline.length,
      sub: 'Elegíveis após gate de conflito',
      tone: 'text-[#B45309]',
      icon: Radar,
      onClick: () => {
        setRadarUrgentOnly(true);
        setRoute('radar');
      },
    },
    {
      label: 'Documentos pendentes',
      value: pendingDocs.length,
      sub: 'Solicitados ou a corrigir',
      tone: 'text-[#0F2744]',
      icon: FileText,
      onClick: () => {
        setDocsPendingOnly(true);
        setRoute('documents');
      },
    },
    {
      label: 'Reuniões agendadas',
      value: filteredMeetings.length,
      sub: 'Com Márcio e sócios',
      tone: 'text-[#15803D]',
      icon: Calendar,
      onClick: () => {
        setRoute('meetings');
      },
    },
  ];

  const completedTests = Object.values(state.acceptance).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F2744] tracking-tight">
            Painel de Gestão · Visão geral
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Acompanhe conversões das páginas de vendas, gargalos documentais, editais verificados e marco operacional.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRoute('demo-roadmap')}
            className="inline-flex items-center gap-2 h-9 px-3.5 text-xs font-semibold text-[#0F2744] bg-white border border-[#E2E8F0] hover:border-[#0F2744] rounded-md transition-colors whitespace-nowrap"
          >
            <ListChecks className="w-4 h-4" />
            <span>Roteiro de demonstração ({completedTests}/10)</span>
          </button>
          <button
            type="button"
            onClick={() => setRoute('funnels')}
            className="inline-flex items-center gap-2 h-9 px-3.5 text-xs font-semibold text-white bg-[#0F2744] hover:bg-[#1A3A63] rounded-md transition-colors whitespace-nowrap"
          >
            <GitBranch className="w-4 h-4" />
            <span>Abrir Construtor de Funis</span>
          </button>
        </div>
      </div>

      {/* 5 Clickable KPI Strip (each opens filtered list) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.label}
              type="button"
              onClick={kpi.onClick}
              className="group text-left bg-white border border-[#E2E8F0] hover:border-[#0F2744] rounded-lg p-4 transition-colors focus-visible:outline-2 focus-visible:outline-[#0F2744]"
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium">{kpi.label}</span>
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-[#0F2744] transition-colors" />
              </div>
              <div className={`mt-2 text-2xl font-display font-bold tabular-nums ${kpi.tone}`}>
                {kpi.value}
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate">{kpi.sub}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-[#0F2744]" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main 2-column operational priority split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Priority Leads Queue */}
        <section className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-lg">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[#0F2744]">Fila prioritária de leads</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Origem por página, gargalo crítico e próximo retorno atribuído
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setLeadsFilterPreset({});
                setRoute('leads');
              }}
              className="text-xs font-semibold text-[#0F2744] hover:underline whitespace-nowrap"
            >
              Ver todos ({filteredLeads.length})
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredLeads.slice(0, 5).map((lead) => {
              const proj = state.projects.find((p) => p.id === lead.projectId);
              const bottleneckStatus = lead.qualification.bottleneckGroup
                ? lead.qualification.groups[lead.qualification.bottleneckGroup]
                : 'verde';
              return (
                <div
                  key={lead.id}
                  onClick={() => {
                    setSelectedLeadId(lead.id);
                    setRoute('leads');
                  }}
                  className="px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {lead.companyName}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs font-medium text-[#0F2744] whitespace-nowrap">
                        {lead.stage}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>{PATH_LABELS[lead.intent]}</span>
                      <span>·</span>
                      <span>{proj?.nome}</span>
                      <span>·</span>
                      <span className="font-mono text-[11px]">v{lead.funnelVersion}</span>
                      <span>·</span>
                      <span>{lead.salesPageId === 'pg_industria' ? 'Página A' : 'Página B'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-1 shrink-0">
                    <div className="text-xs font-medium text-slate-700">
                      Gargalo: {lead.qualification.bottleneckLabel}
                    </div>
                    <SemaphoreIndicator status={bottleneckStatus} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right: Upcoming Meetings + Milestone & Architecture */}
        <div className="lg:col-span-5 space-y-6">
          {/* Meetings */}
          <section className="bg-white border border-[#E2E8F0] rounded-lg">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#0F2744]">Próximas reuniões</h2>
              <button
                type="button"
                onClick={() => setRoute('meetings')}
                className="text-xs font-semibold text-[#0F2744] hover:underline"
              >
                Abrir agenda
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredMeetings.length === 0 ? (
                <div className="p-5 text-xs text-slate-500">Nenhuma reunião agendada neste recorte.</div>
              ) : (
                filteredMeetings.slice(0, 3).map((m) => (
                  <div key={m.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900">{m.companyName}</span>
                      <span className="text-xs font-mono text-[#0F2744] tabular-nums shrink-0">
                        {m.dateTime}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{m.title}</p>
                    <div className="text-[11px] text-slate-500 mt-1.5">
                      Participantes: {m.participants.map((p) => GESTOR_MAP[p]?.nome).join(' · ')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Architectural Overview & v0.3 Milestone */}
          <section className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#0F2744]">Arquitetura JJ LICITA e marco v0.3</h2>
              <span className="text-xs font-mono font-semibold text-[#15803D] tabular-nums">
                {validatedProcuracoesCount}/3 procurações validadas
              </span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-100">
                <div>
                  <div className="font-mono font-semibold text-[#0F2744]">jjlicita.com.br</div>
                  <div className="text-slate-600">Site público · páginas de vendas com funil incorporável</div>
                </div>
                <button
                  type="button"
                  onClick={() => openVisitorMode('pg_industria', false)}
                  className="inline-flex items-center gap-1 text-[#15803D] font-semibold hover:underline shrink-0"
                >
                  <span>Abrir</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-100">
                <div>
                  <div className="font-mono font-semibold text-[#0F2744]">painel.jjlicita.com.br</div>
                  <div className="text-slate-600">Plugin central dos 3 gestores · submissões, CRM e Radar</div>
                </div>
                <span className="text-[#15803D] font-medium shrink-0">Ativo nesta prévia</span>
              </div>
              <div className="flex items-start justify-between gap-3 py-1.5">
                <div>
                  <div className="font-mono font-semibold text-slate-700">clientes.jjlicita.com.br</div>
                  <div className="text-slate-500">Portal autenticado do cliente (entrega posterior ao marco das 3 procurações)</div>
                </div>
                <button
                  type="button"
                  onClick={() => setRoute('integrations')}
                  className="text-[#0F2744] font-medium hover:underline shrink-0"
                >
                  Roteiro
                </button>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Gate de conflito ativo: 2 órgãos bloqueados no Radar</span>
              </span>
              <button
                type="button"
                onClick={() => setRoute('radar')}
                className="font-semibold text-[#0F2744] hover:underline"
              >
                Inspecionar
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
