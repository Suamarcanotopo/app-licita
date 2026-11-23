import {
  AcompanhamentoEdital,
  CanvasDocument,
  CanvasDocumentType,
  CanvasFieldEntry,
  ClientCompany,
  DocumentBrandIdentity,
  DocumentClause,
  DocumentTemplate,
  Edital,
  Lead,
  VinculoSocio,
} from '../types/domain';

export const DOC_TYPE_LABELS: Record<CanvasDocumentType, string> = {
  documento_livre: 'Documento criado do zero',
  procuracao: 'Procuração',
  minuta: 'Minuta',
};

export const CANVAS_VARIABLE_DEFS: {
  key: string;
  token: string;
  label: string;
  group: 'empresa' | 'procuracao' | 'edital';
}[] = [
  { key: 'razaoSocial', token: '{{empresa}}', label: 'Razão social da empresa', group: 'empresa' },
  { key: 'cnpj', token: '{{cnpj}}', label: 'CNPJ', group: 'empresa' },
  { key: 'porte', token: '{{porte}}', label: 'Porte empresarial', group: 'empresa' },
  { key: 'contatoNome', token: '{{contato}}', label: 'Contato / Interlocutor', group: 'empresa' },
  { key: 'contatoCanalValor', token: '{{canal_contato}}', label: 'Canal e contato do lead', group: 'empresa' },
  { key: 'territorio', token: '{{territorio}}', label: 'Território de atuação', group: 'empresa' },
  { key: 'representanteLegal', token: '{{representante}}', label: 'Representante legal', group: 'procuracao' },
  { key: 'poderes', token: '{{poderes}}', label: 'Poderes outorgados', group: 'procuracao' },
  { key: 'vigencia', token: '{{vigencia}}', label: 'Vigência do instrumento', group: 'procuracao' },
  { key: 'signatarios', token: '{{signatarios}}', label: 'Signatários', group: 'procuracao' },
  { key: 'editalCodigo', token: '{{edital_codigo}}', label: 'Código do edital', group: 'edital' },
  { key: 'editalOrgao', token: '{{edital_orgao}}', label: 'Órgão licitante', group: 'edital' },
  { key: 'editalLote', token: '{{edital_lote}}', label: 'Lote / objeto', group: 'edital' },
  { key: 'editalVersao', token: '{{edital_versao}}', label: 'Versão do edital', group: 'edital' },
];

export const FREE_DOC_PURPOSES = [
  'Informativo e alinhamento inicial',
  'Envio para leitura e comentários',
  'Proposta comercial formal',
  'Solicitação de assinatura eletrônica',
];

function entryFromRegistry(val: string | undefined): CanvasFieldEntry {
  const trimmed = (val || '').trim();
  if (!trimmed) {
    return { value: '', origin: 'pendente', registryValue: '' };
  }
  return { value: trimmed, origin: 'cadastro', registryValue: trimmed };
}

export function resolveVariablesText(
  text: string,
  fields: Record<string, CanvasFieldEntry>
): string {
  let out = text;
  for (const def of CANVAS_VARIABLE_DEFS) {
    const val = fields[def.key]?.value?.trim();
    out = out.split(def.token).join(val || `[PENDENTE: ${def.label}]`);
  }
  out = out.split('{{data_hoje}}').join('23/11/2026');
  return out;
}

export function buildBaseFieldsFromLead(params: {
  lead: Lead;
  client?: ClientCompany;
  linkedEdital?: Edital;
  linkedAcomp?: AcompanhamentoEdital;
  template?: DocumentTemplate;
}): Record<string, CanvasFieldEntry> {
  const { lead, client, linkedEdital, linkedAcomp, template } = params;

  const editalCodigo = linkedEdital?.codigo || lead.editalCode || '';
  const editalOrgao =
    linkedEdital?.orgao ||
    (lead.editalCode?.includes('—') ? lead.editalCode.split('—')[1]?.trim() : '');
  const editalLote = linkedAcomp?.lote || lead.editalLot || '';
  const editalVersao = linkedEdital?.versaoEdital || (editalCodigo ? 'v1.0 (Conferida)' : '');

  const rep = client?.interlocutorAtual || lead.contactName;
  const sig = rep ? `${rep} (${client?.razaoSocial || lead.companyName}) · José Ribamar (JJ LICITA)` : '';

  return {
    razaoSocial: entryFromRegistry(client?.razaoSocial || lead.companyName),
    cnpj: entryFromRegistry(client?.cnpj || lead.cnpj),
    porte: entryFromRegistry(client?.porte || lead.porte),
    contatoNome: entryFromRegistry(client?.interlocutorAtual || lead.contactName),
    contatoCanalValor: entryFromRegistry(`${lead.contactChannel}: ${lead.contactValue}`),
    territorio: entryFromRegistry(lead.territory),
    representanteLegal: entryFromRegistry(rep),
    poderes: template?.defaultPoderes
      ? { value: template.defaultPoderes, origin: 'cadastro', registryValue: template.defaultPoderes }
      : { value: '', origin: 'pendente', registryValue: '' },
    vigencia: template?.defaultVigencia
      ? { value: template.defaultVigencia, origin: 'cadastro', registryValue: template.defaultVigencia }
      : { value: '', origin: 'pendente', registryValue: '' },
    signatarios: entryFromRegistry(sig),
    editalCodigo: entryFromRegistry(editalCodigo),
    editalOrgao: entryFromRegistry(editalOrgao),
    editalLote: entryFromRegistry(editalLote),
    editalVersao: entryFromRegistry(editalVersao),
  };
}

export function evaluateLegalCheckForProcuracao(params: {
  fields: Record<string, CanvasFieldEntry>;
  vinculosSocios: VinculoSocio[];
  linkedAcomp?: AcompanhamentoEdital;
}): { passed: boolean; note: string } {
  const orgao = params.fields.editalOrgao?.value?.trim();
  const editalCode = params.fields.editalCodigo?.value?.trim();

  if (!editalCode && !orgao) {
    return {
      passed: true,
      note: 'Procuração geral sem edital específico vinculado: conferência jurídica padrão aplicável na revisão interna.',
    };
  }

  if (orgao) {
    const conflict = params.vinculosSocios.find(
      (v) => v.bloqueiaRadar && v.orgao.toLowerCase() === orgao.toLowerCase()
    );
    if (conflict) {
      return {
        passed: false,
        note: `Bloqueio de conflito (VínculoSócio): ${conflict.orgao} — ${conflict.situacaoJuridica}. Emissão impedida.`,
      };
    }
  }

  if (params.linkedAcomp && !params.linkedAcomp.parecerJuridicoLiberado) {
    return {
      passed: false,
      note: `Edital ${editalCode} vinculado ainda aguarda liberação do parecer jurídico para esta empresa e versão do edital.`,
    };
  }

  return {
    passed: true,
    note: `Conferência jurídica prévia sem impedimentos para ${editalCode || orgao} (controle de conflito verificado).`,
  };
}

export interface CanvasPendingIssue {
  id: string;
  fieldKey?: string;
  label: string;
  blocking: boolean;
}

export function computeCanvasPendencies(doc: CanvasDocument): CanvasPendingIssue[] {
  const issues: CanvasPendingIssue[] = [];

  if (!doc.title.trim()) {
    issues.push({ id: 'p_title', label: 'Título do documento é obrigatório.', blocking: true });
  }

  if (!doc.fields.razaoSocial?.value?.trim()) {
    issues.push({ id: 'p_razao', fieldKey: 'razaoSocial', label: 'Razão social da empresa não preenchida.', blocking: true });
  }

  if (doc.type === 'procuracao') {
    if (!doc.fields.cnpj?.value?.trim()) {
      issues.push({ id: 'p_cnpj', fieldKey: 'cnpj', label: 'CNPJ obrigatório para emissão da procuração.', blocking: true });
    }
    if (!doc.fields.representanteLegal?.value?.trim()) {
      issues.push({ id: 'p_rep', fieldKey: 'representanteLegal', label: 'Representante legal pendente.', blocking: true });
    }
    if (!doc.fields.poderes?.value?.trim()) {
      issues.push({ id: 'p_pod', fieldKey: 'poderes', label: 'Descrição dos poderes outorgados pendente.', blocking: true });
    }
    if (!doc.fields.vigencia?.value?.trim()) {
      issues.push({ id: 'p_vig', fieldKey: 'vigencia', label: 'Prazo de vigência da procuração pendente.', blocking: true });
    }
    if (!doc.fields.signatarios?.value?.trim()) {
      issues.push({ id: 'p_sig', fieldKey: 'signatarios', label: 'Signatários não definidos.', blocking: true });
    }
    if (!doc.legalCheckPassed) {
      issues.push({
        id: 'p_legal_gate',
        label: doc.legalCheckNote || 'Conferência jurídica de edital / conflito pendente.',
        blocking: true,
      });
    }
    if (doc.internalReviewStatus !== 'Aprovada') {
      issues.push({
        id: 'p_internal_rev',
        label: 'Procuração exige aprovação na revisão interna antes de enviar para assinatura.',
        blocking: true,
      });
    }
  } else if (doc.type === 'minuta') {
    if (!doc.body.trim() && doc.clauses.length === 0) {
      issues.push({ id: 'p_min_body', label: 'Conteúdo da minuta não pode estar vazio.', blocking: true });
    }
  } else {
    // documento_livre
    if (!doc.body.trim() && doc.clauses.length === 0) {
      issues.push({ id: 'p_free_body', label: 'Escreva o conteúdo do documento antes de emitir.', blocking: true });
    }
  }

  if (doc.recipients.length === 0 || doc.recipients.some((r) => !r.contact.trim())) {
    issues.push({
      id: 'p_rec',
      label: 'Informe ao menos um destinatário com contato válido.',
      blocking: true,
    });
  }

  return issues;
}

export function getNextActionLabel(doc: CanvasDocument): string {
  if (doc.type === 'minuta') return 'Enviar minuta para revisão';
  if (doc.type === 'procuracao') return 'Enviar procuração para assinatura';
  return 'Confirmar envio do documento';
}

export function computeTemplateSwitchImpact(
  doc: CanvasDocument,
  incomingTemplate: DocumentTemplate | null
): {
  replacedClauses: string[];
  replacedAdjustments: string[];
  willChangeType: boolean;
  newType: CanvasDocumentType;
} {
  const replacedClauses = doc.clauses
    .filter((c) => c.editedInDoc || c.content.trim().length > 0)
    .map((c) => (c.editedInDoc ? `${c.title} (editada neste documento)` : c.title));

  const replacedAdjustments: string[] = [];
  if (doc.body.trim().length > 0) {
    replacedAdjustments.push('Texto principal da folha A4');
  }

  const incomingType: CanvasDocumentType = incomingTemplate ? incomingTemplate.type : 'documento_livre';
  if (incomingTemplate?.defaultPoderes && doc.fields.poderes?.origin === 'documento') {
    replacedAdjustments.push('Campo "Poderes" (ajustado manualmente)');
  }
  if (incomingTemplate?.defaultVigencia && doc.fields.vigencia?.origin === 'documento') {
    replacedAdjustments.push('Campo "Vigência" (ajustado manualmente)');
  }

  return {
    replacedClauses,
    replacedAdjustments,
    willChangeType: incomingType !== doc.type,
    newType: incomingType,
  };
}

export function applyTemplateClauses(
  template: DocumentTemplate,
  fields: Record<string, CanvasFieldEntry>
): DocumentClause[] {
  return template.clauses.map((c) => ({
    id: c.id,
    title: c.title,
    content: resolveVariablesText(c.content, fields),
    editedInDoc: false,
  }));
}
