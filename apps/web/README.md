# CareOps VH Web

Aplicação frontend do CareOps VH, construída com React, TypeScript e Vite. Este app atende os fluxos de gestão da clínica, paciente, parceiro e campanhas públicas.

## Stack

- React
- TypeScript
- Vite
- React Router
- Lucide React
- ESLint
- CSS modularizado por estrutura de projeto

## Estrutura principal

```text
src
├── app
│   ├── providers      # Contextos e provedores globais
│   └── routes         # Rotas públicas e protegidas
├── modules
│   ├── auth           # Login, primeiro acesso, recuperação e área do paciente/parceiro
│   ├── campaigns      # Gestão e páginas públicas de campanhas
│   ├── management     # Layout e dashboard da gestão
│   └── patients       # Lista, cadastro e prontuário de pacientes
└── shared
    ├── ai             # Inteligência assistiva local
    ├── components     # Componentes compartilhados
    ├── config         # Configuração de API
    ├── mocks          # Dados locais de fallback
    └── styles         # Estilos globais
```

## Configuração da API

O frontend usa `/api` por padrão. No desenvolvimento, o Vite encaminha essa rota
para `http://127.0.0.1:4310`; em produção, a aplicação e a API compartilham o
mesmo domínio.

Para usar uma API em outro endereço, crie um arquivo `.env.local` na pasta
`apps/web`:

```env
VITE_API_BASE_URL=https://api.exemplo.com/api
```

Os mocks estão desativados na configuração padrão. Uma falha de API é exibida ao
usuário e nunca é mascarada como um dado persistido.

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev -- --host 127.0.0.1 --port 4195
```

A aplicação ficará disponível em:

```text
http://127.0.0.1:4195
```

## Scripts

```bash
npm run dev
```

Inicia o servidor de desenvolvimento do Vite.

```bash
npm run lint
```

Executa a análise estática com ESLint.

```bash
npm run build
```

Executa a compilação TypeScript e gera o build de produção com Vite.

```bash
npm run preview
```

Serve localmente o build gerado para conferência.

## Rotas principais

### Entrada

- `/`
- `/gestao/login`
- `/paciente/login`
- `/parceiro/login`

### Gestão

- `/gestao/dashboard`
- `/gestao/pacientes`
- `/gestao/campanhas`
- `/gestao/campanhas/nova`
- `/gestao/campanhas/:id`
- `/gestao/campanhas/:id/editar`

### Paciente

- `/paciente/home`
- `/paciente/avaliacao`

### Parceiro

- `/parceiro/home`

### Campanhas públicas

- `/campanha/:slug`
- `/campanha/:slug/cadastro/:profileType`
- `/campanha/:slug/perguntas/:profileType`
- `/campanha/:slug/concluido`

## Validação recomendada

Antes de publicar ou integrar mudanças, execute:

```bash
npm run lint
npm run build
```

## Boas práticas

- Mantenha páginas dentro do módulo funcional correspondente.
- Centralize chamadas HTTP nos arquivos de serviço do módulo.
- Use `src/shared/config/api.ts` para configuração de API e cabeçalhos de autenticação.
- Evite duplicar regras de inteligência assistiva fora de `src/shared/ai`.
- Preserve a separação entre rotas públicas e rotas protegidas.
- Não exponha chaves, tokens ou dados sensíveis no código do frontend.
- Atualize este README quando rotas, variáveis de ambiente ou scripts mudarem.
