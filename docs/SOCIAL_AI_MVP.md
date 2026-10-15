# EKPRIA Social AI — MVP supervisionado

## Objetivo
Criar rascunhos de conteúdo B2B para a EKPRIA, manualmente ou com IA, com aprovação humana obrigatória antes de qualquer integração de publicação externa. O módulo usa as mesmas credenciais administrativas locais do EKPRIA Prospect, mas tabelas e fluxos próprios.

## O que já está incluído
- Painel responsivo em /social, acessível a partir do painel principal.
- Geração de **texto** com OpenAI, iniciada apenas após clique autenticado.
- Rascunhos manuais e editáveis: título, formato, assunto, chamada, legenda, briefing visual, hashtags e data editorial.
- Fluxo rascunho -> aguardando aprovação -> aprovado/rejeitado, com controle de versão.
- Alterações após aprovação cancelam a aprovação anterior; fingerprint SHA-256.
- Auditoria no banco SQLite e contagem de uso por modelo; limite mensal inicial de 30 gerações configurável por SOCIAL_AI_MONTHLY_LIMIT.
- Migração incremental de banco de versão 2 para versão 3, sem apagar dados antigos.
- Testes de regras de aprovação e datas.

## Não está implementado
- Publicação no Instagram ou em qualquer rede social. **Aprovar internamente não envia o conteúdo.**
- Geração de imagens, carrosséis gráficos, áudio ou vídeo (somente briefing textual).
- Insights reais, captação automática de seguidores, automação de follows, curtidas ou mensagens.
- Integração com Meta API; requer fluxo OAuth e validação de permissões antes de construção.
- Controle financeiro completo dos custos de OpenAI: o limite mensal é de quantidade de gerações, não um limite monetário.

## Configuração
1. Instalar Node.js 24, pnpm 10.19.0; usar pnpm install --no-frozen-lockfile.
2. Executar pnpm db; depois pnpm lint, pnpm typecheck, pnpm test, pnpm build.
3. Definir APP_ADMIN_TOKEN >= 24 caracteres, não deixar padrões de exemplo.
4. Opcional: definir OPENAI_API_KEY e SOCIAL_AI_MODEL (padrão via OPENAI_MODEL_FAST).
5. Acessar /login e depois /social. Criar conteúdo manual não exige API de IA.
6. Testar criar, editar, enviar para aprovação, aprovar e editar novamente. A edição deve reverter para rascunho.
7. Não fazer deploy público com SQLite efêmero sem persistência (volume ou migração PostgreSQL) e endurecimento de autenticação.

## Verificação e segurança
- Nenhuma credencial deve ser enviada para GitHub.
- A IA nunca deve receber dados de devedores, informações financeiras sigilosas nem listas de contatos privados.
- A identidade de quem aprova é compartilhada pelo token administrativo atual; antes de expor na internet, criar usuários/sessões individuais e proteção contra CSRF e abuso.
- Antes de conectar Meta: OAuth, escopos adequados, refresh de tokens, armazenamento seguro, checagem de hash no momento de publicar, idempotência e logs.
- Sempre revisar afirmações jurídicas, financeiras e comerciais; não inventar cases ou resultados.

## Plano da próxima versão
1. Segurança de sessão e persistência de produção.
2. Criativos com templates e preview real antes da aprovação.
3. Conexão OAuth com Meta e publicação APENAS de conteúdos efetivamente aprovados.
4. Insights e métricas de audiência, leads e contatos qualificados.
