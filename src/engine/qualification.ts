import {
  FunnelPathId,
  FunnelStep,
  PorteEmpresa,
  QualificationGroupKey,
  QualificationResult,
  QualificationRuleConfig,
  SemaphoreStatus,
  ValidationIssue,
} from '../types/domain';

export const PATH_LABELS: Record<FunnelPathId, string> = {
  avaliar_empresa: 'Avaliar minha empresa',
  ja_tenho_edital: 'Já tenho um edital',
  delegar_participacao: 'Quero delegar a participação',
  aprender_disputar: 'Quero aprender a disputar',
  encontrar_oportunidades: 'Quero encontrar oportunidades',
};

export const SEMAPHORE_LABELS: Record<SemaphoreStatus, string> = {
  verde: 'Verde — disponível declarado',
  amarelo: 'Amarelo — em organização',
  vermelho: 'Vermelho — pendência declarada',
  cinza: 'Cinza — desconhecido ou aplicabilidade a verificar',
};

export const SEMAPHORE_SHORT: Record<SemaphoreStatus, string> = {
  verde: 'Disponível declarado',
  amarelo: 'Em organização',
  vermelho: 'Pendência declarada',
  cinza: 'A verificar',
};

export const GROUP_DEFAULT_LABELS: Record<QualificationGroupKey, string> = {
  empresa_representacao: 'Empresa e representação',
  comprovacao_tecnica: 'Comprovação técnica',
  certidoes: 'Certidões',
  demonstracoes_contabeis: 'Demonstrações contábeis',
};

/**
 * Discards answers belonging to abandoned branches whenever the user changes path.
 */
export function pruneAnswersForActivePath(
  steps: FunnelStep[],
  answers: Record<string, string>,
  activePath: FunnelPathId | undefined
): Record<string, string> {
  if (!activePath) return { ...answers };
  const cleaned: Record<string, string> = {};
  for (const step of steps) {
    if (step.pathScope === 'common' || step.pathScope === activePath) {
      if (answers[step.fieldKey] !== undefined) {
        cleaned[step.fieldKey] = answers[step.fieldKey];
      }
    }
  }
  return cleaned;
}

/**
 * Resolves the next step id given current step and selected answer value.
 */
export function getNextStepId(step: FunnelStep, answerValue?: string): string | undefined {
  if (step.type === 'single_choice' && step.options && answerValue) {
    const chosen = step.options.find((o) => o.value === answerValue);
    if (chosen?.nextStepId) return chosen.nextStepId;
  }
  return step.defaultNextStepId;
}

/**
 * Computes the ordered path of steps visited given current answers.
 */
export function traceFunnelPath(
  steps: FunnelStep[],
  answers: Record<string, string>
): { visitedSteps: FunnelStep[]; activePath: FunnelPathId | undefined } {
  if (steps.length === 0) return { visitedSteps: [], activePath: undefined };
  const stepMap = new Map(steps.map((s) => [s.id, s]));
  const visitedSteps: FunnelStep[] = [];
  const seen = new Set<string>();

  let current: FunnelStep | undefined = steps[0];
  let activePath: FunnelPathId | undefined = answers.intencao as FunnelPathId | undefined;

  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    visitedSteps.push(current);

    if (current.type === 'result') {
      if (!activePath && current.resultConfig?.pathId) {
        activePath = current.resultConfig.pathId;
      }
      break;
    }

    const val = answers[current.fieldKey];
    if (current.fieldKey === 'intencao' && val) {
      activePath = val as FunnelPathId;
    }
    if (!val && current.required) {
      break;
    }
    const nextId = getNextStepId(current, val);
    if (!nextId) break;
    current = stepMap.get(nextId);
  }

  return { visitedSteps, activePath };
}

/**
 * Validates funnel graph before publishing:
 * detects dead ends, missing targets, cycles, and overlapping conditions.
 */
export function validateFunnelSteps(steps: FunnelStep[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const stepIds = new Set(steps.map((s) => s.id));

  for (const step of steps) {
    if (step.type === 'result') continue;

    // Check missing default target
    if (step.defaultNextStepId && !stepIds.has(step.defaultNextStepId)) {
      issues.push({
        id: `missing-default-${step.id}`,
        stepId: step.id,
        severity: 'error',
        code: 'MISSING_TARGET',
        message: `Destino padrão "${step.defaultNextStepId}" não existe neste funil.`,
      });
    }

    if (step.type === 'single_choice') {
      const opts = step.options ?? [];
      const seenValues = new Set<string>();

      if (opts.length === 0) {
        issues.push({
          id: `empty-opts-${step.id}`,
          stepId: step.id,
          severity: 'error',
          code: 'DEAD_END',
          message: 'Pergunta de múltipla escolha sem alternativas configuradas.',
        });
      }

      for (const opt of opts) {
        // Overlapping condition check (duplicate option values or duplicate conditional triggers)
        const normalized = opt.value.trim().toLowerCase();
        if (seenValues.has(normalized)) {
          issues.push({
            id: `overlap-${step.id}-${opt.id}`,
            stepId: step.id,
            severity: 'error',
            code: 'OVERLAPPING_CONDITION',
            message: `Condição sobreposta: valor "${opt.value}" repetido em mais de uma alternativa.`,
          });
        }
        seenValues.add(normalized);

        const target = opt.nextStepId || step.defaultNextStepId;
        if (!target) {
          issues.push({
            id: `dead-end-${step.id}-${opt.id}`,
            stepId: step.id,
            severity: 'error',
            code: 'DEAD_END',
            message: `Caminho sem saída: a alternativa "${opt.label}" não aponta para nenhuma etapa seguinte.`,
          });
        } else if (!stepIds.has(target)) {
          issues.push({
            id: `missing-opt-${step.id}-${opt.id}`,
            stepId: step.id,
            severity: 'error',
            code: 'MISSING_TARGET',
            message: `Destino inexistente "${target}" configurado na alternativa "${opt.label}".`,
          });
        }
      }
    } else if (step.type === 'text_input') {
      if (!step.defaultNextStepId) {
        issues.push({
          id: `dead-end-text-${step.id}`,
          stepId: step.id,
          severity: 'error',
          code: 'DEAD_END',
          message: 'Etapa de texto sem destino configurado para continuar o fluxo.',
        });
      }
    }
  }

  // Cycle detection via DFS
  const adj = new Map<string, string[]>();
  for (const step of steps) {
    const targets = new Set<string>();
    if (step.defaultNextStepId && stepIds.has(step.defaultNextStepId)) {
      targets.add(step.defaultNextStepId);
    }
    if (step.options) {
      for (const opt of step.options) {
        if (opt.nextStepId && stepIds.has(opt.nextStepId)) {
          targets.add(opt.nextStepId);
        }
      }
    }
    adj.set(step.id, Array.from(targets));
  }

  const color = new Map<string, 0 | 1 | 2>(); // 0 unvisited, 1 visiting, 2 done
  const cycleReported = new Set<string>();

  function dfs(nodeId: string) {
    color.set(nodeId, 1);
    for (const next of adj.get(nodeId) ?? []) {
      const c = color.get(next) ?? 0;
      if (c === 1 && !cycleReported.has(nodeId)) {
        cycleReported.add(nodeId);
        issues.push({
          id: `cycle-${nodeId}-${next}`,
          stepId: nodeId,
          severity: 'error',
          code: 'CYCLE',
          message: `Ciclo detectado: esta etapa retorna direta ou indiretamente para "${steps.find((s) => s.id === next)?.title ?? next}".`,
        });
      } else if (c === 0) {
        dfs(next);
      }
    }
    color.set(nodeId, 2);
  }

  for (const step of steps) {
    if ((color.get(step.id) ?? 0) === 0) {
      dfs(step.id);
    }
  }

  return issues;
}

/**
 * Evaluates qualification state strictly from active-branch answers and version config.
 * Never produces an eligibility average; strictly describes declared groups, technical bottleneck,
 * commercial priority, and legal alerts.
 */
export function evaluateQualification(
  steps: FunnelStep[],
  rawAnswers: Record<string, string>,
  config: QualificationRuleConfig
): QualificationResult {
  const intent = (rawAnswers.intencao as FunnelPathId) || 'avaliar_empresa';
  const answers = pruneAnswersForActivePath(steps, rawAnswers, intent);
  const triggeredRules: string[] = [];

  const groups: Record<QualificationGroupKey, SemaphoreStatus> = {
    empresa_representacao: 'cinza',
    comprovacao_tecnica: 'cinza',
    certidoes: 'cinza',
    demonstracoes_contabeis: 'cinza',
  };

  // Apply effects strictly from steps belonging to 'common' or active intent
  for (const step of steps) {
    if (step.pathScope !== 'common' && step.pathScope !== intent) continue;
    if (step.type !== 'single_choice' || !step.options) continue;
    const val = answers[step.fieldKey];
    if (!val) continue;
    const opt = step.options.find((o) => o.value === val);
    if (opt?.groupEffect) {
      groups[opt.groupEffect.group] = opt.groupEffect.status;
      triggeredRules.push(
        `Etapa "${step.title}" → ${config.groupLabels[opt.groupEffect.group]}: ${SEMAPHORE_SHORT[opt.groupEffect.status]}`
      );
    }
  }

  // Infer empresa_representacao from porte if still cinza and porte is clearly declared
  const porte = (answers.porte as PorteEmpresa) || 'Não sei';
  if (groups.empresa_representacao === 'cinza') {
    if (porte === 'ME' || porte === 'EPP' || porte === 'Demais') {
      groups.empresa_representacao = 'verde';
      triggeredRules.push(`Porte declarado (${porte}) → Empresa e representação: Disponível declarado`);
    } else if (porte === 'MEI') {
      groups.empresa_representacao = 'amarelo';
      triggeredRules.push('Porte MEI → Empresa e representação: Em organização (enquadramento a confirmar)');
    }
  }

  const groupKeys: QualificationGroupKey[] = [
    'empresa_representacao',
    'comprovacao_tecnica',
    'certidoes',
    'demonstracoes_contabeis',
  ];

  const availableCount = groupKeys.filter((k) => groups[k] === 'verde').length;
  const legalAlerts: string[] = [];

  // Rule: Technical proof is critical when applicable — must appear even if other 3 groups are green!
  let bottleneckGroup: QualificationGroupKey | null = null;
  const techStatus = groups.comprovacao_tecnica;

  if (
    config.technicalIsCriticalWhenApplicable &&
    (techStatus === 'vermelho' || techStatus === 'amarelo' || techStatus === 'cinza')
  ) {
    if (techStatus === 'vermelho' || techStatus === 'amarelo') {
      bottleneckGroup = 'comprovacao_tecnica';
      triggeredRules.push(
        'Regra crítica: Comprovação técnica destacada como gargalo principal mesmo com demais grupos verdes.'
      );
    }
  }

  if (!bottleneckGroup) {
    // Check any vermelho first
    const firstRed = groupKeys.find((k) => groups[k] === 'vermelho');
    if (firstRed) {
      bottleneckGroup = firstRed;
    } else {
      const firstYellow = groupKeys.find((k) => groups[k] === 'amarelo');
      if (firstYellow) {
        bottleneckGroup = firstYellow;
      } else {
        const firstGray = groupKeys.find((k) => groups[k] === 'cinza');
        bottleneckGroup = firstGray ?? null;
      }
    }
  }

  // ME/EPP favorable tax treatment alert
  const hasFiscalIssue = groups.certidoes === 'vermelho' || groups.certidoes === 'amarelo';
  if (config.meEppFiscalFavorableRule && hasFiscalIssue && (porte === 'ME' || porte === 'EPP')) {
    legalAlerts.push(
      'Pendência fiscal declarada com porte ME/EPP: o advogado verificará se o tratamento favorecido (regularização tardia na LC 123/2006) é aplicável ao caso.'
    );
    triggeredRules.push('Alerta jurídico acionado: tratamento favorecido ME/EPP em certidões.');
  }

  // Unknown porte or MEI review
  if (config.flagUnknownPorteAndMeiReview && (porte === 'MEI' || porte === 'Não sei')) {
    legalAlerts.push(
      porte === 'MEI'
        ? 'Porte MEI sem enquadramento confirmado: encaminhar para conferência de limites e objeto compatível.'
        : 'Porte empresarial não informado ("Não sei"): encaminhar para conferência documental inicial.'
    );
    triggeredRules.push(`Conferência de porte acionada (${porte}).`);
  }

  // Document readiness (separate from commercial priority and legal review!)
  let documentReadiness: QualificationResult['documentReadiness'] = 'Pronto para avanço';
  if (groups.comprovacao_tecnica === 'vermelho' || groupKeys.some((k) => groups[k] === 'vermelho')) {
    documentReadiness = 'Pendência crítica';
  } else if (groupKeys.some((k) => groups[k] === 'amarelo')) {
    documentReadiness = 'Prontidão parcial';
  } else if (groupKeys.some((k) => groups[k] === 'cinza')) {
    documentReadiness = 'A verificar';
  }

  // Check edital urgency
  const isEditalRoute = intent === 'ja_tenho_edital';
  const deadlineRaw = answers.edital_prazo || '';
  const isUrgentEdital =
    isEditalRoute &&
    (deadlineRaw.toLowerCase().includes('urgent') ||
      deadlineRaw.toLowerCase().includes('semana') ||
      deadlineRaw.toLowerCase().includes('dia') ||
      deadlineRaw.includes('2026-11') ||
      deadlineRaw.includes('2026-12'));

  // Commercial priority (separate from document readiness)
  let commercialPriority: QualificationResult['commercialPriority'] = 'Média — estruturada';
  if (isEditalRoute && config.prioritizeUrgentEditalWithPartialDocs) {
    commercialPriority = 'Alta — imediata';
    triggeredRules.push(
      isUrgentEdital
        ? 'Prioridade comercial máxima: edital com prazo próximo entra no topo da fila mesmo com avaliação documental parcial.'
        : 'Rota "Já tenho um edital": prioridade comercial imediata para triagem de 15 min.'
    );
  } else if (config.priorityThresholds.highPriorityIntents.includes(intent)) {
    commercialPriority = 'Alta — imediata';
    triggeredRules.push(`Intenção prioritária (${PATH_LABELS[intent]}): prioridade comercial alta.`);
  } else if (intent === 'aprender_disputar') {
    commercialPriority = 'Educacional / nutrição';
  }

  // Legal review status
  let legalReviewStatus: QualificationResult['legalReviewStatus'] = 'Triagem padrão';
  if (isEditalRoute) {
    legalReviewStatus = 'Triagem urgente de edital (15 min)';
  } else if (hasFiscalIssue && (porte === 'ME' || porte === 'EPP')) {
    legalReviewStatus = 'Verificar tratamento favorecido ME/EPP';
  } else if (porte === 'MEI' || porte === 'Não sei') {
    legalReviewStatus = 'Conferir enquadramento (MEI / porte desconhecido)';
  }

  // Lookup custom result step copy for this path
  const resultStep = steps.find(
    (s) => s.type === 'result' && s.resultConfig?.pathId === intent
  );

  const bottleneckLabel = bottleneckGroup
    ? config.groupLabels[bottleneckGroup]
    : 'Nenhum gargalo crítico declarado';

  // Public summary strictly describes declared answers — NO average/score!
  let publicSummaryLine = `Você declarou ter ${availableCount} de 4 grupos disponíveis.`;
  if (bottleneckGroup === 'comprovacao_tecnica') {
    publicSummaryLine += ' O próximo passo é verificar como comprovar a experiência técnica da sua empresa.';
  } else if (bottleneckGroup === 'certidoes') {
    publicSummaryLine += ' O próximo passo é mapear a regularidade fiscal e certidões aplicáveis.';
  } else if (bottleneckGroup === 'demonstracoes_contabeis') {
    publicSummaryLine += ' O próximo passo é alinhar os balanços e índices contábeis exigidos.';
  } else if (bottleneckGroup === 'empresa_representacao') {
    publicSummaryLine += ' O próximo passo é confirmar o contrato social, enquadramento e poderes de representação.';
  } else {
    publicSummaryLine += ' O próximo passo é validar os documentos na conversa inicial e definir o plano de disputa.';
  }

  const publicNextStep =
    resultStep?.resultConfig?.nextStepText ||
    (isEditalRoute
      ? 'Realizar a triagem inicial de 15 minutos do edital para confirmar aderência, lote e prazo. A revisão jurídica completa é serviço contratado.'
      : 'Agendar a primeira conversa objetiva para destravar o principal ponto identificado e estruturar a participação.');

  const ctaLabel =
    isEditalRoute
      ? 'Triagem do edital (15 min)'
      : resultStep?.resultConfig?.ctaLabel || 'Agendar primeira conversa com Márcio';

  const marcioResumeTopic = isEditalRoute
    ? `Triagem inicial (15 min) do edital ${answers.edital_codigo || 'informado'} · gargalo: ${bottleneckLabel}`
    : `${PATH_LABELS[intent]} · ${availableCount} de 4 grupos disponíveis · foco em ${bottleneckLabel}`;

  return {
    groups,
    availableCount,
    totalGroups: 4,
    bottleneckGroup,
    bottleneckLabel,
    documentReadiness,
    commercialPriority,
    legalReviewStatus,
    legalAlerts,
    publicSummaryLine,
    publicNextStep,
    ctaLabel,
    marcioResumeTopic,
    triggeredRules,
  };
}
