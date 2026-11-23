import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Copy,
  GitBranch,
  History,
  Play,
  Plus,
  RotateCcw,
  Send,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import {
  FunnelOption,
  FunnelPathId,
  FunnelStep,
  QualificationGroupKey,
  SemaphoreStatus,
  StepType,
} from '../../types/domain';
import {
  evaluateQualification,
  GROUP_DEFAULT_LABELS,
  PATH_LABELS,
  pruneAnswersForActivePath,
  traceFunnelPath,
  validateFunnelSteps,
} from '../../engine/qualification';
import { GESTOR_MAP } from '../../data/seedData';
import { SemaphoreIndicator } from '../../components/StatusLabel';

type BuilderTab = 'edit' | 'test' | 'history';

const PATH_SCOPES: { id: 'common' | FunnelPathId; label: string }[] = [
  { id: 'common', label: 'Comum (todas as rotas)' },
  { id: 'avaliar_empresa', label: '1. Avaliar minha empresa' },
  { id: 'ja_tenho_edital', label: '2. Já tenho um edital' },
  { id: 'delegar_participacao', label: '3. Delegar participação' },
  { id: 'aprender_disputar', label: '4. Aprender a disputar' },
  { id: 'encontrar_oportunidades', label: '5. Encontrar oportunidades' },
];

export const FunnelBuilderView: React.FC = () => {
  const {
    state,
    selectedFunnelId,
    setSelectedFunnelId,
    createFunnel,
    duplicateFunnel,
    updateFunnelDraftSteps,
    publishFunnelDraft,
    resetFunnelDraft,
    submitPublicConversion,
    setSelectedLeadId,
    setRoute,
    markAcceptance,
    showToast,
  } = useApp();

  const funnel = state.funnels.find((f) => f.id === selectedFunnelId) || state.funnels[0];
  const draftSteps = funnel.draft.steps;
  const publishedSnap =
    funnel.versions.find((v) => v.status === 'publicada') || funnel.versions[0];

  const [activeTab, setActiveTab] = useState<BuilderTab>('edit');
  const [selectedStepId, setSelectedStepId] = useState<string>(draftSteps[0]?.id || '');
  const [mobilePane, setMobilePane] = useState<'list' | 'editor'>('list');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [publishSummary, setPublishSummary] = useState<string>('');
  const [showNewFunnelModal, setShowNewFunnelModal] = useState(false);
  const [newFunnelName, setNewFunnelName] = useState('');
  const [newFunnelDesc, setNewFunnelDesc] = useState('');

  // Simulator state
  const [simSource, setSimSource] = useState<'draft' | 'published'>('draft');
  const [simMode, setSimMode] = useState<'path' | 'conversion'>('path');
  const [simShowProgress, setSimShowProgress] = useState<boolean>(true);
  const [simAnswers, setSimAnswers] = useState<Record<string, string>>({});
  const [simDiscardedKeys, setSimDiscardedKeys] = useState<string[]>([]);
  const [simStepIdx, setSimStepIdx] = useState<number>(0);
  const [simCompany, setSimCompany] = useState('Construtora Horizonte Demo Ltda');
  const [simContact, setSimContact] = useState('Renata Oliveira');
  const [simChannel, setSimChannel] = useState<'WhatsApp' | 'Ligação' | 'E-mail'>('WhatsApp');
  const [simContactVal, setSimContactVal] = useState('(11) 99550-2211');
  const [simPageId, setSimPageId] = useState(state.salesPages[0]?.id || 'pg_industria');
  const [simCreatedLeadId, setSimCreatedLeadId] = useState<string | null>(null);

  const issues = useMemo(() => validateFunnelSteps(draftSteps), [draftSteps]);
  const issuesByStep = useMemo(() => {
    const map = new Map<string, typeof issues>();
    for (const iss of issues) {
      const arr = map.get(iss.stepId) || [];
      arr.push(iss);
      map.set(iss.stepId, arr);
    }
    return map;
  }, [issues]);

  const selectedStep = draftSteps.find((s) => s.id === selectedStepId) || draftSteps[0];

  const updateStep = (stepId: string, updater: (s: FunnelStep) => FunnelStep) => {
    const next = draftSteps.map((s) => (s.id === stepId ? updater(s) : s));
    updateFunnelDraftSteps(funnel.id, next);
  };

  const addStepFromLibrary = (type: StepType, pathScope: 'common' | FunnelPathId) => {
    const id = `step_${Date.now()}`;
    const newStep: FunnelStep =
      type === 'result'
        ? {
            id,
            title: 'Nova etapa de resultado',
            type: 'result',
            required: false,
            allowDontKnow: false,
            pathScope,
            fieldKey: `res_${Date.now()}`,
            resultConfig: {
              pathId: pathScope === 'common' ? 'avaliar_empresa' : pathScope,
              headline: 'Diagnóstico personalizado da JJ LICITA',
              motivationalText: 'Texto motivador exibido antes da solicitação de contato.',
              nextStepText: 'Próximo passo recomendado para a equipe comercial.',
              ctaLabel: 'Solicitar primeira conversa',
              showProgressIndicatorDefault: true,
            },
          }
        : type === 'text_input'
        ? {
            id,
            title: 'Nova pergunta aberta',
            subtitle: 'Campo de texto configurável',
            type: 'text_input',
            required: false,
            allowDontKnow: true,
            pathScope,
            fieldKey: `campo_${Date.now()}`,
            placeholder: 'Digite sua resposta...',
            defaultNextStepId: draftSteps.find((s) => s.type === 'result')?.id,
          }
        : {
            id,
            title: 'Nova pergunta de múltipla escolha',
            subtitle: 'Configure alternativas, obrigatoriedade e salto condicional',
            type: 'single_choice',
            required: true,
            allowDontKnow: true,
            pathScope,
            fieldKey: `perg_${Date.now()}`,
            defaultNextStepId: draftSteps.find((s) => s.type === 'result')?.id,
            options: [
              {
                id: `opt_${Date.now()}_1`,
                label: 'Sim, já temos disponível',
                value: 'sim',
                nextStepId: draftSteps.find((s) => s.type === 'result')?.id,
              },
              {
                id: `opt_${Date.now()}_2`,
                label: 'Não sei informar',
                value: 'nao_sei',
                nextStepId: draftSteps.find((s) => s.type === 'result')?.id,
                isUnknownOption: true,
              },
            ],
          };

    updateFunnelDraftSteps(funnel.id, [...draftSteps, newStep]);
    setSelectedStepId(id);
    setMobilePane('editor');
    showToast(`Etapa "${newStep.title}" adicionada ao rascunho.`);
  };

  const moveStep = (stepId: string, dir: -1 | 1) => {
    const idx = draftSteps.findIndex((s) => s.id === stepId);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= draftSteps.length) return;
    const copy = [...draftSteps];
    const [removed] = copy.splice(idx, 1);
    copy.splice(target, 0, removed);
    updateFunnelDraftSteps(funnel.id, copy);
  };

  const removeStep = (stepId: string) => {
    if (draftSteps.length <= 2) {
      showToast('Mantenha pelo menos duas etapas no funil.');
      return;
    }
    const next = draftSteps.filter((s) => s.id !== stepId);
    updateFunnelDraftSteps(funnel.id, next);
    if (selectedStepId === stepId) setSelectedStepId(next[0].id);
  };

  const handlePublish = () => {
    if (issues.length > 0) {
      setSelectedStepId(issues[0].stepId);
      setActiveTab('edit');
      showToast(`Corrija ${issues.length} problema(s) de validação antes de publicar.`);
      return;
    }
    publishFunnelDraft(funnel.id, publishSummary);
    setPublishSummary('');
  };

  // --- SIMULATOR ENGINE ---
  const simSnapshot = simSource === 'draft' ? funnel.draft : publishedSnap;
  const simTrace = useMemo(
    () => traceFunnelPath(simSnapshot.steps, simAnswers),
    [simSnapshot.steps, simAnswers]
  );
  const simCurrentStep = simTrace.visitedSteps[Math.min(simStepIdx, Math.max(0, simTrace.visitedSteps.length - 1))];
  const simQualDraft = useMemo(
    () => evaluateQualification(funnel.draft.steps, simAnswers, funnel.draft.qualificationConfig),
    [funnel.draft, simAnswers]
  );
  const simQualPublished = useMemo(
    () => evaluateQualification(publishedSnap.steps, simAnswers, publishedSnap.qualificationConfig),
    [publishedSnap, simAnswers]
  );
  const simQualActive = simSource === 'draft' ? simQualDraft : simQualPublished;

  const handleSimAnswer = (step: FunnelStep, val: string) => {
    let nextAnswers: Record<string, string> = { ...simAnswers, [step.fieldKey]: val };
    // Branch switch pruning!
    if (step.fieldKey === 'intencao') {
      const prevIntent = simAnswers.intencao as FunnelPathId | undefined;
      const newIntent = val as FunnelPathId;
      if (prevIntent && prevIntent !== newIntent) {
        const beforeKeys = Object.keys(nextAnswers);
        nextAnswers = pruneAnswersForActivePath(simSnapshot.steps, nextAnswers, newIntent);
        const afterKeys = new Set(Object.keys(nextAnswers));
        const removed = beforeKeys.filter((k) => !afterKeys.has(k));
        setSimDiscardedKeys(removed);
        if (removed.length > 0) {
          markAcceptance('t2BranchSwitchClean', true);
        }
      }
    }
    setSimAnswers(nextAnswers);
    setSimCreatedLeadId(null);

    if (step.type === 'single_choice') {
      const newTrace = traceFunnelPath(simSnapshot.steps, nextAnswers);
      const curIdx = newTrace.visitedSteps.findIndex((s) => s.id === step.id);
      if (curIdx >= 0 && curIdx + 1 < newTrace.visitedSteps.length) {
        setSimStepIdx(curIdx + 1);
      }
    }
  };

  const handleRunSimConversion = (e: React.FormEvent) => {
    e.preventDefault();
    const res = submitPublicConversion({
      salesPageId: simPageId,
      funnelId: funnel.id,
      useDraft: simSource === 'draft',
      answers: simAnswers,
      companyName: simCompany,
      contactName: simContact,
      contactChannel: simChannel,
      contactValue: simContactVal,
      wantsFutureAlerts: true,
    });
    setSimCreatedLeadId(res.lead.id);
  };

  const visibleStepsInMap = draftSteps.filter(
    (s) => scopeFilter === 'all' || s.pathScope === scopeFilter
  );

  return (
    <div className="space-y-5">
      {/* Header & Funnel Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-[#0F2744]">Construtor de Funis</h1>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-mono text-slate-600">
              Publicada v{funnel.publishedVersion}
            </span>
            {funnel.hasDraft && (
              <>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs font-medium text-[#B45309]">Rascunho em edição</span>
              </>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Configure perguntas, saltos condicionais, resultados por caminho, teste com inspetor e publique novas versões preservando submissões antigas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={funnel.id}
            onChange={(e) => {
              setSelectedFunnelId(e.target.value);
              const target = state.funnels.find((f) => f.id === e.target.value);
              if (target?.draft.steps[0]) setSelectedStepId(target.draft.steps[0].id);
            }}
            aria-label="Selecionar funil"
            className="h-9 px-3 text-xs font-medium bg-white border border-[#E2E8F0] rounded-md text-[#0F2744] max-w-[230px]"
          >
            {state.funnels.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} (v{f.publishedVersion})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowNewFunnelModal(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-[#0F2744] bg-white border border-[#E2E8F0] hover:border-[#0F2744] rounded-md whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo funil</span>
          </button>

          <button
            type="button"
            onClick={() => duplicateFunnel(funnel.id)}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-[#0F2744] bg-white border border-[#E2E8F0] hover:border-[#0F2744] rounded-md whitespace-nowrap"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicar</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Bar + Publish Control */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Segmented tabs */}
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-md self-start">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
              activeTab === 'edit' ? 'bg-white text-[#0F2744] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Editar ({draftSteps.length} etapas)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('test')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
              activeTab === 'test' ? 'bg-white text-[#0F2744] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Testar e inspecionar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
              activeTab === 'history' ? 'bg-white text-[#0F2744] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico ({funnel.versions.length})</span>
          </button>
        </div>

        {/* Validation status + Publish */}
        <div className="flex flex-wrap items-center gap-2">
          {issues.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setActiveTab('edit');
                setSelectedStepId(issues[0].stepId);
                setMobilePane('editor');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C] hover:underline whitespace-nowrap"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{issues.length} erro(s) bloqueiam publicação</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#15803D] whitespace-nowrap">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Fluxo íntegro para publicação</span>
            </span>
          )}

          <input
            type="text"
            value={publishSummary}
            onChange={(e) => setPublishSummary(e.target.value)}
            placeholder="Nota da nova versão..."
            className="h-8 px-2.5 text-xs border border-[#E2E8F0] rounded-md w-44 hidden xl:block"
          />

          <button
            type="button"
            onClick={() => resetFunnelDraft(funnel.id)}
            title="Descartar alterações do rascunho"
            className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-medium text-slate-600 hover:text-[#0F2744] border border-[#E2E8F0] rounded-md whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reverter rascunho</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md transition-colors whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publicar versão</span>
          </button>
        </div>
      </div>

      {/* Validation Alert Banner when issues exist */}
      {issues.length > 0 && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-4 space-y-2">
          <div className="text-xs font-semibold text-[#B91C1C] flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>Problemas encontrados no rascunho antes de publicar:</span>
          </div>
          <ul className="space-y-1 text-xs text-[#991B1B]">
            {issues.map((iss) => {
              const st = draftSteps.find((s) => s.id === iss.stepId);
              return (
                <li key={iss.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <strong>{st?.title || iss.stepId}:</strong> {iss.message}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('edit');
                      setSelectedStepId(iss.stepId);
                      setMobilePane('editor');
                    }}
                    className="font-semibold underline whitespace-nowrap"
                  >
                    Corrigir etapa
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ==================== TAB 1: EDITAR ==================== */}
      {activeTab === 'edit' && (
        <>
          {/* Mobile 360px switcher between Step List and Editor */}
          <div className="flex lg:hidden items-center gap-1 p-1 bg-slate-200/70 rounded-md">
            <button
              type="button"
              onClick={() => setMobilePane('list')}
              className={`flex-1 py-2 text-xs font-semibold rounded ${
                mobilePane === 'list' ? 'bg-white text-[#0F2744]' : 'text-slate-600'
              }`}
            >
              Mapa / Etapas ({draftSteps.length})
            </button>
            <button
              type="button"
              onClick={() => setMobilePane('editor')}
              className={`flex-1 py-2 text-xs font-semibold rounded ${
                mobilePane === 'editor' ? 'bg-white text-[#0F2744]' : 'text-slate-600'
              }`}
            >
              Editor da etapa
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT PANE: Biblioteca de etapas */}
            <aside className="hidden lg:block lg:col-span-3 bg-white border border-[#E2E8F0] rounded-lg p-4 space-y-4 sticky top-20">
              <div>
                <h2 className="text-xs font-semibold text-[#0F2744]">Biblioteca de etapas</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Adicione novas perguntas ou telas de resultado ao rascunho atual.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => addStepFromLibrary('single_choice', scopeFilter === 'all' ? 'common' : (scopeFilter as 'common' | FunnelPathId))}
                  className="w-full text-left p-3 border border-[#E2E8F0] hover:border-[#0F2744] rounded-md transition-colors"
                >
                  <div className="text-xs font-semibold text-[#0F2744]">+ Múltipla escolha</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Alternativas, opção "Não sei", salto condicional e peso nos 4 grupos.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => addStepFromLibrary('text_input', scopeFilter === 'all' ? 'ja_tenho_edital' : (scopeFilter as 'common' | FunnelPathId))}
                  className="w-full text-left p-3 border border-[#E2E8F0] hover:border-[#0F2744] rounded-md transition-colors"
                >
                  <div className="text-xs font-semibold text-[#0F2744]">+ Campo de texto</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Coleta livre de número de edital, lote, órgão ou observação.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => addStepFromLibrary('result', scopeFilter === 'all' ? 'avaliar_empresa' : (scopeFilter as 'common' | FunnelPathId))}
                  className="w-full text-left p-3 border border-[#E2E8F0] hover:border-[#0F2744] rounded-md transition-colors"
                >
                  <div className="text-xs font-semibold text-[#0F2744]">+ Tela de resultado</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Parecer curto, próximo passo, CTA e nota de serviço contratado.
                  </div>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-xs font-semibold text-[#0F2744]">Filtrar mapa por caminho</div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setScopeFilter('all')}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded ${
                      scopeFilter === 'all'
                        ? 'bg-[#0F2744] text-white font-medium'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Todos os caminhos ({draftSteps.length})
                  </button>
                  {PATH_SCOPES.map((sc) => {
                    const count = draftSteps.filter((s) => s.pathScope === sc.id).length;
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => setScopeFilter(sc.id)}
                        className={`w-full text-left px-2.5 py-1.5 text-xs rounded flex items-center justify-between ${
                          scopeFilter === sc.id
                            ? 'bg-[#0F2744] text-white font-medium'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{sc.label}</span>
                        <span className="font-mono text-[11px] tabular-nums">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* CENTER PANE: Mapa visual dos caminhos (mostra de qual resposta cada conexão sai e para onde leva) */}
            <section
              className={`lg:col-span-5 bg-white border border-[#E2E8F0] rounded-lg p-4 space-y-3 ${
                mobilePane === 'list' ? 'block' : 'hidden lg:block'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h2 className="text-xs font-semibold text-[#0F2744]">
                    Mapa de caminhos e conexões
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Clique em uma etapa para editar texto, regras e destinos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addStepFromLibrary('single_choice', 'common')}
                  className="lg:hidden inline-flex items-center gap-1 h-8 px-2.5 text-xs font-semibold text-[#0F2744] border border-[#E2E8F0] rounded-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Etapa</span>
                </button>
              </div>

              <div className="space-y-3">
                {visibleStepsInMap.map((step) => {
                  const globalIdx = draftSteps.findIndex((s) => s.id === step.id);
                  const stepIssues = issuesByStep.get(step.id) || [];
                  const isSelected = selectedStep?.id === step.id;
                  const scopeLabel =
                    step.pathScope === 'common'
                      ? 'Comum'
                      : PATH_LABELS[step.pathScope as FunnelPathId];

                  return (
                    <div
                      key={step.id}
                      onClick={() => {
                        setSelectedStepId(step.id);
                        setMobilePane('editor');
                      }}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                        stepIssues.length > 0
                          ? 'border-[#DC2626] bg-[#FEF2F2]/40'
                          : isSelected
                          ? 'border-[#0F2744] bg-[#F8FAFC] ring-1 ring-[#0F2744]'
                          : 'border-[#E2E8F0] hover:border-slate-400 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5">
                            <span className="font-mono font-semibold text-[#0F2744] tabular-nums">
                              #{globalIdx + 1}
                            </span>
                            <span>·</span>
                            <span>{scopeLabel}</span>
                            <span>·</span>
                            <span>
                              {step.type === 'result'
                                ? 'Resultado'
                                : step.type === 'text_input'
                                ? 'Texto'
                                : 'Escolha única'}
                            </span>
                            {step.required && (
                              <>
                                <span>·</span>
                                <span>Obrigatória</span>
                              </>
                            )}
                          </div>
                          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 mt-1">
                            {step.title}
                          </h3>
                        </div>

                        <div
                          className="flex items-center gap-1 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => moveStep(step.id, -1)}
                            disabled={globalIdx === 0}
                            className="p-1 text-slate-400 hover:text-[#0F2744] disabled:opacity-30"
                            aria-label="Mover etapa para cima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveStep(step.id, 1)}
                            disabled={globalIdx === draftSteps.length - 1}
                            className="p-1 text-slate-400 hover:text-[#0F2744] disabled:opacity-30"
                            aria-label="Mover etapa para baixo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Explicit outgoing connections map */}
                      {step.type === 'single_choice' && step.options && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1">
                          {step.options.map((opt) => {
                            const targetId = opt.nextStepId || step.defaultNextStepId;
                            const targetStep = draftSteps.find((s) => s.id === targetId);
                            return (
                              <div
                                key={opt.id}
                                className="flex items-center justify-between gap-2 text-[11px]"
                              >
                                <span className="text-slate-700 truncate">{opt.label}</span>
                                <span
                                  className={`inline-flex items-center gap-1 shrink-0 font-medium ${
                                    targetStep ? 'text-[#0F2744]' : 'text-[#B91C1C]'
                                  }`}
                                >
                                  <ArrowRight className="w-3 h-3" />
                                  <span className="max-w-[140px] truncate">
                                    {targetStep ? targetStep.title : 'Sem destino'}
                                  </span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {step.type === 'text_input' && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Após preenchimento</span>
                          <span className="inline-flex items-center gap-1 font-medium text-[#0F2744]">
                            <ArrowRight className="w-3 h-3" />
                            <span>
                              {draftSteps.find((s) => s.id === step.defaultNextStepId)?.title ||
                                'Sem destino'}
                            </span>
                          </span>
                        </div>
                      )}

                      {step.type === 'result' && step.resultConfig && (
                        <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-[#15803D] font-medium">
                          CTA: {step.resultConfig.ctaLabel}
                        </div>
                      )}

                      {/* Inline validation errors attached to the step */}
                      {stepIssues.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-[#FECACA] space-y-1">
                          {stepIssues.map((iss) => (
                            <div
                              key={iss.id}
                              className="text-[11px] font-medium text-[#B91C1C] flex items-start gap-1.5"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>{iss.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* RIGHT PANE: Editor do item selecionado */}
            <aside
              className={`lg:col-span-4 bg-white border border-[#E2E8F0] rounded-lg p-4 space-y-4 lg:sticky lg:top-20 ${
                mobilePane === 'editor' ? 'block' : 'hidden lg:block'
              }`}
            >
              {selectedStep ? (
                <>
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-xs font-semibold text-[#0F2744]">Editor da etapa</h2>
                      <div className="text-[11px] font-mono text-slate-400">{selectedStep.id}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStep(selectedStep.id)}
                      className="inline-flex items-center gap-1 text-xs text-[#B91C1C] hover:underline"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover</span>
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Texto da pergunta / título
                      </label>
                      <input
                        type="text"
                        value={selectedStep.title}
                        onChange={(e) =>
                          updateStep(selectedStep.id, (s) => ({ ...s, title: e.target.value }))
                        }
                        className="w-full h-9 px-3 border border-[#E2E8F0] rounded-md text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Descrição auxiliar (opcional)
                      </label>
                      <input
                        type="text"
                        value={selectedStep.subtitle || ''}
                        onChange={(e) =>
                          updateStep(selectedStep.id, (s) => ({ ...s, subtitle: e.target.value }))
                        }
                        className="w-full h-9 px-3 border border-[#E2E8F0] rounded-md text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">Caminho / escopo</label>
                        <select
                          value={selectedStep.pathScope}
                          onChange={(e) =>
                            updateStep(selectedStep.id, (s) => ({
                              ...s,
                              pathScope: e.target.value as 'common' | FunnelPathId,
                            }))
                          }
                          className="w-full h-9 px-2 border border-[#E2E8F0] rounded-md bg-white"
                        >
                          {PATH_SCOPES.map((sc) => (
                            <option key={sc.id} value={sc.id}>
                              {sc.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-medium text-slate-700 mb-1">Tipo da etapa</label>
                        <select
                          value={selectedStep.type}
                          onChange={(e) =>
                            updateStep(selectedStep.id, (s) => ({
                              ...s,
                              type: e.target.value as StepType,
                            }))
                          }
                          className="w-full h-9 px-2 border border-[#E2E8F0] rounded-md bg-white"
                        >
                          <option value="single_choice">Múltipla escolha</option>
                          <option value="text_input">Texto aberto</option>
                          <option value="result">Resultado</option>
                        </select>
                      </div>
                    </div>

                    {selectedStep.type !== 'result' && (
                      <div className="flex flex-wrap items-center gap-4 pt-1">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedStep.required}
                            onChange={(e) =>
                              updateStep(selectedStep.id, (s) => ({
                                ...s,
                                required: e.target.checked,
                              }))
                            }
                          />
                          <span>Resposta obrigatória</span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedStep.allowDontKnow}
                            onChange={(e) =>
                              updateStep(selectedStep.id, (s) => ({
                                ...s,
                                allowDontKnow: e.target.checked,
                              }))
                            }
                          />
                          <span>Permitir opção "Não sei"</span>
                        </label>
                      </div>
                    )}

                    {/* Default next step for text_input or fallback */}
                    {selectedStep.type !== 'result' && (
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Próxima etapa padrão
                        </label>
                        <select
                          value={selectedStep.defaultNextStepId || ''}
                          onChange={(e) =>
                            updateStep(selectedStep.id, (s) => ({
                              ...s,
                              defaultNextStepId: e.target.value || undefined,
                            }))
                          }
                          className="w-full h-9 px-2 border border-[#E2E8F0] rounded-md bg-white"
                        >
                          <option value="">-- Sem destino padrão --</option>
                          {draftSteps
                            .filter((st) => st.id !== selectedStep.id)
                            .map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.title}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    {/* Single-choice Options & Conditional Jumps */}
                    {selectedStep.type === 'single_choice' && (
                      <div className="pt-2 border-t border-slate-100 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#0F2744]">
                            Alternativas e saltos condicionais
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const newOpt: FunnelOption = {
                                id: `opt_${Date.now()}`,
                                label: 'Nova alternativa',
                                value: `val_${Date.now().toString().slice(-4)}`,
                                nextStepId: selectedStep.defaultNextStepId,
                              };
                              updateStep(selectedStep.id, (s) => ({
                                ...s,
                                options: [...(s.options || []), newOpt],
                              }));
                            }}
                            className="text-xs font-semibold text-[#15803D] hover:underline"
                          >
                            + Alternativa
                          </button>
                        </div>

                        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                          {(selectedStep.options || []).map((opt) => (
                            <div
                              key={opt.id}
                              className="p-2.5 border border-[#E2E8F0] rounded-md bg-[#F8FAFC] space-y-2"
                            >
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={opt.label}
                                  onChange={(e) =>
                                    updateStep(selectedStep.id, (s) => ({
                                      ...s,
                                      options: s.options?.map((o) =>
                                        o.id === opt.id ? { ...o, label: e.target.value } : o
                                      ),
                                    }))
                                  }
                                  className="flex-1 h-8 px-2 text-xs bg-white border border-[#E2E8F0] rounded"
                                  placeholder="Rótulo da opção"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateStep(selectedStep.id, (s) => ({
                                      ...s,
                                      options: s.options?.filter((o) => o.id !== opt.id),
                                    }))
                                  }
                                  className="p-1 text-slate-400 hover:text-[#B91C1C]"
                                  aria-label="Excluir alternativa"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 gap-1.5">
                                <label className="text-[11px] text-slate-500">
                                  Salta para etapa:
                                  <select
                                    value={opt.nextStepId || ''}
                                    onChange={(e) =>
                                      updateStep(selectedStep.id, (s) => ({
                                        ...s,
                                        options: s.options?.map((o) =>
                                          o.id === opt.id
                                            ? { ...o, nextStepId: e.target.value || undefined }
                                            : o
                                        ),
                                      }))
                                    }
                                    className="mt-0.5 w-full h-7 px-2 text-[11px] bg-white border border-[#E2E8F0] rounded"
                                  >
                                    <option value="">Usar destino padrão</option>
                                    {draftSteps.map((st) => (
                                      <option key={st.id} value={st.id}>
                                        {st.title} {st.id === selectedStep.id ? '(ciclo!)' : ''}
                                      </option>
                                    ))}
                                    <option value="etapa_inexistente_teste">
                                      [Simular destino inexistente]
                                    </option>
                                  </select>
                                </label>

                                <div className="grid grid-cols-2 gap-1.5">
                                  <select
                                    value={opt.groupEffect?.group || ''}
                                    onChange={(e) => {
                                      const grp = e.target.value as QualificationGroupKey | '';
                                      updateStep(selectedStep.id, (s) => ({
                                        ...s,
                                        options: s.options?.map((o) =>
                                          o.id === opt.id
                                            ? {
                                                ...o,
                                                groupEffect: grp
                                                  ? {
                                                      group: grp,
                                                      status: o.groupEffect?.status || 'verde',
                                                    }
                                                  : undefined,
                                              }
                                            : o
                                        ),
                                      }));
                                    }}
                                    className="h-7 px-1.5 text-[11px] bg-white border border-[#E2E8F0] rounded"
                                  >
                                    <option value="">Sem efeito no semáforo</option>
                                    {(Object.keys(GROUP_DEFAULT_LABELS) as QualificationGroupKey[]).map(
                                      (gk) => (
                                        <option key={gk} value={gk}>
                                          {GROUP_DEFAULT_LABELS[gk]}
                                        </option>
                                      )
                                    )}
                                  </select>

                                  {opt.groupEffect && (
                                    <select
                                      value={opt.groupEffect.status}
                                      onChange={(e) =>
                                        updateStep(selectedStep.id, (s) => ({
                                          ...s,
                                          options: s.options?.map((o) =>
                                            o.id === opt.id && o.groupEffect
                                              ? {
                                                  ...o,
                                                  groupEffect: {
                                                    ...o.groupEffect,
                                                    status: e.target.value as SemaphoreStatus,
                                                  },
                                                }
                                              : o
                                          ),
                                        }))
                                      }
                                      className="h-7 px-1.5 text-[11px] bg-white border border-[#E2E8F0] rounded"
                                    >
                                      <option value="verde">Verde · Disponível</option>
                                      <option value="amarelo">Amarelo · Em org.</option>
                                      <option value="vermelho">Vermelho · Pendência</option>
                                      <option value="cinza">Cinza · A verificar</option>
                                    </select>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Result Step Configuration */}
                    {selectedStep.type === 'result' && selectedStep.resultConfig && (
                      <div className="pt-2 border-t border-slate-100 space-y-2.5">
                        <div className="font-semibold text-[#0F2744]">Configuração do resultado</div>
                        <div>
                          <label className="block text-slate-600 mb-1">Chamada principal</label>
                          <input
                            type="text"
                            value={selectedStep.resultConfig.headline}
                            onChange={(e) =>
                              updateStep(selectedStep.id, (s) => ({
                                ...s,
                                resultConfig: { ...s.resultConfig!, headline: e.target.value },
                              }))
                            }
                            className="w-full h-8 px-2.5 border border-[#E2E8F0] rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1">Texto motivador</label>
                          <textarea
                            rows={2}
                            value={selectedStep.resultConfig.motivationalText}
                            onChange={(e) =>
                              updateStep(selectedStep.id, (s) => ({
                                ...s,
                                resultConfig: {
                                  ...s.resultConfig!,
                                  motivationalText: e.target.value,
                                },
                              }))
                            }
                            className="w-full p-2 border border-[#E2E8F0] rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1">Próximo passo</label>
                          <textarea
                            rows={2}
                            value={selectedStep.resultConfig.nextStepText}
                            onChange={(e) =>
                              updateStep(selectedStep.id, (s) => ({
                                ...s,
                                resultConfig: { ...s.resultConfig!, nextStepText: e.target.value },
                              }))
                            }
                            className="w-full p-2 border border-[#E2E8F0] rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1">Botão de ação (CTA)</label>
                          <input
                            type="text"
                            value={selectedStep.resultConfig.ctaLabel}
                            onChange={(e) =>
                              updateStep(selectedStep.id, (s) => ({
                                ...s,
                                resultConfig: { ...s.resultConfig!, ctaLabel: e.target.value },
                              }))
                            }
                            className="w-full h-8 px-2.5 border border-[#E2E8F0] rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-500">Selecione uma etapa no mapa para editar.</div>
              )}
            </aside>
          </div>
        </>
      )}

      {/* ==================== TAB 2: TESTAR E INSPECIONAR ==================== */}
      {activeTab === 'test' && (
        <div className="space-y-4">
          {/* Simulator Controls */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-md">
                <button
                  type="button"
                  onClick={() => setSimSource('draft')}
                  className={`px-2.5 py-1 rounded font-semibold ${
                    simSource === 'draft' ? 'bg-white text-[#0F2744] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Rascunho ({funnel.draft.version})
                </button>
                <button
                  type="button"
                  onClick={() => setSimSource('published')}
                  className={`px-2.5 py-1 rounded font-semibold ${
                    simSource === 'published'
                      ? 'bg-white text-[#0F2744] shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Publicada (v{publishedSnap.version})
                </button>
              </div>

              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-md">
                <button
                  type="button"
                  onClick={() => setSimMode('path')}
                  className={`px-2.5 py-1 rounded font-semibold ${
                    simMode === 'path' ? 'bg-white text-[#0F2744] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Simular caminho (sem lead)
                </button>
                <button
                  type="button"
                  onClick={() => setSimMode('conversion')}
                  className={`px-2.5 py-1 rounded font-semibold ${
                    simMode === 'conversion'
                      ? 'bg-[#15803D] text-white shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Simular conversão (cria lead)
                </button>
              </div>

              <label className="inline-flex items-center gap-1.5 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simShowProgress}
                  onChange={(e) => setSimShowProgress(e.target.checked)}
                />
                <span>Indicador de progresso</span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                setSimAnswers({});
                setSimDiscardedKeys([]);
                setSimStepIdx(0);
                setSimCreatedLeadId(null);
              }}
              className="text-xs font-semibold text-[#0F2744] hover:underline"
            >
              Reiniciar simulação
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Interactive Preview */}
            <section className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Prévia interativa · {simSource === 'draft' ? 'Rascunho atual' : `Publicada v${publishedSnap.version}`}
                </span>
                <span className="font-mono tabular-nums">
                  Etapa {Math.min(simStepIdx + 1, simTrace.visitedSteps.length)} de{' '}
                  {simTrace.visitedSteps.length}
                </span>
              </div>

              {simShowProgress && (
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0F2744] transition-all duration-200"
                    style={{
                      width: `${Math.min(
                        100,
                        ((simStepIdx + 1) / Math.max(simTrace.visitedSteps.length, 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              )}

              {simCurrentStep && simCurrentStep.type !== 'result' ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-[#0F2744]">{simCurrentStep.title}</h3>
                    {simCurrentStep.subtitle && (
                      <p className="text-xs text-slate-500 mt-1">{simCurrentStep.subtitle}</p>
                    )}
                  </div>

                  {simCurrentStep.type === 'single_choice' && (
                    <div className="space-y-2">
                      {(simCurrentStep.options || []).map((opt) => {
                        const selected = simAnswers[simCurrentStep.fieldKey] === opt.value;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSimAnswer(simCurrentStep, opt.value)}
                            className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm rounded-md border transition-colors ${
                              selected
                                ? 'border-[#0F2744] bg-[#EEF3F9] font-semibold text-[#0F2744]'
                                : 'border-[#E2E8F0] hover:border-[#0F2744] text-slate-800'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {simCurrentStep.type === 'text_input' && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={simAnswers[simCurrentStep.fieldKey] || ''}
                        onChange={(e) => handleSimAnswer(simCurrentStep, e.target.value)}
                        placeholder={simCurrentStep.placeholder}
                        className="w-full h-10 px-3 text-sm border border-[#CBD5E1] rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (simStepIdx + 1 < simTrace.visitedSteps.length) {
                            setSimStepIdx(simStepIdx + 1);
                          }
                        }}
                        className="h-9 px-4 text-xs font-semibold text-white bg-[#0F2744] rounded-md"
                      >
                        Continuar
                      </button>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      disabled={simStepIdx === 0}
                      onClick={() => setSimStepIdx((i) => Math.max(0, i - 1))}
                      className="text-xs font-medium text-slate-600 hover:text-[#0F2744] disabled:opacity-40"
                    >
                      Voltar etapa
                    </button>
                    {simTrace.visitedSteps.some((s) => s.fieldKey === 'intencao') &&
                      simCurrentStep.fieldKey !== 'intencao' && (
                        <button
                          type="button"
                          onClick={() => {
                            const idx = simTrace.visitedSteps.findIndex(
                              (s) => s.fieldKey === 'intencao'
                            );
                            if (idx >= 0) setSimStepIdx(idx);
                          }}
                          className="text-xs font-semibold text-[#0F2744] hover:underline"
                        >
                          Trocar caminho (testar descarte)
                        </button>
                      )}
                  </div>
                </div>
              ) : (
                /* Result preview */
                <div className="space-y-4">
                  <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
                    <div className="text-xs font-semibold text-[#15803D]">
                      Parecer inicial (antes de pedir contato)
                    </div>
                    <h3 className="text-base font-bold text-[#0F2744]">
                      {simCurrentStep?.resultConfig?.headline || 'Diagnóstico inicial'}
                    </h3>
                    <p className="text-sm text-slate-800 font-medium">
                      {simQualActive.publicSummaryLine}
                    </p>
                    <p className="text-xs text-slate-600">{simQualActive.publicNextStep}</p>
                    {simQualActive.legalAlerts.map((al, idx) => (
                      <p key={idx} className="text-xs font-medium text-[#B45309] pt-1">
                        Observação jurídica: {al}
                      </p>
                    ))}
                  </div>

                  {simMode === 'conversion' ? (
                    simCreatedLeadId ? (
                      <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg space-y-2 text-xs">
                        <div className="font-semibold text-[#15803D]">
                          Conversão simulada registrada no CRM!
                        </div>
                        <p className="text-slate-700">
                          Márcio fará a primeira abordagem retomando: {simQualActive.marcioResumeTopic}.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLeadId(simCreatedLeadId);
                            setRoute('leads');
                          }}
                          className="inline-flex items-center gap-1.5 h-8 px-3 font-semibold text-white bg-[#15803D] rounded-md"
                        >
                          <span>Abrir lead criado</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleRunSimConversion} className="space-y-3 text-xs">
                        <div className="font-semibold text-[#0F2744]">
                          Simular conversão na fila de leads
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <select
                            value={simPageId}
                            onChange={(e) => setSimPageId(e.target.value)}
                            className="h-9 px-2.5 border border-[#E2E8F0] rounded-md bg-white"
                          >
                            {state.salesPages.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={simCompany}
                            onChange={(e) => setSimCompany(e.target.value)}
                            placeholder="Empresa fictícia"
                            className="h-9 px-2.5 border border-[#E2E8F0] rounded-md"
                          />
                          <input
                            type="text"
                            value={simContact}
                            onChange={(e) => setSimContact(e.target.value)}
                            placeholder="Nome do contato"
                            className="h-9 px-2.5 border border-[#E2E8F0] rounded-md"
                          />
                          <div className="flex gap-1.5">
                            <select
                              value={simChannel}
                              onChange={(e) =>
                                setSimChannel(e.target.value as 'WhatsApp' | 'Ligação' | 'E-mail')
                              }
                              className="h-9 px-2 border border-[#E2E8F0] rounded-md bg-white"
                            >
                              <option value="WhatsApp">WhatsApp</option>
                              <option value="Ligação">Ligação</option>
                              <option value="E-mail">E-mail</option>
                            </select>
                            <input
                              type="text"
                              value={simContactVal}
                              onChange={(e) => setSimContactVal(e.target.value)}
                              className="flex-1 h-9 px-2.5 border border-[#E2E8F0] rounded-md"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="h-9 px-4 font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md"
                        >
                          {simQualActive.ctaLabel} (Simular conversão)
                        </button>
                      </form>
                    )
                  ) : (
                    <div className="text-xs text-slate-500">
                      Modo "Simular caminho" ativo: nenhum lead será criado. Alterne para "Simular conversão" acima para gravar na fila.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setSimStepIdx(0)}
                    className="text-xs font-semibold text-[#0F2744] hover:underline"
                  >
                    Voltar ao início da simulação
                  </button>
                </div>
              )}
            </section>

            {/* Right: Live Execution Inspector + Before/After Comparison */}
            <aside className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-[#0F2744]">
                  Inspetor de regras e ficha que chega ao painel
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Acompanhe em tempo real trilha percorrida, descarte de ramo abandonado e comparação Rascunho vs Publicada.
                </p>
              </div>

              {simDiscardedKeys.length > 0 && (
                <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-md text-xs text-[#166534]">
                  <strong>Troca de caminho limpa:</strong> respostas exclusivas do ramo anterior (
                  <span className="font-mono">{simDiscardedKeys.join(', ')}</span>) foram descartadas e não influenciam a qualificação.
                </div>
              )}

              {/* Trail of visited steps */}
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-1.5">
                  Etapas percorridas na simulação
                </div>
                <div className="space-y-1 text-xs">
                  {simTrace.visitedSteps.map((s, idx) => (
                    <div key={s.id} className="flex items-center justify-between gap-2 py-1 border-b border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSimStepIdx(idx)}
                        className={`text-left truncate hover:underline ${
                          idx === simStepIdx ? 'font-semibold text-[#0F2744]' : 'text-slate-600'
                        }`}
                      >
                        {idx + 1}. {s.title}
                      </button>
                      <span className="font-mono text-[11px] text-slate-500 shrink-0">
                        {simAnswers[s.fieldKey] || (s.type === 'result' ? 'Resultado' : '—')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4-Group Semaphore Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {(Object.keys(GROUP_DEFAULT_LABELS) as QualificationGroupKey[]).map((gk) => (
                  <div key={gk} className="p-3 border border-[#E2E8F0] rounded-md">
                    <div className="text-[11px] text-slate-500">{GROUP_DEFAULT_LABELS[gk]}</div>
                    <div className="mt-1">
                      <SemaphoreIndicator status={simQualActive.groups[gk]} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Separated 3 Dimensions */}
              <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-500">Gargalo principal: </span>
                  <strong className="text-[#0F2744]">{simQualActive.bottleneckLabel}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Prontidão documental: </span>
                  <span className="font-medium text-slate-800">{simQualActive.documentReadiness}</span>
                </div>
                <div>
                  <span className="text-slate-500">Prioridade comercial: </span>
                  <span className="font-medium text-slate-800">{simQualActive.commercialPriority}</span>
                </div>
                <div>
                  <span className="text-slate-500">Parecer jurídico: </span>
                  <span className="font-medium text-slate-800">{simQualActive.legalReviewStatus}</span>
                </div>
                <div>
                  <span className="text-slate-500">Assunto que Márcio retomará: </span>
                  <span className="text-slate-800">{simQualActive.marcioResumeTopic}</span>
                </div>
              </div>

              {/* Before vs After Comparison (Draft vs Published) */}
              <div className="p-3.5 border border-[#E2E8F0] rounded-md space-y-1.5 text-xs">
                <div className="font-semibold text-[#0F2744]">
                  Comparação Antes (Publicada v{publishedSnap.version}) × Depois (Rascunho {funnel.draft.version})
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="text-[11px] text-slate-500">Versão Publicada v{publishedSnap.version}</div>
                    <div className="font-medium text-slate-800 mt-0.5">
                      {simQualPublished.availableCount}/4 disponíveis · Gargalo: {simQualPublished.bottleneckLabel}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Rascunho atual</div>
                    <div className="font-medium text-[#0F2744] mt-0.5">
                      {simQualDraft.availableCount}/4 disponíveis · Gargalo: {simQualDraft.bottleneckLabel}
                    </div>
                  </div>
                </div>
              </div>

              {/* Triggered rules */}
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-1">Regras acionadas</div>
                {simQualActive.triggeredRules.length === 0 ? (
                  <p className="text-xs text-slate-500">Responda às perguntas ao lado para ver as regras acionadas.</p>
                ) : (
                  <ul className="space-y-1 text-[11px] text-slate-600 list-disc pl-4">
                    {simQualActive.triggeredRules.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: HISTÓRICO DE VERSÕES ==================== */}
      {activeTab === 'history' && (
        <section className="bg-white border border-[#E2E8F0] rounded-lg divide-y divide-slate-100">
          <div className="p-5">
            <h2 className="text-sm font-semibold text-[#0F2744]">Histórico de versões do funil</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Submissões anteriores preservam integralmente perguntas, respostas e versão das regras usadas no momento da conversão.
            </p>
          </div>

          <div className="p-5 bg-[#FFFBEB]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-[#B45309]">
                {funnel.draft.version} · Rascunho em edição
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {funnel.draft.summary} ({funnel.draft.steps.length} etapas)
              </div>
            </div>
            <div className="text-xs font-mono text-slate-500 tabular-nums">
              Editado em {funnel.draft.createdAt}
            </div>
          </div>

          {funnel.versions.map((ver) => {
            const leadsInVersion = state.leads.filter(
              (l) => l.funnelId === funnel.id && l.funnelVersion === ver.version
            ).length;
            return (
              <div
                key={ver.version}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-[#0F2744]">v{ver.version}</span>
                    <span className="text-slate-300">·</span>
                    <span
                      className={
                        ver.status === 'publicada'
                          ? 'font-semibold text-[#15803D]'
                          : 'text-slate-500'
                      }
                    >
                      {ver.status === 'publicada' ? 'Versão publicada ativa' : 'Arquivada (preservada)'}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-600 tabular-nums">
                      {leadsInVersion} lead(s) convertidos nesta versão
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1">{ver.summary}</p>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Publicada por {GESTOR_MAP[ver.createdBy]?.nome} em {ver.createdAt} · {ver.steps.length} etapas
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Create New Funnel Modal */}
      {showNewFunnelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[#0F2744]">Criar novo funil</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Nome do funil</label>
                <input
                  type="text"
                  value={newFunnelName}
                  onChange={(e) => setNewFunnelName(e.target.value)}
                  placeholder="Ex.: Triagem Rápida — Locação de Frotas"
                  className="w-full h-9 px-3 border border-[#E2E8F0] rounded-md"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={newFunnelDesc}
                  onChange={(e) => setNewFunnelDesc(e.target.value)}
                  placeholder="Finalidade e páginas onde será incorporado..."
                  className="w-full p-2.5 border border-[#E2E8F0] rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewFunnelModal(false)}
                className="h-9 px-3 text-xs font-medium text-slate-600 border border-[#E2E8F0] rounded-md"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  createFunnel(newFunnelName, newFunnelDesc);
                  setNewFunnelName('');
                  setNewFunnelDesc('');
                  setShowNewFunnelModal(false);
                }}
                className="h-9 px-4 text-xs font-semibold text-white bg-[#15803D] rounded-md"
              >
                Criar funil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
