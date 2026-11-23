import React from 'react';
import { CheckCircle2, Download, Globe, Lock, ShieldCheck } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { GESTORES } from '../../data/seedData';
import { PATH_LABELS } from '../../engine/qualification';

export const TeamPermissionsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F2744]">Equipe e permissões</h1>
        <p className="text-sm text-slate-600 mt-1">
          Governança dos três gestores internos no subdomínio <span className="font-mono">painel.jjlicita.com.br</span>, com separação de primeira abordagem e área jurídica restrita.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {GESTORES.map((g) => (
          <article key={g.id} className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[#0F2744]">{g.nome}</h2>
                <div className="text-slate-600 mt-0.5">{g.papel}</div>
                <div className="font-mono text-slate-400 mt-0.5">{g.email}</div>
              </div>
              <ShieldCheck className="w-5 h-5 text-[#0F2744] shrink-0" />
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                <span>
                  {g.primeiraAbordagem
                    ? 'Responsável padrão pela 1ª abordagem humana de todos os leads'
                    : 'Participa das reuniões pós-agendamento conforme disponibilidade'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {g.acessoJuridicoRestrito ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span>
                  {g.acessoJuridicoRestrito
                    ? 'Acesso à auditoria restrita de VínculoSócio e emissão de parecer jurídico'
                    : 'Sem acesso à tabela restrita de conflitos societários (recebe apenas oportunidades elegíveis)'}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export const IntegrationsDomainsView: React.FC = () => {
  const { openVisitorMode } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F2744]">Integrações, domínios e roteiro de evolução</h1>
        <p className="text-sm text-slate-600 mt-1">
          Arquitetura de três endereços ilustrativos e estratégia enxuta da v0.3 até o portal autenticado de clientes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
        <section className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 font-mono font-bold text-[#0F2744] text-sm">
            <Globe className="w-4 h-4" />
            <span>jjlicita.com.br</span>
          </div>
          <div className="font-semibold text-[#15803D]">Site público · Páginas de vendas</div>
          <p className="text-slate-600 leading-relaxed">
            Hospeda as páginas de vendas e incorpora o componente do funil identificado por página, funil e versão publicada. Um mesmo funil serve a várias campanhas.
          </p>
          <button
            type="button"
            onClick={() => openVisitorMode('pg_industria', false)}
            className="h-8 px-3 font-semibold text-[#0F2744] border border-[#CBD5E1] rounded-md"
          >
            Testar página incorporada
          </button>
        </section>

        <section className="bg-white border border-[#0F2744] rounded-lg p-5 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 font-mono font-bold text-[#0F2744] text-sm">
            <Globe className="w-4 h-4" />
            <span>painel.jjlicita.com.br</span>
          </div>
          <div className="font-semibold text-[#15803D]">Plugin central de gestão (ativo)</div>
          <p className="text-slate-600 leading-relaxed">
            Área interna dos três gestores que hospeda o Construtor de Funis, recebe submissões deduplicadas, dispara notificações internas, controla CRM, Radar e exportação CSV.
          </p>
        </section>

        <section className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 font-mono font-bold text-slate-700 text-sm">
            <Lock className="w-4 h-4" />
            <span>clientes.jjlicita.com.br</span>
          </div>
          <div className="font-semibold text-slate-500">Portal do cliente (fase posterior)</div>
          <p className="text-slate-600 leading-relaxed">
            Entrega posterior ao marco das 3 procurações validadas. Cada cliente acompanhará processos, enviará documentos e assinará procurações pela plataforma.
          </p>
        </section>
      </div>

      {/* Evolution Roadmap (Section 10) */}
      <section className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 text-xs">
        <h2 className="text-sm font-semibold text-[#0F2744]">Roteiro de evolução pós-aprovação visual</h2>
        <ol className="space-y-2 text-slate-700 list-decimal pl-4">
          <li>
            <strong>Prévia navegável atual:</strong> validação de interface, fluxos e critérios de aceite com persistência local no navegador.
          </li>
          <li>
            <strong>Piloto real v0.3 (enxuto):</strong> conexão ao repositório GitHub, formulário incorporável publicado, parecer de resultado, notificação interna deduplicada e exportação CSV.
          </li>
          <li>
            <strong>Marco das 3 procurações validadas:</strong> gatilho para ativar leitura automatizada de fontes oficiais (PNCP / 27 UFs) e expansão operacional completa.
          </li>
          <li>
            <strong>Entrega posterior — Portal do Cliente:</strong> autenticação isolada em <span className="font-mono">clientes.jjlicita.com.br</span> para documentos, assinatura e acompanhamento de certames.
          </li>
        </ol>
      </section>
    </div>
  );
};

export const CsvExportView: React.FC = () => {
  const { state, isOrgaoBlocked, showToast } = useApp();

  const downloadCsv = (filename: string, headers: string[], rows: string[][]) => {
    const escape = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Arquivo ${filename} exportado com sucesso.`);
  };

  const exportLeads = () => {
    downloadCsv(
      'jjlicita_leads_v03.csv',
      [
        'ID',
        'Empresa',
        'Contato',
        'Canal',
        'Contato Valor',
        'Página Origem',
        'Campanha',
        'Versão Funil',
        'Intenção',
        'Porte',
        'Etapa',
        'Grupos Disponíveis',
        'Gargalo',
        'Procuração',
        'Criado em',
      ],
      state.leads.map((l) => [
        l.id,
        l.companyName,
        l.contactName,
        l.contactChannel,
        l.contactValue,
        l.salesPageUrl,
        l.campaign,
        l.funnelVersion,
        PATH_LABELS[l.intent],
        l.porte,
        l.stage,
        `${l.qualification.availableCount}/4`,
        l.qualification.bottleneckLabel,
        l.procuracaoStatus,
        l.createdAt,
      ])
    );
  };

  const exportRadar = () => {
    const eligible = state.editais.filter((e) => !isOrgaoBlocked(e.orgao).blocked);
    downloadCsv(
      'jjlicita_radar_elegiveis.csv',
      ['Código', 'Versão', 'Órgão', 'UF', 'Município', 'Modalidade', 'Objeto', 'Valor', 'Prazo', 'Situação', 'Origem'],
      eligible.map((e) => [
        e.codigo,
        e.versaoEdital,
        e.orgao,
        e.uf,
        e.municipio,
        e.modalidade,
        e.objeto,
        e.valorEstimado,
        e.prazoIso,
        e.situacao,
        e.originSheet,
      ])
    );
  };

  const exportSources = () => {
    downloadCsv(
      'jjlicita_fontes_oficiais_27ufs.csv',
      ['UF', 'Município', 'IBGE', 'Portal', 'URL Licitações', 'Situação', 'Edital Confirmado', 'Guia Origem'],
      state.sources.map((s) => [
        s.uf,
        s.municipio,
        s.ibgeCode,
        s.portalName,
        s.urlLicitacoes || s.urlPrefeitura,
        s.situacaoValidacao,
        s.hasConfirmedEdital ? 'Sim' : 'Não',
        s.originSheet,
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F2744]">Exportação CSV</h1>
        <p className="text-sm text-slate-600 mt-1">
          Exporte os registros da operação em formato CSV (UTF-8 com BOM, compatível com Excel e Google Sheets). Editais bloqueados por VínculoSócio são excluídos da exportação comercial.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-bold text-[#0F2744]">Fila completa de Leads</h2>
          <p className="text-slate-600">
            Inclui página de origem, campanha, versão do funil, semáforo, gargalo e status da procuração ({state.leads.length} registros).
          </p>
          <button
            type="button"
            onClick={exportLeads}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Leads (.csv)</span>
          </button>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-bold text-[#0F2744]">Radar de Editais elegíveis</h2>
          <p className="text-slate-600">
            Apenas editais verificados e liberados pelo Gate de Conflito v0.3 ({state.editais.filter((e) => !isOrgaoBlocked(e.orgao).blocked).length} registros).
          </p>
          <button
            type="button"
            onClick={exportRadar}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 font-semibold text-white bg-[#0F2744] hover:bg-[#1A3A63] rounded-md"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Radar (.csv)</span>
          </button>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-bold text-[#0F2744]">Fontes Oficiais (27 UFs)</h2>
          <p className="text-slate-600">
            Portais municipais e nacionais catalogados com código IBGE, status de validação e guia de origem ({state.sources.length} registros).
          </p>
          <button
            type="button"
            onClick={exportSources}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 font-semibold text-[#0F2744] bg-white border border-[#CBD5E1] hover:border-[#0F2744] rounded-md"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Fontes (.csv)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
