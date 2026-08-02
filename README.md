# CareOps VH

CareOps VH é o MVP funcional de uma plataforma web para monitoramento clínico, acompanhamento assistencial e gestão de campanhas de saúde. O projeto separa os fluxos da clínica, do paciente e de parceiros, com frontend em React e backend em Spring Boot.

A documentação técnica completa da implementação atual está em [docs/TECHNICAL_DOCUMENTATION.md](docs/TECHNICAL_DOCUMENTATION.md).

## Objetivo

Entregar uma base funcional, rastreável e evolutiva para:

- autenticação por perfil;
- dashboard de gestão da clínica;
- cadastro, listagem, edição e arquivamento de pacientes;
- prontuário inicial, metas de cuidado e eventos de ROI;
- questionário de saúde do paciente;
- home do paciente com acompanhamento assistencial;
- gestão e publicação de campanhas;
- acesso de parceiros e profissionais;
- camada inicial de inteligência assistiva para score, alertas e apoio à decisão.

## Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- CSS com tokens próprios
- Lucide React para ícones

### Backend

- Java 21
- Spring Boot 3.5
- Maven
- Spring Web
- Spring Validation
- Spring Actuator
- PostgreSQL gerenciado no Neon
- Docker multi-stage, com frontend e API entregues pelo mesmo serviço

## Estrutura do projeto

```text
C:\dev\vh
├── apps
│   ├── api          # API Spring Boot
│   └── web          # Aplicação React/Vite
├── docs             # Documentação de produto, arquitetura e decisões
├── .tools           # Ferramentas locais auxiliares, como Maven portátil
├── .gitignore
└── README.md
```

## Escopo funcional atual

### Gestão

- Login da clínica.
- Recuperação de senha e primeiro acesso.
- Dashboard com indicadores operacionais, ROI e alertas.
- Lista de pacientes.
- Cadastro manual de pacientes.
- Visualização e edição de prontuário.
- Arquivamento de pacientes.
- Registro de avaliações, metas de cuidado e eventos de ROI.
- Gestão de campanhas.

### Paciente

- Login do paciente.
- Recuperação de senha e primeiro acesso.
- Home com resumo do acompanhamento.
- Avaliação de saúde em fluxo guiado.
- Envio de respostas para cálculo assistivo.

### Parceiro

- Login de parceiro.
- Recuperação de senha e primeiro acesso.
- Home inicial de parceiro.

### Campanhas públicas

- Página pública por campanha.
- Cadastro por tipo de perfil.
- Perguntas públicas.
- Conclusão de participação.

## Inteligência preditiva e RAG

A plataforma possui uma camada inicial de inteligência assistiva para apoiar o monitoramento clínico. Na versão atual, essa camada:

- calcula score assistivo com base nas respostas do questionário;
- classifica risco como baixo, moderado ou alto;
- prioriza sinais clínicos e farmacêuticos relevantes;
- gera alertas e ações recomendadas para acompanhamento;
- exibe fontes RAG aprovadas usadas como referência;
- apresenta o resultado como risco, alerta ou apoio à decisão, nunca como diagnóstico automático.

Neste projeto, RAG significa um hub de recuperação de conhecimento baseado em fontes aprovadas, como regras de score VH, parâmetros de PRMs, regras clínicas de alerta, plano de cuidado validado e ROI assistencial. Ele não deve ser descrito como rede neural.

Machine Learning e redes neurais são evoluções futuras, condicionadas à existência de base histórica suficiente, rotulada e validada clinicamente.

## Executar com Neon e Docker

Pré-requisitos: Docker e uma string de conexão do banco Neon.

```bash
cp .env.example .env
# Edite DATABASE_URL com a string copiada em Neon > Connection Details
docker compose up --build
```

Abra [http://localhost:4310](http://localhost:4310). O frontend é servido junto
da API e usa automaticamente `/api` no mesmo domínio; não há URL de backend nem
CORS para configurar nesse modo.

O serviço de produção exige `DATABASE_URL`: se ela não estiver presente, o
container encerra em vez de gravar dados clínicos em armazenamento efêmero. A API
cria a tabela `careops_store` no Neon na primeira inicialização e preserva os
dados entre deploys. Consulte [DEPLOY-RENDER-NEON.md](DEPLOY-RENDER-NEON.md) para
publicação.

## Desenvolvimento sem Docker

O Vite encaminha `/api` para `http://127.0.0.1:4310` por padrão. Para apontar
para outro backend durante o desenvolvimento, defina `VITE_API_PROXY_TARGET` em
`apps/web/.env.local`. `VITE_API_BASE_URL` só é necessário quando o frontend for
publicado separadamente da API.

## Rotas principais do frontend

### Entrada

- `/`
- `/gestao/login`
- `/paciente/login`
- `/parceiro/login`

### Recuperação e primeiro acesso

- `/gestao/esqueci-senha`
- `/paciente/esqueci-senha`
- `/parceiro/esqueci-senha`
- `/gestao/primeiro-acesso`
- `/paciente/primeiro-acesso`
- `/parceiro/primeiro-acesso`

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

## Endpoints principais da API

### Saúde

- `GET /api/health`

### Autenticação

- `POST /api/auth/management/login`
- `POST /api/auth/patient/login`
- `POST /api/auth/partner/login`
- `POST /api/auth/management/password-reset`
- `POST /api/auth/patient/password-reset`
- `POST /api/auth/partner/password-reset`
- `POST /api/auth/management/first-access`
- `POST /api/auth/patient/first-access`
- `POST /api/auth/partner/first-access`

### Gestão

- `GET /api/management/dashboard`
- `GET /api/management/patients`
- `POST /api/management/patients`
- `GET /api/management/patients/{id}`
- `PUT /api/management/patients/{id}`
- `PATCH /api/management/patients/{id}/archive`
- `POST /api/management/patients/{id}/assessment`
- `POST /api/management/patients/{id}/goals`
- `PATCH /api/management/patients/{id}/goals/{goalId}`
- `POST /api/management/patients/{id}/roi-events`

### Paciente

- `GET /api/patient/home`
- `POST /api/patient/assessment`

### Inteligência

- `GET /api/intelligence/sources`
- `POST /api/intelligence/preview`

### Campanhas

- `GET /api/campaigns`
- `POST /api/campaigns`
- `GET /api/campaigns/{id}`
- `PUT /api/campaigns/{id}`
- `GET /api/campaigns/{slug}/public`
- `GET /api/campaigns/{slug}/questions`
- `POST /api/campaigns/{slug}/check-user`
- `POST /api/campaigns/{slug}/register`
- `POST /api/campaigns/{slug}/answers`

### Campanhas públicas

- `GET /api/public/campaigns/{slug}`
- `GET /api/public/campaigns/{slug}/questions/{profileType}`
- `POST /api/public/campaigns/{slug}/check-user`
- `POST /api/public/campaigns/{slug}/register`
- `POST /api/public/campaigns/{slug}/responses`

## Validação

### Frontend

```bash
cd apps/web
npm run lint
npm run build
```

### Backend

```bash
cd apps/api
mvn test
```

### Backend com Java e Maven locais no Windows

Use este bloco se o Windows não tiver `java` e `mvn` configurados no `PATH`:

```powershell
$env:JAVA_HOME = 'C:\Users\thiag\.antigravity\extensions\redhat.java-1.54.0-win32-x64\jre\21.0.10-win32-x86_64'
$env:Path = "$env:JAVA_HOME\bin;C:\dev\vh\.tools\apache-maven-3.9.9\bin;$env:Path"
cd C:\dev\vh\apps\api
mvn test
```

### Validação focada da inteligência assistiva

```bash
cd apps/web
npx eslint src/shared/ai/careopsAi.ts src/modules/auth/pages/PatientAssessmentPage.tsx src/modules/auth/pages/PatientHomePage.tsx src/modules/management/pages/ManagementDashboardPage.tsx
npx tsc --noEmit --ignoreConfig --types vite/client --jsx react-jsx --moduleResolution bundler --module esnext --target es2022 --lib es2022,dom --skipLibCheck src/shared/ai/careopsAi.ts src/modules/auth/pages/PatientAssessmentPage.tsx src/modules/auth/pages/PatientHomePage.tsx src/modules/management/pages/ManagementDashboardPage.tsx
```

## Boas práticas de desenvolvimento

- Mantenha a separação entre módulos de autenticação, gestão, pacientes, campanhas e componentes compartilhados.
- Prefira serviços de API dedicados por domínio em vez de chamadas `fetch` espalhadas pelas páginas.
- Não trate score, alertas ou recomendações como diagnóstico automático.
- Não exponha chaves, tokens ou dados sensíveis no frontend.
- Use variáveis de ambiente para URLs e configurações externas.
- Rode lint, build e testes aplicáveis antes de publicar alterações.
- Atualize a documentação sempre que rotas, endpoints ou fluxos principais mudarem.
- Preserve a rastreabilidade das decisões relevantes nos arquivos em `docs`.

## Documentação principal

- `docs/01-stack-e-arquitetura.md`
- `docs/02-escopo-mvp-atual.md`
- `docs/03-consolidacao-decisoes-negocio.md`
- `docs/04-fonte-de-verdade-mvp-funcional.md`
- `docs/05-diagrama-sistema.md`
- `docs/06-inteligencia-preditiva-rag.md`
- `docs/STATUS-ATUAL-2026-05-16.md`

## Observações

- A referência funcional do MVP está no documento de telas e regras de negócio.
- A referência visual principal da gestão é o dashboard aprovado pelo Maurício.
- O sistema está sendo construído para uso real, com separação clara entre clínica, paciente e parceiro.
- A persistência atual é local e adequada para o estágio de MVP; uma base de dados dedicada deve ser planejada antes de uso produtivo.
