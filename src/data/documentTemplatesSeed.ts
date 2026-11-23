import {
  CanvasDocument,
  DocumentBrandIdentity,
  DocumentTemplate,
} from '../types/domain';

export const DEFAULT_BRAND_STANDARD: DocumentBrandIdentity = {
  logoText: 'JJ LICITA',
  logoSubtext: 'Assessoria Jurídica e Gestão de Licitações Públicas',
  accentColor: '#0F2744',
  headerText: 'JJ LICITA · Gestão Comercial e Jurídica B2G · painel.jjlicita.com.br',
  footerText: 'JJ LICITA Assessoria em Licitações · Documento preparado em plataforma interna · Uso restrito às partes',
};

export const INITIAL_DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'tpl_procuracao_padrao',
    name: 'Procuração Padrão · Representação em Licitações',
    type: 'procuracao',
    description: 'Instrumento particular padrão de outorga de poderes para credenciamento, lances, recursos e acompanhamento administrativo.',
    defaultTitle: 'Procuração Particular — Representação em Licitações Públicas',
    defaultPoderes:
      'Representar a outorgante perante órgãos públicos federais, estaduais e municipais, sistemas eletrônicos (PNCP, Compras.gov, portais estaduais/municipais), formular propostas e lances, assinar atas, apresentar impugnações, esclarecimentos e recursos administrativos.',
    defaultVigencia: '12 meses a contar da assinatura (até 23/11/2027)',
    defaultBody:
      'Pelo presente instrumento particular de mandato, {{empresa}}, inscrita no CNPJ sob nº {{cnpj}}, porte {{porte}}, neste ato representada por {{representante}}, nomeia e constitui como seus bastantes procuradores os representantes da JJ LICITA, conferindo-lhes amplos poderes administrativos para atuação em processos licitatórios.',
    clauses: [
      {
        id: 'cl_proc_1',
        title: 'Cláusula 1ª — Dos Poderes Outorgados',
        content: 'Ficam outorgados poderes específicos para: {{poderes}}.',
      },
      {
        id: 'cl_proc_2',
        title: 'Cláusula 2ª — Da Vigência e Revogação',
        content: 'O presente mandato vigorará pelo prazo de {{vigencia}}, podendo ser revogado por comunicação formal por escrito, cessando imediatamente novas representações.',
      },
      {
        id: 'cl_proc_3',
        title: 'Cláusula 3ª — Dos Signatários e Conferência',
        content: 'Firmam o presente instrumento: {{signatarios}}, em {{data_hoje}}.',
      },
    ],
    updatedAt: '2026-11-18 10:00',
  },
  {
    id: 'tpl_procuracao_certame',
    name: 'Procuração Específica · Certame / Edital Vinculado',
    type: 'procuracao',
    description: 'Mandato direcionado a um pregão ou concorrência específica com identificação de órgão, lote e versão do edital.',
    defaultTitle: 'Procuração Específica para Certame Licitatório',
    defaultPoderes:
      'Credenciar, ofertar lances, negociar preços, apresentar documentação de habilitação, manifestar intenção de recurso e interpor razões administrativas no certame identificado.',
    defaultVigencia: 'Até a homologação e assinatura do contrato decorrente do certame',
    defaultBody:
      'A empresa {{empresa}} (CNPJ {{cnpj}}), representada por {{representante}}, outorga poderes específicos à equipe da JJ LICITA para representá-la no certame {{edital_codigo}}, conduzido por {{edital_orgao}}, referente ao objeto/lote {{edital_lote}} (versão conferida: {{edital_versao}}).',
    clauses: [
      {
        id: 'cl_pc_1',
        title: 'Cláusula 1ª — Vinculação ao Edital',
        content: 'Este mandato é restrito ao certame {{edital_codigo}} ({{edital_orgao}} · {{edital_versao}}), lote {{edital_lote}}.',
      },
      {
        id: 'cl_pc_2',
        title: 'Cláusula 2ª — Poderes e Limites',
        content: 'Poderes conferidos: {{poderes}}. Vigência: {{vigencia}}.',
      },
      {
        id: 'cl_pc_3',
        title: 'Cláusula 3ª — Assinaturas',
        content: 'Signatários identificados: {{signatarios}}.',
      },
    ],
    updatedAt: '2026-11-20 14:30',
  },
  {
    id: 'tpl_minuta_padrao',
    name: 'Minuta Padrão · Contrato de Delegação B2G',
    type: 'minuta',
    description: 'Minuta contratual enviada ao cliente para leitura, revisão de escopo comercial e registro de comentários antes da versão definitiva.',
    defaultTitle: 'Minuta Contratual — Prestação de Serviços em Licitações Públicas',
    defaultBody:
      'MINUTA PARA LEITURA E COMENTÁRIOS — Instrumento preliminar preparado para {{empresa}} (CNPJ {{cnpj}}, porte {{porte}}), aos cuidados de {{contato}} ({{canal_contato}}), detalhando escopo de assessoria, radar de editais em território {{territorio}} e condução jurídica.',
    clauses: [
      {
        id: 'cl_min_1',
        title: 'Cláusula 1ª — Do Objeto da Assessoria',
        content: 'A JJ LICITA prestará serviços de inteligência de editais, triagem jurídica, organização documental em 4 grupos e acompanhamento de sessões públicas para {{empresa}}.',
      },
      {
        id: 'cl_min_2',
        title: 'Cláusula 2ª — Da Governança e Condição de Representação',
        content: 'Qualquer representação formal em sessão pública ou protocolo de proposta depende de procuração assinada e validada e parecer jurídico liberado para a versão vigente do edital.',
      },
      {
        id: 'cl_min_3',
        title: 'Cláusula 3ª — Condições Comerciais (Minuta sujeita a ajustes)',
        content: 'Os valores de mensalidade fixa e remuneração variável serão consolidados após comentários da diretoria de {{empresa}} sobre esta minuta.',
      },
    ],
    updatedAt: '2026-11-19 09:15',
  },
  {
    id: 'tpl_minuta_triagem',
    name: 'Minuta de Proposta · Revisão Completa de Edital',
    type: 'minuta',
    description: 'Minuta comercial focada em revisão completa, impugnação e montagem integral de habilitação para um edital já identificado.',
    defaultTitle: 'Minuta de Proposta — Revisão Completa e Participação no Certame',
    defaultBody:
      'MINUTA PARA REVISÃO — Proposta técnica e comercial dirigida à {{empresa}} (CNPJ {{cnpj}}) para atuação completa no edital {{edital_codigo}} ({{edital_orgao}}), lote {{edital_lote}}.',
    clauses: [
      {
        id: 'cl_mt_1',
        title: 'Cláusula 1ª — Escopo Contratado Pós-Triagem de 15 min',
        content: 'Abrange revisão jurídica integral do edital {{edital_codigo}}, conferência de atestados técnicos, certidões e preparação de proposta.',
      },
      {
        id: 'cl_mt_2',
        title: 'Cláusula 2ª — Prazo e Documentação',
        content: 'A contratante compromete-se a disponibilizar documentos pendentes conforme cronograma ajustado com Márcio e equipe jurídica.',
      },
    ],
    updatedAt: '2026-11-21 11:00',
  },
];

export function createInitialCanvasDocuments(): CanvasDocument[] {
  const brand = structuredClone(DEFAULT_BRAND_STANDARD);

  const minutaFields = {
    razaoSocial: { value: 'FrotaNordeste Locação de Veículos S/A', origin: 'cadastro' as const, registryValue: 'FrotaNordeste Locação de Veículos S/A' },
    cnpj: { value: '19.804.612/0001-08', origin: 'cadastro' as const, registryValue: '19.804.612/0001-08' },
    porte: { value: 'Demais', origin: 'cadastro' as const, registryValue: 'Demais' },
    contatoNome: { value: 'Roberto Vasconcelos', origin: 'cadastro' as const, registryValue: 'Roberto Vasconcelos' },
    contatoCanalValor: { value: 'WhatsApp: (82) 99911-3340', origin: 'cadastro' as const, registryValue: 'WhatsApp: (82) 99911-3340' },
    territorio: { value: 'Estadual', origin: 'cadastro' as const, registryValue: 'Estadual' },
    representanteLegal: { value: 'Roberto Vasconcelos', origin: 'cadastro' as const, registryValue: 'Roberto Vasconcelos' },
    poderes: { value: '', origin: 'pendente' as const, registryValue: '' },
    vigencia: { value: '12 meses', origin: 'documento' as const, registryValue: '' },
    signatarios: { value: 'Roberto Vasconcelos · José Ribamar', origin: 'cadastro' as const, registryValue: 'Roberto Vasconcelos · José Ribamar' },
    editalCodigo: { value: 'PE 027/2026', origin: 'documento' as const, registryValue: '' },
    editalOrgao: { value: 'Prefeitura Municipal de Maceió/AL', origin: 'documento' as const, registryValue: '' },
    editalLote: { value: 'Lote Único — 42 veículos utilitários', origin: 'documento' as const, registryValue: '' },
    editalVersao: { value: 'v1.2 (Retificado 20/11/2026)', origin: 'documento' as const, registryValue: '' },
  };

  const minutaClauses = [
    {
      id: 'cl_min_1',
      title: 'Cláusula 1ª — Do Objeto da Assessoria',
      content: 'A JJ LICITA prestará serviços de inteligência de editais, triagem jurídica e condução de pregões de locação de frota para FrotaNordeste Locação de Veículos S/A.',
      editedInDoc: false,
    },
    {
      id: 'cl_min_2',
      title: 'Cláusula 2ª — Condição de Representação',
      content: 'Qualquer representação formal em sessão pública depende de procuração assinada e validada e parecer jurídico liberado para a versão vigente do edital.',
      editedInDoc: false,
    },
  ];

  const minutaBody =
    'MINUTA PARA LEITURA E COMENTÁRIOS — Instrumento preliminar preparado para FrotaNordeste Locação de Veículos S/A (CNPJ 19.804.612/0001-08), aos cuidados de Roberto Vasconcelos.';

  const minutaRecipients = [
    {
      id: 'rec_fn_1',
      name: 'Roberto Vasconcelos',
      role: 'Diretor Comercial · FrotaNordeste',
      contact: '(82) 99911-3340',
      channel: 'WhatsApp' as const,
    },
  ];

  const emittedMinutaSnap = {
    versionId: 'snap_min_101',
    versionLabel: 'v1.0 · Minuta',
    savedAt: '2026-11-19 15:30',
    savedBy: 'José Ribamar',
    reason: 'Emissão oficial: Minuta enviada para leitura e comentários',
    isEmittedSnapshot: true,
    emittedStatus: 'Minuta enviada para comentários' as const,
    deliveryMessage: 'Olá Roberto, segue a minuta contratual v1.0 para sua leitura e eventuais comentários antes da assinatura.',
    type: 'minuta' as const,
    title: 'Minuta Contratual — Prestação de Serviços em Licitações Públicas',
    brand: structuredClone(brand),
    body: minutaBody,
    clauses: structuredClone(minutaClauses),
    fields: structuredClone(minutaFields),
    recipients: structuredClone(minutaRecipients),
  };

  return [
    {
      id: 'DOC-2026-101',
      leadId: 'lead_frotanordeste',
      companyName: 'FrotaNordeste Locação de Veículos S/A',
      type: 'minuta',
      templateId: 'tpl_minuta_padrao',
      templateName: 'Minuta Padrão · Contrato de Delegação B2G',
      currentVersion: 'v1.0 · Minuta',
      status: 'Minuta enviada para comentários',
      internalReviewStatus: 'Aprovada',
      legalCheckPassed: true,
      legalCheckNote: 'Minuta revisada pelo jurídico.',
      title: 'Minuta Contratual — Prestação de Serviços em Licitações Públicas',
      brand: structuredClone(brand),
      body: minutaBody,
      clauses: structuredClone(minutaClauses),
      fields: structuredClone(minutaFields),
      recipients: structuredClone(minutaRecipients),
      comments: [
        {
          id: 'cmt_1',
          at: '2026-11-19 15:10',
          author: 'José Ribamar',
          text: 'Escopo de locação de frota alinhado com a reunião. Liberada para comentários do cliente.',
        },
      ],
      deliveryMessage: 'Olá Roberto, segue a minuta contratual v1.0 para sua leitura e eventuais comentários antes da assinatura.',
      inSentQueue: true,
      emittedAt: '2026-11-19 15:30',
      emittedSnapshot: emittedMinutaSnap,
      recoverableVersions: [emittedMinutaSnap],
      updatedAt: '2026-11-19 15:30',
      createdAt: '2026-11-19 14:40',
    },
    {
      id: 'DOC-2026-102',
      leadId: 'lead_frotanordeste',
      companyName: 'FrotaNordeste Locação de Veículos S/A',
      type: 'procuracao',
      templateId: 'tpl_procuracao_padrao',
      templateName: 'Procuração Padrão · Representação em Licitações',
      currentVersion: 'v1.0',
      status: 'Aprovado para emissão',
      internalReviewStatus: 'Aprovada',
      legalCheckPassed: true,
      legalCheckNote: 'Conferência jurídica prévia sem impedimentos para Prefeitura Municipal de Maceió/AL.',
      title: 'Procuração Particular — Representação em Licitações Públicas',
      brand: structuredClone(brand),
      body: 'Pelo presente instrumento particular de mandato, FrotaNordeste Locação de Veículos S/A, inscrita no CNPJ sob nº 19.804.612/0001-08, porte Demais, neste ato representada por Roberto Vasconcelos, nomeia e constitui como seus bastantes procuradores os representantes da JJ LICITA.',
      clauses: [
        {
          id: 'cl_proc_1',
          title: 'Cláusula 1ª — Dos Poderes Outorgados',
          content: 'Ficam outorgados poderes específicos para representação em pregões eletrônicos, lances, recursos e acompanhamento administrativo.',
          editedInDoc: false,
        },
        {
          id: 'cl_proc_2',
          title: 'Cláusula 2ª — Da Vigência e Revogação',
          content: 'O presente mandato vigorará pelo prazo de 12 meses a contar da assinatura (até 23/11/2027).',
          editedInDoc: false,
        },
      ],
      fields: {
        ...structuredClone(minutaFields),
        poderes: {
          value: 'Representação em pregões eletrônicos, lances, recursos e acompanhamento administrativo',
          origin: 'cadastro',
          registryValue: 'Representação em pregões eletrônicos, lances, recursos e acompanhamento administrativo',
        },
        vigencia: {
          value: '12 meses a contar da assinatura (até 23/11/2027)',
          origin: 'cadastro',
          registryValue: '12 meses a contar da assinatura (até 23/11/2027)',
        },
      },
      recipients: structuredClone(minutaRecipients),
      comments: [
        {
          id: 'cmt_2',
          at: '2026-11-22 10:20',
          author: 'José Ribamar',
          text: 'Revisão interna aprovada. Pronta para confirmar envio para assinatura.',
        },
      ],
      deliveryMessage: 'Olá Roberto, encaminhamos a procuração aprovada (DOC-2026-102 · v1.0) para assinatura eletrônica.',
      inSentQueue: false,
      recoverableVersions: [],
      updatedAt: '2026-11-22 10:20',
      createdAt: '2026-11-22 09:50',
    },
  ];
}
