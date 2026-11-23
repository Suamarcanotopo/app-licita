import React, { useState } from 'react';
import { Code2, Copy, ExternalLink, FileSearch } from 'lucide-react';
import { useApp } from '../../store/AppContext';

export const SalesPagesView: React.FC = () => {
  const { state, openVisitorMode, showToast } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopySnippet = (pageId: string, snippet: string) => {
    navigator.clipboard?.writeText(snippet).catch(() => {});
    setCopiedId(pageId);
    showToast('Código de incorporação copiado.');
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F2744]">Páginas de vendas e formulários incorporáveis</h1>
        <p className="text-sm text-slate-600 mt-1">
          Um mesmo funil publicado serve a múltiplas páginas em <span className="font-mono">jjlicita.com.br</span>, registrando página, campanha e versão na origem de cada lead.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {state.salesPages.map((page) => {
          const funnel = state.funnels.find((f) => f.id === page.funnelId) || state.funnels[0];
          const project = state.projects.find((p) => p.id === page.projectId);
          const pageLeads = state.leads.filter((l) => l.salesPageId === page.id);
          const snippet = `<div data-jjlicita-embed data-page="${page.slug}" data-funnel="${funnel.id}" data-version="${funnel.publishedVersion}" data-campaign="${page.utmCampaign}"></div>\n<script src="https://painel.jjlicita.com.br/embed/funnel.js" async></script>`;

          return (
            <article
              key={page.id}
              className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-[#0F2744] font-semibold truncate">{page.url}</span>
                  <span className="text-[#15803D] font-semibold shrink-0">Ativa</span>
                </div>

                <div>
                  <h2 className="text-base font-bold text-[#0F2744]">{page.title}</h2>
                  <p className="text-xs text-slate-600 mt-1">{page.headline}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500 block">Projeto / Nicho</span>
                    <span className="font-semibold text-slate-900">{project?.nome}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Funil e versão</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {funnel.id} · v{funnel.publishedVersion}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Campanha atribuída</span>
                    <span className="font-medium text-slate-800">{page.campaignName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Leads gerados na fila</span>
                    <span className="font-mono font-bold text-[#0F2744] tabular-nums">
                      {pageLeads.length}
                    </span>
                  </div>
                </div>

                {/* Embed code block */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Componente incorporável</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopySnippet(page.id, snippet)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F2744] hover:underline"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedId === page.id ? 'Copiado' : 'Copiar código'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap">
                    {snippet}
                  </pre>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openVisitorMode(page.id, false)}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md whitespace-nowrap"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir página como visitante</span>
                </button>
                <button
                  type="button"
                  onClick={() => openVisitorMode(page.id, true)}
                  className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold text-[#0F2744] bg-white border border-[#CBD5E1] hover:border-[#0F2744] rounded-md whitespace-nowrap"
                >
                  <FileSearch className="w-3.5 h-3.5" />
                  <span>Acesso direto: Já tenho edital</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
