export type MenuRoute =
  | 'overview'
  | 'projects'
  | 'tasks'
  | 'demo-roadmap'
  | 'leads'
  | 'qualification'
  | 'meetings'
  | 'proposals'
  | 'funnels'
  | 'sales-pages'
  | 'campaigns'
  | 'cadences'
  | 'radar'
  | 'sources'
  | 'triage'
  | 'acompanhamentos'
  | 'clients'
  | 'documents'
  | 'client-tenders'
  | 'indicators'
  | 'audit-log'
  | 'team'
  | 'integrations'
  | 'csv-export';

export type GestorId = 'marcio' | 'ribamar' | 'ribamar_jr';

export interface Gestor {
  id: GestorId;
  nome: string;
  papel: string;
  email: string;
  acessoJuridicoRestrito: boolean;
  primeiraAbordagem: boolean;
}

export type SemaphoreStatus = 'verde' | 'amarelo' | 'vermelho' | 'cinza';

export type QualificationGroupKey =
  | 'empresa_representacao'
  | 'comprovacao_tecnica'
  | 'certidoes'
  | 'demonstracoes_contabeis';

export type FunnelPathId =
  | 'avaliar_empresa'
  | 'ja_tenho_edital'
  | 'delegar_participacao'
  | 'aprender_disputar'
  | 'encontrar_oportunidades';

export type LeadStage =
  | 'Novo'
  | 'Em contato'
  | 'Respondeu'
  | 'Documentos solicitados'
  | 'Reunião agendada'
  | 'Proposta'
  | 'Procuração pendente'
  | 'Procuração assinada e validada'
  | 'Cliente ativo'
  | 'Encerrado';

export type DocumentStatus = 'Solicitado' | 'Recebido' | 'Aprovado' | 'A corrigir';

export type ProcuracaoStatus =
  | 'Não iniciada'
  | 'Pendente de assinatura'
  | 'Assinada e validada'
  | 'Vencida'
  | 'Revogada';

export type PorteEmpresa = 'MEI' | 'ME' | 'EPP' | 'Demais' | 'Não sei';

export interface ProjectNiche {
  id: string;
  nome: string;
  nicho: string;
  descricao: string;
  responsaveis: GestorId[];
  regioes: string[];
  funilIds: string[];
  proximaAcao: string;
  metaMensalLeads: number;
}

export interface FunnelOption {
  id: string;
  label: string;
  value: string;
  nextStepId?: string; // Explicit jump target from this answer
  groupEffect?: {
    group: QualificationGroupKey;
    status: SemaphoreStatus;
  };
  isUnknownOption?: boolean;
}

export type StepType = 'single_choice' | 'text_input' | 'result';

export interface FunnelStep {
  id: string;
  title: string;
  subtitle?: string;
  type: StepType;
  required: boolean;
  allowDontKnow: boolean;
  pathScope: 'common' | FunnelPathId;
  fieldKey: string;
  options?: FunnelOption[];
  placeholder?: string;
  defaultNextStepId?: string;
  // For result steps
  resultConfig?: {
    pathId: FunnelPathId;
    headline: string;
    motivationalText: string;
    nextStepText: string;
    ctaLabel: string;
    showProgressIndicatorDefault: boolean;
    contractedServiceNote?: string;
  };
}

export interface QualificationRuleConfig {
  versionNote: string;
  technicalIsCriticalWhenApplicable: boolean;
  prioritizeUrgentEditalWithPartialDocs: boolean;
  meEppFiscalFavorableRule: boolean;
  flagUnknownPorteAndMeiReview: boolean;
  groupLabels: Record<QualificationGroupKey, string>;
  priorityThresholds: {
    urgentDeadlineDays: number;
    highPriorityIntents: FunnelPathId[];
  };
}

export interface FunnelVersionSnapshot {
  version: string;
  status: 'publicada' | 'rascunho' | 'arquivada';
  createdAt: string;
  createdBy: GestorId;
  summary: string;
  steps: FunnelStep[];
  qualificationConfig: QualificationRuleConfig;
}

export interface Funnel {
  id: string;
  name: string;
  description: string;
  projectIds: string[];
  publishedVersion: string;
  hasDraft: boolean;
  draft: FunnelVersionSnapshot;
  versions: FunnelVersionSnapshot[];
}

export interface ValidationIssue {
  id: string;
  stepId: string;
  severity: 'error' | 'warning';
  code: 'DEAD_END' | 'MISSING_TARGET' | 'CYCLE' | 'OVERLAPPING_CONDITION';
  message: string;
}

export interface QualificationResult {
  groups: Record<QualificationGroupKey, SemaphoreStatus>;
  availableCount: number;
  totalGroups: number;
  bottleneckGroup: QualificationGroupKey | null;
  bottleneckLabel: string;
  documentReadiness: 'Pronto para avanço' | 'Prontidão parcial' | 'Pendência crítica' | 'A verificar';
  commercialPriority: 'Alta — imediata' | 'Média — estruturada' | 'Educacional / nutrição';
  legalReviewStatus:
    | 'Triagem padrão'
    | 'Verificar tratamento favorecido ME/EPP'
    | 'Conferir enquadramento (MEI / porte desconhecido)'
    | 'Triagem urgente de edital (15 min)';
  legalAlerts: string[];
  publicSummaryLine: string;
  publicNextStep: string;
  ctaLabel: string;
  marcioResumeTopic: string;
  triggeredRules: string[];
}

export interface SalesPage {
  id: string;
  slug: string;
  url: string;
  title: string;
  headline: string;
  subheadline: string;
  projectId: string;
  funnelId: string;
  campaignName: string;
  utmSource: string;
  utmCampaign: string;
  active: boolean;
}

export interface LeadDocument {
  id: string;
  name: string;
  group: QualificationGroupKey;
  status: DocumentStatus;
  updatedAt: string;
  note?: string;
}

export interface LeadHistoryEvent {
  id: string;
  at: string;
  actor: string;
  description: string;
  type: 'stage' | 'cadence' | 'meeting' | 'document' | 'legal' | 'procuracao' | 'submission';
}

export interface Lead {
  id: string;
  dedupeKey?: string;
  companyName: string;
  cnpj?: string;
  contactName: string;
  contactChannel: 'WhatsApp' | 'Ligação' | 'E-mail';
  contactValue: string;
  wantsFutureAlerts: boolean;
  projectId: string;
  funnelId: string;
  funnelVersion: string;
  salesPageId: string;
  salesPageUrl: string;
  campaign: string;
  intent: FunnelPathId;
  porte: PorteEmpresa;
  offerSummary: string;
  territory: string;
  editalCode?: string;
  editalLot?: string;
  editalDeadline?: string; // ISO date YYYY-MM-DD
  stage: LeadStage;
  closedReason?: string;
  ownerFirstContact: GestorId;
  assignedPartners: GestorId[];
  nextReturnAt: string; // ISO date YYYY-MM-DD
  noReturnYet: boolean;
  triageMinutesActual?: number;
  answersSnapshot: Record<string, string>;
  stepsSnapshot: { stepId: string; title: string; answerLabel: string }[];
  qualification: QualificationResult;
  procuracaoStatus: ProcuracaoStatus;
  procuracaoValidUntil?: string;
  cadenceId?: string;
  cadencePaused: boolean;
  cadencePauseReason?: string;
  documents: LeadDocument[];
  history: LeadHistoryEvent[];
  createdAt: string;
  clientId?: string;
}

export interface Meeting {
  id: string;
  leadId: string;
  companyName: string;
  projectId: string;
  title: string;
  agenda: string;
  dateTime: string; // ISO string or readable date/time
  dateIso: string; // YYYY-MM-DD
  participants: GestorId[];
  status: 'Agendada' | 'Realizada' | 'Cancelada';
  durationMinutes: number;
}

export interface TaskItem {
  id: string;
  title: string;
  owner: GestorId;
  projectId: string;
  leadId?: string;
  editalId?: string;
  dueDate: string; // YYYY-MM-DD
  overdue: boolean;
  done: boolean;
  category: 'Primeira abordagem' | 'Documentação' | 'Triagem jurídica' | 'Reunião' | 'Procuração';
  dedupeKey?: string;
}

export interface NotificationItem {
  id: string;
  at: string;
  recipient: GestorId;
  title: string;
  message: string;
  read: boolean;
  leadId?: string;
  dedupeKey?: string;
}

export interface CadenceStepRule {
  id: string;
  route: FunnelPathId | 'pendencia_documental';
  routeLabel: string;
  trigger: string;
  condition: string;
  delay: string;
  messageTemplate: string;
  owner: GestorId;
  stopRule: string;
  active: boolean;
}

export interface OfficialSource {
  id: string;
  uf: string;
  municipio: string;
  ibgeCode: string;
  portalName: string;
  urlLicitacoes?: string;
  urlPrefeitura: string;
  canalFuncao: string;
  perfilTerritorial: string;
  situacaoValidacao: string;
  evidenciaInstitucional?: string;
  dataConsulta: string;
  diarioUf?: string;
  comprasEstadual?: string;
  statusHttpCatalogo: string;
  hasConfirmedEdital: boolean;
  originSheet: 'BUSCADOR NACIONAL' | 'FONTES MUNICIPAIS' | 'FONTES NACIONAIS' | 'MAPA 27 UFs';
}

export interface VinculoSocio {
  id: string;
  orgao: string;
  cnpjOrgao?: string;
  uf: string;
  municipio: string;
  socio: GestorId;
  natureza: string;
  vigencia: string;
  situacaoJuridica: 'Vínculo ativo — bloqueio obrigatório' | 'Potencial vínculo — em análise jurídica' | 'Sem vínculo confirmado (controle positivo)';
  bloqueiaRadar: boolean;
  parecerNota: string;
}

export interface Edital {
  id: string;
  codigo: string;
  versaoEdital: string;
  orgao: string;
  uf: string;
  municipio: string;
  objeto: string;
  modalidade: 'Pregão Eletrônico' | 'Concorrência Eletrônica' | 'Dispensa Eletrônica';
  valorEstimado: string;
  prazoIso: string; // YYYY-MM-DD
  situacao: 'Verificado no Radar' | 'Em triagem' | 'Aprovado para disputa' | 'Encerrado';
  fonteId: string;
  fonteNome: string;
  originSheet: 'RADAR PRIORITÁRIO' | 'EDITAIS — TRIAGEM' | 'BUSCADOR NACIONAL';
  dataConferencia: string;
  projectIds: string[];
  triageMinutes?: number;
}

export interface AcompanhamentoEdital {
  id: string;
  editalId: string;
  projectId: string;
  clientId?: string;
  lote: string;
  responsavel: GestorId;
  proximaAcao: string;
  motivoCompatibilidade: string;
  status: 'Em análise' | 'Habilitação em preparo' | 'Parecer jurídico liberado' | 'Proposta habilitada' | 'Bloqueado por parecer';
  parecerJuridicoLiberado: boolean;
  parecerEditalVersao?: string;
  propostaHabilitada: boolean;
}

export interface ClientCompany {
  id: string;
  leadId?: string;
  razaoSocial: string;
  cnpj: string;
  porte: PorteEmpresa;
  projectId: string;
  uf: string;
  municipio: string;
  interlocutorAtual: string;
  interlocutorCargo: string;
  interlocutorContato: string;
  historicoInterlocutores: { nome: string; periodo: string; motivo: string }[];
  procuracaoStatus: ProcuracaoStatus;
  procuracaoValidUntil?: string;
  operacaoAtiva: boolean;
  responsavelComercial: GestorId;
  responsavelJuridico: GestorId;
}

export interface ProposalRecord {
  id: string;
  clientId: string;
  editalId: string;
  editalVersao: string;
  valorProposta: string;
  parecerJuridicoLiberado: boolean;
  status: 'Bloqueada (sem parecer jurídico)' | 'Habilitada para protocolo' | 'Protocolada';
  updatedAt: string;
}

export interface SavedRadarFilter {
  id: string;
  name: string;
  projectId: string;
  uf: string;
  keyword: string;
  modalidade: string;
  status: string;
}

export interface AuditLogEntry {
  id: string;
  at: string;
  actor: string;
  module: string;
  action: string;
  detail: string;
}

export interface AcceptanceTestState {
  t1DraftEditedAndCompared: boolean;
  t2BranchSwitchClean: boolean;
  t3TwoSalesPagesConverted: boolean;
  t4TechBottleneckWithThreeGreens: boolean;
  t5LeadReplyPausedCadence: boolean;
  t6MeetingScheduledWithPartners: boolean;
  t7EditalFilteredAndLinkedToClient: boolean;
  t8ConflictGateVerified: boolean;
  t9ProcuracaoValidatedOpenedOps: boolean;
  t10MobileChecked: boolean;
}

export type CanvasDocumentType = 'documento_livre' | 'procuracao' | 'minuta';

export type FieldOrigin = 'cadastro' | 'documento' | 'pendente';

export type CanvasDocumentStatus =
  | 'Em preparação'
  | 'Rascunho salvo'
  | 'Em revisão interna'
  | 'Aprovado para emissão'
  | 'Minuta enviada para comentários'
  | 'Procuração enviada para assinatura'
  | 'Documento enviado'
  | 'Procuração assinada (simulada)';

export interface DocumentBrandIdentity {
  logoText: string;
  logoSubtext: string;
  accentColor: string;
  headerText: string;
  footerText: string;
}

export interface DocumentClause {
  id: string;
  title: string;
  content: string;
  editedInDoc?: boolean;
}

export interface DocumentRecipient {
  id: string;
  name: string;
  role: string;
  contact: string;
  channel: 'E-mail' | 'WhatsApp';
}

export interface DocumentComment {
  id: string;
  at: string;
  author: string;
  text: string;
}

export interface CanvasFieldEntry {
  value: string;
  origin: FieldOrigin;
  registryValue?: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: CanvasDocumentType;
  description: string;
  defaultTitle: string;
  defaultBody: string;
  clauses: { id: string; title: string; content: string }[];
  defaultPoderes?: string;
  defaultVigencia?: string;
  updatedAt: string;
}

export interface CanvasVersionSnapshot {
  versionId: string;
  versionLabel: string;
  savedAt: string;
  savedBy: string;
  reason: string;
  isEmittedSnapshot: boolean;
  emittedStatus?: CanvasDocumentStatus;
  emittedPurpose?: string;
  deliveryMessage?: string;
  type: CanvasDocumentType;
  title: string;
  brand: DocumentBrandIdentity;
  body: string;
  clauses: DocumentClause[];
  fields: Record<string, CanvasFieldEntry>;
  recipients: DocumentRecipient[];
}

export interface CanvasDocument {
  id: string;
  leadId: string;
  clientId?: string;
  companyName: string;
  type: CanvasDocumentType;
  templateId?: string;
  templateName?: string;
  missingDefaultFor?: 'procuracao' | 'minuta';
  currentVersion: string;
  status: CanvasDocumentStatus;
  internalReviewStatus: 'Não solicitada' | 'Em revisão interna' | 'Aprovada';
  legalCheckPassed: boolean;
  legalCheckNote?: string;
  title: string;
  brand: DocumentBrandIdentity;
  body: string;
  clauses: DocumentClause[];
  fields: Record<string, CanvasFieldEntry>;
  recipients: DocumentRecipient[];
  comments: DocumentComment[];
  sendPurpose?: string;
  deliveryMessage: string;
  inSentQueue: boolean;
  emittedAt?: string;
  emittedSnapshot?: CanvasVersionSnapshot;
  recoverableVersions: CanvasVersionSnapshot[];
  updatedAt: string;
  createdAt: string;
}

export interface DemoState {
  activeProjectId: string; // 'all' or projectId
  projects: ProjectNiche[];
  funnels: Funnel[];
  salesPages: SalesPage[];
  leads: Lead[];
  meetings: Meeting[];
  tasks: TaskItem[];
  notifications: NotificationItem[];
  cadences: CadenceStepRule[];
  sources: OfficialSource[];
  vinculosSocios: VinculoSocio[];
  editais: Edital[];
  acompanhamentos: AcompanhamentoEdital[];
  clients: ClientCompany[];
  proposals: ProposalRecord[];
  savedRadarFilters: SavedRadarFilter[];
  auditLog: AuditLogEntry[];
  acceptance: AcceptanceTestState;
  documentBrandStandard: DocumentBrandIdentity;
  documentTemplates: DocumentTemplate[];
  defaultTemplateIds: {
    procuracao: string | null;
    minuta: string | null;
  };
  canvasDocuments: CanvasDocument[];
}

