# CareOps VH - Diagrama do Sistema

Data: 2026-05-16

Este diagrama registra a estrutura do produto desde a entrada no sistema ate a base de implementacao do MVP funcional.

## 1. Visao macro

```mermaid
flowchart LR
    A["Entrada da clinica"] --> B["Painel de gestao"]
    C["Entrada do paciente"] --> D["Home do paciente"]

    B --> E["Dashboard de ROI e governanca"]
    B --> F["Lista de pacientes"]
    F --> G["Cadastro manual"]
    F --> H["Prontuario integrado"]
    H --> I["Plano de cuidado"]
    H --> J["Metas do paciente"]
    H --> K["Caixa de ROI"]

    D --> L["Questionario de cuidado"]
    D --> M["Metas do dia"]
    D --> N["Score de saude"]

    L --> O["Calculo do score"]
    K --> P["Calculo de ROI"]
    O --> E
    P --> E
    J --> D
```

## 2. Fluxo de acesso

```mermaid
flowchart TD
    A["URL da gestao"] --> B["Login da clinica"]
    B --> C["Esqueci minha senha"]
    B --> D["Primeiro acesso"]
    B --> E["Dashboard"]

    F["URL do paciente"] --> G["Login do paciente"]
    G --> H["Esqueci minha senha"]
    G --> I["Primeiro acesso"]
    G --> J["Home do paciente"]
```

## 3. Fluxo de monitoramento clinico

```mermaid
flowchart TD
    A["Profissional acessa o dashboard"] --> B["Abre a lista de pacientes"]
    B --> C["Seleciona o paciente"]
    C --> D["Abre o prontuario integrado"]
    D --> E["Analisa respostas e sinais criticos"]
    D --> F["Define plano de cuidado"]
    D --> G["Define metas do paciente"]
    D --> H["Marca gatilhos de ROI"]
    G --> I["Home do paciente atualizada"]
    H --> J["Dashboard de ROI atualizado"]
```

## 4. Fluxo do paciente

```mermaid
flowchart TD
    A["Paciente entra na home"] --> B["Ve score e metas do dia"]
    B --> C["Responde avaliacao"]
    C --> D["Respostas sao salvas"]
    D --> E["Score e alertas sao recalculados"]
    E --> F["Paciente volta para a home"]
    F --> G["Clinica recebe sinal de nova resposta"]
```

## 5. Dominios do MVP

- Acesso e autenticacao
- Gestao da clinica
- Cadastro e monitoramento de pacientes
- Prontuario integrado
- Home do paciente
- Questionario de cuidado
- Score de saude
- Motor de ROI
- Alertas clinicos
- Auditoria e multitenancy

## 6. Base de implementacao

### Frontend

- `apps/web`
- rotas separadas por perfil
- interfaces desktop para gestao
- interfaces mobile-first para paciente

### Backend

- `apps/api`
- autenticacao
- dashboard
- pacientes
- proximos modulos:
  - prontuario
  - metas
  - questionario
  - ROI
  - logs

### Documentacao viva

- `03-consolidacao-decisoes-negocio.md`
- `04-fonte-de-verdade-mvp-funcional.md`
- `05-diagrama-sistema.md`
- `STATUS-ATUAL-2026-05-16.md`
