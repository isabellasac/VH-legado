# Publicação: Docker + Neon

O projeto é publicado como um único serviço Docker. O build incorpora o React na
API Spring Boot, portanto a URL pública atende tanto a aplicação quanto `/api`.
O banco é Neon/PostgreSQL e nenhuma credencial é incluída no repositório.

## Variável obrigatória

No painel do Neon, abra **Connection Details** e copie a URL PostgreSQL com TLS.
Cadastre-a no provedor de deploy como:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST-DO-NEON/NOME_DO_BANCO?sslmode=require
```

O container recebe `CAREOPS_REQUIRE_DATABASE=true`; sem essa variável a API não
inicia. Na primeira conexão ela cria a tabela `careops_store` e faz o seed inicial.

## Railway

Com a CLI autenticada, na raiz deste diretório:

```bash
railway init --name vh-health-hub
railway add --service vh-health-hub
railway variable set DATABASE_URL='postgresql://...' --service vh-health-hub
railway up --service vh-health-hub --detach -m "Deploy CareOps VH"
railway domain --service vh-health-hub
```

Use o `Dockerfile` da raiz. Configure o health check como `/api/health`. A URL
entregue por `railway domain` é o link final da aplicação.

## Render

Crie um Web Service usando Docker e diretório raiz do repositório. Defina
`DATABASE_URL` e use `/api/health` como health check. Não é necessário criar um
serviço separado para o frontend nem configurar `VITE_API_BASE_URL`.
