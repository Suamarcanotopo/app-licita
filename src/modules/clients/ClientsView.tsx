import React, { useState } from 'react';
import { Building2, CheckCircle2, ShieldAlert, UserCheck } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { GESTOR_MAP } from '../../data/seedData';
import { ProcuracaoStatusText } from '../../components/StatusLabel';

export const ClientsView: React.FC = () => {
  const {
    state,
    selectedClientId,
    setSelectedClientId,
    changeClientInterlocutor,
    updateClientProcuracaoStatus,
    toggleLegalOpinionForAcompanhamento,
    updateCompanyRegistryInfo,
    setRoute,
  } = useApp();

  const clients = state.clients.filter(
    (c) => state.activeProjectId === 'all' || c.projectId === state.activeProjectId
  );

  const activeClient =
    clients.find((c) => c.id === selectedClientId) || clients[0] || state.clients[0];

  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newReason, setNewReason] = useState('');
  const [showChangeForm, setShowChangeForm] = useState(false);

  // Separate company registry update action
  const [showRegistryEdit, setShowRegistryEdit] = useState(false);
  const [regRazao, setRegRazao] = useState('');
  const [regCnpj, setRegCnpj] = useState('');

  const clientAcomps = activeClient
    ? state.acompanhamentos.filter((a) => a.clientId === activeClient.id)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F2744]">Clientes · Empresas e contatos</h1>
        <p className="text-sm text-slate-600 mt-1">
          A operação de representação exige procuração assinada e validada. O vínculo permanece com a empresa mesmo quando o interlocutor muda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Client Companies List */}
        <section className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-lg divide-y divide-slate-100">
          <div className="px-4 py-3 border-b border-[#E2E8F0] text-xs font-semibold text-[#0F2744]">
            Empresas cadastradas ({clients.length})
          </div>
          {clients.map((cli) => {
            const selected = activeClient?.id === cli.id;
            const acompsCount = state.acompanhamentos.filter((a) => a.clientId === cli.id).length;
            return (
              <button
                key={cli.id}
                type="button"
                onClick={() => {
                  setSelectedClientId(cli.id);
                  setShowChangeForm(false);
                  setShowRegistryEdit(false);
                }}
                className={`w-full text-left p-4 transition-colors space-y-1.5 ${
                  selected ? 'bg-[#EEF3F9]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">{cli.razaoSocial}</span>
                  <span className="text-[11px] font-mono text-slate-500 shrink-0 tabular-nums">
                    {acompsCount} edital(is)
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {cli.municipio}/{cli.uf} · {cli.porte} · Interlocutor: {cli.interlocutorAtual}
                </div>
                <ProcuracaoStatusText status={cli.procuracaoStatus} />
              </button>
            );
          })}
        </section>

        {/* Right: Operational Company Record */}
        {activeClient && (
          <section className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="text-slate-500">
                  {state.projects.find((p) => p.id === activeClient.projectId)?.nome} · CNPJ{' '}
                  <span className="font-mono">{activeClient.cnpj}</span>
                </div>
                <h2 className="text-lg font-bold text-[#0F2744] mt-0.5 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>{activeClient.razaoSocial}</span>
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-slate-600">
                  <span>Comercial: {GESTOR_MAP[activeClient.responsavelComercial]?.nome}</span>
                  <span>·</span>
                  <span>Jurídico: {GESTOR_MAP[activeClient.responsavelJuridico]?.nome}</span>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setRegRazao(activeClient.razaoSocial);
                      setRegCnpj(activeClient.cnpj);
                      setShowRegistryEdit((v) => !v);
                    }}
                    className="font-semibold text-[#0F2744] hover:underline"
                  >
                    {showRegistryEdit ? 'Cancelar edição cadastral' : 'Atualizar cadastro da empresa'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-1.5">
                <ProcuracaoStatusText status={activeClient.procuracaoStatus} />
                <div className="text-[11px] font-mono text-slate-500">
                  Vigência: {activeClient.procuracaoValidUntil || 'Sem vigência ativa'}
                </div>
                <div className="flex gap-2 mt-1">
                  {!activeClient.operacaoAtiva ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateClientProcuracaoStatus(activeClient.id, 'Assinada e validada', '2027-11-23')
                      }
                      className="h-8 px-3 font-semibold text-white bg-[#15803D] rounded-md"
                    >
                      Validar procuração
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateClientProcuracaoStatus(activeClient.id, 'Revogada')}
                      className="h-8 px-2.5 text-[#B91C1C] border border-[#FECACA] rounded-md"
                    >
                      Revogar procuração
                    </button>
                  )}
                </div>
              </div>
            </div>

            {showRegistryEdit && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateCompanyRegistryInfo(
                    activeClient.leadId || activeClient.id,
                    regRazao,
                    regCnpj
                  );
                  setShowRegistryEdit(false);
                }}
                className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg space-y-2.5"
              >
                <div className="font-semibold text-[#0F2744]">
                  Atualização de cadastro na ficha da empresa
                </div>
                <p className="text-[11px] text-slate-600">
                  Esta ação atualiza o cadastro oficial da empresa (e do lead vinculado). Documentos já emitidos no Canvas preservam o snapshot original da emissão.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    value={regRazao}
                    onChange={(e) => setRegRazao(e.target.value)}
                    placeholder="Razão social"
                    className="h-9 px-2.5 bg-white border border-[#CBD5E1] rounded"
                  />
                  <input
                    type="text"
                    required
                    value={regCnpj}
                    onChange={(e) => setRegCnpj(e.target.value)}
                    placeholder="CNPJ"
                    className="h-9 px-2.5 bg-white border border-[#CBD5E1] rounded font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="h-8 px-3.5 font-semibold text-white bg-[#0F2744] rounded-md"
                >
                  Salvar atualização cadastral
                </button>
              </form>
            )}

            {!activeClient.operacaoAtiva && (
              <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-md text-[#991B1B] flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Operação de representação interrompida:</strong> procuração {activeClient.procuracaoStatus.toLowerCase()}. Novas ações de representação e habilitação de propostas ficam bloqueadas até validação de novo instrumento.
                </span>
              </div>
            )}

            {/* Interlocutor preserving company link */}
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-[#0F2744] inline-flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>Interlocutor atual (vínculo preservado na empresa)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowChangeForm((v) => !v)}
                  className="font-semibold text-[#0F2744] hover:underline"
                >
                  {showChangeForm ? 'Cancelar troca' : 'Trocar interlocutor'}
                </button>
              </div>

              <div className="text-slate-800">
                <strong>{activeClient.interlocutorAtual}</strong> · {activeClient.interlocutorCargo} ·{' '}
                {activeClient.interlocutorContato}
              </div>

              {showChangeForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    changeClientInterlocutor(
                      activeClient.id,
                      newName,
                      newRole,
                      newContact,
                      newReason
                    );
                    setNewName('');
                    setNewRole('');
                    setNewContact('');
                    setNewReason('');
                    setShowChangeForm(false);
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200"
                >
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nome do novo interlocutor"
                    className="h-9 px-2.5 bg-white border border-[#CBD5E1] rounded"
                  />
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="Cargo"
                    className="h-9 px-2.5 bg-white border border-[#CBD5E1] rounded"
                  />
                  <input
                    type="text"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    placeholder="Contato (e-mail / telefone)"
                    className="h-9 px-2.5 bg-white border border-[#CBD5E1] rounded"
                  />
                  <input
                    type="text"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    placeholder="Motivo da mudança"
                    className="h-9 px-2.5 bg-white border border-[#CBD5E1] rounded"
                  />
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="h-9 px-4 font-semibold text-white bg-[#0F2744] rounded-md"
                    >
                      Salvar novo interlocutor preservando histórico da empresa
                    </button>
                  </div>
                </form>
              )}

              {activeClient.historicoInterlocutores.length > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-1 text-[11px] text-slate-600">
                  <div className="font-semibold text-slate-700">Histórico de interlocutores anteriores:</div>
                  {activeClient.historicoInterlocutores.map((h, i) => (
                    <div key={i}>
                      <strong>{h.nome}</strong> ({h.periodo}) — {h.motivo}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Client linked editais (Acceptance Test 7 target!) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#0F2744]">
                  Acompanhamentos de editais desta empresa ({clientAcomps.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setRoute('radar')}
                  className="font-semibold text-[#15803D] hover:underline"
                >
                  + Vincular edital no Radar
                </button>
              </div>

              {clientAcomps.length === 0 ? (
                <div className="p-4 border border-[#E2E8F0] rounded-lg text-slate-500">
                  Nenhum edital vinculado a esta empresa ainda. Filtre um edital no Radar e clique em "Vincular a cliente".
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-[#E2E8F0] rounded-lg">
                  {clientAcomps.map((ac) => {
                    const ed = state.editais.find((e) => e.id === ac.editalId);
                    return (
                      <div key={ac.id} className="p-4 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-mono font-bold text-[#0F2744]">{ed?.codigo}</span>
                            <span className="text-slate-300 mx-1.5">·</span>
                            <span className="font-semibold text-slate-900">{ed?.orgao}</span>
                          </div>
                          <span
                            className={`font-semibold ${
                              ac.parecerJuridicoLiberado ? 'text-[#15803D]' : 'text-[#B45309]'
                            }`}
                          >
                            {ac.status}
                          </span>
                        </div>
                        <p className="text-slate-700">{ed?.objeto}</p>
                        <div className="text-slate-500 flex flex-wrap gap-x-2 gap-y-0.5">
                          <span>Lote: {ac.lote}</span>
                          <span>·</span>
                          <span>Responsável: {GESTOR_MAP[ac.responsavel]?.nome}</span>
                          <span>·</span>
                          <span>Próxima ação: {ac.proximaAcao}</span>
                        </div>
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">
                            Compatibilidade: {ac.motivoCompatibilidade}
                          </span>
                          {ac.parecerJuridicoLiberado ? (
                            <span className="inline-flex items-center gap-1 text-[#15803D] font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Proposta habilitada</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={!activeClient.operacaoAtiva}
                              onClick={() => toggleLegalOpinionForAcompanhamento(ac.id, true)}
                              className="h-7 px-2.5 font-semibold text-white bg-[#15803D] disabled:opacity-40 rounded"
                            >
                              Liberar parecer jurídico
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
