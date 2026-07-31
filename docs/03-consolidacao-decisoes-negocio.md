# CareOps VH - Consolidacao de Decisoes de Negocio

Data: 2026-05-16

## Fonte principal desta fase

Nesta etapa do projeto, a referencia principal para implementacao e:

- o documento `Telas e Regra de negocios`
- a tela de dashboard enviada pelo Mauricio

Os demais documentos ficam apenas como historico de contexto e nao devem comandar a interface ou o fluxo atual do MVP.

## 1. O que foi definido no sprint

Primeira entrega funcional de monitoramento clinico.

### Escopo atual do MVP

- login profissional / gestao
- login paciente
- recuperacao de senha
- dashboard da clinica
- lista de pacientes
- cadastro manual de paciente
- prontuario integrado
- home do paciente
- questionario de cuidado integrado
- score de saude
- alertas principais
- ROI basico

### O que fica fora por enquanto

- parceiro completo
- beneficios completos
- creditos complexos
- plano de vida
- desenvolvimento
- gestora expandida
- IA ampla

## 2. Contexto de negocio que ja estava respondido

### Visao do produto

- definicao principal: monitoramento
- publico inicial mais importante: profissionais de saude
- primeira versao precisa gerar dados para tomada de decisao em dashboards
- primeira versao util: analise de dados coletados em dashboards para gestao
- IA preditiva pode ficar para depois

### Perfis

- paciente
- profissional de saude
- gestor

### Entrada

- cada perfil deve ter URL propria
- cadastro por convite direcionado
- vinculo do usuario com a instituicao por convite
- parceiro precisa de aprovacao
- recuperar senha e obrigatorio
- termos de uso e LGPD obrigatorios

### Usuario

- deve ver boas-vindas ou dicas genericas da clinica
- precisa responder avaliacao no primeiro acesso
- resultado so aparece apos avaliacao profissional
- plano de cuidado e acompanhado pelo sistema
- podera buscar e agendar profissionais
- podera contratar beneficios
- plano de vida nao entra agora
- desenvolvimento nao foi priorizado para agora

### Plano de cuidado

- criado pelo profissional de saude com ajuda do paciente
- validado pelo profissional
- alterado pelo profissional com ajuda do paciente
- acompanhado pelo sistema
- encerrado quando o paciente declinar do monitoramento

### Instituicao

- painel com dados para tomada de decisao
- lista de usuarios vinculados
- visao por nivel:
  - gestao ve tudo
  - profissional ve apenas seus pacientes
  - administrativo ve dados gerais e de cadastro
- precisa de relatorios e alertas

### Privacidade

- profissionai de saude ve apenas seus pacientes
- instituicao ve resumo geral
- parceiro nao ve dados individuais de saude
- consentimento LGPD obrigatorio
- usuario pode solicitar exclusao, mas nao excluir sozinho

## 3. O que o documento de Telas e Regras definiu

### Entradas

- duas entradas separadas:
  - gestao
  - paciente
- a entrada da gestao e escritorio/dashboard
- a entrada do paciente e mobile-first

### Regras de negocio centrais

- motor de ROI com gatilhos monetarios
- score de saude calculado por respostas fechadas
- perguntas abertas nao pontuam, mas geram aviso no prontuario
- destaque de risco quando houver sinais relevantes
- multitenancy por instituicao
- logs de acesso ao prontuario
- autosave para notas profissionais

### Fluxos definidos

- profissional entra direto no dashboard
- paciente entra direto na home
- clicar no paciente abre prontuario
- adicionar paciente manual abre modal rapido
- paciente recebe acesso por e-mail/WhatsApp
- paciente acessa com CPF + senha
- codigo da instituicao entra no primeiro acesso
- metas sincronizam com a home do paciente

### Status de paciente

- Pendente
- Ativo
- Em Alerta
- Monitorado
- Inativo

### Permissoes

- administrador ve ROI, todos os pacientes e cria profissionais
- profissional edita prontuario, marca ROI e define metas
- paciente ve sua propria home, responde perguntas e marca metas

### Direcao visual

- Emerald Green `#10B981`
- Slate Blue `#1E293B`
- visual limpo
- botao arredondado
- tipografia sans-serif

## 4. Contexto de prazo e direcionamento

### Macro do produto

- sistema operacional de governanca em saude
- foco em reduzir desperdicio e monitorar adesao terapeutica
- primeira versao deve provar ROI financeiro

### MVP dela

- login por perfil
- cadastro por codigo
- avaliacao de saude em 3 blocos
- plano de cuidado validado por humano
- dashboard basico de ROI

### Fases sugeridas

- ate 15/05: esqueleto estrutural
- ate 15/06: nucleo de cuidado com dashboard de ROI
- julho: marketplace, pagamentos e IA ampliada

## 5. O que Mauricio perguntou

### Fluxo

- para onde cada perfil vai apos o login
- comportamento do clique no paciente
- fluxo do cadastro manual
- primeiro acesso do paciente
- retorno apos questionario
- sincronizacao de metas e alertas

### Campos e telas

- campos exatos da lista de pacientes
- campos obrigatorios do cadastro manual
- regras completas dos status
- regras exatas do score
- lista oficial dos gatilhos de ROI
- estrutura completa do questionario
- criterios objetivos de alerta

### Regras e arquitetura

- permissoes exatas por perfil
- estados de tela
- criterios de aceite
- entidades principais
- endpoints/servicos necessarios
- design system oficial

## 6. O que ficou definido no projeto novo agora

- reconstruir o sistema do zero
- nao reaproveitar a estrutura do Lovable
- usar o Lovable apenas como referencia funcional e visual
- backend em Java
- frontend moderno e responsivo
- o sistema precisa nascer limpo
- nada de texto tecnico ou explicativo dentro da interface
- fluxo real de acesso:
  - login
  - recuperar senha
  - primeiro acesso
  - permissao por perfil
  - sessao protegida

## 7. O que o Lovable trouxe como referencia

### Base funcional relevante

- `src/pages/Login.tsx`
- `src/pages/InstitutionalDashboard.tsx`
- `src/pages/Patients.tsx`
- `src/pages/UserDashboard.tsx`
- `src/pages/HealthAssessment.tsx`
- `src/pages/CarePlan.tsx`

### O que ele mostra

- paleta principal verde
- sidebar escura institucional
- cards claros
- experiencia mais leve para o paciente
- plataforma maior que o nosso recorte atual

### O que nao seguir literalmente

- login simulado
- mistura de muitos modulos ao mesmo tempo
- explicacoes demais em algumas telas
- modulos fora do recorte atual

## 8. O que ainda precisa ser fechado

- fluxo exato de recuperar senha
- fluxo exato de primeiro acesso
- quem cadastra profissional e parceiro no inicio
- lista inicial oficial das perguntas do questionario
- lista inicial oficial dos gatilhos de ROI
- comportamento do cadastro manual do paciente
- campos finais do prontuario integrado

## 9. Direcao correta para o sistema

- usar o verde do CareOps como base
- usar a maturidade visual da tela do Mauricio como referencia principal
- usar o Lovable como mapa do produto, nao como implementacao
- construir por etapas:
  - acesso
  - dashboard
  - pacientes
  - prontuario
  - paciente
  - questionario
  - ROI e alertas
