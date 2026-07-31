# CareOps VH - Stack e Arquitetura

Data: 2026-05-16

## Objetivo

Criar o CareOps VH do zero, com base nas regras do projeto, nos alinhamentos com o cliente, nas perguntas do Mauricio e nas referencias visuais do Lovable e da tela de ROI e Governanca.

## Principios

- projeto novo, sem reaproveitar a estrutura do Lovable
- Lovable usado apenas como referencia funcional e visual
- backend em Java
- frontend moderno, limpo e responsivo
- separacao entre gestao e paciente
- arquitetura preparada para crescer com seguranca
- UX com cara de sistema real, nao de demonstracao

## Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- CSS com design tokens proprios

### Backend

- Java 21
- Spring Boot
- Maven
- Spring Web
- Spring Validation
- Spring Actuator

## Estrutura do projeto

```text
careops-vh-enterprise/
  apps/
    web/
    api/
  docs/
```

## Estrutura inicial do frontend

```text
apps/web/src/
  app/
    providers/
    routes/
  modules/
    auth/
    management/
    patients/
  shared/
    components/
    styles/
    types/
```

## Estrutura inicial do backend

```text
apps/api/src/main/java/br/com/careops/api/
  config/
  health/
  auth/
  dashboard/
  patient/
  common/
```

## Direcao visual

- referencia de maturidade: tela do Mauricio
- referencia de inventario de produto: Lovable
- estilo visual:
  - institucional
  - limpo
  - forte em dados
  - pouco texto
  - sem blocos decorativos sem funcao
  - bom uso de espacamento
  - leitura clara em desktop e tablet

## Regras do sistema inicial

- login vazio, sem credencial preenchida
- sessao protegida
- separacao por perfil
- area da clinica focada em desktop
- area do paciente focada em mobile, sem quebrar desktop e tablet
- a interface nao pode explicar o produto; ela precisa operar o produto

