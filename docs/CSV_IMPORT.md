# Importação de empresas — EKPRIA Prospect

Importe **somente perfis públicos de empresas potencialmente contratantes**, nunca pessoas inadimplentes ou carteiras de devedores.

## Estrutura recomendada

Salve um CSV UTF-8 com cabeçalhos:

```csv
instagram;nome;segmento;cidade;bio;fonte
@distribuidora.exemplo;Distribuidora Exemplo;Atacado;Ribeirão Preto;Empresa de atacado B2B;https://www.instagram.com/distribuidora.exemplo/
```


O exemplo é **fictício**. Não constitui uma lista de empresas reais.

- A coluna \`instagram\` (ou \`handle\`) é obrigatória.
- Aceita URLs públicas \`https://www.instagram.com/usuario/\` e arrobas.
- As demais colunas são opcionais: \`nome\`, \`segmento\`, \`cidade\`, \`bio\`, \`fonte\`.
- São aceitos os separadores vírgula e ponto e vírgula, inclusive campos entre aspas.
- Máximo de 250 linhas e 256 KB por importação.
- Perfis duplicados, inválidos e a própria conta @ekpria são ignorados.
- Contatos já cadastrados **nunca são sobrescritos**, preservando sua situação de não contato.

## Qualificação

O indicador exibido é **aderência comercial ao perfil desejado** (0–100), não a chance de conversão. Considera palavras visíveis do segmento, menções a operações B2B e região informada. Não deduz que uma empresa tem dívidas, faturamento, inadimplência nem capacidade financeira. Prioridades: alta (70–100), média (40–69) e baixa (0–39).

A execução da importação não envia nenhuma DM e funciona sem chave da OpenAI ou sessão do Chrome.

## Operação

1. Execute \`pnpm install\` e \`pnpm dev\`; as migrações rodam automaticamente.
2. Entre no painel, envie o CSV e confira o total de importados/ignorados.
3. Revise os registros priorizados manualmente antes de qualquer campanha.
4. Registre e respeite pedidos de não contato. Dados de prospecção devem ter origem legítima e retenção compatível com a LGPD.

Este recurso **não substitui** a descoberta automatizada via Instagram prevista no plano original.
