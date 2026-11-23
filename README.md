# JJ LICITA — Painel de Gestão (Prévia Visual e Interativa)

Protótipo navegável do sistema central de gestão comercial, construtor de funis, CRM, cadências, radar de editais e controle jurídico da **JJ LICITA**, com dados fictícios e persistência local no navegador (`localStorage`).

## Como executar localmente

```bash
npm install
npm run dev
```

Para validar build de produção:

```bash
npm run build
```

## Arquitetura de módulos

- `src/types/domain.ts` — Contratos TypeScript de projetos, funis versionados, qualificação, leads, reuniões, documentos, procurações, cadências, fontes oficiais (27 UFs), editais, acompanhamentos e `VínculoSócio`.
- `src/engine/qualification.ts` — Motor puro de validação de grafos de funil (sem saída, destino inexistente, ciclos e condições sobrepostas), descarte de respostas de caminhos abandonados e avaliação dos 4 grupos com gargalo técnico crítico e alertas ME/EPP/MEI.
- `src/data/seedData.ts` — Dados fictícios organizados por 3 nichos (Manutenção Industrial, Fornecimento de Equipamentos, Locação de Veículos), 2 páginas de vendas, 7 leads, fontes baseadas no catálogo nacional 27 UFs e controle de conflito societário.
- `src/store/AppContext.tsx` — Estado persistente local, deduplicação de submissões, automações de pausa de cadência, ativação por procuração validada, gate de conflito v0.3 e botão **Restaurar dados de demonstração**.
- `src/modules/workspace/` — Visão geral, Projetos e nichos, Minha agenda e tarefas e **Roteiro de demonstração** (10 cenários de aceite com links diretos).
- `src/modules/funnels/` — Construtor de Funis (3 colunas desktop / lista + editor mobile 360 px), Páginas e formulários incorporáveis, Campanhas e atribuição, e experiência **Testar como visitante**.
- `src/modules/commercial/` — CRM Leads (tabela + quadro por etapa + ficha lateral completa), Qualificação por versão, Reuniões, Propostas e procurações, e Cadências e mensagens.
- `src/modules/radar/` — Radar de editais com Gate de Conflito v0.3 (`VínculoSócio`), Fontes oficiais (27 UFs), Triagem de editais e Acompanhamentos independentes por nicho e cliente.
- `src/modules/clients/` — Empresas e contatos (preservando vínculo na troca de interlocutor), Documentos e Licitações do cliente.
- `src/modules/management/` — Indicadores comerciais e tempo jurídico, Histórico de alterações, Equipe e permissões, Integrações e domínios e Exportação CSV.

## Evolução pós-aprovação visual

Esta prévia valida interface, fluxos e critérios de aceite com dados fictícios. Após aprovação e conexão ao repositório GitHub, o piloto real **v0.3** entra enxuto (formulário incorporável, resultado, notificação interna e exportação CSV), condicionando a automação de fontes e o portal `clientes.jjlicita.com.br` ao marco das três procurações validadas.
