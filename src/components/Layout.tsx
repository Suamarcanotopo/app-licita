import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Compass,
  Download,
  ExternalLink,
  FileCheck2,
  FileSearch,
  FileText,
  FolderKanban,
  GitBranch,
  Globe,
  History,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  Menu,
  MessageSquare,
  Radar,
  RotateCcw,
  Scale,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { MenuRoute } from '../types/domain';

interface NavGroup {
  label: string;
  items: {
    id: MenuRoute;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
      { id: 'projects', label: 'Projetos e nichos', icon: FolderKanban },
      { id: 'tasks', label: 'Minha agenda e tarefas', icon: CheckSquare },
      { id: 'demo-roadmap', label: 'Roteiro de demonstração', icon: ListChecks },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { id: 'leads', label: 'Leads', icon: Users },
      { id: 'qualification', label: 'Qualificação', icon: SlidersHorizontal },
      { id: 'meetings', label: 'Reuniões', icon: Calendar },
      { id: 'proposals', label: 'Propostas e procurações', icon: FileCheck2 },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { id: 'funnels', label: 'Funis', icon: GitBranch },
      { id: 'sales-pages', label: 'Páginas e formulários', icon: Globe },
      { id: 'campaigns', label: 'Campanhas e atribuição', icon: Megaphone },
      { id: 'cadences', label: 'Cadências e mensagens', icon: MessageSquare },
    ],
  },
  {
    label: 'Licitações',
    items: [
      { id: 'radar', label: 'Radar de editais', icon: Radar },
      { id: 'sources', label: 'Fontes oficiais', icon: Compass },
      { id: 'triage', label: 'Triagem de editais', icon: FileSearch },
      { id: 'acompanhamentos', label: 'Acompanhamentos', icon: Scale },
    ],
  },
  {
    label: 'Clientes',
    items: [
      { id: 'clients', label: 'Empresas e contatos', icon: Building2 },
      { id: 'documents', label: 'Documentos', icon: FileText },
      { id: 'client-tenders', label: 'Licitações do cliente', icon: Activity },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { id: 'indicators', label: 'Indicadores e tempo jurídico', icon: BarChart3 },
      { id: 'audit-log', label: 'Histórico de alterações', icon: History },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { id: 'team', label: 'Equipe e permissões', icon: ShieldCheck },
      { id: 'integrations', label: 'Integrações e domínios', icon: Globe },
      { id: 'csv-export', label: 'Exportação CSV', icon: Download },
    ],
  },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    state,
    route,
    setRoute,
    openVisitorMode,
    globalSearch,
    setGlobalSearch,
    setActiveProjectId,
    restoreDemoData,
    markNotificationRead,
    setSelectedLeadId,
    toast,
  } = useApp();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadNotifs = state.notifications.filter((n) => !n.read);

  let currentGroupLabel = 'Workspace';
  let currentItemLabel = 'Visão geral';
  for (const g of NAV_GROUPS) {
    const found = g.items.find((i) => i.id === route);
    if (found) {
      currentGroupLabel = g.label;
      currentItemLabel = found.label;
      break;
    }
  }

  const handleNavigate = (id: MenuRoute) => {
    setRoute(id);
    setMobileMenuOpen(false);
  };

  const renderNavContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-[#0F2744] text-slate-100 select-none">
      {/* Brand header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => handleNavigate('overview')}
          className="text-left focus-visible:outline-2 focus-visible:outline-white rounded"
        >
          {collapsed && !isMobile ? (
            <span className="font-display font-bold text-base tracking-tight text-white">JJ</span>
          ) : (
            <span className="font-display font-bold text-base tracking-tight text-white whitespace-nowrap">
              JJ LICITA
            </span>
          )}
        </button>

        {isMobile ? (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-slate-300 hover:text-white rounded-md"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Active Project selector in sidebar */}
      {(!collapsed || isMobile) && (
        <div className="px-3 py-3 border-b border-white/10 shrink-0">
          <label htmlFor={isMobile ? 'proj-sel-m' : 'proj-sel-d'} className="block text-[11px] font-medium text-slate-300 mb-1">
            Projeto ativo
          </label>
          <select
            id={isMobile ? 'proj-sel-m' : 'proj-sel-d'}
            value={state.activeProjectId}
            onChange={(e) => setActiveProjectId(e.target.value)}
            className="w-full h-9 px-2.5 text-xs font-medium bg-[#17355A] text-white border border-white/15 rounded-md focus:border-white/40 focus:outline-none"
          >
            <option value="all">Todos os projetos ({state.projects.length})</option>
            {state.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Navigation groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4" aria-label="Menu principal">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {(!collapsed || isMobile) && (
              <div className="px-2.5 mb-1 text-[11px] font-semibold tracking-wide text-slate-400">
                {group.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = route === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleNavigate(item.id)}
                      title={collapsed && !isMobile ? `${group.label} · ${item.label}` : undefined}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-white/15 text-white'
                          : 'text-slate-300 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom quick utility actions */}
      <div className="p-3 border-t border-white/10 space-y-2 shrink-0">
        {(!collapsed || isMobile) ? (
          <>
            <button
              type="button"
              onClick={restoreDemoData}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white bg-white/8 hover:bg-white/15 rounded-md transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Restaurar dados de demonstração</span>
            </button>
            <div className="text-[11px] text-slate-400 px-1 truncate">
              painel.jjlicita.com.br · Márcio
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={restoreDemoData}
            title="Restaurar dados de demonstração"
            className="w-full flex items-center justify-center p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-md"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F6F8FB] text-[#0F172A]">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 sticky top-0 h-screen transition-[width] duration-150 ${
          collapsed ? 'w-[68px]' : 'w-[256px]'
        }`}
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-[280px] max-w-[85vw] h-full shadow-xl">
            {renderNavContent(true)}
          </div>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar (compact <=56px for 15% mobile sticky cap compliance) */}
        <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#E2E8F0] px-3 sm:px-6 flex items-center justify-between gap-3">
          {/* Left: Hamburger + Breadcrumb */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-1 text-slate-700 hover:bg-slate-100 rounded-md shrink-0"
              aria-label="Abrir menu de navegação"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm min-w-0">
              <span className="hidden sm:inline text-slate-500 whitespace-nowrap">{currentGroupLabel}</span>
              <span className="hidden sm:inline text-slate-300">/</span>
              <span className="font-display font-semibold text-[#0F2744] truncate">{currentItemLabel}</span>
            </div>
          </div>

          {/* Center: Global Search (desktop & tablet) */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-2">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Buscar leads, editais, órgãos, clientes ou funis..."
                className="w-full h-9 pl-9 pr-3 text-xs bg-[#F6F8FB] border border-[#E2E8F0] rounded-md text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0F2744] focus:outline-none"
              />
            </div>
          </div>

          {/* Right: Notifications + Primary Action "Testar como visitante" */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2 text-slate-600 hover:text-[#0F2744] hover:bg-slate-100 rounded-md transition-colors"
                aria-label="Notificações internas"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 text-[10px] font-mono font-semibold bg-[#B91C1C] text-white rounded flex items-center justify-center tabular-nums">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-24px)] bg-white border border-[#E2E8F0] rounded-lg shadow-lg z-50">
                  <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#0F2744]">Notificações internas</span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="text-slate-400 hover:text-slate-700"
                      aria-label="Fechar notificações"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {state.notifications.length === 0 ? (
                      <div className="p-4 text-xs text-slate-500">Nenhuma notificação registrada.</div>
                    ) : (
                      state.notifications.slice(0, 8).map((n) => (
                        <div key={n.id} className={`p-3.5 text-xs ${n.read ? 'bg-white' : 'bg-slate-50'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-slate-900">{n.title}</p>
                            <span className="text-[11px] font-mono text-slate-400 shrink-0 tabular-nums">
                              {n.at.slice(11)}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                          <div className="mt-2 flex items-center gap-3">
                            {n.leadId && (
                              <button
                                type="button"
                                onClick={() => {
                                  markNotificationRead(n.id);
                                  setSelectedLeadId(n.leadId!);
                                  setRoute('leads');
                                  setNotifOpen(false);
                                }}
                                className="text-xs font-medium text-[#0F2744] hover:underline"
                              >
                                Abrir lead
                              </button>
                            )}
                            {!n.read && (
                              <button
                                type="button"
                                onClick={() => markNotificationRead(n.id)}
                                className="text-xs text-slate-500 hover:text-slate-800"
                              >
                                Marcar como lida
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => openVisitorMode('pg_industria', false)}
              className="inline-flex items-center gap-1.5 h-9 px-3 sm:px-4 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>Testar como visitante</span>
            </button>
          </div>
        </header>

        {/* Active project bar on narrow screens or when filtered */}
        {state.activeProjectId !== 'all' && (
          <div className="bg-[#EEF3F9] border-b border-[#D5E1EF] px-4 sm:px-6 py-2 flex items-center justify-between gap-2 text-xs">
            <div className="text-[#0F2744]">
              Filtro de projeto ativo:{' '}
              <strong className="font-semibold">
                {state.projects.find((p) => p.id === state.activeProjectId)?.nome}
              </strong>
            </div>
            <button
              type="button"
              onClick={() => setActiveProjectId('all')}
              className="font-medium text-[#0F2744] hover:underline whitespace-nowrap"
            >
              Ver todos os projetos
            </button>
          </div>
        )}

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Transient feedback toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-50 max-w-md bg-[#0F2744] text-white px-4 py-3 rounded-lg shadow-lg border border-white/15 text-xs font-medium flex items-center gap-3"
        >
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};
