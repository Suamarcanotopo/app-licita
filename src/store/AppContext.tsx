import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AcceptanceTestState,
  AcompanhamentoEdital,
  CanvasDocument,
  CanvasDocumentStatus,
  CanvasDocumentType,
  CanvasVersionSnapshot,
  ClientCompany,
  DemoState,
  DocumentBrandIdentity,
  DocumentStatus,
  DocumentTemplate,
  Funnel,
  FunnelPathId,
  FunnelStep,
  GestorId,
  Lead,
  LeadStage,
  MenuRoute,
  PorteEmpresa,
  ProcuracaoStatus,
  QualificationRuleConfig,
  SavedRadarFilter,
} from '../types/domain';
import { createInitialDemoState, GESTOR_MAP } from '../data/seedData';
import { evaluateQualification, pruneAnswersForActivePath } from '../engine/qualification';
import {
  applyTemplateClauses,
  buildBaseFieldsFromLead,
  evaluateLegalCheckForProcuracao,
  resolveVariablesText,
} from '../engine/documentCanvas';

const STORAGE_KEY = 'jj_licita_painel_gestao_v1';

export interface LeadsPresetFilter {
  noReturnOnly?: boolean;
  stage?: string;
  bottleneck?: string;
  procuracao?: string;
  salesPageId?: string;
}

interface SubmissionPayload {
  salesPageId: string;
  funnelId: string;
  useDraft?: boolean;
  answers: Record<string, string>;
  companyName: string;
  contactName: string;
  contactChannel: 'WhatsApp' | 'Ligação' | 'E-mail';
  contactValue: string;
  wantsFutureAlerts: boolean;
}

interface AppContextValue {
  state: DemoState;
  route: MenuRoute;
  setRoute: (r: MenuRoute) => void;
  viewMode: 'internal' | 'visitor';
  openVisitorMode: (salesPageId?: string, jumpToEdital?: boolean) => void;
  closeVisitorMode: () => void;
  visitorPageId: string;
  setVisitorPageId: (id: string) => void;
  visitorJumpEdital: boolean;
  setVisitorJumpEdital: (v: boolean) => void;
  globalSearch: string;
  setGlobalSearch: (s: string) => void;
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  selectedFunnelId: string;
  setSelectedFunnelId: (id: string) => void;
  leadsFilterPreset: LeadsPresetFilter;
  setLeadsFilterPreset: (f: LeadsPresetFilter) => void;
  tasksOverdueOnly: boolean;
  setTasksOverdueOnly: (v: boolean) => void;
  docsPendingOnly: boolean;
  setDocsPendingOnly: (v: boolean) => void;
  radarUrgentOnly: boolean;
  setRadarUrgentOnly: (v: boolean) => void;
  toast: string | null;
  showToast: (msg: string) => void;

  // Actions
  setActiveProjectId: (id: string) => void;
  restoreDemoData: () => void;
  markAcceptance: (key: keyof AcceptanceTestState, value?: boolean) => void;

  // Funnel actions
  createFunnel: (name: string, description: string) => string;
  duplicateFunnel: (funnelId: string) => string;
  updateFunnelDraftSteps: (funnelId: string, steps: FunnelStep[]) => void;
  updateFunnelDraftQualConfig: (funnelId: string, config: QualificationRuleConfig) => void;
  publishFunnelDraft: (funnelId: string, summary: string) => void;
  resetFunnelDraft: (funnelId: string) => void;

  // Visitor conversion
  submitPublicConversion: (payload: SubmissionPayload) => { lead: Lead; deduplicated: boolean };

  // CRM actions
  updateLeadStage: (leadId: string, stage: LeadStage, closedReason?: string) => void;
  reopenLead: (leadId: string, reason: string) => void;
  simulateLeadReply: (leadId: string, note: string) => void;
  scheduleMeeting: (params: {
    leadId: string;
    title: string;
    agenda: string;
    dateIso: string;
    time: string;
    participants: GestorId[];
    durationMinutes: number;
  }) => void;
  updateLeadTriageMinutes: (leadId: string, minutes: number) => void;
  updateLeadDocumentStatus: (leadId: string, docId: string, status: DocumentStatus) => void;
  addLeadDocument: (leadId: string, name: string, group: Lead['documents'][number]['group']) => void;
  updateProcuracaoStatus: (leadId: string, status: ProcuracaoStatus, validUntil?: string) => void;
  updateClientProcuracaoStatus: (clientId: string, status: ProcuracaoStatus, validUntil?: string) => void;
  changeClientInterlocutor: (clientId: string, nome: string, cargo: string, contato: string, motivo: string) => void;

  // Task & Cadence actions
  toggleTaskDone: (taskId: string) => void;
  simulateCadenceNotification: (cadenceId: string, leadId?: string) => void;
  markNotificationRead: (id: string) => void;

  // Radar & Conflict Gate actions
  isOrgaoBlocked: (orgao: string) => { blocked: boolean; reason?: string; vinculoId?: string };
  saveRadarFilter: (filter: Omit<SavedRadarFilter, 'id'>) => void;
  deleteRadarFilter: (id: string) => void;
  sendEditalToTriage: (editalId: string) => void;
  linkEditalToClient: (params: {
    editalId: string;
    clientId: string;
    projectId: string;
    lote: string;
    responsavel: GestorId;
    motivoCompatibilidade: string;
    proximaAcao: string;
  }) => void;
  toggleLegalOpinionForAcompanhamento: (acompId: string, liberado: boolean) => void;

  // Document Canvas actions
  activeCanvasDocId: string | null;
  openDocumentCanvas: (docId: string) => void;
  closeDocumentCanvas: () => void;
  prepareDocumentFromLead: (leadId: string, action: CanvasDocumentType) => string;
  updateCanvasDocument: (docId: string, updater: (doc: CanvasDocument) => CanvasDocument) => void;
  saveCanvasDraft: (docId: string) => void;
  applyTemplateToCanvasDocument: (docId: string, templateId: string | null, saveRecoverableFirst: boolean) => void;
  restoreCanvasVersion: (docId: string, versionId: string) => void;
  sendCanvasToInternalReview: (docId: string) => void;
  approveCanvasInternalReview: (docId: string, approverName: string) => void;
  addCanvasComment: (docId: string, author: string, text: string) => void;
  confirmEmitCanvasDocument: (docId: string, params: { deliveryMessage: string; sendPurpose?: string }) => void;
  simulateSignProcuracaoDocument: (docId: string) => void;
  updateDocumentBrandStandard: (brand: DocumentBrandIdentity) => void;
  updateDocumentTemplate: (template: DocumentTemplate) => void;
  setDefaultTemplateId: (kind: 'procuracao' | 'minuta', templateId: string | null) => void;
  updateCompanyRegistryInfo: (leadId: string, companyName: string, cnpj: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function nowStr() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DemoState>(() => {
    const fresh = createInitialDemoState();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<DemoState>;
        if (parsed && Array.isArray(parsed.projects) && Array.isArray(parsed.funnels)) {
          return {
            ...fresh,
            ...parsed,
            documentBrandStandard: parsed.documentBrandStandard || fresh.documentBrandStandard,
            documentTemplates: Array.isArray(parsed.documentTemplates)
              ? parsed.documentTemplates
              : fresh.documentTemplates,
            defaultTemplateIds: parsed.defaultTemplateIds || fresh.defaultTemplateIds,
            canvasDocuments: Array.isArray(parsed.canvasDocuments)
              ? parsed.canvasDocuments
              : fresh.canvasDocuments,
          };
        }
      }
    } catch {
      // ignore storage errors
    }
    return fresh;
  });
  const [activeCanvasDocId, setActiveCanvasDocId] = useState<string | null>(null);

  const [route, setRoute] = useState<MenuRoute>('overview');
  const [viewMode, setViewMode] = useState<'internal' | 'visitor'>('internal');
  const [visitorPageId, setVisitorPageId] = useState<string>('pg_industria');
  const [visitorJumpEdital, setVisitorJumpEdital] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>('fun_principal');
  const [leadsFilterPreset, setLeadsFilterPreset] = useState<LeadsPresetFilter>({});
  const [tasksOverdueOnly, setTasksOverdueOnly] = useState<boolean>(false);
  const [docsPendingOnly, setDocsPendingOnly] = useState<boolean>(false);
  const [radarUrgentOnly, setRadarUrgentOnly] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota issues
    }
  }, [state]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 4200);
  };

  const appendAudit = (prev: DemoState, actor: string, module: string, action: string, detail: string) => [
    {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      at: nowStr(),
      actor,
      module,
      action,
      detail,
    },
    ...prev.auditLog,
  ];

  const openVisitorMode = (salesPageId?: string, jumpToEdital = false) => {
    if (salesPageId) setVisitorPageId(salesPageId);
    setVisitorJumpEdital(jumpToEdital);
    setViewMode('visitor');
  };

  const closeVisitorMode = () => {
    setViewMode('internal');
    setVisitorJumpEdital(false);
  };

  const setActiveProjectId = (id: string) => {
    setState((prev) => ({ ...prev, activeProjectId: id }));
  };

  const restoreDemoData = () => {
    const fresh = createInitialDemoState();
    setState(fresh);
    setSelectedLeadId(null);
    setSelectedClientId(null);
    setSelectedFunnelId('fun_principal');
    setLeadsFilterPreset({});
    setTasksOverdueOnly(false);
    setDocsPendingOnly(false);
    setRadarUrgentOnly(false);
    setGlobalSearch('');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    showToast('Dados de demonstração restaurados para o estado inicial.');
  };

  const markAcceptance = (key: keyof AcceptanceTestState, value = true) => {
    setState((prev) => {
      if (prev.acceptance[key] === value) return prev;
      return {
        ...prev,
        acceptance: { ...prev.acceptance, [key]: value },
      };
    });
  };

  // --- FUNNEL ACTIONS ---
  const createFunnel = (name: string, description: string) => {
    const id = `fun_${Date.now()}`;
    const baseFunnel = state.funnels[0];
    const clonedSteps = structuredClone(baseFunnel.versions[0].steps);
    const clonedConfig = structuredClone(baseFunnel.versions[0].qualificationConfig);
    const newFunnel: Funnel = {
      id,
      name: name.trim() || 'Novo Funil Comercial',
      description: description.trim() || 'Funil personalizado criado no painel.',
      projectIds: ['proj_manutencao'],
      publishedVersion: '1.0',
      hasDraft: true,
      draft: {
        version: '1.1-rascunho',
        status: 'rascunho',
        createdAt: nowStr(),
        createdBy: 'marcio',
        summary: 'Rascunho inicial do novo funil.',
        steps: structuredClone(clonedSteps),
        qualificationConfig: structuredClone(clonedConfig),
      },
      versions: [
        {
          version: '1.0',
          status: 'publicada',
          createdAt: nowStr(),
          createdBy: 'marcio',
          summary: 'Versão base publicada.',
          steps: clonedSteps,
          qualificationConfig: clonedConfig,
        },
      ],
    };
    setState((prev) => ({
      ...prev,
      funnels: [...prev.funnels, newFunnel],
      auditLog: appendAudit(prev, 'Márcio', 'Funis', 'Funil criado', `Criado funil "${newFunnel.name}".`),
    }));
    setSelectedFunnelId(id);
    showToast(`Funil "${newFunnel.name}" criado.`);
    return id;
  };

  const duplicateFunnel = (funnelId: string) => {
    const orig = state.funnels.find((f) => f.id === funnelId);
    if (!orig) return funnelId;
    const id = `fun_${Date.now()}`;
    const copy: Funnel = {
      ...structuredClone(orig),
      id,
      name: `${orig.name} (Cópia)`,
    };
    setState((prev) => ({
      ...prev,
      funnels: [...prev.funnels, copy],
      auditLog: appendAudit(prev, 'Márcio', 'Funis', 'Funil duplicado', `Duplicado a partir de "${orig.name}".`),
    }));
    setSelectedFunnelId(id);
    showToast(`Funil duplicado como "${copy.name}".`);
    return id;
  };

  const updateFunnelDraftSteps = (funnelId: string, steps: FunnelStep[]) => {
    setState((prev) => ({
      ...prev,
      funnels: prev.funnels.map((f) =>
        f.id === funnelId
          ? {
              ...f,
              hasDraft: true,
              draft: {
                ...f.draft,
                createdAt: nowStr(),
                steps,
              },
            }
          : f
      ),
      acceptance: { ...prev.acceptance, t1DraftEditedAndCompared: true },
    }));
  };

  const updateFunnelDraftQualConfig = (funnelId: string, config: QualificationRuleConfig) => {
    setState((prev) => ({
      ...prev,
      funnels: prev.funnels.map((f) =>
        f.id === funnelId
          ? {
              ...f,
              hasDraft: true,
              draft: {
                ...f.draft,
                createdAt: nowStr(),
                qualificationConfig: config,
              },
            }
          : f
      ),
    }));
    showToast('Regras de qualificação salvas no rascunho da versão.');
  };

  const publishFunnelDraft = (funnelId: string, summary: string) => {
    setState((prev) => {
      const target = prev.funnels.find((f) => f.id === funnelId);
      if (!target) return prev;
      const majorMinor = target.publishedVersion.split('.').map(Number);
      const nextVer = `${majorMinor[0] || 1}.${(majorMinor[1] || 0) + 1}`;
      const nextDraftVer = `${majorMinor[0] || 1}.${(majorMinor[1] || 0) + 2}-rascunho`;

      const newPublished = {
        version: nextVer,
        status: 'publicada' as const,
        createdAt: nowStr(),
        createdBy: 'marcio' as const,
        summary: summary.trim() || `Publicação da versão ${nextVer}`,
        steps: structuredClone(target.draft.steps),
        qualificationConfig: structuredClone(target.draft.qualificationConfig),
      };

      const archivedVersions = target.versions.map((v) =>
        v.status === 'publicada' ? { ...v, status: 'arquivada' as const } : v
      );

      return {
        ...prev,
        funnels: prev.funnels.map((f) =>
          f.id === funnelId
            ? {
                ...f,
                publishedVersion: nextVer,
                hasDraft: false,
                versions: [newPublished, ...archivedVersions],
                draft: {
                  version: nextDraftVer,
                  status: 'rascunho',
                  createdAt: nowStr(),
                  createdBy: 'marcio',
                  summary: `Rascunho aberto a partir da v${nextVer}.`,
                  steps: structuredClone(newPublished.steps),
                  qualificationConfig: structuredClone(newPublished.qualificationConfig),
                },
              }
            : f
        ),
        auditLog: appendAudit(
          prev,
          'Márcio',
          'Funis',
          `Versão ${nextVer} publicada`,
          `Funil "${target.name}" publicado. Submissões anteriores mantêm a versão anterior intacta.`
        ),
      };
    });
    showToast('Nova versão publicada! Submissões anteriores preservam perguntas, respostas e regras antigas.');
  };

  const resetFunnelDraft = (funnelId: string) => {
    setState((prev) => ({
      ...prev,
      funnels: prev.funnels.map((f) => {
        if (f.id !== funnelId) return f;
        const pub = f.versions.find((v) => v.status === 'publicada') || f.versions[0];
        return {
          ...f,
          hasDraft: false,
          draft: {
            ...f.draft,
            createdAt: nowStr(),
            steps: structuredClone(pub.steps),
            qualificationConfig: structuredClone(pub.qualificationConfig),
          },
        };
      }),
    }));
    showToast('Rascunho redefinido para coincidir com a versão publicada.');
  };

  // --- VISITOR CONVERSION (DEDUPLICATED!) ---
  const submitPublicConversion = (payload: SubmissionPayload): { lead: Lead; deduplicated: boolean } => {
    const page = state.salesPages.find((p) => p.id === payload.salesPageId) || state.salesPages[0];
    const funnel = state.funnels.find((f) => f.id === payload.funnelId) || state.funnels[0];
    const versionSnap = payload.useDraft
      ? funnel.draft
      : funnel.versions.find((v) => v.status === 'publicada') || funnel.versions[0];

    const intent = (payload.answers.intencao as FunnelPathId) || 'avaliar_empresa';
    const cleanedAnswers = pruneAnswersForActivePath(versionSnap.steps, payload.answers, intent);
    const qual = evaluateQualification(versionSnap.steps, cleanedAnswers, versionSnap.qualificationConfig);

    const normalizedContact = payload.contactValue.trim().toLowerCase();
    const dedupeKey = `${page.id}|${funnel.id}|${normalizedContact}`;

    const stepsSnapshot = versionSnap.steps
      .filter((s) => s.type !== 'result' && (s.pathScope === 'common' || s.pathScope === intent))
      .filter((s) => cleanedAnswers[s.fieldKey])
      .map((s) => {
        const val = cleanedAnswers[s.fieldKey];
        const opt = s.options?.find((o) => o.value === val);
        return {
          stepId: s.id,
          title: s.title,
          answerLabel: opt ? opt.label : val,
        };
      });

    const existing = state.leads.find((l) => l.dedupeKey === dedupeKey);
    const deadlineIso =
      intent === 'ja_tenho_edital'
        ? cleanedAnswers.edital_prazo?.includes('7 dias')
          ? '2026-11-27'
          : '2026-12-05'
        : undefined;

    if (existing) {
      const updatedLead: Lead = {
        ...existing,
        companyName: payload.companyName.trim() || existing.companyName,
        contactName: payload.contactName.trim() || existing.contactName,
        contactChannel: payload.contactChannel,
        wantsFutureAlerts: payload.wantsFutureAlerts,
        funnelVersion: versionSnap.version,
        intent,
        porte: (cleanedAnswers.porte as PorteEmpresa) || existing.porte,
        offerSummary: cleanedAnswers.oferta || existing.offerSummary,
        territory: cleanedAnswers.territorio || existing.territory,
        editalCode: cleanedAnswers.edital_codigo || existing.editalCode,
        editalLot: cleanedAnswers.edital_lote || existing.editalLot,
        editalDeadline: deadlineIso || existing.editalDeadline,
        answersSnapshot: cleanedAnswers,
        stepsSnapshot,
        qualification: qual,
        history: [
          {
            id: `h_${Date.now()}`,
            at: nowStr(),
            actor: 'Sistema (Deduplicação)',
            description: `Reenvio identificado (${page.slug} · v${versionSnap.version}). Registro, notificação e tarefa de Márcio mantidos sem duplicidade.`,
            type: 'submission',
          },
          ...existing.history,
        ],
      };

      setState((prev) => ({
        ...prev,
        leads: prev.leads.map((l) => (l.id === existing.id ? updatedLead : l)),
      }));
      showToast('Submissão repetida detectada: o mesmo lead e tarefa única de Márcio foram preservados.');
      return { lead: updatedLead, deduplicated: true };
    }

    const newLeadId = `lead_${Date.now()}`;
    const cadenceMap: Record<FunnelPathId, string> = {
      ja_tenho_edital: 'cad_edital',
      delegar_participacao: 'cad_delegacao',
      avaliar_empresa: 'cad_pendencia',
      aprender_disputar: 'cad_aprendizado',
      encontrar_oportunidades: 'cad_oportunidades',
    };

    const newLead: Lead = {
      id: newLeadId,
      dedupeKey,
      companyName: payload.companyName.trim() || 'Empresa Visitante Demo Ltda',
      contactName: payload.contactName.trim() || 'Responsável Comercial',
      contactChannel: payload.contactChannel,
      contactValue: payload.contactValue.trim(),
      wantsFutureAlerts: payload.wantsFutureAlerts,
      projectId: page.projectId,
      funnelId: funnel.id,
      funnelVersion: versionSnap.version,
      salesPageId: page.id,
      salesPageUrl: page.url,
      campaign: page.campaignName,
      intent,
      porte: (cleanedAnswers.porte as PorteEmpresa) || 'Não sei',
      offerSummary: cleanedAnswers.oferta || 'Não informado',
      territory: cleanedAnswers.territorio || 'Não informado',
      editalCode: cleanedAnswers.edital_codigo,
      editalLot: cleanedAnswers.edital_lote,
      editalDeadline: deadlineIso,
      stage: 'Novo',
      ownerFirstContact: 'marcio',
      assignedPartners: [],
      nextReturnAt: '2026-11-24',
      noReturnYet: true,
      answersSnapshot: cleanedAnswers,
      stepsSnapshot,
      qualification: qual,
      procuracaoStatus: 'Não iniciada',
      cadenceId: cadenceMap[intent],
      cadencePaused: false,
      documents:
        qual.bottleneckGroup === 'comprovacao_tecnica'
          ? [
              {
                id: `doc_${Date.now()}_1`,
                name: 'Atestado de Capacidade Técnica compatível',
                group: 'comprovacao_tecnica',
                status: 'Solicitado',
                updatedAt: '2026-11-23',
                note: 'Gargalo principal identificado na triagem inicial.',
              },
            ]
          : [
              {
                id: `doc_${Date.now()}_1`,
                name: 'Contrato Social + Cartão CNPJ + Certidões básicas',
                group: 'empresa_representacao',
                status: 'Solicitado',
                updatedAt: '2026-11-23',
              },
            ],
      history: [
        {
          id: `h_${Date.now()}`,
          at: nowStr(),
          actor: 'Sistema',
          description: `Lead criado via ${page.title} (${page.campaignName}) · Funil v${versionSnap.version}. Gargalo: ${qual.bottleneckLabel}.`,
          type: 'submission',
        },
      ],
      createdAt: nowStr(),
    };

    const taskKey = `first_contact|${dedupeKey}`;
    const notifKey = `notif|${dedupeKey}`;

    setState((prev) => {
      const allLeads = [newLead, ...prev.leads];
      // Check if simulated conversions exist from both sales pages
      const convertedPages = new Set(
        allLeads.filter((l) => l.createdAt.startsWith('2026-11-23') || l.id.startsWith('lead_17')).map((l) => l.salesPageId)
      );
      const bothPagesConverted =
        prev.acceptance.t3TwoSalesPagesConverted ||
        (convertedPages.has('pg_industria') && convertedPages.has('pg_edital_urgente'));

      const techBottleneckWithThreeGreens =
        prev.acceptance.t4TechBottleneckWithThreeGreens ||
        (qual.availableCount === 3 && qual.bottleneckGroup === 'comprovacao_tecnica');

      const hasTask = prev.tasks.some((t) => t.dedupeKey === taskKey);
      const hasNotif = prev.notifications.some((n) => n.dedupeKey === notifKey);

      return {
        ...prev,
        leads: allLeads,
        tasks: hasTask
          ? prev.tasks
          : [
              {
                id: `task_${Date.now()}`,
                title: `Primeira abordagem: ${newLead.companyName} (${qual.marcioResumeTopic})`,
                owner: 'marcio',
                projectId: page.projectId,
                leadId: newLeadId,
                dueDate: '2026-11-24',
                overdue: false,
                done: false,
                category: 'Primeira abordagem',
                dedupeKey: taskKey,
              },
              ...prev.tasks,
            ],
        notifications: hasNotif
          ? prev.notifications
          : [
              {
                id: `not_${Date.now()}`,
                at: nowStr(),
                recipient: 'marcio',
                title: `Nova conversão · ${page.slug}`,
                message: `${newLead.companyName} (${newLead.contactName}) via ${page.campaignName} · v${versionSnap.version}. Retomar: ${qual.marcioResumeTopic}.`,
                read: false,
                leadId: newLeadId,
                dedupeKey: notifKey,
              },
              ...prev.notifications,
            ],
        auditLog: appendAudit(
          prev,
          'Visitante (Demo)',
          'Conversão / Leads',
          'Lead criado via página incorporada',
          `${newLead.companyName} via ${page.url} (Funil v${versionSnap.version}). Tarefa única criada para Márcio.`
        ),
        acceptance: {
          ...prev.acceptance,
          t3TwoSalesPagesConverted: bothPagesConverted,
          t4TechBottleneckWithThreeGreens: techBottleneckWithThreeGreens,
        },
      };
    });

    showToast('Lead criado no CRM com tarefa e notificação única para Márcio.');
    return { lead: newLead, deduplicated: false };
  };

  // --- CRM ACTIONS ---
  const updateLeadStage = (leadId: string, stage: LeadStage, closedReason?: string) => {
    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((l) => {
        if (l.id !== leadId) return l;
        return {
          ...l,
          stage,
          noReturnYet: stage === 'Novo' ? l.noReturnYet : false,
          closedReason: stage === 'Encerrado' ? closedReason || 'Encerrado pelo gestor' : undefined,
          cadencePaused: stage === 'Encerrado' || stage === 'Cliente ativo' ? true : l.cadencePaused,
          history: [
            {
              id: `h_${Date.now()}`,
              at: nowStr(),
              actor: 'Márcio',
              description:
                stage === 'Encerrado'
                  ? `Lead encerrado. Motivo: ${closedReason || 'Não informado'}.`
                  : `Etapa atualizada para "${stage}".`,
              type: 'stage',
            },
            ...l.history,
          ],
        };
      }),
      auditLog: appendAudit(prev, 'Márcio', 'CRM / Leads', 'Mudança de etapa', `Lead ${leadId} → ${stage}`),
    }));
  };

  const reopenLead = (leadId: string, reason: string) => {
    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((l) => {
        if (l.id !== leadId) return l;
        return {
          ...l,
          stage: 'Em contato',
          closedReason: undefined,
          cadencePaused: false,
          history: [
            {
              id: `h_${Date.now()}`,
              at: nowStr(),
              actor: 'Márcio',
              description: `Lead reaberto para "Em contato". Motivo: ${reason || 'Retomada comercial'}.`,
              type: 'stage',
            },
            ...l.history,
          ],
        };
      }),
      auditLog: appendAudit(prev, 'Márcio', 'CRM / Leads', 'Lead reaberto', `Lead ${leadId} reaberto: ${reason}`),
    }));
    showToast('Lead reaberto com histórico registrado.');
  };

  const simulateLeadReply = (leadId: string, note: string) => {
    setState((prev) => {
      const target = prev.leads.find((l) => l.id === leadId);
      if (!target) return prev;
      return {
        ...prev,
        leads: prev.leads.map((l) =>
          l.id === leadId
            ? {
                ...l,
                stage: l.stage === 'Novo' || l.stage === 'Em contato' ? 'Respondeu' : l.stage,
                noReturnYet: false,
                cadencePaused: true,
                cadencePauseReason: `Resposta do lead registrada: "${note}" — próximo lembrete pausado automaticamente.`,
                history: [
                  {
                    id: `h_${Date.now()}`,
                    at: nowStr(),
                    actor: target.contactName,
                    description: `Lead respondeu (${target.contactChannel}): "${note}". Próximo lembrete da cadência foi pausado.`,
                    type: 'cadence',
                  },
                  ...l.history,
                ],
              }
            : l
        ),
        auditLog: appendAudit(
          prev,
          'Sistema (Cadência)',
          'Cadências',
          'Cadência pausada por resposta',
          `${target.companyName} respondeu; próximo lembrete comercial pausado.`
        ),
        acceptance: { ...prev.acceptance, t5LeadReplyPausedCadence: true },
      };
    });
    showToast('Resposta do lead registrada! Próximo lembrete da cadência foi pausado.');
  };

  const scheduleMeeting = (params: {
    leadId: string;
    title: string;
    agenda: string;
    dateIso: string;
    time: string;
    participants: GestorId[];
    durationMinutes: number;
  }) => {
    const lead = state.leads.find((l) => l.id === params.leadId);
    if (!lead) return;
    // Ensure Márcio is included as first contact owner + any selected partners
    const uniqueParticipants = Array.from(new Set<GestorId>(['marcio', ...params.participants]));
    const formattedDate = params.dateIso.split('-').reverse().join('/') + ' · ' + params.time;
    const partnersAdded = uniqueParticipants.filter((p) => p !== 'marcio');

    setState((prev) => ({
      ...prev,
      meetings: [
        {
          id: `meet_${Date.now()}`,
          leadId: lead.id,
          companyName: lead.companyName,
          projectId: lead.projectId,
          title: params.title.trim() || `Reunião comercial e jurídica · ${lead.companyName}`,
          agenda: params.agenda.trim() || 'Revisão documental, escopo e próximos passos.',
          dateTime: formattedDate,
          dateIso: params.dateIso,
          participants: uniqueParticipants,
          status: 'Agendada',
          durationMinutes: params.durationMinutes,
        },
        ...prev.meetings,
      ],
      leads: prev.leads.map((l) =>
        l.id === lead.id
          ? {
              ...l,
              stage: 'Reunião agendada',
              noReturnYet: false,
              assignedPartners: Array.from(new Set([...l.assignedPartners, ...partnersAdded])),
              cadencePaused: true,
              cadencePauseReason: 'Reunião agendada cancelou lembretes comerciais automáticos.',
              nextReturnAt: params.dateIso,
              history: [
                {
                  id: `h_${Date.now()}`,
                  at: nowStr(),
                  actor: 'Márcio',
                  description: `Reunião agendada para ${formattedDate} com ${uniqueParticipants
                    .map((id) => GESTOR_MAP[id]?.nome)
                    .join(', ')}. Lembretes comerciais cancelados.`,
                  type: 'meeting',
                },
                ...l.history,
              ],
            }
          : l
      ),
      auditLog: appendAudit(
        prev,
        'Márcio',
        'Reuniões',
        'Reunião agendada com sócios',
        `${lead.companyName} em ${formattedDate} · Participantes: ${uniqueParticipants.map((id) => GESTOR_MAP[id]?.nome).join(', ')}.`
      ),
      acceptance: {
        ...prev.acceptance,
        t6MeetingScheduledWithPartners: prev.acceptance.t6MeetingScheduledWithPartners || partnersAdded.length > 0,
      },
    }));
    showToast('Reunião adicionada à agenda e lembretes comerciais cancelados.');
  };

  const updateLeadTriageMinutes = (leadId: string, minutes: number) => {
    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((l) =>
        l.id === leadId
          ? {
              ...l,
              triageMinutesActual: minutes,
              history: [
                {
                  id: `h_${Date.now()}`,
                  at: nowStr(),
                  actor: 'José Ribamar',
                  description: `Tempo efetivo de triagem do edital registrado: ${minutes} min (referência inicial: 15 min).`,
                  type: 'legal',
                },
                ...l.history,
              ],
            }
          : l
      ),
    }));
    showToast(`Minutos efetivos de triagem atualizados (${minutes} min).`);
  };

  const updateLeadDocumentStatus = (leadId: string, docId: string, status: DocumentStatus) => {
    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((l) => {
        if (l.id !== leadId) return l;
        const targetDoc = l.documents.find((d) => d.id === docId);
        return {
          ...l,
          documents: l.documents.map((d) =>
            d.id === docId ? { ...d, status, updatedAt: '2026-11-23' } : d
          ),
          history: [
            {
              id: `h_${Date.now()}`,
              at: nowStr(),
              actor: 'Márcio',
              description:
                status === 'Recebido'
                  ? `Documento "${targetDoc?.name}" marcado como Recebido. Lembrete automático deste item cancelado.`
                  : `Documento "${targetDoc?.name}" atualizado para "${status}".`,
              type: 'document',
            },
            ...l.history,
          ],
        };
      }),
    }));
    if (status === 'Recebido') {
      showToast('Documento recebido! Lembrete específico deste item foi cancelado na cadência.');
    }
  };

  const addLeadDocument = (leadId: string, name: string, group: Lead['documents'][number]['group']) => {
    if (!name.trim()) return;
    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((l) =>
        l.id === leadId
          ? {
              ...l,
              stage: l.stage === 'Novo' || l.stage === 'Em contato' || l.stage === 'Respondeu' ? 'Documentos solicitados' : l.stage,
              documents: [
                ...l.documents,
                {
                  id: `doc_${Date.now()}`,
                  name: name.trim(),
                  group,
                  status: 'Solicitado',
                  updatedAt: '2026-11-23',
                },
              ],
              history: [
                {
                  id: `h_${Date.now()}`,
                  at: nowStr(),
                  actor: 'Márcio',
                  description: `Documento solicitado: "${name.trim()}".`,
                  type: 'document',
                },
                ...l.history,
              ],
            }
          : l
      ),
    }));
  };

  const updateProcuracaoStatus = (leadId: string, status: ProcuracaoStatus, validUntil = '2027-11-23') => {
    setState((prev) => {
      const lead = prev.leads.find((l) => l.id === leadId);
      if (!lead) return prev;

      let clients = [...prev.clients];
      let clientId = lead.clientId;
      let nextStage: LeadStage = lead.stage;
      let openedOps = prev.acceptance.t9ProcuracaoValidatedOpenedOps;

      if (status === 'Assinada e validada') {
        nextStage = 'Cliente ativo';
        openedOps = true;
        if (!clientId) {
          clientId = `cli_${Date.now()}`;
          const newClient: ClientCompany = {
            id: clientId,
            leadId: lead.id,
            razaoSocial: lead.companyName,
            cnpj: lead.cnpj || '38.912.440/0001-95',
            porte: lead.porte,
            projectId: lead.projectId,
            uf: lead.projectId === 'proj_veiculos' ? 'AL' : lead.projectId === 'proj_equipamentos' ? 'SP' : 'PR',
            municipio: lead.projectId === 'proj_veiculos' ? 'Maceió' : lead.projectId === 'proj_equipamentos' ? 'Campinas' : 'Curitiba',
            interlocutorAtual: lead.contactName,
            interlocutorCargo: 'Responsável Comercial',
            interlocutorContato: `${lead.contactChannel}: ${lead.contactValue}`,
            historicoInterlocutores: [],
            procuracaoStatus: 'Assinada e validada',
            procuracaoValidUntil: validUntil,
            operacaoAtiva: true,
            responsavelComercial: 'marcio',
            responsavelJuridico: lead.assignedPartners[0] || 'ribamar',
          };
          clients = [newClient, ...clients];
        } else {
          clients = clients.map((c) =>
            c.id === clientId
              ? { ...c, procuracaoStatus: 'Assinada e validada', procuracaoValidUntil: validUntil, operacaoAtiva: true }
              : c
          );
        }
      } else if (status === 'Pendente de assinatura') {
        nextStage = 'Procuração pendente';
      } else if (status === 'Vencida' || status === 'Revogada') {
        if (clientId) {
          clients = clients.map((c) =>
            c.id === clientId ? { ...c, procuracaoStatus: status, operacaoAtiva: false } : c
          );
        }
      }

      return {
        ...prev,
        clients,
        leads: prev.leads.map((l) =>
          l.id === leadId
            ? {
                ...l,
                procuracaoStatus: status,
                procuracaoValidUntil: status === 'Assinada e validada' ? validUntil : l.procuracaoValidUntil,
                stage: nextStage,
                clientId,
                cadencePaused: status === 'Assinada e validada' ? true : l.cadencePaused,
                history: [
                  {
                    id: `h_${Date.now()}`,
                    at: nowStr(),
                    actor: 'José Ribamar',
                    description:
                      status === 'Assinada e validada'
                        ? `Procuração assinada e validada (vigência até ${validUntil}). Operação do cliente ativada.`
                        : status === 'Vencida' || status === 'Revogada'
                        ? `Procuração marcada como ${status}. Novas ações de representação interrompidas.`
                        : `Status da procuração alterado para "${status}".`,
                    type: 'procuracao',
                  },
                  ...l.history,
                ],
              }
            : l
        ),
        auditLog: appendAudit(
          prev,
          'José Ribamar',
          'Procurações',
          `Procuração: ${status}`,
          `${lead.companyName} — ${status === 'Assinada e validada' ? 'Ficha operacional de cliente aberta.' : 'Ações de representação atualizadas.'}`
        ),
        acceptance: { ...prev.acceptance, t9ProcuracaoValidatedOpenedOps: openedOps },
      };
    });

    if (status === 'Assinada e validada') {
      showToast('Procuração validada! Ficha operacional do cliente ativada em Clientes.');
    } else if (status === 'Vencida' || status === 'Revogada') {
      showToast(`Procuração ${status.toLowerCase()}: novas ações de representação foram interrompidas.`);
    }
  };

  const updateClientProcuracaoStatus = (clientId: string, status: ProcuracaoStatus, validUntil = '2027-11-23') => {
    setState((prev) => {
      const cli = prev.clients.find((c) => c.id === clientId);
      if (!cli) return prev;
      const operacaoAtiva = status === 'Assinada e validada';
      return {
        ...prev,
        clients: prev.clients.map((c) =>
          c.id === clientId
            ? {
                ...c,
                procuracaoStatus: status,
                procuracaoValidUntil: operacaoAtiva ? validUntil : c.procuracaoValidUntil,
                operacaoAtiva,
              }
            : c
        ),
        leads: cli.leadId
          ? prev.leads.map((l) =>
              l.id === cli.leadId ? { ...l, procuracaoStatus: status, stage: operacaoAtiva ? 'Cliente ativo' : l.stage } : l
            )
          : prev.leads,
        auditLog: appendAudit(
          prev,
          'José Ribamar',
          'Clientes / Procurações',
          `Procuração ${status}`,
          `${cli.razaoSocial}: operação ${operacaoAtiva ? 'liberada' : 'interrompida'}.`
        ),
      };
    });
    showToast(
      status === 'Assinada e validada'
        ? 'Procuração revalidada e operação de representação reativada.'
        : `Procuração marcada como ${status}. Ações de representação interrompidas.`
    );
  };

  const changeClientInterlocutor = (
    clientId: string,
    nome: string,
    cargo: string,
    contato: string,
    motivo: string
  ) => {
    if (!nome.trim()) return;
    setState((prev) => ({
      ...prev,
      clients: prev.clients.map((c) => {
        if (c.id !== clientId) return c;
        return {
          ...c,
          historicoInterlocutores: [
            {
              nome: c.interlocutorAtual,
              periodo: `Até 23/11/2026`,
              motivo: motivo.trim() || 'Troca de ponto focal comercial; vínculo mantido na empresa.',
            },
            ...c.historicoInterlocutores,
          ],
          interlocutorAtual: nome.trim(),
          interlocutorCargo: cargo.trim() || 'Novo Interlocutor',
          interlocutorContato: contato.trim() || c.interlocutorContato,
        };
      }),
      auditLog: appendAudit(
        prev,
        'Márcio',
        'Clientes',
        'Interlocutor atualizado',
        `Novo interlocutor "${nome.trim()}" registrado preservando o vínculo da empresa.`
      ),
    }));
    showToast('Interlocutor atualizado mantendo todo o histórico e vínculo da empresa.');
  };

  const toggleTaskDone = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
    }));
  };

  const simulateCadenceNotification = (cadenceId: string, leadId?: string) => {
    const cad = state.cadences.find((c) => c.id === cadenceId);
    const lead = leadId ? state.leads.find((l) => l.id === leadId) : state.leads[0];
    if (!cad) return;
    setState((prev) => ({
      ...prev,
      notifications: [
        {
          id: `not_sim_${Date.now()}`,
          at: nowStr(),
          recipient: cad.owner,
          title: `Simulação interna · ${cad.routeLabel}`,
          message: `Lembrete simulado para ${lead?.companyName || 'Lead'} (nenhum envio externo realizado).`,
          read: false,
          leadId: lead?.id,
        },
        ...prev.notifications,
      ],
    }));
    showToast('Notificação interna simulada (nenhuma mensagem enviada externamente).');
  };

  const markNotificationRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  // --- RADAR & CONFLICT GATE v0.3 ---
  const isOrgaoBlocked = (orgao: string) => {
    const norm = orgao.trim().toLowerCase();
    const match = state.vinculosSocios.find(
      (v) => v.bloqueiaRadar && v.orgao.trim().toLowerCase() === norm
    );
    if (match) {
      return {
        blocked: true,
        reason: `${match.situacaoJuridica} (${GESTOR_MAP[match.socio]?.nome} — ${match.natureza})`,
        vinculoId: match.id,
      };
    }
    return { blocked: false };
  };

  const saveRadarFilter = (filter: Omit<SavedRadarFilter, 'id'>) => {
    const newFilter: SavedRadarFilter = { ...filter, id: `flt_${Date.now()}` };
    setState((prev) => ({
      ...prev,
      savedRadarFilters: [newFilter, ...prev.savedRadarFilters],
      auditLog: appendAudit(prev, 'Márcio', 'Radar de Editais', 'Filtro salvo por nicho', `Filtro "${filter.name}" salvo.`),
    }));
    showToast(`Filtro "${filter.name}" salvo para o nicho.`);
  };

  const deleteRadarFilter = (id: string) => {
    setState((prev) => ({
      ...prev,
      savedRadarFilters: prev.savedRadarFilters.filter((f) => f.id !== id),
    }));
  };

  const sendEditalToTriage = (editalId: string) => {
    setState((prev) => ({
      ...prev,
      editais: prev.editais.map((e) => (e.id === editalId ? { ...e, situacao: 'Em triagem' } : e)),
      auditLog: appendAudit(prev, 'Márcio', 'Radar de Editais', 'Encaminhado para triagem', `Edital ${editalId} movido para Triagem.`),
    }));
    showToast('Edital encaminhado para a fila de Triagem.');
  };

  const linkEditalToClient = (params: {
    editalId: string;
    clientId: string;
    projectId: string;
    lote: string;
    responsavel: GestorId;
    motivoCompatibilidade: string;
    proximaAcao: string;
  }) => {
    const edital = state.editais.find((e) => e.id === params.editalId);
    const client = state.clients.find((c) => c.id === params.clientId);
    if (!edital || !client) return;

    // Enforce conflict gate
    const gate = isOrgaoBlocked(edital.orgao);
    if (gate.blocked) {
      showToast('Bloqueado pelo Gate de Conflito (VínculoSócio).');
      return;
    }

    const newAcomp: AcompanhamentoEdital = {
      id: `acomp_${Date.now()}`,
      editalId: params.editalId,
      projectId: params.projectId,
      clientId: params.clientId,
      lote: params.lote.trim() || 'Lote Único',
      responsavel: params.responsavel,
      proximaAcao: params.proximaAcao.trim() || 'Conferir habilitação e aguardar parecer jurídico.',
      motivoCompatibilidade: params.motivoCompatibilidade.trim() || 'Compatibilidade de objeto e território validada no Radar.',
      status: 'Em análise',
      parecerJuridicoLiberado: false,
      propostaHabilitada: false,
    };

    setState((prev) => ({
      ...prev,
      acompanhamentos: [newAcomp, ...prev.acompanhamentos],
      proposals: [
        {
          id: `prop_${Date.now()}`,
          clientId: params.clientId,
          editalId: params.editalId,
          editalVersao: edital.versaoEdital,
          valorProposta: 'A definir após parecer',
          parecerJuridicoLiberado: false,
          status: 'Bloqueada (sem parecer jurídico)',
          updatedAt: nowStr(),
        },
        ...prev.proposals,
      ],
      auditLog: appendAudit(
        prev,
        'Márcio',
        'Radar / Acompanhamentos',
        'Edital vinculado a cliente',
        `${edital.codigo} (${edital.orgao}) vinculado a ${client.razaoSocial}. Andamento individual criado.`
      ),
      acceptance: { ...prev.acceptance, t7EditalFilteredAndLinkedToClient: true },
    }));
    showToast(`Edital ${edital.codigo} vinculado a ${client.razaoSocial} com andamento independente.`);
  };

  const toggleLegalOpinionForAcompanhamento = (acompId: string, liberado: boolean) => {
    setState((prev) => {
      const target = prev.acompanhamentos.find((a) => a.id === acompId);
      if (!target) return prev;
      const edital = prev.editais.find((e) => e.id === target.editalId);
      const client = prev.clients.find((c) => c.id === target.clientId);
      if (liberado && client && !client.operacaoAtiva) {
        return prev;
      }
      return {
        ...prev,
        acompanhamentos: prev.acompanhamentos.map((a) =>
          a.id === acompId
            ? {
                ...a,
                parecerJuridicoLiberado: liberado,
                parecerEditalVersao: liberado ? edital?.versaoEdital : undefined,
                propostaHabilitada: liberado,
                status: liberado ? 'Parecer jurídico liberado' : 'Bloqueado por parecer',
              }
            : a
        ),
        proposals: prev.proposals.map((p) =>
          p.clientId === target.clientId && p.editalId === target.editalId
            ? {
                ...p,
                parecerJuridicoLiberado: liberado,
                status: liberado ? 'Habilitada para protocolo' : 'Bloqueada (sem parecer jurídico)',
                updatedAt: nowStr(),
              }
            : p
        ),
        auditLog: appendAudit(
          prev,
          'José Ribamar',
          'Jurídico / Triagem',
          liberado ? 'Parecer jurídico liberado' : 'Parecer jurídico suspenso',
          `${edital?.codigo} (${edital?.versaoEdital}) · ${client?.razaoSocial || 'Nicho'}`
        ),
      };
    });
    showToast(
      liberado
        ? 'Parecer jurídico liberado para esta empresa e versão do edital. Proposta habilitada!'
        : 'Parecer jurídico bloqueado. Proposta desabilitada.'
    );
  };

  // --- DOCUMENT CANVAS ACTIONS ---
  const openDocumentCanvas = (docId: string) => {
    setActiveCanvasDocId(docId);
  };

  const closeDocumentCanvas = () => {
    setActiveCanvasDocId(null);
  };

  const prepareDocumentFromLead = (leadId: string, action: CanvasDocumentType): string => {
    const lead = state.leads.find((l) => l.id === leadId);
    if (!lead) return '';
    const client = state.clients.find((c) => c.id === lead.clientId || c.leadId === lead.id);
    const linkedAcomp = client
      ? state.acompanhamentos.find((a) => a.clientId === client.id)
      : undefined;
    const linkedEdital =
      (linkedAcomp && state.editais.find((e) => e.id === linkedAcomp.editalId)) ||
      (lead.editalCode
        ? state.editais.find((e) => lead.editalCode?.includes(e.codigo))
        : undefined);

    let template: DocumentTemplate | undefined;
    let missingDefaultFor: 'procuracao' | 'minuta' | undefined;

    if (action === 'procuracao') {
      const defId = state.defaultTemplateIds.procuracao;
      template = defId ? state.documentTemplates.find((t) => t.id === defId) : undefined;
      if (!template) missingDefaultFor = 'procuracao';
    } else if (action === 'minuta') {
      const defId = state.defaultTemplateIds.minuta;
      template = defId ? state.documentTemplates.find((t) => t.id === defId) : undefined;
      if (!template) missingDefaultFor = 'minuta';
    }

    const fields = buildBaseFieldsFromLead({
      lead,
      client,
      linkedEdital,
      linkedAcomp,
      template,
    });

    const legalCheck = evaluateLegalCheckForProcuracao({
      fields,
      vinculosSocios: state.vinculosSocios,
      linkedAcomp,
    });

    const nextSeq = 101 + state.canvasDocuments.length;
    const newId = `DOC-2026-${nextSeq}`;
    const versionLabel = action === 'minuta' ? 'v1.0 · Minuta' : 'v1.0';

    const title =
      action === 'documento_livre'
        ? `Documento — ${lead.companyName}`
        : template
        ? template.defaultTitle
        : action === 'procuracao'
        ? 'Procuração (sem modelo padrão configurado)'
        : 'Minuta (sem modelo padrão configurado)';

    const body =
      action === 'documento_livre' || !template
        ? ''
        : resolveVariablesText(template.defaultBody, fields);

    const clauses =
      action === 'documento_livre' || !template ? [] : applyTemplateClauses(template, fields);

    const defaultMsg =
      action === 'minuta'
        ? `Olá ${lead.contactName}, encaminhamos a minuta (${newId} · ${versionLabel}) para leitura e comentários antes da emissão definitiva.`
        : action === 'procuracao'
        ? `Olá ${lead.contactName}, encaminhamos a procuração (${newId} · ${versionLabel}) para assinatura eletrônica.`
        : `Olá ${lead.contactName}, encaminhamos o documento ${newId} referente à ${lead.companyName}.`;

    const newDoc: CanvasDocument = {
      id: newId,
      leadId: lead.id,
      clientId: client?.id,
      companyName: client?.razaoSocial || lead.companyName,
      type: action,
      templateId: template?.id,
      templateName: template?.name,
      missingDefaultFor,
      currentVersion: versionLabel,
      status: 'Em preparação',
      internalReviewStatus: 'Não solicitada',
      legalCheckPassed: legalCheck.passed,
      legalCheckNote: legalCheck.note,
      title,
      brand: structuredClone(state.documentBrandStandard),
      body,
      clauses,
      fields,
      recipients: [
        {
          id: `rec_${Date.now()}`,
          name: client?.interlocutorAtual || lead.contactName,
          role: client?.interlocutorCargo || 'Responsável Comercial',
          contact: lead.contactValue,
          channel: lead.contactChannel === 'E-mail' ? 'E-mail' : 'WhatsApp',
        },
      ],
      comments: [],
      deliveryMessage: defaultMsg,
      inSentQueue: false, // Keeps sent queue strictly intact until confirmed inside Canvas!
      recoverableVersions: [],
      updatedAt: nowStr(),
      createdAt: nowStr(),
    };

    setState((prev) => ({
      ...prev,
      canvasDocuments: [newDoc, ...prev.canvasDocuments],
    }));

    setActiveCanvasDocId(newId);
    showToast(
      missingDefaultFor
        ? `Modelo padrão de ${missingDefaultFor} ausente — escolha outro modelo ou crie do zero no Canvas.`
        : `Preparação aberta no Canvas (${newId}). A fila de envios permanece intacta até confirmação.`
    );
    return newId;
  };

  const updateCanvasDocument = (docId: string, updater: (doc: CanvasDocument) => CanvasDocument) => {
    setState((prev) => ({
      ...prev,
      canvasDocuments: prev.canvasDocuments.map((d) => {
        if (d.id !== docId) return d;
        const updated = updater(d);
        const linkedAcomp = updated.clientId
          ? prev.acompanhamentos.find((a) => a.clientId === updated.clientId)
          : undefined;
        const legalCheck = evaluateLegalCheckForProcuracao({
          fields: updated.fields,
          vinculosSocios: prev.vinculosSocios,
          linkedAcomp,
        });
        return {
          ...updated,
          legalCheckPassed: legalCheck.passed,
          legalCheckNote: legalCheck.note,
          updatedAt: nowStr(),
        };
      }),
    }));
  };

  const saveCanvasDraft = (docId: string) => {
    setState((prev) => ({
      ...prev,
      canvasDocuments: prev.canvasDocuments.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: d.inSentQueue ? d.status : 'Rascunho salvo',
              updatedAt: nowStr(),
            }
          : d
      ),
      auditLog: appendAudit(
        prev,
        'Márcio',
        'Propostas e procurações',
        'Rascunho salvo no Canvas',
        `Documento ${docId} salvo como rascunho (sem entrar na fila de envios).`
      ),
    }));
    showToast('Rascunho salvo. A fila de envios continua intacta.');
  };

  const applyTemplateToCanvasDocument = (
    docId: string,
    templateId: string | null,
    saveRecoverableFirst: boolean
  ) => {
    setState((prev) => {
      const doc = prev.canvasDocuments.find((d) => d.id === docId);
      if (!doc) return prev;
      const tpl = templateId ? prev.documentTemplates.find((t) => t.id === templateId) : undefined;

      const recoverable: CanvasVersionSnapshot[] = [...doc.recoverableVersions];
      if (saveRecoverableFirst) {
        recoverable.unshift({
          versionId: `ver_${Date.now()}`,
          versionLabel: `${doc.currentVersion} (salva antes da troca)`,
          savedAt: nowStr(),
          savedBy: 'Márcio',
          reason: tpl ? `Backup antes de trocar para "${tpl.name}"` : 'Backup antes de começar do zero',
          isEmittedSnapshot: false,
          type: doc.type,
          title: doc.title,
          brand: structuredClone(doc.brand),
          body: doc.body,
          clauses: structuredClone(doc.clauses),
          fields: structuredClone(doc.fields),
          recipients: structuredClone(doc.recipients),
        });
      }

      const nextType: CanvasDocumentType = tpl ? tpl.type : 'documento_livre';
      const nextFields = structuredClone(doc.fields);

      if (tpl?.defaultPoderes) {
        nextFields.poderes = {
          value: tpl.defaultPoderes,
          origin: 'cadastro',
          registryValue: tpl.defaultPoderes,
        };
      }
      if (tpl?.defaultVigencia) {
        nextFields.vigencia = {
          value: tpl.defaultVigencia,
          origin: 'cadastro',
          registryValue: tpl.defaultVigencia,
        };
      }

      const nextVersionNum = recoverable.length + 1;
      const nextVersionLabel =
        nextType === 'minuta' ? `v1.${nextVersionNum} · Minuta` : `v1.${nextVersionNum}`;

      const linkedAcomp = doc.clientId
        ? prev.acompanhamentos.find((a) => a.clientId === doc.clientId)
        : undefined;
      const legalCheck = evaluateLegalCheckForProcuracao({
        fields: nextFields,
        vinculosSocios: prev.vinculosSocios,
        linkedAcomp,
      });

      const updatedDoc: CanvasDocument = {
        ...doc,
        type: nextType,
        templateId: tpl?.id,
        templateName: tpl?.name,
        missingDefaultFor: undefined,
        currentVersion: nextVersionLabel,
        // Re-evaluate review if document type changed
        internalReviewStatus:
          nextType !== doc.type ? 'Não solicitada' : doc.internalReviewStatus,
        status: 'Em preparação',
        legalCheckPassed: legalCheck.passed,
        legalCheckNote: legalCheck.note,
        title: tpl ? tpl.defaultTitle : `Documento — ${doc.companyName}`,
        body: tpl ? resolveVariablesText(tpl.defaultBody, nextFields) : '',
        clauses: tpl ? applyTemplateClauses(tpl, nextFields) : [],
        fields: nextFields,
        deliveryMessage:
          nextType === 'minuta'
            ? `Olá ${doc.fields.contatoNome?.value || 'cliente'}, segue a minuta (${doc.id} · ${nextVersionLabel}) para leitura e comentários.`
            : nextType === 'procuracao'
            ? `Olá ${doc.fields.contatoNome?.value || 'cliente'}, encaminhamos a procuração (${doc.id} · ${nextVersionLabel}) para assinatura.`
            : `Olá ${doc.fields.contatoNome?.value || 'cliente'}, encaminhamos o documento ${doc.id} (${nextVersionLabel}).`,
        recoverableVersions: recoverable,
        updatedAt: nowStr(),
      };

      return {
        ...prev,
        canvasDocuments: prev.canvasDocuments.map((d) => (d.id === docId ? updatedDoc : d)),
        auditLog: appendAudit(
          prev,
          'Márcio',
          'Canvas de Documentos',
          tpl ? 'Modelo trocado no Canvas' : 'Canvas reiniciado do zero',
          `${docId}: ${saveRecoverableFirst ? 'versão anterior salva como recuperável e ' : ''}atualizado para ${tpl ? tpl.name : 'folha em branco'}.`
        ),
      };
    });

    showToast(
      saveRecoverableFirst
        ? 'Trabalho anterior salvo como versão recuperável e novo modelo aplicado.'
        : 'Conteúdo atualizado mantendo vínculo com empresa e lead.'
    );
  };

  const restoreCanvasVersion = (docId: string, versionId: string) => {
    setState((prev) => {
      const doc = prev.canvasDocuments.find((d) => d.id === docId);
      if (!doc) return prev;
      const snap = doc.recoverableVersions.find((v) => v.versionId === versionId);
      if (!snap) return prev;

      const restored: CanvasDocument = {
        ...doc,
        type: snap.type,
        title: snap.title,
        brand: structuredClone(snap.brand),
        body: snap.body,
        clauses: structuredClone(snap.clauses),
        fields: structuredClone(snap.fields),
        recipients: structuredClone(snap.recipients),
        currentVersion: `${snap.versionLabel.replace(' (salva antes da troca)', '')} (restaurada)`,
        updatedAt: nowStr(),
      };

      return {
        ...prev,
        canvasDocuments: prev.canvasDocuments.map((d) => (d.id === docId ? restored : d)),
        auditLog: appendAudit(
          prev,
          'Márcio',
          'Canvas de Documentos',
          'Versão anterior recuperada',
          `${docId} restaurado a partir de "${snap.versionLabel}".`
        ),
      };
    });
    showToast('Versão anterior recuperada no Canvas.');
  };

  const sendCanvasToInternalReview = (docId: string) => {
    setState((prev) => ({
      ...prev,
      canvasDocuments: prev.canvasDocuments.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: 'Em revisão interna',
              internalReviewStatus: 'Em revisão interna',
              comments: [
                {
                  id: `cmt_${Date.now()}`,
                  at: nowStr(),
                  author: 'Márcio',
                  text: 'Documento enviado para revisão interna da equipe jurídica antes da emissão.',
                },
                ...d.comments,
              ],
              updatedAt: nowStr(),
            }
          : d
      ),
      auditLog: appendAudit(
        prev,
        'Márcio',
        'Canvas de Documentos',
        'Enviado para revisão interna',
        `${docId} submetido para conferência jurídica interna.`
      ),
    }));
    showToast('Documento enviado para revisão interna (a fila de envios externos segue intacta).');
  };

  const approveCanvasInternalReview = (docId: string, approverName: string) => {
    setState((prev) => ({
      ...prev,
      canvasDocuments: prev.canvasDocuments.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: d.inSentQueue ? d.status : 'Aprovado para emissão',
              internalReviewStatus: 'Aprovada',
              comments: [
                {
                  id: `cmt_${Date.now()}`,
                  at: nowStr(),
                  author: approverName,
                  text: 'Revisão interna aprovada. Liberado para emissão.',
                },
                ...d.comments,
              ],
              updatedAt: nowStr(),
            }
          : d
      ),
      auditLog: appendAudit(
        prev,
        approverName,
        'Canvas de Documentos',
        'Revisão interna aprovada',
        `${docId} aprovado por ${approverName}.`
      ),
    }));
    showToast(`Revisão interna aprovada por ${approverName}.`);
  };

  const addCanvasComment = (docId: string, author: string, text: string) => {
    if (!text.trim()) return;
    setState((prev) => ({
      ...prev,
      canvasDocuments: prev.canvasDocuments.map((d) =>
        d.id === docId
          ? {
              ...d,
              comments: [
                {
                  id: `cmt_${Date.now()}`,
                  at: nowStr(),
                  author,
                  text: text.trim(),
                },
                ...d.comments,
              ],
              updatedAt: nowStr(),
            }
          : d
      ),
    }));
  };

  const confirmEmitCanvasDocument = (
    docId: string,
    params: { deliveryMessage: string; sendPurpose?: string }
  ) => {
    setState((prev) => {
      const doc = prev.canvasDocuments.find((d) => d.id === docId);
      if (!doc) return prev;

      const emittedStatus: CanvasDocumentStatus =
        doc.type === 'minuta'
          ? 'Minuta enviada para comentários'
          : doc.type === 'procuracao'
          ? 'Procuração enviada para assinatura'
          : 'Documento enviado';

      const frozenSnapshot: CanvasVersionSnapshot = {
        versionId: `emitted_${Date.now()}`,
        versionLabel: doc.currentVersion,
        savedAt: nowStr(),
        savedBy: 'Márcio',
        reason:
          doc.type === 'minuta'
            ? 'Emissão confirmada: Minuta enviada para leitura e comentários'
            : doc.type === 'procuracao'
            ? 'Emissão confirmada: Procuração enviada para assinatura'
            : `Emissão confirmada: Documento enviado (${params.sendPurpose || 'Finalidade comercial'})`,
        isEmittedSnapshot: true,
        emittedStatus,
        emittedPurpose: params.sendPurpose,
        deliveryMessage: params.deliveryMessage,
        type: doc.type,
        title: doc.title,
        brand: structuredClone(doc.brand),
        body: doc.body,
        clauses: structuredClone(doc.clauses),
        fields: structuredClone(doc.fields),
        recipients: structuredClone(doc.recipients),
      };

      const historyMsg =
        doc.type === 'minuta'
          ? `[${doc.id} · ${doc.currentVersion}] Minuta enviada para comentários (${doc.recipients.map((r) => r.name).join(', ')}).`
          : doc.type === 'procuracao'
          ? `[${doc.id} · ${doc.currentVersion}] Procuração enviada para assinatura (${doc.recipients.map((r) => r.name).join(', ')}).`
          : `[${doc.id} · ${doc.currentVersion}] Documento enviado — finalidade: ${params.sendPurpose || 'Geral'}.`;

      return {
        ...prev,
        canvasDocuments: prev.canvasDocuments.map((d) =>
          d.id === docId
            ? {
                ...d,
                status: emittedStatus,
                sendPurpose: params.sendPurpose || d.sendPurpose,
                deliveryMessage: params.deliveryMessage,
                inSentQueue: true,
                emittedAt: nowStr(),
                emittedSnapshot: frozenSnapshot,
                recoverableVersions: [frozenSnapshot, ...d.recoverableVersions],
                updatedAt: nowStr(),
              }
            : d
        ),
        leads: prev.leads.map((l) =>
          l.id === doc.leadId
            ? {
                ...l,
                procuracaoStatus:
                  doc.type === 'procuracao' && l.procuracaoStatus === 'Não iniciada'
                    ? 'Pendente de assinatura'
                    : l.procuracaoStatus,
                stage:
                  doc.type === 'procuracao' &&
                  ['Novo', 'Em contato', 'Respondeu', 'Documentos solicitados', 'Reunião agendada', 'Proposta'].includes(l.stage)
                    ? 'Procuração pendente'
                    : l.stage,
                history: [
                  {
                    id: `h_doc_${Date.now()}`,
                    at: nowStr(),
                    actor: 'Márcio',
                    description: historyMsg,
                    type: doc.type === 'procuracao' ? 'procuracao' : 'document',
                  },
                  ...l.history,
                ],
              }
            : l
        ),
        auditLog: appendAudit(
          prev,
          'Márcio',
          'Propostas e procurações',
          emittedStatus,
          `${doc.id} (${doc.currentVersion}) · ${doc.companyName}. Snapshot imutável congelado.`
        ),
      };
    });

    showToast('Emissão simulada confirmada! Versão enviada preservada de forma imutável no histórico.');
  };

  const simulateSignProcuracaoDocument = (docId: string) => {
    const doc = state.canvasDocuments.find((d) => d.id === docId);
    if (!doc) return;
    setState((prev) => ({
      ...prev,
      canvasDocuments: prev.canvasDocuments.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: 'Procuração assinada (simulada)',
              updatedAt: nowStr(),
            }
          : d
      ),
    }));
    updateProcuracaoStatus(doc.leadId, 'Assinada e validada', '2027-11-23');
  };

  const updateDocumentBrandStandard = (brand: DocumentBrandIdentity) => {
    setState((prev) => ({
      ...prev,
      documentBrandStandard: structuredClone(brand),
      auditLog: appendAudit(
        prev,
        'Márcio',
        'Modelos e Identidade',
        'Padrão visual atualizado',
        `Logo/cabeçalho/rodapé padrão atualizado para "${brand.logoText}". Documentos já emitidos permanecem intactos.`
      ),
    }));
    showToast('Padrão visual vigente atualizado. Versões já emitidas continuam preservadas.');
  };

  const updateDocumentTemplate = (template: DocumentTemplate) => {
    setState((prev) => ({
      ...prev,
      documentTemplates: prev.documentTemplates.map((t) =>
        t.id === template.id ? { ...structuredClone(template), updatedAt: nowStr() } : t
      ),
      auditLog: appendAudit(
        prev,
        'José Ribamar',
        'Modelos e Identidade',
        'Modelo padrão atualizado',
        `Modelo "${template.name}" atualizado. Documentos já emitidos preservam sua versão congelada.`
      ),
    }));
    showToast('Modelo salvo. Documentos já enviados não sofrem alteração.');
  };

  const setDefaultTemplateId = (kind: 'procuracao' | 'minuta', templateId: string | null) => {
    setState((prev) => ({
      ...prev,
      defaultTemplateIds: {
        ...prev.defaultTemplateIds,
        [kind]: templateId,
      },
      auditLog: appendAudit(
        prev,
        'José Ribamar',
        'Modelos e Identidade',
        `Modelo padrão de ${kind} alterado`,
        templateId ? `Definido como ${templateId}.` : `Removido padrão de ${kind} (atalho abrirá seleção/do zero).`
      ),
    }));
    showToast(
      templateId
        ? `Modelo padrão de ${kind} atualizado.`
        : `Padrão de ${kind} removido — teste o atalho na ficha do lead para ver o fluxo de recuperação.`
    );
  };

  const updateCompanyRegistryInfo = (targetId: string, companyName: string, cnpj: string) => {
    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((l) =>
        l.id === targetId || l.clientId === targetId
          ? { ...l, companyName: companyName.trim() || l.companyName, cnpj: cnpj.trim() || l.cnpj }
          : l
      ),
      clients: prev.clients.map((c) =>
        c.leadId === targetId || c.id === targetId
          ? { ...c, razaoSocial: companyName.trim() || c.razaoSocial, cnpj: cnpj.trim() || c.cnpj }
          : c
      ),
      auditLog: appendAudit(
        prev,
        'Márcio',
        'Cadastro da empresa',
        'Dados cadastrais atualizados',
        `Empresa atualizada para "${companyName}" (CNPJ ${cnpj}). Documentos já emitidos preservam o snapshot original.`
      ),
    }));
    showToast('Cadastro da empresa atualizado. Versões já emitidas mantêm os dados originais.');
  };

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      route,
      setRoute,
      viewMode,
      openVisitorMode,
      closeVisitorMode,
      visitorPageId,
      setVisitorPageId,
      visitorJumpEdital,
      setVisitorJumpEdital,
      globalSearch,
      setGlobalSearch,
      selectedLeadId,
      setSelectedLeadId,
      selectedClientId,
      setSelectedClientId,
      selectedFunnelId,
      setSelectedFunnelId,
      leadsFilterPreset,
      setLeadsFilterPreset,
      tasksOverdueOnly,
      setTasksOverdueOnly,
      docsPendingOnly,
      setDocsPendingOnly,
      radarUrgentOnly,
      setRadarUrgentOnly,
      toast,
      showToast,
      setActiveProjectId,
      restoreDemoData,
      markAcceptance,
      createFunnel,
      duplicateFunnel,
      updateFunnelDraftSteps,
      updateFunnelDraftQualConfig,
      publishFunnelDraft,
      resetFunnelDraft,
      submitPublicConversion,
      updateLeadStage,
      reopenLead,
      simulateLeadReply,
      scheduleMeeting,
      updateLeadTriageMinutes,
      updateLeadDocumentStatus,
      addLeadDocument,
      updateProcuracaoStatus,
      updateClientProcuracaoStatus,
      changeClientInterlocutor,
      toggleTaskDone,
      simulateCadenceNotification,
      markNotificationRead,
      isOrgaoBlocked,
      saveRadarFilter,
      deleteRadarFilter,
      sendEditalToTriage,
      linkEditalToClient,
      toggleLegalOpinionForAcompanhamento,
      activeCanvasDocId,
      openDocumentCanvas,
      closeDocumentCanvas,
      prepareDocumentFromLead,
      updateCanvasDocument,
      saveCanvasDraft,
      applyTemplateToCanvasDocument,
      restoreCanvasVersion,
      sendCanvasToInternalReview,
      approveCanvasInternalReview,
      addCanvasComment,
      confirmEmitCanvasDocument,
      simulateSignProcuracaoDocument,
      updateDocumentBrandStandard,
      updateDocumentTemplate,
      setDefaultTemplateId,
      updateCompanyRegistryInfo,
    }),
    [
      state,
      route,
      viewMode,
      visitorPageId,
      visitorJumpEdital,
      globalSearch,
      selectedLeadId,
      selectedClientId,
      selectedFunnelId,
      leadsFilterPreset,
      tasksOverdueOnly,
      docsPendingOnly,
      radarUrgentOnly,
      toast,
      activeCanvasDocId,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider');
  return ctx;
}
