import React, { useMemo, useState } from 'react';
import {
  BookmarkPlus,
  Building2,
  CheckCircle2,
  FileSearch,
  Link2,
  Lock,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { GESTORES, GESTOR_MAP } from '../../data/seedData';
import { Edital, GestorId } from '../../types/domain';

export const RadarView: React.FC = () => {
  const {
    state,
    globalSearch,
    radarUrgentOnly,
    setRadarUrgentOnly,
    isOrgaoBlocked,
    saveRadarFilter,
    deleteRadarFilter,
    sendEditalToTriage,
    linkEditalToClient,
    setSelectedClientId,
    setRoute,
    markAcceptance,
  } = useApp();

  const [tab, setTab] = useState<'oportunidades' | 'auditoria_juridica'>('oportunidades');
  const [keyword, setKeyword] = useState('');
  const [ufFilter, setUfFilter] = useState('Todos');
  const [municipioFilter, setMunicipioFilter] = useState('');
  const [nicheFilter, setNicheFilter] = useState<string>(
    state.activeProjectId === 'all' ? 'Todos' : state.activeProjectId
  );
  const [modalidadeFilter, setModalidadeFilter] = useState('Todas');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [clientFilter, setClientFilter] = useState('Todos');
  const [newFilterName, setNewFilterName] = useState('');

  // Link to client modal
  const [linkingEdital, setLinkingEdital] = useState<Edital | null>(null);
  const [linkClientId, setLinkClientId] = useState<string>(state.clients[0]?.id || '');
  const [linkLote, setLinkLote] = useState('Lote 01');
  const [linkOwner, setLinkOwner] = useState<GestorId>('ribamar');
  const [linkReason, setLinkReason] = useState('Objeto, porte e acervo técnico compatíveis com a empresa.');
  const [linkNextAction, setLinkNextAction] = useState('Solicitar conferência documental e parecer jurídico da versão atual.');

  React.useEffect(() => {
    setNicheFilter(state.activeProjectId === 'all' ? 'Todos' : state.activeProjectId);
  }, [state.activeProjectId]);

  // Separate eligible vs conflict-blocked editais
  const { eligibleEditais, blockedEditais } = useMemo(() => {
    const eligible: Edital[] = [];
    const blocked: { edital: Edital; reason: string }[] = [];
    for (const ed of state.editais) {
      const gate = isOrgaoBlocked(ed.orgao);
      if (gate.blocked) {
        blocked.push({ edital: ed, reason: gate.reason || 'Vínculo societário ativo' });
      } else {
        eligible.push(ed);
      }
    }
    return { eligibleEditais: eligible, blockedEditais: blocked };
  }, [state.editais, state.vinculosSocios]);

  const filteredEligible = useMemo(() => {
    const kw = (keyword || globalSearch).trim().toLowerCase();
    const mun = municipioFilter.trim().toLowerCase();
    return eligibleEditais.filter((ed) => {
      if (ufFilter !== 'Todos' && ed.uf !== ufFilter) return false;
      if (mun && !ed.municipio.toLowerCase().includes(mun)) return false;
      if (nicheFilter !== 'Todos' && !ed.projectIds.includes(nicheFilter)) return false;
      if (modalidadeFilter !== 'Todas' && ed.modalidade !== modalidadeFilter) return false;
      if (statusFilter !== 'Todos' && ed.situacao !== statusFilter) return false;
      if (radarUrgentOnly && ed.prazoIso > '2026-12-05') return false;
      if (clientFilter !== 'Todos') {
        const hasLink = state.acompanhamentos.some(
          (a) => a.editalId === ed.id && a.clientId === clientFilter
        );
        if (!hasLink) return false;
      }
      if (kw) {
        const hay = `${ed.codigo} ${ed.orgao} ${ed.municipio} ${ed.objeto} ${ed.fonteNome} ${ed.originSheet}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [
    eligibleEditais,
    keyword,
    globalSearch,
    ufFilter,
    municipioFilter,
    nicheFilter,
    modalidadeFilter,
    statusFilter,
    radarUrgentOnly,
    clientFilter,
    state.acompanhamentos,
  ]);

  const ufs = Array.from(new Set(eligibleEditais.map((e) => e.uf))).sort();

  const handleSaveFilter = () => {
    if (!newFilterName.trim()) return;
    saveRadarFilter({
      name: newFilterName.trim(),
      projectId: nicheFilter,
      uf: ufFilter,
      keyword,
      modalidade: modalidadeFilter,
      status: statusFilter,
    });
    setNewFilterName('');
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkingEdital || !linkClientId) return;
    const cli = state.clients.find((c) => c.id === linkClientId);
    linkEditalToClient({
      editalId: linkingEdital.id,
      clientId: linkClientId,
      projectId: cli?.projectId || linkingEdital.projectIds[0] || 'proj_manutencao',
      lote: linkLote,
      responsavel: linkOwner,
      motivoCompatibilidade: linkReason,
      proximaAcao: linkNextAction,
    });
    setLinkingEdital(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F2744]">Radar de editais</h1>
          <p className="text-sm text-slate-600 mt-1">
            Editais verificados a partir das guias RADAR PRIORITÁRIO, EDITAIS — TRIAGEM e BUSCADOR NACIONAL. Portais sem edital confirmado permanecem em Fontes Oficiais.
          </p>
        </div>

        {/* Segmented Tab: Opportunities vs Restricted Legal Conflict Audit */}
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-md self-start">
          <button
            type="button"
            onClick={() => setTab('oportunidades')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
              tab === 'oportunidades' ? 'bg-white text-[#0F2744] shadow-xs' : 'text-slate-600'
            }`}
          >
            Oportunidades elegíveis ({eligibleEditais.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('auditoria_juridica');
              markAcceptance('t8ConflictGateVerified', true);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
              tab === 'auditoria_juridica'
                ? 'bg-[#0F2744] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Auditoria jurídica · VínculoSócio ({blockedEditais.length} bloqueios)</span>
          </button>
        </div>
      </div>

      {tab === 'oportunidades' ? (
        <>
          {/* Saved Niche Filters Strip */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#0F2744]">Filtros salvos por nicho</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newFilterName}
                  onChange={(e) => setNewFilterName(e.target.value)}
                  placeholder="Nome do filtro atual..."
                  className="h-8 px-2.5 text-xs border border-[#E2E8F0] rounded-md w-44"
                />
                <button
                  type="button"
                  onClick={handleSaveFilter}
                  className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-semibold text-[#0F2744] bg-[#F8FAFC] border border-[#CBD5E1] hover:border-[#0F2744] rounded-md whitespace-nowrap"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>Salvar filtro</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {state.savedRadarFilters.map((flt) => (
                <div
                  key={flt.id}
                  className="inline-flex items-center border border-[#CBD5E1] rounded-md bg-[#F8FAFC] text-xs"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setNicheFilter(flt.projectId);
                      setUfFilter(flt.uf);
                      setKeyword(flt.keyword);
                      setModalidadeFilter(flt.modalidade);
                      setStatusFilter(flt.status);
                    }}
                    className="px-2.5 py-1 font-medium text-[#0F2744] hover:underline"
                  >
                    {flt.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRadarFilter(flt.id)}
                    className="px-1.5 py-1 text-slate-400 hover:text-[#B91C1C] border-l border-[#E2E8F0]"
                    aria-label={`Remover filtro ${flt.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Filter Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 text-xs">
              <input
                type="search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Palavra-chave, código ou órgão..."
                className="h-8 px-2.5 border border-[#E2E8F0] rounded-md"
              />
              <select
                value={nicheFilter}
                onChange={(e) => setNicheFilter(e.target.value)}
                className="h-8 px-2 border border-[#E2E8F0] rounded-md bg-white"
                aria-label="Filtrar por nicho"
              >
                <option value="Todos">Todos os nichos</option>
                {state.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
              <select
                value={ufFilter}
                onChange={(e) => setUfFilter(e.target.value)}
                className="h-8 px-2 border border-[#E2E8F0] rounded-md bg-white"
                aria-label="Filtrar por UF"
              >
                <option value="Todos">Todas as UFs</option>
                {ufs.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={municipioFilter}
                onChange={(e) => setMunicipioFilter(e.target.value)}
                placeholder="Município..."
                className="h-8 px-2.5 border border-[#E2E8F0] rounded-md"
              />
              <select
                value={modalidadeFilter}
                onChange={(e) => setModalidadeFilter(e.target.value)}
                className="h-8 px-2 border border-[#E2E8F0] rounded-md bg-white"
                aria-label="Filtrar por modalidade"
              >
                <option value="Todas">Todas modalidades</option>
                <option value="Pregão Eletrônico">Pregão Eletrônico</option>
                <option value="Concorrência Eletrônica">Concorrência Eletrônica</option>
                <option value="Dispensa Eletrônica">Dispensa Eletrônica</option>
              </select>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="h-8 px-2 border border-[#E2E8F0] rounded-md bg-white"
                aria-label="Filtrar por cliente"
              >
                <option value="Todos">Todos os clientes</option>
                {state.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razaoSocial}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 px-2 border border-[#E2E8F0] rounded-md bg-white"
                  aria-label="Filtrar por status"
                >
                  <option value="Todos">Todos os status</option>
                  <option value="Verificado no Radar">Verificado no Radar</option>
                  <option value="Em triagem">Em triagem</option>
                  <option value="Aprovado para disputa">Aprovado para disputa</option>
                </select>
                <label className="inline-flex items-center gap-1.5 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={radarUrgentOnly}
                    onChange={(e) => setRadarUrgentOnly(e.target.checked)}
                  />
                  <span>Somente prazo próximo (até 05/12)</span>
                </label>
              </div>
              <span className="text-[11px] text-slate-500">
                Gate v0.3 ativo: órgãos com VínculoSócio ativo/em análise são suprimidos automaticamente desta fila.
              </span>
            </div>
          </div>

          {/* Eligible Editais Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg divide-y divide-slate-100">
            {filteredEligible.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <p>Nenhum edital elegível corresponde a estes filtros.</p>
                <p className="text-[11px]">
                  Se você buscou um órgão com conflito societário (ex.: Arapiraca/AL ou Contagem/MG), ele foi ocultado pelo Gate de Conflito v0.3 e só aparece na aba restrita de Auditoria Jurídica.
                </p>
              </div>
            ) : (
              filteredEligible.map((ed) => {
                const links = state.acompanhamentos.filter((a) => a.editalId === ed.id);
                const isPositiveControl = state.vinculosSocios.some(
                  (v) =>
                    !v.bloqueiaRadar &&
                    v.orgao.toLowerCase() === ed.orgao.toLowerCase()
                );

                return (
                  <article key={ed.id} className="p-5 space-y-3 hover:bg-slate-50/70 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                          <span className="font-mono font-bold text-[#0F2744]">{ed.codigo}</span>
                          <span className="text-slate-300">·</span>
                          <span className="font-semibold text-slate-800">{ed.orgao}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-600">
                            {ed.municipio}/{ed.uf}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono text-[11px] text-slate-500">
                            Origem: {ed.originSheet}
                          </span>
                          {isPositiveControl && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="inline-flex items-center gap-1 text-[#15803D] font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Sem vínculo (controle positivo)</span>
                              </span>
                            </>
                          )}
                        </div>

                        <p className="text-sm font-medium text-slate-900 leading-snug">{ed.objeto}</p>

                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                          <span>{ed.modalidade}</span>
                          <span>·</span>
                          <span className="font-mono text-slate-700 tabular-nums">{ed.valorEstimado}</span>
                          <span>·</span>
                          <span className="font-mono text-[#B45309] font-semibold tabular-nums">
                            Prazo: {ed.prazoIso.split('-').reverse().join('/')}
                          </span>
                          <span>·</span>
                          <span>Fonte: {ed.fonteNome}</span>
                          <span>·</span>
                          <span>Conferido em {ed.dataConferencia}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold text-[#0F2744] mr-1">{ed.situacao}</span>
                        {ed.situacao === 'Verificado no Radar' && (
                          <button
                            type="button"
                            onClick={() => sendEditalToTriage(ed.id)}
                            className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-medium text-[#0F2744] bg-white border border-[#CBD5E1] hover:border-[#0F2744] rounded-md whitespace-nowrap"
                          >
                            <FileSearch className="w-3.5 h-3.5" />
                            <span>Enviar para triagem</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setLinkingEdital(ed);
                            setLinkClientId(state.clients[0]?.id || '');
                          }}
                          className="inline-flex items-center gap-1 h-8 px-3 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md whitespace-nowrap"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span>Vincular a cliente</span>
                        </button>
                      </div>
                    </div>

                    {/* Linked clients independent tracking strip */}
                    {links.length > 0 && (
                      <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
                        <span className="text-slate-500 font-medium">Acompanhamentos vinculados:</span>
                        {links.map((lk) => {
                          const cli = state.clients.find((c) => c.id === lk.clientId);
                          return (
                            <button
                              key={lk.id}
                              type="button"
                              onClick={() => {
                                if (cli) {
                                  setSelectedClientId(cli.id);
                                  setRoute('clients');
                                }
                              }}
                              className="inline-flex items-center gap-1.5 text-[#0F2744] hover:underline font-medium"
                            >
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {cli?.razaoSocial || 'Nicho'} ({lk.status})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* RESTRICTED LEGAL AUDIT TAB: VínculoSócio Conflict Gate v0.3 */
        <div className="space-y-5">
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0F2744]">
              <ShieldAlert className="w-4 h-4 text-[#B91C1C]" />
              <span>Área jurídica restrita · Gate de conflito v0.3 (VínculoSócio)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Visível apenas para os sócios jurídicos (<strong>José Ribamar</strong> e{' '}
              <strong>José Ribamar Júnior</strong>) para fins de auditoria. Qualquer órgão com vínculo ativo ou potencial vínculo ainda em análise desaparece automaticamente do Radar de oportunidades e sugestões comerciais.
            </p>
          </div>

          {/* VínculoSócio registry table */}
          <section className="bg-white border border-[#E2E8F0] rounded-lg overflow-x-auto">
            <div className="px-5 py-3.5 border-b border-[#E2E8F0] text-xs font-semibold text-[#0F2744]">
              Registros da entidade VínculoSócio
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-slate-600">
                  <th className="py-3 px-4 font-semibold">Órgão</th>
                  <th className="py-3 px-4 font-semibold">Sócio</th>
                  <th className="py-3 px-4 font-semibold">Natureza e vigência</th>
                  <th className="py-3 px-4 font-semibold">Situação jurídica</th>
                  <th className="py-3 px-4 font-semibold">Efeito no Radar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.vinculosSocios.map((v) => (
                  <tr key={v.id}>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {v.orgao}
                      <div className="text-[11px] font-mono text-slate-500">{v.cnpjOrgao}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{GESTOR_MAP[v.socio]?.nome}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{v.natureza}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">{v.vigencia}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      <span className={v.bloqueiaRadar ? 'text-[#B91C1C]' : 'text-[#15803D]'}>
                        {v.situacaoJuridica}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {v.bloqueiaRadar ? 'Oculto do Radar e sugestões' : 'Elegível (controle positivo)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Suppressed Editais visible only in audit */}
          <section className="bg-white border border-[#E2E8F0] rounded-lg">
            <div className="px-5 py-3.5 border-b border-[#E2E8F0] text-xs font-semibold text-[#B91C1C]">
              Editais suprimidos automaticamente do Radar ({blockedEditais.length})
            </div>
            <div className="divide-y divide-slate-100">
              {blockedEditais.map(({ edital, reason }) => (
                <div key={edital.id} className="p-4 space-y-1 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900">
                      <span className="font-mono text-[#0F2744]">{edital.codigo}</span> · {edital.orgao}
                    </span>
                    <span className="font-semibold text-[#B91C1C]">Bloqueado no Radar</span>
                  </div>
                  <p className="text-slate-600">{edital.objeto}</p>
                  <p className="text-[11px] text-[#991B1B]">Motivo do bloqueio: {reason}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Link Edital to Client Modal */}
      {linkingEdital && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleLinkSubmit}
            className="bg-white border border-[#E2E8F0] rounded-lg max-w-lg w-full p-5 space-y-4 shadow-xl text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#0F2744]">
                  Vincular edital a cliente ({linkingEdital.codigo})
                </h3>
                <p className="text-slate-500 mt-0.5">
                  Um mesmo edital pode ser vinculado a mais de um cliente mantendo andamento independente.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLinkingEdital(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Empresa cliente</label>
                <select
                  value={linkClientId}
                  onChange={(e) => setLinkClientId(e.target.value)}
                  className="w-full h-9 px-2.5 border border-[#CBD5E1] rounded-md bg-white"
                >
                  {state.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razaoSocial} ({c.procuracaoStatus})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Lote / item</label>
                  <input
                    type="text"
                    value={linkLote}
                    onChange={(e) => setLinkLote(e.target.value)}
                    className="w-full h-9 px-2.5 border border-[#CBD5E1] rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Responsável</label>
                  <select
                    value={linkOwner}
                    onChange={(e) => setLinkOwner(e.target.value as GestorId)}
                    className="w-full h-9 px-2.5 border border-[#CBD5E1] rounded-md bg-white"
                  >
                    {GESTORES.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Motivo de compatibilidade</label>
                <input
                  type="text"
                  value={linkReason}
                  onChange={(e) => setLinkReason(e.target.value)}
                  className="w-full h-9 px-2.5 border border-[#CBD5E1] rounded-md"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Próxima ação</label>
                <input
                  type="text"
                  value={linkNextAction}
                  onChange={(e) => setLinkNextAction(e.target.value)}
                  className="w-full h-9 px-2.5 border border-[#CBD5E1] rounded-md"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLinkingEdital(null)}
                className="h-9 px-3 text-slate-600 border border-[#E2E8F0] rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-9 px-4 font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md"
              >
                Criar acompanhamento independente
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
