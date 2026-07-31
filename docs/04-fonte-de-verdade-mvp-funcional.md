# CareOps VH - Fonte de Verdade do MVP Funcional

Data: 2026-05-16

## Referencia oficial desta implementacao

Este arquivo representa a traducao tecnica do documento `Telas e Regra de negocios`, usando a tela de dashboard enviada pelo Mauricio como referencia visual principal.

Para esta fase:

- seguir o documento `Telas e Regra de negocios`
- seguir a linguagem visual do dashboard do Mauricio
- nao usar outros documentos como comando de interface
- nao reaproveitar a estrutura antiga do Lovable

## Objetivo geral

Criar um sistema limpo, rapido e focado em provar resultado:

- quem e monitorado gasta menos
- quem e monitorado vive melhor

## 1. Conceito de acesso

O sistema deve ter duas entradas separadas:

- entrada de gestao
- entrada do paciente

### Entrada de gestao

- uso da Raquel, medicos e farmaceutica
- interface de escritorio / dashboard

### Entrada do paciente

- uso do paciente
- experiencia focada em mobile
- botoes grandes
- leitura facil

### Regra de LGPD

No rodape das telas de login e cadastro deve existir o texto:

`Ao clicar em entrar, voce concorda com nossos Termos de Uso e Politica de Privacidade (LGPD).`

Sem pop-ups extras para nao travar o fluxo.

## 2. Regras de negocio

### 2.1 Motor de ROI

O sistema precisa calcular economia a partir de cliques do profissional no prontuario.

#### Tabela de banco

Criar tabela `gatilhos_roi`.

Cada registro deve ter:

- nome
- valor monetario
- justificativa opcional

#### Exemplos iniciais

- ajuste de medicacao (evitou internacao): `R$ 4.100,00`
- prevencao de risco de queda: `R$ 1.500,00`
- intervencao NR-1 (saude mental): `R$ 600,00`

#### Funcionamento

- a farmacêutica marca os gatilhos no perfil do paciente
- o dashboard da clinica soma isso automaticamente no grafico de economia assistencial
- o profissional tambem pode adicionar ganho manual:
  - titulo
  - valor
  - justificativa opcional

### 2.2 Score de saude

O score deve transformar respostas em numero de 0 a 100.

#### Regras

- perguntas fechadas pontuam
- perguntas abertas nao pontuam
- perguntas abertas com texto geram aviso no prontuario

#### Formula inicial

Se a pergunta for escala de 1 a 5:

`(soma das notas / maximo de pontos) * 100`

#### Faixas

- `71 a 100`: verde
- `41 a 70`: amarelo
- `0 a 40`: vermelho

#### Historico

O sistema deve plotar grafico de linha com historico do score do paciente ou do grupo.

## 3. Inventario de telas

### Gestao

#### Pagina 1 - Dashboard de ROI e Governanca

Blocos obrigatorios:

- total de vidas
- taxa de adesao
- economia total
- historico de saude do grupo
- alertas
- economia assistencial por tipo
- pacientes por status

#### Pagina 2 - Lista de Pacientes

Tabela principal:

- nome
- ultima avaliacao
- score atual
- status

Botao critico:

- adicionar paciente manualmente

Regra:

- profissional preenche nome, CPF e e-mail
- paciente entra na lista como `Pendente`

#### Pagina 3 - Prontuario Integrado VH

Abas:

- avaliacao
- plano de cuidado
- metas do paciente
- caixa de ROI

##### Aba avaliacao

- respostas do paciente organizadas por blocos
- habitos
- remedios
- terapias
- itens criticos em destaque

##### Aba plano de cuidado

- campo de texto livre para orientacoes do profissional

##### Aba metas do paciente

- metas diarias
- exemplo: beber agua, caminhada

##### Caixa de ROI

- checklist de intervencoes realizadas
- alimenta o financeiro

### Paciente

#### Pagina 4 - Minha Saude

Blocos obrigatorios:

- score de saude em destaque
- checklist de metas
- botao responder avaliacao

#### Pagina 5 - Questionario de Cuidado Integrado

Componente modular para:

- escala
- multipla escolha
- aberta

Deve aceitar perguntas ligadas a:

- habitos
- medicamentos
- terapias
- NR-1

## 4. Diferenciais de monitoramento

### Avaliacao integral

Cruzar habitos com remedios.

Exemplo:

- paciente relata tontura
- profissional ve uso de 3 remedios de pressao
- sistema destaca isso no prontuario

### Sincronizacao

Quando o profissional salva nota ou meta no prontuario:

- a home do paciente atualiza na hora

### Multitenancy

- cada clinica ve apenas seus dados
- tudo filtrado por `institution_id`

## 5. Regras de fluxo e navegacao

### Destino apos login

- profissional cai direto no dashboard
- paciente cai direto na home do paciente

### Lista de pacientes

- clique em um paciente abre o prontuario em nova tela/pagina

### Cadastro manual

- abre modal rapido

### Pos cadastro manual

- paciente recebe e-mail ou WhatsApp automatico
- recebe link de acesso
- recebe codigo da clinica

### Primeiro acesso do paciente

- acesso com CPF + senha
- codigo da instituicao pedido apenas no primeiro acesso

### Pos questionario

- paciente volta para a home
- score atualizado

### Alertas para o profissional

- ponto vermelho ou sino no dashboard quando paciente termina de responder

### Sincronizacao de metas

- salvou no prontuario
- home do paciente reflete imediatamente

## 6. Campos e regras da lista de pacientes

### Colunas

- nome completo
- CPF mascarado
- score atual
- status
- data da ultima resposta

### Cadastro manual

Campos:

- nome
- CPF
- e-mail
- telefone
- data de nascimento
- sexo

### Edicao e exclusao

- profissional pode editar
- profissional pode inativar
- nao existe exclusao real
- usar status `Inativo`

## 7. Regra dos status

- `Pendente`: cadastrado e sem resposta
- `Ativo`: respondeu nos ultimos 30 dias
- `Em Alerta`: score abaixo de 60 ou mais de 10 dias sem resposta
- `Monitorado`: plano validado e metas sendo cumpridas
- `Inativo`: arquivado pelo profissional

## 8. Regras clinicas de alerta

Criar alerta automatico se:

- paciente usa mais de 5 medicamentos
- score caiu 20 pontos de uma semana para outra
- paciente ficou 7 dias sem marcar metas como feitas

Locais de exibicao:

- icone de alerta na lista de pacientes
- topo do prontuario

## 9. Inteligencia preditiva e RAG

A inteligencia do MVP deve atuar como camada assistiva de predicao de risco, nao como diagnostico automatico.

### Entrada de dados

- respostas fechadas do questionario
- campos abertos do paciente
- score de saude
- alertas clinicos
- sinais de PRMs
- eventos de ROI assistencial

### Saidas permitidas

- score preditivo
- risco baixo, moderado ou alto
- alertas priorizados
- sinais para prontuario
- recomendacoes de acompanhamento
- fontes RAG consultadas

### Regras

- RAG e hub de conhecimento/recuperacao, nao rede neural
- nenhuma chave ou API externa de IA deve ficar exposta no front-end
- a v1 deve priorizar regras clinicas, estatistica simples e fontes aprovadas
- modelos de Machine Learning ou redes neurais entram apenas com dados historicos suficientes e validacao clinica
- toda saida sensivel deve ser apresentada como apoio a decisao validada por profissional

## 10. Permissoes

### Administrador

- ve ROI financeiro
- ve todos os pacientes
- cria outros profissionais

### Profissional

- ve lista de pacientes
- edita prontuario
- marca ROI
- define metas

### Paciente

- ve a propria home
- responde perguntas
- marca metas como concluidas

## 11. Design e estados de tela

### Identidade visual

- Emerald Green `#10B981`
- Slate Blue `#1E293B`
- botao arredondado
- fonte sans-serif
- visual de clinica premium

### Estado vazio

Quando nao houver pacientes:

`Nenhum paciente cadastrado. Comece adicionando um manualmente.`

## 12. Entidades principais

- instituicao
- profissional
- paciente
- avaliacao
- meta
- log

## 13. Direcao tecnica imediata

O foco agora e:

- banco multitenant
- rotas de cadastro
- fluxo de acesso
- dashboard da clinica
- lista de pacientes
- prontuario integrado
