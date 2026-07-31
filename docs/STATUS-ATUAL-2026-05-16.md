# Status Atual - 2026-05-16

## O que ficou decidido

- o sistema sera reconstruido do zero
- a estrutura antiga do Lovable nao sera reaproveitada
- o Lovable ficara apenas como referencia
- o backend sera em Java
- o frontend sera moderno e responsivo
- o MVP seguira o recorte ja alinhado nos documentos e no sprint
- o documento `Telas e Regra de negocios` passa a ser a origem principal do MVP
- a tela enviada pelo Mauricio passa a ser a referencia visual principal da gestao
- o arquivo `04-fonte-de-verdade-mvp-funcional.md` passa a ser a traducao tecnica oficial dessa base

## O que esta sendo feito agora

- organizacao do projeto novo
- definicao da arquitetura inicial
- fundacao do backend
- fundacao do frontend
- primeiro fluxo real de acesso e gestao
- refinamento visual fiel ao CareOps
- separacao dos fluxos de primeiro acesso e recuperacao de senha
- melhoria da home do paciente
- criacao do diagrama vivo do sistema
- congelamento da fonte principal do MVP
- alinhamento visual da gestao com a tela do Mauricio

## O que ja esta de pe

- backend Spring Boot rodando em `http://127.0.0.1:4310`
- frontend React rodando em `http://127.0.0.1:4195`
- login da clinica
- login do paciente
- esqueci minha senha da clinica
- esqueci minha senha do paciente
- primeiro acesso da clinica
- primeiro acesso do paciente
- dashboard inicial da clinica
- lista de pacientes alinhada ao documento
- dashboard da gestao reestruturado com topo global, painel de ROI e status corretos
- home do paciente refeita
- tela inicial de avaliacao do paciente
- diagrama salvo em `05-diagrama-sistema.md`
- correcoes visuais aplicadas em lateral, bloco de suporte, cards de status e leitura da tabela de pacientes
- bug de inicializacao da sessao corrigido para permitir abrir rotas protegidas diretamente sem desviar tudo para o dashboard
- novas capturas validadas em `.captures/09-gestao-dashboard-validado.png`, `.captures/10-gestao-pacientes-validado.png` e `.captures/11-paciente-home-validado.png`
- entrada raiz criada em `/` para separar de forma clara o acesso da clÃ­nica e o acesso do paciente
- `.gitignore` e `README.md` criados para publicaÃ§Ã£o limpa do repositÃ³rio

## Rotas atuais

- `/gestao/login`
- `/gestao/esqueci-senha`
- `/gestao/primeiro-acesso`
- `/gestao/dashboard`
- `/gestao/pacientes`
- `/`
- `/paciente/login`
- `/paciente/esqueci-senha`
- `/paciente/primeiro-acesso`
- `/paciente/home`
- `/paciente/avaliacao`

## Endpoints atuais

- `GET /api/health`
- `POST /api/auth/management/login`
- `POST /api/auth/patient/login`
- `POST /api/auth/management/password-reset`
- `POST /api/auth/patient/password-reset`
- `POST /api/auth/management/first-access`
- `POST /api/auth/patient/first-access`
- `GET /api/management/dashboard`
- `GET /api/management/patients`

## Credenciais atuais de desenvolvimento

- gestao: `gestao@clinicavida.com` / `12345678`
- paciente: `123.456.789-00` / `12345678`

## Proximo bloco de execucao

- refinamento visual do dashboard inicial da clinica
- evolucao da lista de pacientes para modal de cadastro manual
- prontuario integrado
- home do paciente ligada ao questionario e as metas
- regras automaticas de score, alertas e ROI
- revisao visual tela por tela com base na referencia do Mauricio e no documento `Telas e Regra de negocios`

## Ajustes rápidos - 2026-05-18 16:50
- dashboard da gestão com textos corrigidos em português
- status do painel reestruturados para não quebrar nomes como Monitorado e Em Alerta
- links falsos de relatório trocados por ação neutra para não mandar o usuário para a entrada raiz
- layout da gestão com navegação e suporte revisados
- front e back abertos em janelas separadas do VS Code


## Ajustes de uso e responsividade - 2026-05-18 17:05
- rota pública separada por perfil para impedir que login do paciente caia na gestão
- logout da gestão e do paciente retorna para a entrada principal
- tela inicial com textos centralizados e cartões mais fortes
- home do paciente com metas clicáveis, ações visíveis e resumo do acompanhamento
- lista de pacientes com ações clicáveis de ver, editar e arquivar


## Ajustes de fluxo do paciente - 2026-05-18 17:25
- home do paciente refinada para leitura mais fluida e menos efeito de bloco colado
- avaliação do paciente convertida em fluxo de 3 blocos com avanço e conclusão
- botão de concluir avaliação preparado para retornar à home
- rota raiz agora redireciona direto para a entrada da clínica
- logout da clínica e do paciente volta para a entrada correta de cada perfil
- links de relatório do dashboard da gestão levam para pacientes


## 2026-05-19 - Front publicado para teste na Vercel
- frontend ajustado para funcionar sozinho em ambiente de teste com fallback local quando a API nao estiver publicada.
- entrada da clinica mantida separada da entrada do paciente.
- home do paciente refinada com leitura mais centralizada e acoes clicaveis.
- lista de pacientes recebeu acoes e modais de teste para ver, editar e adicionar.
- adicionado vercel.json no frontend para manter rotas do SPA funcionando em producao.
- deploy de producao publicado na Vercel para validacao do front hoje.

