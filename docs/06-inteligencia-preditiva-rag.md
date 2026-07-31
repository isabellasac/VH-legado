# CareOps VH - Inteligencia Preditiva e RAG

Data: 2026-06-16

## Objetivo

Adicionar uma camada de inteligencia preditiva para transformar dados do questionario, score, alertas, PRMs e ROI em:

- score assistivo atualizado
- estratificacao de risco
- alertas priorizados
- recomendacoes de acompanhamento
- apoio a decisao para paciente, clinica e gestao

Esta camada nao substitui diagnostico medico. Toda saida clinica deve ser apresentada como risco, alerta ou apoio a decisao.

## Regra tecnica principal

O front-end e a interface principal de interacao, mas nao deve expor chaves, prompts sensiveis ou acesso direto a APIs externas de IA.

Na v1:

- usar regras clinicas, estatistica simples e score preditivo local
- usar RAG como lista de fontes clinicas aprovadas e recuperaveis
- evitar dependencia de API externa paga ou descontrolada
- manter qualquer IA externa futura atras de um backend/controlador interno com limites de custo, logs e governanca

## O que e RAG neste projeto

RAG nao e rede neural. RAG e uma arquitetura de recuperacao de conhecimento para consultar fontes aprovadas antes de compor respostas assistivas.

Fontes iniciais aprovadas:

- regra de score VH
- parametros de PRMs
- regras clinicas de alerta
- plano de cuidado validado
- ROI assistencial

## V1 implementada

A primeira versao da inteligencia fica em `apps/web/src/shared/ai/careopsAi.ts`.

Ela:

- calcula risco preditivo a partir das respostas do paciente
- gera score de 0 a 100
- classifica risco como baixo, moderado ou alto
- gera sinais assistivos com evidencia e acao recomendada
- mostra fontes RAG usadas na leitura
- deixa claro que a saida e apoio a decisao, nao diagnostico

## Evolucao futura

Machine Learning e redes neurais entram apenas quando houver base historica suficiente, rotulada e validada.

Ordem recomendada:

1. regras clinicas e estatistica simples
2. score preditivo calibrado com dados reais
3. RAG com documentos clinicos aprovados
4. modelos de ML supervisionados para predicao de risco
5. modelos neurais apenas se entregarem ganho mensuravel, auditavel e seguro

## Criterios de aceite

- nenhuma tela declara diagnostico automatico
- o front-end nao depende de API externa de IA
- toda leitura preditiva mostra risco, score, sinais e fonte RAG
- qualquer decisao clinica sensivel permanece vinculada a validacao profissional
