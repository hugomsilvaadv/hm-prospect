# Configuração local — HM Prospect

1. Instale Node.js 24 e pnpm no seu computador.
2. Execute `cp .env.example .env` e escolha APP_ADMIN_TOKEN longo e seguro.
3. Copie `config/business.example.json` para `config/business.json`; preencha o site, Instagram, WhatsApp e somente alegações comerciais comprovadas. Os dois arquivos privados estão no .gitignore.
4. Crie uma chave exclusiva em https://platform.openai.com/api-keys com permissões restritas, configure limite mensal no projeto e preencha OPENAI_API_KEY, OPENAI_MODEL, OPENAI_MODEL_FAST, OPENAI_MONTHLY_BUDGET_USD.
5. Abra Chrome com perfil dedicado. No Windows PowerShell: `& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1 --user-data-dir="$PWD\.chrome-profile"`. Entre no Instagram manualmente e conclua 2FA.
6. Confira `http://127.0.0.1:9222/json/version` no mesmo computador. Nunca exponha a porta CDP na internet: ela concede controle total da sessão.
7. Rode `pnpm install`, `pnpm db` e `pnpm dev`. Acesse `http://127.0.0.1:3000`.
8. Configure o aplicativo Meta, permissões e webhook HTTPS com assinatura. A API oficial só pode responder a destinatários elegíveis e dentro da janela permitida.
9. Não ative LIVE_SEND_ENABLED até concluir testes simulados, dry-run, confirmação de sessão, opt-outs e autorização de smoke test limitado. Nesta versão, o executor ainda não está completo.
10. Se uma chave vazar, revogue-a imediatamente. Proteja o banco de dados local, a lista de não contato e backups. Para restaurar um backup, pare os processos antes de substituir o arquivo do banco e preserve os opt-outs mais recentes.

A empresa HM está sendo posicionada para cobrança administrativa B2B, separada de serviços de advocacia.
