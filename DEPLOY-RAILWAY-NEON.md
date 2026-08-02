# Deployment: Railway and Neon

## Current production service

The current production service is `careops-vh` in Railway project `careops-vh`.
The environment is `production`.
The service uses the root `Dockerfile` and the `DATABASE_URL` secret.

Railway does not use a GitHub repository source for this service.
Railway PR deployments are disabled.
A GitHub push or merge does not deploy the service.

The active health endpoint is:

```text
https://careops-vh-production.up.railway.app/api/health
```

## Required secret

Set `DATABASE_URL` in the Railway service variables.
Use the PostgreSQL URL from Neon Connection Details with TLS enabled.

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

The production image sets `CAREOPS_REQUIRE_DATABASE=true`.
The application stops when the database URL is absent.
During the first connection, the application creates the `careops_store` table and seed data.

## Direct deployment procedure

1. Open a clean checkout that contains the intended revision.
2. Run `railway link --project careops-vh`.
3. Run `railway environment production`.
4. Run `railway service careops-vh`.
5. Verify that `railway status` identifies the production service.
6. Run `railway up --detach -m "Describe the release"`.
7. Verify the health endpoint after the deployment succeeds.

CAUTION: `railway up` uploads the files in the local checkout.
Before you run the command, verify the branch and commit.

## Health verification

Run this command after each direct deployment:

```bash
curl -fsS https://careops-vh-production.up.railway.app/api/health
```

The service returns JSON with `status` equal to `ok`.

## Legacy Render metadata

`render.yaml` remains in this repository as inactive legacy metadata.
It does not configure the active production service.
