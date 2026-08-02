# CareOps VH Technical Documentation

**Document status:** Current implementation reference
**Repository path:** `careops-vh-enterprise`
**Last reviewed:** 2026-08-02
**Language mode:** Pragmatic Simplified Technical English

## 1. Purpose and scope

CareOps VH is a web MVP for clinical monitoring and health campaign management.
It has separate experiences for management users, patients, partners, and public campaign participants.
The system combines a React single-page application and a Spring Boot API.

The API calculates an assistive health score and risk signals from questionnaire answers.
These results support clinical follow-up. They do not provide an automatic diagnosis.

This document describes the implementation in this repository.
It describes current behavior, not a future target architecture.

## 2. System at a glance

```mermaid
flowchart LR
  Browser[Browser]
  Web[React and Vite web application]
  Api[Spring Boot API]
  Store[CareopsDataStore]
  Db[(PostgreSQL or Neon)]
  File[(Local JSON file)]

  Browser --> Web
  Web -->|/api| Api
  Api --> Store
  Store -->|when DATABASE_URL exists| Db
  Store -->|when DATABASE_URL is empty| File
  Api -->|serves production static files| Browser
```

The production image compiles the web application and places its files in the API JAR.
The same Spring Boot process then serves the browser routes, static files, and API routes.
The browser uses `/api` by default. This path keeps the web application and API on one origin.

## 3. Technology stack

| Area | Technology | Current role |
| --- | --- | --- |
| Web application | React 19, TypeScript, Vite 8 | User interface and browser routing |
| Web routing | React Router 7 | Public and role-based pages |
| Icons | Lucide React | Interface icons |
| API | Java 21, Spring Boot 3.5 | HTTP API, validation, static-file delivery |
| Build | Maven 3.9 and npm | API and web builds |
| Data store | JSON or PostgreSQL | Persists all MVP entities |
| Production package | Docker multi-stage build | Builds and runs one service |
| Health endpoint | Spring MVC endpoint | Service health verification |

## 4. Repository layout

```text
careops-vh-enterprise/
├── apps/
│   ├── api/                         Spring Boot application
│   │   └── src/main/java/br/com/careops/api/
│   │       ├── auth/                Login, first access, and sessions
│   │       ├── campaign/            Campaign management and public flows
│   │       ├── config/              CORS configuration
│   │       ├── core/                Data store and domain records
│   │       ├── dashboard/           Management dashboard aggregation
│   │       ├── health/              Health endpoint
│   │       ├── intelligence/        Rules, signals, and source records
│   │       ├── patient/             Patient records and care actions
│   │       ├── support/             API error mapping
│   │       └── web/                 Single-page application fallback
│   └── web/                         React application
│       └── src/
│           ├── app/                 Providers and routes
│           ├── modules/             Feature pages and API clients
│           └── shared/              API setup, styles, AI helper, and mocks
├── docs/                            Product and technical documents
├── Dockerfile                       Production multi-stage image
├── compose.yaml                     Local Docker service
├── render.yaml                      Render service metadata
├── DEPLOY-RENDER-NEON.md            Deployment notes
└── README.md                        Project introduction
```

## 5. Runtime architecture

### 5.1 Web application

The web application has feature modules for authentication, management, patients, and campaigns.
Each module keeps its pages and HTTP client close together.
`src/shared/config/api.ts` defines the API base URL and Authorization header helper.

`AuthProvider` saves the session object in browser `localStorage` under `careops-vh.session`.
`ProtectedRoute` blocks browser navigation when the saved role does not match the page role.
This protection applies only in the browser. The API must enforce its own authorization.

The default API base URL is `/api`.
During development, Vite proxies this path to `http://127.0.0.1:4310`.
Set `VITE_API_BASE_URL` when the web application uses another API origin.

### 5.2 API application

`CareopsApiApplication` starts the Spring Boot application.
Controllers receive HTTP requests and delegate work to services.
Services use `CareopsDataStore` for all persistence operations.

The API returns JSON from its `/api/**` routes.
`SpaController` forwards browser routes to `index.html`.
It does not forward routes under `/api`.

`ApiExceptionHandler` returns this error format for handled errors:

```json
{
  "message": "Human-readable error message"
}
```

Validation and domain errors return HTTP `400` unless a service selects another status.
Missing records return HTTP `404` in the related services.
Invalid login credentials return HTTP `401`.
The persistence error handler returns HTTP `503`.

### 5.3 Data store

`CareopsDataStore` keeps one `CareopsData` aggregate in memory.
Every write saves the full aggregate.
The store uses a local JSON file when `DATABASE_URL` is empty.
It uses PostgreSQL when `DATABASE_URL` exists.

PostgreSQL uses one table named `careops_store`.
The table has one row with `id = main` and a JSON document in its `data` column.
The table is not a normalized clinical schema.

All store methods are synchronized inside one JVM process.
This does not protect concurrent writes from multiple service instances.
Use one running instance for the current storage design.

### 5.4 Production package

The root `Dockerfile` has three stages:

1. It installs web dependencies with `npm ci` and runs the Vite production build.
2. It copies the web build into Spring Boot static resources and packages the JAR.
3. It runs the JAR on Java 21 as the non-root `careops` user.

The production image sets `CAREOPS_REQUIRE_DATABASE=true`.
The API stops during startup when `DATABASE_URL` is absent in that image.

## 6. Local development

### 6.1 Requirements

- Java 21
- Maven 3.9 or newer
- Node.js 22
- npm
- Docker Desktop, for container execution
- A PostgreSQL or Neon URL, for persistent container data

### 6.2 Run the API without Docker

1. Open a terminal in `apps/api`.
2. Run `mvn spring-boot:run`.
3. Open `http://127.0.0.1:4310/api/health`.

Without `DATABASE_URL`, the API writes data to `apps/api/data/careops-store.json`.
This mode is for local development.

### 6.3 Run the web application without Docker

1. Open another terminal in `apps/web`.
2. Run `npm ci`.
3. Run `npm run dev -- --host 127.0.0.1 --port 4195`.
4. Open `http://127.0.0.1:4195`.

Vite forwards `/api` requests to port `4310`.
Set `VITE_API_PROXY_TARGET` in `apps/web/.env.local` to use another local API address.

### 6.4 Run the production package with Docker

1. Create `.env` in the repository root.
2. Set `DATABASE_URL` to a PostgreSQL or Neon connection URL.
3. Run `docker compose up --build`.
4. Open `http://127.0.0.1:4310`.

Use this `.env` format:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
CAREOPS_CORS_ALLOWED_ORIGINS=http://localhost:4310
```

CAUTION: Do not commit `.env` files or database credentials.
The connection URL grants access to clinical and campaign data.

## 7. Configuration reference

| Variable | Default | Used by | Description |
| --- | --- | --- | --- |
| `PORT` | `4310` | API | HTTP server port |
| `DATABASE_URL` | Empty | API | PostgreSQL or Neon connection URL |
| `CAREOPS_REQUIRE_DATABASE` | `false` | API | Stops startup when the database URL is absent |
| `CAREOPS_DATA_PATH` | `data/careops-store.json` | API | Local JSON file path |
| `CAREOPS_CORS_ALLOWED_ORIGINS` | Development origin list | API | Comma-separated API origins |
| `VITE_API_BASE_URL` | `/api` | Web application | External API base URL |
| `VITE_API_PROXY_TARGET` | `http://127.0.0.1:4310` | Vite | Development proxy destination |

The root Docker image sets `CAREOPS_REQUIRE_DATABASE=true` and `CAREOPS_DATA_PATH=/tmp/careops-store.json`.
The local JSON path is then only a fallback when the database requirement is disabled.

If `CAREOPS_CORS_ALLOWED_ORIGINS` is empty, the API permits selected localhost ports.
Set an explicit HTTPS origin for each separately deployed web application.

## 8. User roles and browser routes

| Role | Purpose | Protected browser routes |
| --- | --- | --- |
| `MANAGEMENT` | Clinic administration and patient management | `/gestao/dashboard`, `/gestao/pacientes`, `/gestao/campanhas/**` |
| `PATIENT` | Personal health record and questionnaire | `/paciente/home`, `/paciente/avaliacao` |
| `PARTNER` | Partner home page | `/parceiro/home` |
| Public participant | Campaign registration and answers | `/campanha/**` |

| Route group | Routes |
| --- | --- |
| Entry | `/`, `/gestao/login`, `/paciente/login`, `/parceiro/login` |
| Password and first access | `/gestao/esqueci-senha`, `/paciente/esqueci-senha`, `/parceiro/esqueci-senha`, `/gestao/primeiro-acesso`, `/paciente/primeiro-acesso`, `/parceiro/primeiro-acesso` |
| Management | `/gestao/dashboard`, `/gestao/pacientes`, `/gestao/campanhas`, `/gestao/campanhas/nova`, `/gestao/campanhas/:id`, `/gestao/campanhas/:id/editar` |
| Patient | `/paciente/home`, `/paciente/avaliacao` |
| Partner | `/parceiro/home` |
| Public campaigns | `/campanha/:slug`, `/campanha/:slug/cadastro/:profileType`, `/campanha/:slug/perguntas/:profileType`, `/campanha/:slug/concluido` |

## 9. Authentication and sessions

The API has three login endpoints, one for each authenticated role.
The login response returns an opaque session token, the role, user details, permissions, and destination route.
The web application saves this response in `localStorage`.

Authenticated patient endpoints read `Authorization: Bearer <token>`.
The store creates a new token for the user and removes prior sessions for that user.
The response reports an eight-hour expiration time.

### 9.1 Current server authorization

Only these endpoints call `requireAuthenticatedUser` in the current API:

| Endpoint | Required role |
| --- | --- |
| `GET /api/patient/home` | `PATIENT` |
| `POST /api/patient/assessment` | `PATIENT` |

The management, dashboard, intelligence, and campaign endpoints do not enforce Authorization on the server.
The management route guard only protects browser navigation.
Do not expose this MVP as a production clinical service before server authorization is implemented.

### 9.2 Current session limits

`findSession` verifies that a session is not revoked.
It does not compare `expiresAt` with the current time.
The eight-hour expiration field is therefore informational in the current code.

The store uses unsalted SHA-256 for passwords.
Use a dedicated password hashing algorithm before production, such as BCrypt, Argon2, or PBKDF2.
The browser stores the bearer token in `localStorage`, which increases XSS token exposure.

### 9.3 Development seed accounts

The first data store starts with a sample clinic, four sample patients, one campaign, and sample accounts.
All seed accounts use the same value from the `DEFAULT_PASSWORD` constant.
The identifiers and password source are in `CareopsDataStore`.

CAUTION: Do not deploy the seed accounts to a real environment.
Replace the data store, credentials, and access flow before clinical use.

## 10. API reference

### 10.1 General rules

All API paths start with `/api`.
Requests with a JSON body use `Content-Type: application/json`.
Fields marked **required** have server validation where this document states it.

The API has no generated OpenAPI document in this repository.
This section is the maintained route contract for the current code.

### 10.2 Health

| Method and path | Authentication | Response |
| --- | --- | --- |
| `GET /api/health` | None | `{ service, status, timestamp }` |

Use this endpoint for Docker, Render, Railway, and load-balancer health verification.

### 10.3 Authentication endpoints

| Method and path | Request body | Response |
| --- | --- | --- |
| `POST /api/auth/management/login` | `identifier`, `password` | `LoginResponse` |
| `POST /api/auth/patient/login` | `identifier`, `password` | `LoginResponse` |
| `POST /api/auth/partner/login` | `identifier`, `password` | `LoginResponse` |
| `POST /api/auth/management/password-reset` | `email` | `ActionResponse` |
| `POST /api/auth/patient/password-reset` | `cpf`, `email` | `ActionResponse` |
| `POST /api/auth/partner/password-reset` | `email` | `ActionResponse` |
| `POST /api/auth/management/first-access` | Management first-access payload | `ActionResponse` |
| `POST /api/auth/patient/first-access` | Patient first-access payload | `ActionResponse` |
| `POST /api/auth/partner/first-access` | Partner first-access payload | `ActionResponse` |

`identifier` and `password` are required for login.
Patient identifiers match after the API removes non-digit CPF characters.
Management and partner identifiers match without case differences.

`LoginResponse` has `token`, `role`, `name`, `destination`, `institutionId`, `subjectId`, `expiresAt`, `permissions`, and `demoMode`.
`ActionResponse` has one `message` field.

Management first access requires `email`, `invitationCode`, `password`, and `confirmPassword`.
The invitation code is the active institution code in the current implementation.

Patient first access requires `cpf`, `institutionCode`, `birthDate`, `password`, and `confirmPassword`.
It also accepts `name` and `email`.
The API creates a patient record when the CPF has no existing patient.

Partner first access requires `name`, `email`, `specialty`, `institutionCode`, `password`, and `confirmPassword`.
All first-access passwords require at least eight characters.

The password-reset endpoints return a success message only.
They do not send email, create a reset token, or change a password.

### 10.4 Management and patient endpoints

| Method and path | Request body | Response |
| --- | --- | --- |
| `GET /api/management/dashboard` | None | `DashboardResponse` |
| `GET /api/management/patients` | None | `PatientListItemResponse[]` |
| `POST /api/management/patients` | Patient create payload | `201 PatientListItemResponse` |
| `GET /api/management/patients/{id}` | None | `PatientRecordResponse` |
| `PUT /api/management/patients/{id}` | Patient update payload | `PatientListItemResponse` |
| `PATCH /api/management/patients/{id}/archive` | None | `PatientListItemResponse` |
| `POST /api/management/patients/{id}/assessment` | Assessment payload | `PatientRecordResponse` |
| `POST /api/management/patients/{id}/goals` | Care-goal payload | `PatientRecordResponse` |
| `PATCH /api/management/patients/{id}/goals/{goalId}` | Goal-status payload | `PatientRecordResponse` |
| `POST /api/management/patients/{id}/roi-events` | ROI-event payload | `PatientRecordResponse` |
| `GET /api/patient/home` | Bearer patient token | `PatientRecordResponse` |
| `POST /api/patient/assessment` | Bearer patient token and assessment payload | `PatientRecordResponse` |

Patient create fields are `name`, `cpf`, `email`, `phone`, `birthDate`, `sex`, and `professional`.
`name` and `cpf` are required. `email` must have email syntax when present.

Patient update accepts the same patient fields and `active`.
All update fields are optional.
The archive route sets `active` to `false`, status to `Inativo`, and an archive signal.

An assessment payload has a required non-empty `answers` object.
The management route ignores `patientId` in the body and uses the path value.
The patient route ignores `patientId` and uses the authenticated patient.

A care-goal payload requires `title` and accepts `frequency` and `createdBy`.
A goal-status payload requires `status`.
An ROI-event payload requires `title` and `value`, then accepts `category`, `justification`, and `createdBy`.

`PatientRecordResponse` includes the patient summary, assessments, goals, ROI events, alerts, intelligence result, and LGPD consent fields.
Patient list responses mask the CPF. Detailed patient responses also expose only `cpfMasked`.

### 10.5 Intelligence endpoints

| Method and path | Request body | Response |
| --- | --- | --- |
| `GET /api/intelligence/sources` | None | `RagSourceResponse[]` |
| `POST /api/intelligence/preview` | Assessment payload | `ClinicalIntelligenceResponse` |

The preview endpoint calculates an intelligence result without saving an assessment.
It requires a non-empty `answers` object.

`ClinicalIntelligenceResponse` includes the score, risk values, signals, recommended actions, RAG sources, governance note, rules version, and generation time.

### 10.6 Campaign management endpoints

| Method and path | Request body | Response |
| --- | --- | --- |
| `GET /api/campaigns` | None | `CampaignListItemResponse[]` |
| `GET /api/campaigns/{id}` | None | `CampaignResponse` |
| `POST /api/campaigns` | Campaign payload | `201 CampaignResponse` |
| `PUT /api/campaigns/{id}` | Campaign payload | `CampaignResponse` |
| `DELETE /api/campaigns/{id}` | None | `204 No Content` |

A campaign payload requires `name` and `slug`.
It accepts `description`, `confirmationMessage`, `active`, and `profiles`.
Each profile has `profileType` and a list of questions.

Each question has `text`, `type`, `options`, `required`, `order`, `conditionalOnQuestionId`, and `conditionalOnAnswer`.
The API does not validate question types, profile names, duplicate slugs, or condition references.

### 10.7 Public campaign endpoints

The two public route groups call the same service.
The web application uses the first group in this table.

| Purpose | Web route | Alternate public route |
| --- | --- | --- |
| Campaign details | `GET /api/campaigns/{slug}/public` | `GET /api/public/campaigns/{slug}` |
| Profile questions | `GET /api/campaigns/{slug}/questions?profileType={profileType}` | `GET /api/public/campaigns/{slug}/questions/{profileType}` |
| Existing registration | `POST /api/campaigns/{slug}/check-user` | `POST /api/public/campaigns/{slug}/check-user` |
| Register participant | `POST /api/campaigns/{slug}/register` | `POST /api/public/campaigns/{slug}/register` |
| Submit answers | `POST /api/campaigns/{slug}/answers` | `POST /api/public/campaigns/{slug}/responses` |

The registration body requires `profileType`, `name`, and email-format `email`.
It accepts `phone` and a string map named `profileFields`.
The response has `registrationId`, `message`, and `alreadyRegistered`.

The existing-registration body has required email-format `email`.
The response has `exists`, `name`, and `registrationId`.

The answer body requires `registrationId` and `profileType`.
It accepts `answers` and `wantsNewsletter`.
Each answer has `questionId` and `value`.

The API verifies that the campaign slug is active before it registers answers.
It does not verify that the registration belongs to that campaign or profile.
It also does not verify question identifiers or required answers.

## 11. Domain behavior

### 11.1 Patient lifecycle

A new patient starts with status `Pendente` and no assessment.
The store creates a disabled patient account during manual patient creation.
Patient first access activates that account after the institution code and birth date match.

The API recalculates patient status when it lists patients or saves patient-related actions.
An inactive patient has status `Inativo`.
A patient without an assessment has status `Pendente`.

A patient has status `Em Alerta` when the score is less than 60.
A patient also has status `Em Alerta` after more than ten days without a response.
A patient with a completed goal has status `Monitorado`.
Other active patients have status `Ativo`.

### 11.2 Goals, ROI events, and alerts

A new goal starts with status `Pendente`.
When the status is `Concluida` or `Concluída`, the store records the completion time and standardizes the value to `Concluida`.

An ROI event has a decimal value rounded to two decimal places.
The dashboard sums events by institution and category.
It displays total lives, assessment adherence, total ROI, score history, alerts, statuses, and ROI composition.

The store creates automatic alerts during patient recalculation.
The alert conditions include a score below 60 and a score drop of 20 points.
They also include ten days without responses, six medications, and seven days without a completed goal.
Automatic alerts have sources that start with `AUTO_`.

### 11.3 Intelligence rules

The intelligence service uses deterministic rules in `ClinicalIntelligenceService`.
It does not call an external LLM, machine-learning service, or neural network.
The current rules version is `vh-rules-2026-06-16-backend-v1`.

Risk starts at 12 points.
The service adds points for low sleep, low energy, emotional overload, medication adherence, medication count, adverse-effect text, therapy adherence, hydration, activity, and reminders.
The final risk value stays between 0 and 100.
The health score equals `100 - riskPercent`.

| Risk percent | Risk level | Tone |
| --- | --- | --- |
| 0 to 34 | `Baixo` | `success` |
| 35 to 64 | `Moderado` | `warning` |
| 65 to 100 | `Alto` | `danger` |

The service creates signals from these response keys:

- `sono`, `energia`, `humor`, `estresse`, and `medicacao`
- `quantidade_medicamentos`, `efeitos`, and `terapia`
- `hidratacao`, `atividade`, and `lembrete`
- `burnout` and `observacao`

Free text can create an assistive signal for the clinical record.
It does not change the result into a diagnosis.
The response includes source records for score rules, pharmaceutical risks, alerts, care follow-up, and ROI.

## 12. Persistence model

The aggregate has the following collections:

| Collection | Main content |
| --- | --- |
| `institutions` | Institution ID, name, code, and active state |
| `users` | Role, login identifier, password hash, permissions, and access state |
| `sessions` | Opaque token, role, dates, and revocation state |
| `patients` | Profile, status, score, risk, consent, and invitation fields |
| `assessments` | Answers, score snapshot, signals, source IDs, and rule versions |
| `goals` | Care goals and completion state |
| `roiEvents` | Financial value and intervention context |
| `alerts` | Automatic or manual alert data |
| `ragSources` | Approved source metadata |
| `campaigns` | Campaign metadata, profiles, and questions |
| `registrations` | Public participant data and answers |
| `consents` | Patient consent source, version, and date |

The PostgreSQL schema has only this table:

```sql
create table if not exists careops_store (
  id varchar(64) primary key,
  data text not null,
  updated_at timestamptz not null default now()
)
```

The store creates this table during the first database connection.
It inserts seed data when the row does not exist.

## 13. Deployment

### 13.1 Docker service

Use the root `Dockerfile` for the complete application.
The root `compose.yaml` maps port `4310` only to `127.0.0.1`.
This prevents direct access from other hosts on the local network.

The Compose service needs `DATABASE_URL`.
It restarts unless stopped.
Its health verification calls `/api/health` every 30 seconds.

### 13.2 Render and Railway

Deploy one Docker web service from the repository root.
Set `DATABASE_URL` as a secret environment variable.
Set the health path to `/api/health`.

The API serves the React files in this deployment model.
Do not create a separate frontend service unless you also set `VITE_API_BASE_URL` and CORS origins.

The repository includes `render.yaml`, but its `rootDir` points to `apps/api`.
The production Dockerfile is in the repository root and builds both applications.
Set the service root to the repository root when you use the full single-service package.

## 14. Validation and maintenance

### 14.1 Run local quality commands

1. Open a terminal in `apps/web`.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Open a terminal in `apps/api`.
5. Run `mvn test`.

The repository has no committed automated test classes at this review date.
`mvn test` therefore verifies compilation and the Maven test lifecycle without application tests.

### 14.2 Manual smoke test

1. Start the API and web application, or start Docker Compose.
2. Open the health endpoint and verify `status` equals `ok`.
3. Sign in with a development seed account in a local data store.
4. Open the management dashboard and patient list.
5. Create a test patient with a unique CPF.
6. Submit a patient assessment and verify the score and alert result.
7. Create or edit a campaign, then complete its public flow.
8. Restart the API and verify that data remains available.

If the API uses PostgreSQL, inspect the `careops_store` row after the test.
If the API uses JSON, inspect `apps/api/data/careops-store.json` after the test.

### 14.3 Change guidance

Keep API DTO changes synchronized with TypeScript types in each feature service.
Keep `ClinicalIntelligenceService.RULES_VERSION` synchronized with any rule change.
Preserve old assessment snapshots when intelligence rules change.

Add server authorization before you add sensitive management features.
Add migration logic before you change the serialized store structure.
Add tests for each new business rule and API route.

## 15. Production-readiness gaps

This MVP stores health information and requires a security review before production use.
The following gaps exist in the current implementation.

| Priority | Gap | Current evidence | Required direction |
| --- | --- | --- | --- |
| Critical | Server authorization | Management and campaign controllers do not read a bearer token | Enforce authentication and role permissions on every protected API route |
| Critical | Session expiry | Session lookup ignores `expiresAt` | Reject expired tokens and add logout or revocation handling |
| Critical | Password storage | The store uses unsalted SHA-256 | Use BCrypt, Argon2, or PBKDF2 with secure parameters |
| Critical | Seed credentials | Seed accounts use one constant password | Remove seed accounts from deployed environments |
| High | Password reset | Endpoints only return messages | Add identity verification, one-time tokens, expiry, and email delivery |
| High | Token storage | Browser `localStorage` stores bearer tokens | Use a safer session design and XSS controls |
| High | Data model | One JSON document holds all operational data | Move to normalized tables with migrations and transaction controls |
| High | Multi-tenancy | Several services use the fixed `clinicavida` institution | Derive institution scope from the authenticated session |
| High | Audit trail | Writes have no immutable actor audit log | Record actor, action, source, time, and relevant object IDs |
| Medium | API contract | No OpenAPI document exists | Publish OpenAPI and contract tests |
| Medium | Clinical governance | Rules are static application code | Add clinical approval, review dates, and change control |
| Medium | Data retention | The data store has no retention or deletion workflow | Define LGPD retention, deletion, export, and access procedures |
| Medium | Monitoring | The application has only a health endpoint | Add structured logs, metrics, alerts, and backup verification |

CAUTION: Do not process real clinical data until these controls are designed, implemented, and verified.
The current application is an MVP and not a compliant production clinical platform.

## 16. Troubleshooting

| Symptom | Cause | Action |
| --- | --- | --- |
| API stops in Docker startup | `DATABASE_URL` is missing | Set a valid database URL in `.env` or the deployment secret store |
| Web application cannot reach the API locally | API is not on port `4310` | Start the API or set `VITE_API_PROXY_TARGET` |
| Browser gets a CORS error | Browser origin is not allowed | Set `CAREOPS_CORS_ALLOWED_ORIGINS` to the web application origin |
| Data disappears after restart | API uses an ephemeral local file | Configure PostgreSQL or Neon with `DATABASE_URL` |
| Login fails | Role, identifier, or password does not match | Verify the role and use a first-access flow for inactive accounts |
| Patient home returns `401` | Token is absent or role differs | Sign in as a patient and send `Authorization: Bearer <token>` |
| Patient home returns `404` | No active patient record matches the account CPF | Create or activate the matching patient record |
| Campaign page returns `404` | Campaign is missing or inactive | Verify the campaign slug and set `active` to `true` |
| Database connection fails with Neon URL | Connection URL format is invalid | Use the TLS URL from Neon Connection Details |

## 17. Reference files

| File | Purpose |
| --- | --- |
| `README.md` | Project scope, basic commands, and route list |
| `DEPLOY-RENDER-NEON.md` | Deployment commands and Neon setup |
| `docs/01-stack-e-arquitetura.md` | Original stack and architecture decision |
| `docs/04-fonte-de-verdade-mvp-funcional.md` | MVP business requirements |
| `apps/api/src/main/resources/application.yml` | API configuration defaults |
| `apps/api/src/main/java/br/com/careops/api/core/CareopsDataStore.java` | Persistence, seed data, status logic, and session data |
| `apps/api/src/main/java/br/com/careops/api/intelligence/ClinicalIntelligenceService.java` | Intelligence scoring and signals |
| `apps/web/src/app/routes/AppRoutes.tsx` | Browser route definition |
| `apps/web/src/shared/config/api.ts` | Browser API configuration and Authorization header helper |
