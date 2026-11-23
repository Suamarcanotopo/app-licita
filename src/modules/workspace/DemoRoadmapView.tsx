import React from 'react';
import { ArrowRight, CheckCircle2, Circle, RotateCcw, Smartphone } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { AcceptanceTestState } from '../../types/domain';

interface ScenarioItem {
  number: number;
  key: keyof AcceptanceTestState;
  title: string;
  howToTest: string;
  actionLabel: string;
  run: () => void;
}

export const DemoRoadmapView: React.FC = () => {
  const {
    state,
    setRoute,
    setSelectedLeadId,
    setSelectedFunnelId,
    setLeadsFilterPreset,
    openVisitorMode,
    markAcceptance,
    restoreDemoData,
  } = useApp();

  const scenarios: ScenarioItem[] = [
    {
      number: 1,
      key: 't1DraftEditedAndCompared',
      title: 'Editar uma pergunta em rascunho e comparar o resultado antes e depois',
      howToTest:
        'Abra o Construtor de Funis, altere o texto ou efeito de uma alternativa no rascunho v1.1 e alterne para a aba "Testar" comparando Rascunho vs Versão Publicada 1.0.',
      actionLabel: 'Abrir Construtor de Funis',
      run: () => {
        setSelectedFunnelId('fun_principal');
        setRoute('funnels');
      },
    },
    {
      number: 2,
      key: 't2BranchSwitchClean',
      title: 'Trocar de caminho e conferir que respostas abandonadas não interferem na qualificação',
      howToTest:
        'No modo Testar do Construtor ou como visitante, preencha o caminho "Já tenho um edital", volte à intenção e troque para "Avaliar minha empresa". Confira no inspetor que as respostas do edital foram descartadas.',
      actionLabel: 'Testar troca de caminho',
      run: () => {
        setSelectedFunnelId('fun_principal');
        setRoute('funnels');
      },
    },
    {
      number: 3,
      key: 't3TwoSalesPagesConverted',
      title: 'Abrir as duas páginas de vendas, simular conversões e verificar as duas origens na mesma fila',
      howToTest:
        'Use o modo visitante alternando entre Página A (jjlicita.com.br/licitacoes-industria) e Página B (jjlicita.com.br/triagem-edital-urgente) no modo "Simular conversão", depois confira ambas as origens em Leads.',
      actionLabel: 'Abrir Páginas de Vendas',
      run: () => openVisitorMode('pg_industria', false),
    },
    {
      number: 4,
      key: 't4TechBottleneckWithThreeGreens',
      title: 'Ver o gargalo técnico destacado com outros três grupos verdes',
      howToTest:
        'Abra o lead "TermoSul Engenharia e Manutenção Ltda" (ou simule uma empresa EPP com certidões e balanço verdes e atestado técnico vermelho). Comprovação técnica aparece como gargalo crítico.',
      actionLabel: 'Abrir lead TermoSul',
      run: () => {
        markAcceptance('t4TechBottleneckWithThreeGreens', true);
        setSelectedLeadId('lead_termosul');
        setRoute('leads');
      },
    },
    {
      number: 5,
      key: 't5LeadReplyPausedCadence',
      title: 'Simular resposta de um lead e confirmar que o próximo lembrete foi pausado',
      howToTest:
        'Abra "Metalúrgica Alfa Caldeiraria ME" (cadência ativa) ou vá em Cadências e mensagens e clique em "Simular resposta do lead". A cadência é pausada imediatamente com registro no histórico.',
      actionLabel: 'Ir para lead com cadência ativa',
      run: () => {
        setSelectedLeadId('lead_metalurgica_alfa');
        setRoute('leads');
      },
    },
    {
      number: 6,
      key: 't6MeetingScheduledWithPartners',
      title: 'Agendar reunião a partir do lead e adicionar um ou ambos os sócios',
      howToTest:
        'Na ficha de qualquer lead (ex.: TermoSul), abra a aba Reunião, selecione José Ribamar e/ou José Ribamar Júnior junto com Márcio e salve. A reunião entra na Agenda e cancela lembretes comerciais.',
      actionLabel: 'Agendar a partir de um lead',
      run: () => {
        setSelectedLeadId('lead_termosul');
        setRoute('leads');
      },
    },
    {
      number: 7,
      key: 't7EditalFilteredAndLinkedToClient',
      title: 'Filtrar um edital por nicho, vinculá-lo a um cliente e abrir o acompanhamento na ficha da empresa',
      howToTest:
        'No Radar de Editais, filtre por projeto/nicho (ex.: Locação de Veículos ou Fornecimento), clique em "Vincular a cliente", escolha a empresa e abra a ficha em Clientes.',
      actionLabel: 'Abrir Radar de Editais',
      run: () => setRoute('radar'),
    },
    {
      number: 8,
      key: 't8ConflictGateVerified',
      title: 'Confirmar que um órgão bloqueado desaparece do Radar e que um órgão sem vínculo segue elegível',
      howToTest:
        'No Radar de Editais, busque "Arapiraca" ou "Contagem" (não aparecem nas oportunidades). Alterne para "Auditoria jurídica (VínculoSócio)" para ver o bloqueio e confirmar "Campinas/SP" como controle positivo.',
      actionLabel: 'Verificar Gate de Conflito',
      run: () => {
        markAcceptance('t8ConflictGateVerified', true);
        setRoute('radar');
      },
    },
    {
      number: 9,
      key: 't9ProcuracaoValidatedOpenedOps',
      title: 'Simular procuração validada e conferir abertura da ficha operacional',
      howToTest:
        'Abra o lead "FrotaNordeste Locação de Veículos S/A" (Procuração pendente) e clique em "Validar procuração assinada". A empresa passa para Cliente Ativo com operação liberada.',
      actionLabel: 'Abrir lead FrotaNordeste',
      run: () => {
        setSelectedLeadId('lead_frotanordeste');
        setRoute('leads');
      },
    },
    {
      number: 10,
      key: 't10MobileChecked',
      title: 'Conferir o formulário e a navegação interna em tela de 360 px, além de desktop',
      howToTest:
        'Redimensione o navegador para 360 px (ou use o modo celular no DevTools) e navegue pelo menu lateral recolhível, lista de etapas do Construtor de Funis e formulário público do visitante.',
      actionLabel: 'Testar página pública (360 px)',
      run: () => {
        markAcceptance('t10MobileChecked', true);
        openVisitorMode('pg_industria', false);
      },
    },
  ];

  const completed = scenarios.filter((s) => state.acceptance[s.key]).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F2744]">Roteiro de demonstração · Aceite da prévia</h1>
          <p className="text-sm text-slate-600 mt-1">
            Execute os 10 cenários de aceite diretamente nesta aplicação usando os dados fictícios carregados no navegador.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-mono font-semibold text-[#0F2744] tabular-nums">
            {completed} de 10 verificados
          </span>
          <button
            type="button"
            onClick={restoreDemoData}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold text-slate-700 bg-white border border-[#E2E8F0] hover:border-[#0F2744] rounded-md whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar dados de demonstração</span>
          </button>
        </div>
      </div>

      {/* Progress strip */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-[#0F2744]">Andamento da conferência de aceite</span>
          <span className="font-mono text-slate-600 tabular-nums">{Math.round((completed / 10) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#15803D] transition-all duration-200"
            style={{ width: `${(completed / 10) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span>
            Todos os cenários atualizam automaticamente conforme você executa as interações reais no painel (ou marque manualmente abaixo).
          </span>
          <button
            type="button"
            onClick={() => {
              setLeadsFilterPreset({});
              setRoute('leads');
            }}
            className="font-semibold text-[#0F2744] hover:underline"
          >
            Ver fila consolidada de leads
          </button>
        </div>
      </div>

      {/* 10 Scenarios list */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg divide-y divide-slate-100">
        {scenarios.map((sc) => {
          const done = state.acceptance[sc.key];
          return (
            <div
              key={sc.key}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <button
                  type="button"
                  onClick={() => markAcceptance(sc.key, !done)}
                  className="mt-0.5 shrink-0"
                  aria-label={`Alternar status do cenário ${sc.number}`}
                >
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 hover:text-[#0F2744]" />
                  )}
                </button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-400 tabular-nums">
                      {String(sc.number).padStart(2, '0')}.
                    </span>
                    <h2 className="text-sm font-semibold text-slate-900">{sc.title}</h2>
                    <span
                      className={`text-xs font-medium ${done ? 'text-[#15803D]' : 'text-slate-500'}`}
                    >
                      · {done ? 'Executado' : 'Pendente'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{sc.howToTest}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={sc.run}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-[#0F2744] bg-white border border-[#CBD5E1] hover:border-[#0F2744] hover:bg-[#F8FAFC] rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                {sc.number === 10 && <Smartphone className="w-3.5 h-3.5" />}
                <span>{sc.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Evolution note (Section 10) */}
      <section className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-2 text-xs text-slate-600">
        <h3 className="text-sm font-semibold text-[#0F2744]">Escopo desta entrega e evolução pós-aprovação</h3>
        <p className="leading-relaxed">
          Esta prévia valida visualmente e funcionalmente a experiência completa da JJ LICITA com persistência local.
          O piloto real da <strong>v0.3</strong> permanece enxuto (formulário incorporável, resultado, notificação interna e exportação CSV),
          expandindo a automação de fontes e o portal <span className="font-mono text-[#0F2744]">clientes.jjlicita.com.br</span> após o marco das três procurações validadas.
        </p>
      </section>
    </div>
  );
};
