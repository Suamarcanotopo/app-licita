import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import {
  evaluateQualification,
  GROUP_DEFAULT_LABELS,
  pruneAnswersForActivePath,
  traceFunnelPath,
} from '../../engine/qualification';
import { FunnelPathId, FunnelStep, QualificationGroupKey } from '../../types/domain';
import { SemaphoreIndicator } from '../../components/StatusLabel';

export const PublicVisitorView: React.FC = () => {
  const {
    state,
    visitorPageId,
    setVisitorPageId,
    visitorJumpEdital,
    setVisitorJumpEdital,
    closeVisitorMode,
    submitPublicConversion,
    setSelectedLeadId,
    setRoute,
    markAcceptance,
  } = useApp();

  const page = state.salesPages.find((p) => p.id === visitorPageId) || state.salesPages[0];
  const funnel = state.funnels.find((f) => f.id === page.funnelId) || state.funnels[0];
  const published = funnel.versions.find((v) => v.status === 'publicada') || funnel.versions[0];

  const [mode, setMode] = useState<'conversion' | 'path'>('conversion');
  const [showProgress, setShowProgress] = useState<boolean>(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [discardedNotice, setDiscardedNotice] = useState<string | null>(null);

  // Contact form after result
  const [channel, setChannel] = useState<'WhatsApp' | 'Ligação' | 'E-mail'>('WhatsApp');
  const [companyName, setCompanyName] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [contactValue, setContactValue] = useState<string>('');
  const [wantsFutureAlerts, setWantsFutureAlerts] = useState<boolean>(false);
  const [submittedResult, setSubmittedResult] = useState<{
    leadId: string;
    deduplicated: boolean;
    marcioTopic: string;
  } | null>(null);

  // Support direct jump to "Já tenho um edital"
  const startEditalDirect = () => {
    const prefilled: Record<string, string> = {
      oferta: page.projectId === 'proj_manutencao' ? 'Manutenção industrial' : 'Fornecimento de equipamentos',
      territorio: 'Estadual',
      porte: 'EPP',
      intencao: 'ja_tenho_edital',
    };
    setAnswers(prefilled);
    const trace = traceFunnelPath(published.steps, prefilled);
    const edIdx = trace.visitedSteps.findIndex((s) => s.id === 'step_ed_identificacao');
    setStepIdx(edIdx >= 0 ? edIdx : 0);
    setSubmittedResult(null);
    setDiscardedNotice(null);
  };

  useEffect(() => {
    if (visitorJumpEdital) {
      startEditalDirect();
      setVisitorJumpEdital(false);
    }
  }, [visitorJumpEdital]);

  const trace = useMemo(
    () => traceFunnelPath(published.steps, answers),
    [published.steps, answers]
  );

  const currentStep = trace.visitedSteps[Math.min(stepIdx, Math.max(0, trace.visitedSteps.length - 1))];
  const isResultStep = currentStep?.type === 'result';

  const qualification = useMemo(
    () => evaluateQualification(published.steps, answers, published.qualificationConfig),
    [published, answers]
  );

  const handleSelectOption = (step: FunnelStep, val: string) => {
    let next = { ...answers, [step.fieldKey]: val };
    if (step.fieldKey === 'intencao') {
      const prevIntent = answers.intencao as FunnelPathId | undefined;
      const newIntent = val as FunnelPathId;
      if (prevIntent && prevIntent !== newIntent) {
        const before = Object.keys(next);
        next = pruneAnswersForActivePath(published.steps, next, newIntent);
        const afterSet = new Set(Object.keys(next));
        const removed = before.filter((k) => !afterSet.has(k));
        if (removed.length > 0) {
          setDiscardedNotice(
            `Ramo anterior limpo: respostas exclusivas (${removed.join(', ')}) descartadas.`
          );
          markAcceptance('t2BranchSwitchClean', true);
        }
      }
    }
    setAnswers(next);
    setSubmittedResult(null);

    if (step.type === 'single_choice') {
      const nextTrace = traceFunnelPath(published.steps, next);
      const curPos = nextTrace.visitedSteps.findIndex((s) => s.id === step.id);
      if (curPos >= 0 && curPos + 1 < nextTrace.visitedSteps.length) {
        setStepIdx(curPos + 1);
      }
    }
  };

  const resetForm = () => {
    setAnswers({});
    setStepIdx(0);
    setSubmittedResult(null);
    setDiscardedNotice(null);
  };

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactValue.trim()) return;
    if (mode === 'path') {
      setSubmittedResult({
        leadId: '',
        deduplicated: false,
        marcioTopic: qualification.marcioResumeTopic,
      });
      return;
    }
    const res = submitPublicConversion({
      salesPageId: page.id,
      funnelId: funnel.id,
      useDraft: false,
      answers,
      companyName: companyName.trim() || `Empresa ${page.slug} Demo Ltda`,
      contactName: contactName.trim() || 'Interlocutor Visitante',
      contactChannel: channel,
      contactValue: contactValue.trim(),
      wantsFutureAlerts,
    });
    setSubmittedResult({
      leadId: res.lead.id,
      deduplicated: res.deduplicated,
      marcioTopic: res.lead.qualification.marcioResumeTopic,
    });
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#0F172A] flex flex-col">
      {/* Compact Visitor Preview Control Bar (<= 56px on mobile) */}
      <div className="sticky top-0 z-40 bg-[#0F2744] text-white border-b border-white/10">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={closeVisitorMode}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 bg-white/10 hover:bg-white/20 rounded-md font-semibold whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao painel</span>
            </button>
            <span className="hidden md:inline font-mono text-slate-300 truncate">
              {page.url} · Funil v{published.version}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Switch between the 2 sales pages */}
            <select
              value={page.id}
              onChange={(e) => {
                setVisitorPageId(e.target.value);
                resetForm();
              }}
              aria-label="Selecionar página de vendas"
              className="h-8 px-2 text-xs bg-[#17355A] text-white border border-white/20 rounded-md max-w-[180px] sm:max-w-none"
            >
              {state.salesPages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>

            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as 'conversion' | 'path');
                setSubmittedResult(null);
              }}
              aria-label="Modo de simulação"
              className="h-8 px-2 text-xs bg-[#17355A] text-white border border-white/20 rounded-md"
            >
              <option value="conversion">Simular conversão (cria lead)</option>
              <option value="path">Simular caminho (sem lead)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Public Sales Page Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Public Brand Header & Hero */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="font-display font-bold text-sm text-[#0F2744]">JJ LICITA</span>
            <span className="font-mono text-[11px] truncate">
              Origem: {page.slug} · {page.campaignName}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Copy Column */}
            <div className="lg:col-span-5 space-y-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0F2744] leading-tight tracking-tight">
                {page.headline}
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">{page.subheadline}</p>

              {/* Direct Shortcut for visitors who already have an edital */}
              <div className="pt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={startEditalDirect}
                  className="inline-flex items-center gap-2 h-10 px-4 text-xs font-semibold text-[#0F2744] bg-white border border-[#0F2744] hover:bg-[#EEF3F9] rounded-md transition-colors whitespace-nowrap"
                >
                  <FileSearch className="w-4 h-4" />
                  <span>Já tenho um edital (acesso direto)</span>
                </button>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] space-y-2 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                  <span>Parecer objetivo exibido antes de solicitar seu contato.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                  <span>Primeira conversa conduzida por Márcio, sem promessas genéricas.</span>
                </div>
                <div className="pt-2">
                  <label className="inline-flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showProgress}
                      onChange={(e) => setShowProgress(e.target.checked)}
                    />
                    <span>Exibir indicador de progresso no formulário</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Embedded Funnel Component */}
            <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-lg p-4 sm:p-6 space-y-5">
              {/* Top meta inside embedded component */}
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-medium text-[#0F2744]">
                  {funnel.name} · v{published.version}
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-[#0F2744]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Recomeçar</span>
                </button>
              </div>

              {showProgress && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                    <span>
                      Etapa {Math.min(stepIdx + 1, trace.visitedSteps.length)} de{' '}
                      {trace.visitedSteps.length}
                    </span>
                    <span>
                      {Math.round(
                        ((Math.min(stepIdx + 1, trace.visitedSteps.length)) /
                          Math.max(trace.visitedSteps.length, 1)) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#15803D] transition-all duration-200"
                      style={{
                        width: `${Math.min(
                          100,
                          ((stepIdx + 1) / Math.max(trace.visitedSteps.length, 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {discardedNotice && (
                <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-md text-xs text-[#166534]">
                  {discardedNotice}
                </div>
              )}

              {!isResultStep && currentStep ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#0F2744]">
                      {currentStep.title}
                    </h2>
                    {currentStep.subtitle && (
                      <p className="text-xs text-slate-500 mt-1">{currentStep.subtitle}</p>
                    )}
                  </div>

                  {currentStep.type === 'single_choice' && (
                    <div className="space-y-2.5">
                      {(currentStep.options || []).map((opt) => {
                        const selected = answers[currentStep.fieldKey] === opt.value;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectOption(currentStep, opt.value)}
                            className={`w-full min-h-[44px] text-left px-4 py-3 text-sm rounded-md border transition-colors ${
                              selected
                                ? 'border-[#0F2744] bg-[#EEF3F9] font-semibold text-[#0F2744]'
                                : 'border-[#CBD5E1] hover:border-[#0F2744] text-slate-800 bg-white'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentStep.type === 'text_input' && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={answers[currentStep.fieldKey] || ''}
                        onChange={(e) => handleSelectOption(currentStep, e.target.value)}
                        placeholder={currentStep.placeholder}
                        className="w-full h-11 px-3.5 text-sm border border-[#CBD5E1] rounded-md focus:border-[#0F2744] focus:outline-none"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (currentStep.required && !answers[currentStep.fieldKey]?.trim()) return;
                            if (stepIdx + 1 < trace.visitedSteps.length) setStepIdx(stepIdx + 1);
                          }}
                          className="h-10 px-5 text-xs font-semibold text-white bg-[#0F2744] hover:bg-[#1A3A63] rounded-md"
                        >
                          Continuar
                        </button>
                        {currentStep.allowDontKnow && (
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectOption(currentStep, 'Não sei');
                              if (stepIdx + 1 < trace.visitedSteps.length) setStepIdx(stepIdx + 1);
                            }}
                            className="h-10 px-4 text-xs font-medium text-slate-700 border border-[#CBD5E1] rounded-md hover:border-[#0F2744]"
                          >
                            Não sei informar
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      disabled={stepIdx === 0}
                      onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                      className="font-medium text-slate-600 hover:text-[#0F2744] disabled:opacity-40"
                    >
                      Voltar pergunta anterior
                    </button>
                    {trace.visitedSteps.some((s) => s.fieldKey === 'intencao') &&
                      currentStep.fieldKey !== 'intencao' && (
                        <button
                          type="button"
                          onClick={() => {
                            const idx = trace.visitedSteps.findIndex((s) => s.fieldKey === 'intencao');
                            if (idx >= 0) setStepIdx(idx);
                          }}
                          className="font-medium text-[#0F2744] hover:underline"
                        >
                          Alterar caminho
                        </button>
                      )}
                  </div>
                </div>
              ) : (
                /* RESULT SCREEN BEFORE ASKING CONTACT */
                <div className="space-y-5">
                  <div className="p-4 sm:p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-3">
                    <div className="text-xs font-semibold text-[#15803D]">
                      Parecer inicial baseado nas suas respostas
                    </div>
                    <h2 className="text-lg font-bold text-[#0F2744]">
                      {currentStep?.resultConfig?.headline || 'Resumo da sua situação atual'}
                    </h2>
                    <p className="text-sm font-medium text-slate-900 leading-relaxed">
                      {qualification.publicSummaryLine}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {currentStep?.resultConfig?.motivationalText}
                    </p>

                    {/* 4 declared groups (never an average!) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {(Object.keys(GROUP_DEFAULT_LABELS) as QualificationGroupKey[]).map((gk) => (
                        <div key={gk} className="p-2.5 bg-white border border-[#E2E8F0] rounded">
                          <div className="text-[11px] text-slate-500">
                            {GROUP_DEFAULT_LABELS[gk]}
                          </div>
                          <div className="mt-1">
                            <SemaphoreIndicator status={qualification.groups[gk]} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200 text-xs space-y-1.5">
                      <div>
                        <span className="text-slate-500">Ponto principal a esclarecer: </span>
                        <strong className="text-[#0F2744]">{qualification.bottleneckLabel}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Próximo passo: </span>
                        <span className="text-slate-800">{qualification.publicNextStep}</span>
                      </div>
                      {currentStep?.resultConfig?.contractedServiceNote && (
                        <p className="text-[11px] text-slate-500 pt-1">
                          {currentStep.resultConfig.contractedServiceNote}
                        </p>
                      )}
                      {qualification.legalAlerts.map((alert, idx) => (
                        <p key={idx} className="text-xs font-medium text-[#B45309] pt-1">
                          Nota jurídica: {alert}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Contact Request Form OR Confirmation */}
                  {submittedResult ? (
                    <div className="p-4 sm:p-5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg space-y-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#15803D]">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>
                          {mode === 'path'
                            ? 'Caminho simulado com sucesso (sem criação de lead)'
                            : submittedResult.deduplicated
                            ? 'Solicitação atualizada sem duplicidade'
                            : 'Solicitação recebida com sucesso'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                        <strong>Márcio</strong> fará a primeira abordagem pelo canal{' '}
                        <strong>{channel}</strong> ({contactValue}) retomando diretamente:{' '}
                        <strong>{submittedResult.marcioTopic}</strong>.
                      </p>
                      <div className="text-xs text-slate-600">
                        Alertas futuros de editais:{' '}
                        {wantsFutureAlerts ? 'Autorizado separadamente' : 'Não solicitado'}.
                      </div>

                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        {mode === 'conversion' && submittedResult.leadId && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLeadId(submittedResult.leadId);
                              closeVisitorMode();
                              setRoute('leads');
                            }}
                            className="inline-flex items-center gap-1.5 h-10 px-4 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md"
                          >
                            <span>Abrir lead criado no painel</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={resetForm}
                          className="h-10 px-4 text-xs font-semibold text-[#0F2744] bg-white border border-[#CBD5E1] rounded-md"
                        >
                          Fazer novo teste
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitContact} className="space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-[#0F2744]">
                          Como prefere receber o retorno de Márcio?
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Escolha o canal e informe apenas o contato correspondente.
                        </p>
                      </div>

                      {/* Channel selector */}
                      <div className="grid grid-cols-3 gap-2">
                        {(['WhatsApp', 'Ligação', 'E-mail'] as const).map((ch) => (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => setChannel(ch)}
                            className={`h-10 text-xs font-semibold rounded-md border transition-colors ${
                              channel === ch
                                ? 'bg-[#0F2744] text-white border-[#0F2744]'
                                : 'bg-white text-slate-700 border-[#CBD5E1] hover:border-[#0F2744]'
                            }`}
                          >
                            {ch}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">
                            Nome da empresa
                          </label>
                          <input
                            type="text"
                            required
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Ex.: Industrial Delta Ltda"
                            className="w-full h-10 px-3 text-sm border border-[#CBD5E1] rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">
                            Seu nome
                          </label>
                          <input
                            type="text"
                            required
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="Ex.: Mariana Souza"
                            className="w-full h-10 px-3 text-sm border border-[#CBD5E1] rounded-md"
                          />
                        </div>
                      </div>

                      <div className="text-xs">
                        <label className="block font-medium text-slate-700 mb-1">
                          {channel === 'E-mail'
                            ? 'Seu melhor e-mail corporativo'
                            : `Seu número para ${channel}`}
                        </label>
                        <input
                          type={channel === 'E-mail' ? 'email' : 'text'}
                          required
                          value={contactValue}
                          onChange={(e) => setContactValue(e.target.value)}
                          placeholder={
                            channel === 'E-mail' ? 'nome@empresa-demo.com.br' : '(11) 99999-0000'
                          }
                          className="w-full h-10 px-3 text-sm border border-[#CBD5E1] rounded-md"
                        />
                      </div>

                      {/* Separate opt-in for future alerts */}
                      <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wantsFutureAlerts}
                          onChange={(e) => setWantsFutureAlerts(e.target.checked)}
                          className="mt-0.5"
                        />
                        <span>
                          Quero receber alertas futuros de editais compatíveis com meu segmento (opção separada do retorno inicial).
                        </span>
                      </label>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setStepIdx(Math.max(0, stepIdx - 1))}
                          className="text-xs font-medium text-slate-600 hover:text-[#0F2744]"
                        >
                          Voltar e revisar respostas
                        </button>
                        <button
                          type="submit"
                          className="h-11 px-5 text-xs sm:text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md transition-colors"
                        >
                          {qualification.ctaLabel}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
