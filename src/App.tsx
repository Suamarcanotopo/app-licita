/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { Layout } from './components/Layout';
import { OverviewView } from './modules/workspace/OverviewView';
import { ProjectsView } from './modules/workspace/ProjectsView';
import { TasksAgendaView } from './modules/workspace/TasksAgendaView';
import { DemoRoadmapView } from './modules/workspace/DemoRoadmapView';
import { FunnelBuilderView } from './modules/funnels/FunnelBuilderView';
import { SalesPagesView } from './modules/funnels/SalesPagesView';
import { CampaignsView } from './modules/funnels/CampaignsView';
import { PublicVisitorView } from './modules/funnels/PublicVisitorView';
import { LeadsView } from './modules/commercial/LeadsView';
import { QualificationRulesView } from './modules/commercial/QualificationRulesView';
import { MeetingsView } from './modules/commercial/MeetingsView';
import { ProposalsProcuracoesView } from './modules/commercial/ProposalsProcuracoesView';
import { CadencesView } from './modules/commercial/CadencesView';
import { RadarView } from './modules/radar/RadarView';
import { OfficialSourcesView } from './modules/radar/OfficialSourcesView';
import { TriageEditaisView } from './modules/radar/TriageEditaisView';
import { AcompanhamentosView } from './modules/radar/AcompanhamentosView';
import { ClientsView } from './modules/clients/ClientsView';
import { DocumentsView } from './modules/clients/DocumentsView';
import { ClientTendersView } from './modules/clients/ClientTendersView';
import { IndicatorsView } from './modules/management/IndicatorsView';
import { AuditLogView } from './modules/management/AuditLogView';
import {
  CsvExportView,
  IntegrationsDomainsView,
  TeamPermissionsView,
} from './modules/management/SettingsViews';
import { DocumentCanvas } from './modules/documents/DocumentCanvas';

const AppRouter: React.FC = () => {
  const { route, viewMode } = useApp();

  if (viewMode === 'visitor') {
    return <PublicVisitorView />;
  }

  const renderScreen = () => {
    switch (route) {
      case 'overview':
        return <OverviewView />;
      case 'projects':
        return <ProjectsView />;
      case 'tasks':
        return <TasksAgendaView />;
      case 'demo-roadmap':
        return <DemoRoadmapView />;
      case 'leads':
        return <LeadsView />;
      case 'qualification':
        return <QualificationRulesView />;
      case 'meetings':
        return <MeetingsView />;
      case 'proposals':
        return <ProposalsProcuracoesView />;
      case 'funnels':
        return <FunnelBuilderView />;
      case 'sales-pages':
        return <SalesPagesView />;
      case 'campaigns':
        return <CampaignsView />;
      case 'cadences':
        return <CadencesView />;
      case 'radar':
        return <RadarView />;
      case 'sources':
        return <OfficialSourcesView />;
      case 'triage':
        return <TriageEditaisView />;
      case 'acompanhamentos':
        return <AcompanhamentosView />;
      case 'clients':
        return <ClientsView />;
      case 'documents':
        return <DocumentsView />;
      case 'client-tenders':
        return <ClientTendersView />;
      case 'indicators':
        return <IndicatorsView />;
      case 'audit-log':
        return <AuditLogView />;
      case 'team':
        return <TeamPermissionsView />;
      case 'integrations':
        return <IntegrationsDomainsView />;
      case 'csv-export':
        return <CsvExportView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <>
      <Layout>{renderScreen()}</Layout>
      <DocumentCanvas />
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
