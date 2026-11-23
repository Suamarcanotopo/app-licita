import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Eye,
  FilePlus2,
  History,
  Lock,
  MessageSquare,
  Plus,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import {
  CANVAS_VARIABLE_DEFS,
  computeCanvasPendencies,
  computeTemplateSwitchImpact,
  DOC_TYPE_LABELS,
  FREE_DOC_PURPOSES,
  getNextActionLabel,
} from '../../engine/documentCanvas';
import { CanvasVersionSnapshot, DocumentClause, FieldOrigin } from '../../types/domain';

const ORIGIN_META: Record<FieldOrigin, { label: string; cls: string }> = {
  cadastro: { label: 'Do cadastro', cls: 'text-[#0F2744]' },
  documento: { label: 'Ajustado no doc', cls: 'text-[#15803D]' },
  pendente: { label: 'Pendente', cls: 'text-[#B91C1C]' },
};

export const DocumentCanvas: React.FC = () => {
  const {
    state,
    activeCanvasDocId,
    closeDocumentCanvas,
    updateCanvasDocument,
    saveCanvasDraft,
    applyTemplateToCanvasDocument,
    restoreCanvasVersion,
    sendCanvasToInternalReview,
    approveCanvasInternalReview,
    addCanvasComment,
    confirmEmitCanvasDocument,
    simulateSignProcuracaoDocument,
    setRoute,
    showToast,
  } = useApp();

  const doc = state.canvasDocuments.find((d) => d.id === activeCanvasDocId);
  const [mobileTab, setMobileTab] = useState<'dados' | 'folha' | 'pendencias'>('folha');
  const [viewingEmitted, setViewingEmitted] = useState<boolean>(false);
  const [showA4Preview, setShowA4Preview] = useState<boolean>(false);
  const [previewSnapOverride, setPreviewSnapOverride] = useState<CanvasVersionSnapshot | null>(null);

  // Switch template / Start from scratch modal
  const [switchModalMode, setSwitchModalMode] = useState<'template' | 'blank' | null>(null);
  const [pickedTemplateId, setPickedTemplateId] = useState<string>(
    state.documentTemplates[0]?.id || ''
  );

  // Confirmation before emission modal
  const [showEmitModal, setShowEmitModal] = useState<boolean>(false);
  const [emitMessage, setEmitMessage] = useState<string>('');
  const [emitPurpose, setEmitPurpose] = useState<string>('');

  // Right panel quick inputs
  const [commentText, setCommentText] = useState('');
  const [newRecName, setNewRecName] = useState('');
  const [newRecRole, setNewRecRole] = useState('');
  const [newRecContact, setNewRecContact] = useState('');
  const [newRecChannel, setNewRecChannel] = useState<'E-mail' | 'WhatsApp'>('E-mail');

  React.useEffect(() => {
    if (doc) {
      setViewingEmitted(false);
      setEmitMessage(doc.deliveryMessage);
      setEmitPurpose(doc.sendPurpose || '');
    }
  }, [doc?.id]);

  const pendencies = useMemo(() => (doc ? computeCanvasPendencies(doc) : []), [doc]);
  const blockingPendencies = pendencies.filter((p) => p.blocking);

  if (!doc) return null;

  const activeEmittedSnap = doc.emittedSnapshot;
  const isReadOnlySnapshot = viewingEmitted && !!activeEmittedSnap;

  // Data rendered on A4 (either live draft or immutable emitted snapshot)
  const renderBrand = isReadOnlySnapshot ? activeEmittedSnap.brand : doc.brand;
  const renderTitle = isReadOnlySnapshot ? activeEmittedSnap.title : doc.title;
  const renderBody = isReadOnlySnapshot ? activeEmittedSnap.body : doc.body;
  const renderClauses = isReadOnlySnapshot ? activeEmittedSnap.clauses : doc.clauses;
  const renderFields = isReadOnlySnapshot ? activeEmittedSnap.fields : doc.fields;
  const renderVersion = isReadOnlySnapshot ? activeEmittedSnap.versionLabel : doc.currentVersion;
  const renderType = isReadOnlySnapshot ? activeEmittedSnap.type : doc.type;
  const renderRecipients = isReadOnlySnapshot ? activeEmittedSnap.recipients : doc.recipients;

  const updateFieldValue = (key: string, val: string) => {
    updateCanvasDocument(doc.id, (prev) => {
      const existing = prev.fields[key];
      const regVal = existing?.registryValue ?? '';
      const trimmed = val.trim();
      const nextOrigin: FieldOrigin = !trimmed
        ? 'pendente'
        : trimmed === regVal
        ? 'cadastro'
        : 'documento';
      return {
        ...prev,
        fields: {
          ...prev.fields,
          [key]: { value: val, origin: nextOrigin, registryValue: regVal },
        },
      };
    });
  };

  const insertVariableIntoBody = (key: string, label: string) => {
    const val = doc.fields[key]?.value?.trim();
    const insertion = val || `[PENDENTE: ${label}]`;
    updateCanvasDocument(doc.id, (prev) => ({
      ...prev,
      body: prev.body ? `${prev.body} ${insertion}` : insertion,
    }));
    showToast(`Variável "${label}" inserida na folha A4.`);
  };

  const updateClause = (clauseId: string, patch: Partial<DocumentClause>) => {
    updateCanvasDocument(doc.id, (prev) => ({
      ...prev,
      clauses: prev.clauses.map((c) =>
        c.id === clauseId ? { ...c, ...patch, editedInDoc: true } : c
      ),
    }));
  };

  const addClause = () => {
    const num = doc.clauses.length + 1;
    updateCanvasDocument(doc.id, (prev) => ({
      ...prev,
      clauses: [
        ...prev.clauses,
        {
          id: `cl_${Date.now()}`,
          title: `Cláusula ${num}ª — Nova disposição`,
          content: '',
          editedInDoc: true,
        },
      ],
    }));
  };

  const removeClause = (clauseId: string) => {
    updateCanvasDocument(doc.id, (prev) => ({
      ...prev,
      clauses: prev.clauses.filter((c) => c.id !== clauseId),
    }));
  };

  const handleOpenEmitConfirmation = () => {
    setEmitMessage(doc.deliveryMessage);
    setEmitPurpose(doc.sendPurpose || '');
    setShowEmitModal(true);
  };

  const handleConfirmEmit = () => {
    if (blockingPendencies.length > 0) return;
    if (doc.type === 'documento_livre' && !emitPurpose.trim()) return;
    confirmEmitCanvasDocument(doc.id, {
      deliveryMessage: emitMessage,
      sendPurpose: doc.type === 'documento_livre' ? emitPurpose : undefined,
    });
    setShowEmitModal(false);
  };

  const incomingTemplateForSwitch =
    switchModalMode === 'template'
      ? state.documentTemplates.find((t) => t.id === pickedTemplateId) || null
      : null;

  const switchImpact = switchModalMode
    ? computeTemplateSwitchImpact(doc, incomingTemplateForSwitch)
    : null;

  const renderA4SheetStatic = (opts: {
    brand: typeof doc.brand;
    title: string;
    version: string;
    type: typeof doc.type;
    body: string;
    clauses: DocumentClause[];
    fields: typeof doc.fields;
  }) => (
    <div className="bg-white border border-[#CBD5E1] rounded-md shadow-xs p-6 sm:p-10 space-y-6 text-[#0F172A]">
      {/* Brand Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div
            className="font-display font-bold text-lg tracking-tight"
            style={{ color: opts.brand.accentColor }}
          >
            {opts.brand.logoText}
          </div>
          <div className="text-[11px] text-slate-500">{opts.brand.logoSubtext}</div>
        </div>
        <div className="sm:text-right text-[11px] text-slate-500 space-y-0.5">
          <div>{opts.brand.headerText}</div>
          <div className="font-mono font-semibold text-[#0F2744]">
            {doc.id} · {opts.version} · {DOC_TYPE_LABELS[opts.type]}
          </div>
        </div>
      </div>

      {/* Document Title */}
      <div>
        {opts.type === 'minuta' && (
          <div className="text-[11px] font-semibold text-[#B45309] mb-1">
            MINUTA PARA LEITURA E COMENTÁRIOS — NÃO VALE COMO INSTRUMENTO ASSINADO
          </div>
        )}
        <h2 className="text-lg font-bold text-[#0F2744]">{opts.title}</h2>
      </div>

      {/* Structured Identification Block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-3 border-y border-slate-100 text-xs">
        <div>
          <span className="text-slate-500">Empresa: </span>
          <strong className="text-slate-900">{opts.fields.razaoSocial?.value || '[Pendente]'}</strong>
        </div>
        <div>
          <span className="text-slate-500">CNPJ: </span>
          <span className="font-mono text-slate-800">{opts.fields.cnpj?.value || '[Pendente]'}</span>
        </div>
        {opts.type === 'procuracao' && (
          <>
            <div>
              <span className="text-slate-500">Representante: </span>
              <span className="text-slate-800">{opts.fields.representanteLegal?.value || '[Pendente]'}</span>
            </div>
            <div>
              <span className="text-slate-500">Vigência: </span>
              <span className="text-slate-800">{opts.fields.vigencia?.value || '[Pendente]'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500">Poderes: </span>
              <span className="text-slate-800">{opts.fields.poderes?.value || '[Pendente]'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500">Signatários: </span>
              <span className="text-slate-800">{opts.fields.signatarios?.value || '[Pendente]'}</span>
            </div>
          </>
        )}
        {opts.fields.editalCodigo?.value && (
          <div className="sm:col-span-2">
            <span className="text-slate-500">Edital vinculado: </span>
            <span className="font-mono text-[#0F2744] font-semibold">
              {opts.fields.editalCodigo.value}
            </span>
            {opts.fields.editalOrgao?.value && ` · ${opts.fields.editalOrgao.value}`}
            {opts.fields.editalLote?.value && ` · ${opts.fields.editalLote.value}`}
            {opts.fields.editalVersao?.value && ` (${opts.fields.editalVersao.value})`}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap min-h-[60px]">
        {opts.body || <span className="text-slate-400 italic">Corpo em branco.</span>}
      </div>

      {/* Clauses */}
      {opts.clauses.length > 0 && (
        <div className="space-y-4">
          {opts.clauses.map((cl) => (
            <div key={cl.id} className="space-y-1">
              <h3 className="text-xs font-bold text-[#0F2744]">{cl.title}</h3>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {cl.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Signature lines for Procuracao */}
      {opts.type === 'procuracao' && (
        <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-center">
          <div className="pt-3 border-t border-slate-400">
            <div className="font-semibold text-slate-900">
              {opts.fields.representanteLegal?.value || 'Outorgante'}
            </div>
            <div className="text-slate-500">{opts.fields.razaoSocial?.value}</div>
          </div>
          <div className="pt-3 border-t border-slate-400">
            <div className="font-semibold text-slate-900">José Ribamar · JJ LICITA</div>
            <div className="text-slate-500">Procurador / Conferência Jurídica</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span>{opts.brand.footerText}</span>
        <span className="font-mono">
          {doc.id} · {opts.version}
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] bg-[#F6F8FB] flex flex-col overflow-hidden">
      {/* Top Canvas Toolbar */}
      <header className="bg-white border-b border-[#E2E8F0] px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={closeDocumentCanvas}
            className="p-1.5 text-slate-600 hover:text-[#0F2744] hover:bg-slate-100 rounded-md shrink-0"
            aria-label="Fechar Canvas de Documentos"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-mono font-bold text-[#0F2744]">{doc.id}</span>
              <span className="text-slate-300">·</span>
              <span className="font-mono font-semibold text-slate-700">{renderVersion}</span>
              <span className="text-slate-300">·</span>
              <span className="font-semibold text-[#15803D]">{doc.status}</span>
              <span className="hidden sm:inline text-slate-300">·</span>
              <span className="hidden sm:inline text-slate-600 truncate max-w-[220px]">
                {doc.companyName}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {DOC_TYPE_LABELS[renderType]} · {doc.inSentQueue ? 'Na fila de envios' : 'Preparação (fila de envios intacta)'}
            </div>
          </div>
        </div>

        {/* Canvas Primary Controls */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {!isReadOnlySnapshot && (
            <>
              <button
                type="button"
                onClick={() => {
                  setPickedTemplateId(doc.templateId || state.documentTemplates[0]?.id || '');
                  setSwitchModalMode('template');
                }}
                className="inline-flex items-center gap-1 h-8 px-2.5 font-medium text-[#0F2744] bg-white border border-[#CBD5E1] hover:border-[#0F2744] rounded-md whitespace-nowrap"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Trocar modelo</span>
              </button>
              <button
                type="button"
                onClick={() => setSwitchModalMode('blank')}
                className="inline-flex items-center gap-1 h-8 px-2.5 font-medium text-slate-700 bg-white border border-[#CBD5E1] hover:border-[#0F2744] rounded-md whitespace-nowrap"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                <span>Começar do zero</span>
              </button>
              <button
                type="button"
                onClick={() => saveCanvasDraft(doc.id)}
                className="inline-flex items-center gap-1 h-8 px-2.5 font-medium text-[#0F2744] bg-white border border-[#CBD5E1] hover:border-[#0F2744] rounded-md whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar rascunho</span>
              </button>
              <button
                type="button"
                onClick={() => sendCanvasToInternalReview(doc.id)}
                className="inline-flex items-center gap-1 h-8 px-2.5 font-medium text-[#0F2744] bg-[#EEF3F9] border border-[#CBD5E1] hover:border-[#0F2744] rounded-md whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Enviar para revisão interna</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setPreviewSnapOverride(null);
              setShowA4Preview(true);
            }}
            className="inline-flex items-center gap-1 h-8 px-2.5 font-medium text-[#0F2744] bg-white border border-[#CBD5E1] hover:border-[#0F2744] rounded-md whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Prévia A4</span>
          </button>

          {!isReadOnlySnapshot && (
            <button
              type="button"
              onClick={handleOpenEmitConfirmation}
              className="inline-flex items-center gap-1.5 h-8 px-3 font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{getNextActionLabel(doc)}</span>
            </button>
          )}
        </div>
      </header>

      {/* Missing Default Template Recovery Banner */}
      {doc.missingDefaultFor && (
        <div className="bg-[#FFFBEB] border-b border-[#FDE68A] px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-start gap-2 text-[#92400E]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>
                Modelo padrão vigente ausente para{' '}
                {doc.missingDefaultFor === 'procuracao' ? 'Procuração' : 'Minuta'}.
              </strong>{' '}
              Configure o padrão em{' '}
              <button
                type="button"
                onClick={() => {
                  closeDocumentCanvas();
                  setRoute('proposals');
                }}
                className="underline font-semibold"
              >
                Propostas e procurações → Modelos e identidade padrão
              </button>{' '}
              para que este atalho carregue o modelo automaticamente na próxima vez.
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setPickedTemplateId(state.documentTemplates[0]?.id || '');
                setSwitchModalMode('template');
              }}
              className="h-8 px-3 font-semibold text-white bg-[#0F2744] rounded-md whitespace-nowrap"
            >
              Escolher outro modelo
            </button>
            <button
              type="button"
              onClick={() => applyTemplateToCanvasDocument(doc.id, null, false)}
              className="h-8 px-3 font-semibold text-[#0F2744] bg-white border border-[#CBD5E1] rounded-md whitespace-nowrap"
            >
              Criar do zero
            </button>
          </div>
        </div>
      )}

      {/* Emitted Immutable Snapshot Switcher Banner */}
      {activeEmittedSnap && (
        <div className="bg-[#EEF3F9] border-b border-[#D5E1EF] px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 text-[#0F2744]">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong>Versão emitida preservada ({activeEmittedSnap.versionLabel})</strong> em{' '}
              {activeEmittedSnap.savedAt} — {activeEmittedSnap.emittedStatus}. Alterações posteriores em modelos, logo padrão ou cadastro não modificam esta versão.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewingEmitted((v) => !v)}
              className="h-7 px-2.5 font-semibold text-[#0F2744] bg-white border border-[#CBD5E1] rounded"
            >
              {viewingEmitted ? 'Voltar para rascunho editável' : 'Inspecionar versão emitida (imutável)'}
            </button>
            {doc.status === 'Procuração enviada para assinatura' && (
              <button
                type="button"
                onClick={() => simulateSignProcuracaoDocument(doc.id)}
                className="h-7 px-2.5 font-semibold text-white bg-[#15803D] rounded"
              >
                Simular assinatura concluída
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile 3-Tab Bar (< lg) */}
      <div className="lg:hidden bg-white border-b border-[#E2E8F0] px-3 py-2 flex items-center gap-1 shrink-0">
        {(
          [
            ['dados', 'Dados e variáveis'],
            ['folha', 'Folha A4'],
            ['pendencias', `Pendências (${blockingPendencies.length})`],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setMobileTab(k)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
              mobileTab === k ? 'bg-[#0F2744] text-white' : 'text-slate-600 bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main 3-Column Canvas Body */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT COLUMN: Dados, Inserir Variável e Identidade Visual deste Documento */}
        <aside
          className={`lg:col-span-3 bg-white border-r border-[#E2E8F0] overflow-y-auto p-4 space-y-5 text-xs ${
            mobileTab === 'dados' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div>
            <h2 className="text-xs font-bold text-[#0F2744]">Dados do cadastro e variáveis</h2>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Ajustes feitos aqui valem <strong>apenas para este documento</strong>. Para alterar o cadastro oficial, edite na ficha da empresa.
            </p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] border-t border-slate-100 pt-2">
              <span className="font-semibold text-[#0F2744]">· Do cadastro</span>
              <span className="font-semibold text-[#15803D]">· Ajustado no doc</span>
              <span className="font-semibold text-[#B91C1C]">· Pendente</span>
            </div>
          </div>

          {/* Inserir variável panel */}
          <div className="space-y-2">
            <div className="font-semibold text-[#0F2744]">Inserir variável na folha A4</div>
            <div className="space-y-1.5">
              {CANVAS_VARIABLE_DEFS.filter(
                (v) =>
                  v.group === 'empresa' ||
                  (v.group === 'procuracao' && (renderType === 'procuracao' || doc.fields[v.key]?.value)) ||
                  (v.group === 'edital' && (doc.fields.editalCodigo?.value || renderType === 'procuracao'))
              ).map((v) => {
                const entry = renderFields[v.key] || { value: '', origin: 'pendente' as FieldOrigin };
                const meta = ORIGIN_META[entry.origin];
                return (
                  <div
                    key={v.key}
                    className="p-2.5 border border-[#E2E8F0] rounded-md bg-[#F8FAFC] space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium text-slate-800">{v.label}</span>
                      <span className={`text-[10px] font-semibold ${meta.cls}`}>{meta.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {v.key === 'poderes' ? (
                        <textarea
                          rows={2}
                          disabled={isReadOnlySnapshot}
                          value={entry.value}
                          onChange={(e) => updateFieldValue(v.key, e.target.value)}
                          placeholder={`Preencher ${v.label.toLowerCase()}...`}
                          className="flex-1 p-1.5 text-xs bg-white border border-[#CBD5E1] rounded disabled:bg-slate-100"
                        />
                      ) : (
                        <input
                          type="text"
                          disabled={isReadOnlySnapshot}
                          value={entry.value}
                          onChange={(e) => updateFieldValue(v.key, e.target.value)}
                          placeholder={`Preencher ${v.label.toLowerCase()}...`}
                          className="flex-1 h-7 px-2 text-xs bg-white border border-[#CBD5E1] rounded disabled:bg-slate-100"
                        />
                      )}
                      {!isReadOnlySnapshot && (
                        <button
                          type="button"
                          onClick={() => insertVariableIntoBody(v.key, v.label)}
                          title={`Inserir ${v.label} no texto da folha A4`}
                          className="h-7 px-2 text-[11px] font-semibold text-[#0F2744] bg-white border border-[#CBD5E1] hover:border-[#0F2744] rounded shrink-0"
                        >
                          + Inserir
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual Identity Override for this document */}
          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            <div className="font-semibold text-[#0F2744]">Identidade visual deste documento</div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Logo / Marca</label>
              <input
                type="text"
                disabled={isReadOnlySnapshot}
                value={renderBrand.logoText}
                onChange={(e) =>
                  updateCanvasDocument(doc.id, (p) => ({
                    ...p,
                    brand: { ...p.brand, logoText: e.target.value },
                  }))
                }
                className="w-full h-8 px-2.5 border border-[#CBD5E1] rounded bg-white disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Subtítulo da logo</label>
              <input
                type="text"
                disabled={isReadOnlySnapshot}
                value={renderBrand.logoSubtext}
                onChange={(e) =>
                  updateCanvasDocument(doc.id, (p) => ({
                    ...p,
                    brand: { ...p.brand, logoSubtext: e.target.value },
                  }))
                }
                className="w-full h-8 px-2.5 border border-[#CBD5E1] rounded bg-white disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Cabeçalho</label>
              <input
                type="text"
                disabled={isReadOnlySnapshot}
                value={renderBrand.headerText}
                onChange={(e) =>
                  updateCanvasDocument(doc.id, (p) => ({
                    ...p,
                    brand: { ...p.brand, headerText: e.target.value },
                  }))
                }
                className="w-full h-8 px-2.5 border border-[#CBD5E1] rounded bg-white disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Rodapé</label>
              <input
                type="text"
                disabled={isReadOnlySnapshot}
                value={renderBrand.footerText}
                onChange={(e) =>
                  updateCanvasDocument(doc.id, (p) => ({
                    ...p,
                    brand: { ...p.brand, footerText: e.target.value },
                  }))
                }
                className="w-full h-8 px-2.5 border border-[#CBD5E1] rounded bg-white disabled:bg-slate-100"
              />
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN: Folha A4 Editável */}
        <main
          className={`lg:col-span-6 overflow-y-auto p-4 sm:p-6 bg-[#EEF2F7] ${
            mobileTab === 'folha' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="max-w-[780px] mx-auto">
            {isReadOnlySnapshot ? (
              renderA4SheetStatic({
                brand: renderBrand,
                title: renderTitle,
                version: renderVersion,
                type: renderType,
                body: renderBody,
                clauses: renderClauses,
                fields: renderFields,
              })
            ) : (
              <div className="bg-white border border-[#CBD5E1] rounded-md shadow-xs p-5 sm:p-9 space-y-6">
                {/* Applied Logo + Header */}
                <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div
                      className="font-display font-bold text-lg tracking-tight"
                      style={{ color: doc.brand.accentColor }}
                    >
                      {doc.brand.logoText}
                    </div>
                    <div className="text-[11px] text-slate-500">{doc.brand.logoSubtext}</div>
                  </div>
                  <div className="sm:text-right text-[11px] text-slate-500 space-y-0.5">
                    <div>{doc.brand.headerText}</div>
                    <div className="font-mono font-semibold text-[#0F2744]">
                      {doc.id} · {doc.currentVersion} · {DOC_TYPE_LABELS[doc.type]}
                    </div>
                  </div>
                </div>

                {/* Minuta identification strip */}
                {doc.type === 'minuta' && (
                  <div className="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded text-xs font-semibold text-[#92400E]">
                    Identificado como MINUTA ({doc.currentVersion}) — preparado para leitura e comentários antes da versão definitiva.
                  </div>
                )}

                {/* Procuração legal check banner when edital is linked */}
                {doc.type === 'procuracao' && (
                  <div
                    className={`p-3 rounded border text-xs flex items-start gap-2 ${
                      doc.legalCheckPassed
                        ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                        : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                    }`}
                  >
                    {doc.legalCheckPassed ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>
                      <strong>Conferência jurídica prévia:</strong> {doc.legalCheckNote}
                    </span>
                  </div>
                )}

                {/* Editable Title */}
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Título do documento</label>
                  <input
                    type="text"
                    value={doc.title}
                    onChange={(e) =>
                      updateCanvasDocument(doc.id, (p) => ({ ...p, title: e.target.value }))
                    }
                    className="w-full text-base sm:text-lg font-display font-bold text-[#0F2744] border-b border-slate-200 focus:border-[#0F2744] pb-1.5 focus:outline-none"
                  />
                </div>

                {/* Resolved Key Fields Strip with Origin Labels */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-3 border-y border-slate-100 text-xs">
                  {(
                    [
                      ['razaoSocial', 'Empresa'],
                      ['cnpj', 'CNPJ'],
                      ...(doc.type === 'procuracao'
                        ? ([
                            ['representanteLegal', 'Representante'],
                            ['vigencia', 'Vigência'],
                            ['poderes', 'Poderes'],
                            ['signatarios', 'Signatários'],
                          ] as const)
                        : []),
                      ...(doc.fields.editalCodigo?.value
                        ? ([
                            ['editalCodigo', 'Edital vinculado'],
                            ['editalOrgao', 'Órgão'],
                          ] as const)
                        : []),
                    ] as const
                  ).map(([key, label]) => {
                    const entry = doc.fields[key] || { value: '', origin: 'pendente' as FieldOrigin };
                    const meta = ORIGIN_META[entry.origin];
                    return (
                      <div key={key} className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-slate-500">{label}</span>
                          <span className="text-slate-300">·</span>
                          <span className={`font-semibold ${meta.cls}`}>{meta.label}</span>
                        </div>
                        <div
                          className={`font-medium ${
                            entry.origin === 'pendente' ? 'text-[#B91C1C] italic' : 'text-slate-900'
                          }`}
                        >
                          {entry.value || 'Campo pendente — preencha no painel esquerdo'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Free Editable Body */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-slate-500">
                    Corpo do documento (clique em "+ Inserir" no painel esquerdo para inserir variáveis)
                  </label>
                  <textarea
                    rows={6}
                    value={doc.body}
                    onChange={(e) =>
                      updateCanvasDocument(doc.id, (p) => ({ ...p, body: e.target.value }))
                    }
                    placeholder="Escreva livremente o texto do documento na folha A4 ou insira variáveis do lead e da empresa..."
                    className="w-full p-3 text-sm text-slate-800 leading-relaxed border border-[#E2E8F0] focus:border-[#0F2744] rounded-md focus:outline-none"
                  />
                </div>

                {/* Editable Clauses */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#0F2744]">
                      Cláusulas e seções ({doc.clauses.length})
                    </span>
                    <button
                      type="button"
                      onClick={addClause}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D] hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar cláusula</span>
                    </button>
                  </div>

                  {doc.clauses.map((cl) => (
                    <div
                      key={cl.id}
                      className="p-3.5 border border-[#E2E8F0] rounded-md space-y-2 bg-[#FAFCFF]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={cl.title}
                          onChange={(e) => updateClause(cl.id, { title: e.target.value })}
                          className="flex-1 text-xs font-bold text-[#0F2744] bg-transparent border-b border-transparent focus:border-[#0F2744] focus:outline-none"
                        />
                        <div className="flex items-center gap-2 shrink-0">
                          {cl.editedInDoc && (
                            <span className="text-[10px] font-semibold text-[#15803D]">
                              Ajustada no doc
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeClause(cl.id)}
                            className="text-slate-400 hover:text-[#B91C1C]"
                            aria-label={`Remover ${cl.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <textarea
                        rows={3}
                        value={cl.content}
                        onChange={(e) => updateClause(cl.id, { content: e.target.value })}
                        placeholder="Texto da cláusula..."
                        className="w-full p-2 text-xs text-slate-800 leading-relaxed bg-white border border-[#E2E8F0] rounded focus:border-[#0F2744] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Footer Preview */}
                <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>{doc.brand.footerText}</span>
                  <span className="font-mono">
                    {doc.id} · {doc.currentVersion}
                  </span>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT COLUMN: Pendências, Revisão Interna, Destinatários, Comentários e Versões Recuperáveis */}
        <aside
          className={`lg:col-span-3 bg-white border-l border-[#E2E8F0] overflow-y-auto p-4 space-y-5 text-xs ${
            mobileTab === 'pendencias' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Pendências */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#0F2744]">Pendências para emissão</h2>
              <span
                className={`font-mono font-semibold tabular-nums ${
                  blockingPendencies.length > 0 ? 'text-[#B91C1C]' : 'text-[#15803D]'
                }`}
              >
                {blockingPendencies.length}
              </span>
            </div>

            {blockingPendencies.length === 0 ? (
              <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded text-[#166534] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Sem pendências bloqueantes. Pronto para confirmar emissão.</span>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {blockingPendencies.map((p) => (
                  <li
                    key={p.id}
                    className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded text-[#991B1B] flex items-start gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{p.label}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Internal Review Controls */}
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Revisão interna:</span>
                <strong
                  className={
                    doc.internalReviewStatus === 'Aprovada'
                      ? 'text-[#15803D]'
                      : doc.internalReviewStatus === 'Em revisão interna'
                      ? 'text-[#B45309]'
                      : 'text-slate-700'
                  }
                >
                  {doc.internalReviewStatus}
                </strong>
              </div>
              {doc.internalReviewStatus !== 'Aprovada' && (
                <div className="flex flex-wrap gap-1.5">
                  {doc.internalReviewStatus === 'Não solicitada' && (
                    <button
                      type="button"
                      onClick={() => sendCanvasToInternalReview(doc.id)}
                      className="h-7 px-2.5 font-semibold text-[#0F2744] bg-white border border-[#CBD5E1] rounded"
                    >
                      Solicitar revisão
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => approveCanvasInternalReview(doc.id, 'José Ribamar')}
                    className="h-7 px-2.5 font-semibold text-white bg-[#15803D] rounded"
                  >
                    Aprovar (José Ribamar)
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Destinatários */}
          <section className="pt-4 border-t border-slate-200 space-y-2.5">
            <h2 className="font-bold text-[#0F2744]">Destinatários ({renderRecipients.length})</h2>
            <div className="space-y-2">
              {renderRecipients.map((r) => (
                <div
                  key={r.id}
                  className="p-2.5 border border-[#E2E8F0] rounded flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{r.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {r.role} · {r.channel}: {r.contact}
                    </div>
                  </div>
                  {!isReadOnlySnapshot && (
                    <button
                      type="button"
                      onClick={() =>
                        updateCanvasDocument(doc.id, (p) => ({
                          ...p,
                          recipients: p.recipients.filter((x) => x.id !== r.id),
                        }))
                      }
                      className="text-slate-400 hover:text-[#B91C1C]"
                      aria-label={`Remover destinatário ${r.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!isReadOnlySnapshot && (
              <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={newRecName}
                    onChange={(e) => setNewRecName(e.target.value)}
                    placeholder="Nome"
                    className="h-7 px-2 bg-white border border-[#CBD5E1] rounded"
                  />
                  <input
                    type="text"
                    value={newRecRole}
                    onChange={(e) => setNewRecRole(e.target.value)}
                    placeholder="Papel"
                    className="h-7 px-2 bg-white border border-[#CBD5E1] rounded"
                  />
                </div>
                <div className="flex gap-1.5">
                  <select
                    value={newRecChannel}
                    onChange={(e) => setNewRecChannel(e.target.value as 'E-mail' | 'WhatsApp')}
                    className="h-7 px-1.5 bg-white border border-[#CBD5E1] rounded"
                  >
                    <option value="E-mail">E-mail</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                  <input
                    type="text"
                    value={newRecContact}
                    onChange={(e) => setNewRecContact(e.target.value)}
                    placeholder="E-mail ou WhatsApp"
                    className="flex-1 h-7 px-2 bg-white border border-[#CBD5E1] rounded"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!newRecName.trim() || !newRecContact.trim()) return;
                    updateCanvasDocument(doc.id, (p) => ({
                      ...p,
                      recipients: [
                        ...p.recipients,
                        {
                          id: `rec_${Date.now()}`,
                          name: newRecName.trim(),
                          role: newRecRole.trim() || 'Destinatário',
                          contact: newRecContact.trim(),
                          channel: newRecChannel,
                        },
                      ],
                    }));
                    setNewRecName('');
                    setNewRecRole('');
                    setNewRecContact('');
                  }}
                  className="inline-flex items-center gap-1 h-7 px-2.5 font-semibold text-[#0F2744] bg-white border border-[#CBD5E1] rounded"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Adicionar destinatário</span>
                </button>
              </div>
            )}
          </section>

          {/* Comentários */}
          <section className="pt-4 border-t border-slate-200 space-y-2.5">
            <h2 className="font-bold text-[#0F2744] inline-flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Comentários ({doc.comments.length})</span>
            </h2>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Adicionar comentário interno..."
                className="flex-1 h-8 px-2.5 border border-[#CBD5E1] rounded"
              />
              <button
                type="button"
                onClick={() => {
                  addCanvasComment(doc.id, 'Márcio', commentText);
                  setCommentText('');
                }}
                className="h-8 px-2.5 font-semibold text-white bg-[#0F2744] rounded"
              >
                Postar
              </button>
            </div>
            <div className="space-y-2 max-h-44 overflow-y-auto">
              {doc.comments.length === 0 ? (
                <p className="text-[11px] text-slate-500">Nenhum comentário registrado ainda.</p>
              ) : (
                doc.comments.map((c) => (
                  <div key={c.id} className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <strong className="text-[#0F2744]">{c.author}</strong>
                      <span className="font-mono tabular-nums">{c.at}</span>
                    </div>
                    <p className="text-slate-700 mt-1">{c.text}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Versões recuperáveis & emitidas */}
          <section className="pt-4 border-t border-slate-200 space-y-2.5">
            <h2 className="font-bold text-[#0F2744] inline-flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>Versões recuperáveis ({doc.recoverableVersions.length})</span>
            </h2>
            {doc.recoverableVersions.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                Ao trocar de modelo, começar do zero ou emitir, o histórico recuperável aparece aqui.
              </p>
            ) : (
              <div className="space-y-2">
                {doc.recoverableVersions.map((ver) => (
                  <div key={ver.versionId} className="p-2.5 border border-[#E2E8F0] rounded space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-semibold text-[#0F2744]">
                        {ver.versionLabel}
                      </span>
                      {ver.isEmittedSnapshot && (
                        <span className="text-[10px] font-semibold text-[#15803D]">Emitida</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600">{ver.reason}</div>
                    <div className="text-[10px] font-mono text-slate-400">{ver.savedAt}</div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => restoreCanvasVersion(doc.id, ver.versionId)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F2744] hover:underline"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Recuperar versão</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewSnapOverride(ver);
                          setShowA4Preview(true);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:underline"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ver A4</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      {/* ==================== MODAL 1: TROCAR MODELO / COMEÇAR DO ZERO ==================== */}
      {switchModalMode && switchImpact && (
        <div className="fixed inset-0 z-[70] bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#0F2744]">
                  {switchModalMode === 'template'
                    ? 'Trocar modelo do documento'
                    : 'Começar do zero (folha em branco)'}
                </h3>
                <p className="text-slate-600 mt-0.5">
                  O vínculo com <strong>{doc.companyName}</strong> e com o lead será preservado. Confira o impacto antes de aplicar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSwitchModalMode(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {switchModalMode === 'template' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Escolha o novo modelo
                </label>
                <select
                  value={pickedTemplateId}
                  onChange={(e) => setPickedTemplateId(e.target.value)}
                  className="w-full h-9 px-2.5 border border-[#CBD5E1] rounded-md bg-white font-medium"
                >
                  {state.documentTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({DOC_TYPE_LABELS[t.type]})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Preview of incoming template */}
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-1.5">
              <div className="font-semibold text-[#0F2744]">
                Prévia do destino:{' '}
                {incomingTemplateForSwitch
                  ? `${incomingTemplateForSwitch.name} (${DOC_TYPE_LABELS[incomingTemplateForSwitch.type]})`
                  : 'Folha A4 em branco com identidade visual vigente'}
              </div>
              <p className="text-slate-600">
                {incomingTemplateForSwitch
                  ? incomingTemplateForSwitch.description
                  : 'Remove texto principal e cláusulas atuais mantendo logo, cabeçalho, rodapé e variáveis do lead/empresa.'}
              </p>
              {incomingTemplateForSwitch && (
                <div className="text-[11px] text-slate-500 pt-1">
                  Cláusulas do novo modelo:{' '}
                  {incomingTemplateForSwitch.clauses.map((c) => c.title).join(' · ')}
                </div>
              )}
            </div>

            {/* Impact Warning: Replaced clauses & adjustments */}
            <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-md space-y-2 text-[#92400E]">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Trechos e ajustes que serão substituídos:</span>
              </div>
              {switchImpact.replacedClauses.length === 0 &&
              switchImpact.replacedAdjustments.length === 0 ? (
                <p>Nenhum trecho preenchido será perdido.</p>
              ) : (
                <ul className="list-disc pl-4 space-y-0.5">
                  {switchImpact.replacedAdjustments.map((item, i) => (
                    <li key={`adj_${i}`}>{item}</li>
                  ))}
                  {switchImpact.replacedClauses.map((cl, i) => (
                    <li key={`cl_${i}`}>{cl}</li>
                  ))}
                </ul>
              )}

              {switchImpact.willChangeType && (
                <div className="pt-1 font-medium text-[#0F2744]">
                  Atenção: o tipo do documento mudará de{' '}
                  <strong>{DOC_TYPE_LABELS[doc.type]}</strong> para{' '}
                  <strong>{DOC_TYPE_LABELS[switchImpact.newType]}</strong> — campos obrigatórios, revisão interna e ação final serão reavaliados automaticamente.
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSwitchModalMode(null)}
                className="h-9 px-3 font-medium text-slate-600 border border-[#CBD5E1] rounded-md"
              >
                Cancelar troca
              </button>
              <button
                type="button"
                onClick={() => {
                  applyTemplateToCanvasDocument(
                    doc.id,
                    switchModalMode === 'template' ? pickedTemplateId : null,
                    false
                  );
                  setSwitchModalMode(null);
                }}
                className="h-9 px-3 font-medium text-[#0F2744] bg-white border border-[#CBD5E1] rounded-md"
              >
                Aplicar sem salvar versão
              </button>
              <button
                type="button"
                onClick={() => {
                  applyTemplateToCanvasDocument(
                    doc.id,
                    switchModalMode === 'template' ? pickedTemplateId : null,
                    true
                  );
                  setSwitchModalMode(null);
                }}
                className="h-9 px-4 font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md"
              >
                Salvar trabalho atual como versão recuperável e aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: PRÉVIA A4 COMPLETA ==================== */}
      {showA4Preview && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-[#EEF2F7] rounded-lg max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-3 bg-white border-b border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0F2744]">
                Prévia A4 ·{' '}
                {previewSnapOverride
                  ? `Snapshot ${previewSnapOverride.versionLabel} (${previewSnapOverride.savedAt})`
                  : `${doc.id} · ${renderVersion}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowA4Preview(false);
                  setPreviewSnapOverride(null);
                }}
                className="inline-flex items-center gap-1 h-8 px-3 font-semibold text-[#0F2744] border border-[#CBD5E1] rounded-md"
              >
                <X className="w-3.5 h-3.5" />
                <span>Fechar prévia</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              <div className="max-w-[780px] mx-auto">
                {renderA4SheetStatic(
                  previewSnapOverride
                    ? {
                        brand: previewSnapOverride.brand,
                        title: previewSnapOverride.title,
                        version: previewSnapOverride.versionLabel,
                        type: previewSnapOverride.type,
                        body: previewSnapOverride.body,
                        clauses: previewSnapOverride.clauses,
                        fields: previewSnapOverride.fields,
                      }
                    : {
                        brand: renderBrand,
                        title: renderTitle,
                        version: renderVersion,
                        type: renderType,
                        body: renderBody,
                        clauses: renderClauses,
                        fields: renderFields,
                      }
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: CONFIRMAÇÃO ANTES DA EMISSÃO ==================== */}
      {showEmitModal && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-lg max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-xs">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0F2744]">
                  Confirmar emissão · {getNextActionLabel(doc)}
                </h3>
                <div className="text-slate-500 mt-0.5 font-mono">
                  {doc.id} · Versão exata: {doc.currentVersion} · Envio e assinatura simulados nesta prévia
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmitModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Blocking pendencies */}
              {blockingPendencies.length > 0 && (
                <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-md space-y-1.5 text-[#991B1B]">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Envio bloqueado até corrigir as pendências obrigatórias:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {blockingPendencies.map((p) => (
                      <li key={p.id}>{p.label}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Free Document Purpose Selection (Required before confirming) */}
              {doc.type === 'documento_livre' && (
                <div className="p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md space-y-2">
                  <label className="block font-semibold text-[#0F2744]">
                    Escolha a finalidade do envio deste documento criado do zero (obrigatório):
                  </label>
                  <select
                    value={emitPurpose}
                    onChange={(e) => setEmitPurpose(e.target.value)}
                    className="w-full h-9 px-2.5 bg-white border border-[#CBD5E1] rounded-md"
                  >
                    <option value="">-- Selecione a finalidade do envio --</option>
                    {FREE_DOC_PURPOSES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Recipients summary */}
              <div className="space-y-1.5">
                <div className="font-semibold text-[#0F2744]">Destinatários</div>
                <div className="flex flex-wrap gap-2">
                  {doc.recipients.map((r) => (
                    <div
                      key={r.id}
                      className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-slate-800"
                    >
                      <strong>{r.name}</strong> ({r.channel}: {r.contact})
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery message */}
              <div>
                <label className="block font-semibold text-[#0F2744] mb-1">
                  Mensagem de acompanhamento (envio simulado)
                </label>
                <textarea
                  rows={2}
                  value={emitMessage}
                  onChange={(e) => setEmitMessage(e.target.value)}
                  className="w-full p-2.5 border border-[#CBD5E1] rounded-md"
                />
              </div>

              {/* Full Document Preview inside Confirmation */}
              <div className="space-y-1.5">
                <div className="font-semibold text-[#0F2744]">
                  Documento completo que será congelado e emitido ({doc.currentVersion})
                </div>
                <div className="border border-[#CBD5E1] rounded-md max-h-[320px] overflow-y-auto p-3 bg-[#EEF2F7]">
                  {renderA4SheetStatic({
                    brand: doc.brand,
                    title: doc.title,
                    version: doc.currentVersion,
                    type: doc.type,
                    body: doc.body,
                    clauses: doc.clauses,
                    fields: doc.fields,
                  })}
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Somente após confirmar o documento entra na fila de envios e histórico.</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmitModal(false)}
                  className="h-9 px-3 font-medium text-slate-600 border border-[#CBD5E1] bg-white rounded-md"
                >
                  Voltar ao Canvas
                </button>
                <button
                  type="button"
                  disabled={
                    blockingPendencies.length > 0 ||
                    (doc.type === 'documento_livre' && !emitPurpose.trim())
                  }
                  onClick={handleConfirmEmit}
                  className="inline-flex items-center gap-1.5 h-9 px-4 font-semibold text-white bg-[#15803D] hover:bg-[#166534] disabled:opacity-40 rounded-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{getNextActionLabel(doc)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
