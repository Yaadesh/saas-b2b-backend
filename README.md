# SaaS B2B Backend

A multi-tenant backend for a B2B employee onboarding platform. It gives an
organization a single admin surface to get new hires set up on day one:
enrolling their device into MDM and assigning them a role-specific onboarding
curriculum built from live Confluence docs and custom tasks — with enterprise
identity provisioning (SCIM/Okta) able to kick the whole flow off automatically.

## What it does

- **Multi-tenant auth** — Supabase-issued JWTs are verified against Supabase's
  JWKS endpoint; every authenticated request resolves to a user scoped to
  their organization.
- **Learning modules for onboarding** — a module is a named bundle of
  documents and tasks (e.g. "Backend Onboarding") that new hires work through;
  documents can be pulled live from a connected Confluence space (search,
  recent pages, spaces browser) so onboarding content stays linked to the
  org's actual docs instead of being copy-pasted and going stale.
- **Role-based curriculum** — roles map to modules (`role_module_mapping`),
  so which onboarding modules a new hire gets is driven by the role they're
  assigned, giving each role its own custom onboarding path; roles also map
  to which integrations they get access to.
- **MDM enrollment** — Jamf Pro and SimpleMDM integrations so a new hire's
  device can be enrolled into device management as part of onboarding.
- **Third-party integrations** — a factory/strategy setup
  (`IntegrationFactoryService`) behind a common `BaseIntegrationService`
  interface, so OAuth-based integrations (GitHub, Slack, Confluence) and
  credential-based integrations (Jamf, SimpleMDM) are added/connected through
  the same API shape without branching integration-specific logic through the
  rest of the app.
- **SCIM 2.0 provisioning** — a `/scim/v2` endpoint set for identity providers
  (e.g. Okta) to provision and deprovision users into an organization
  automatically, so onboarding can start as soon as a new hire lands in the
  org's IdP.
- **Header token issuance** — short-lived, org+integration-scoped JWTs that
  downstream integrations use to call back into the platform.

## Stack

- **Framework**: NestJS (TypeScript, Node.js)
- **Auth**: Supabase JWT verification via JWKS, Passport
- **Data**: PostgreSQL via TypeORM
- **Patterns**: CQRS (`@nestjs/cqrs`) for write paths like user creation,
  repository layer between services and TypeORM entities
- **API docs**: OpenAPI/Swagger, generated from decorators on controllers/DTOs
- **Testing**: Jest (unit + e2e)

## Project layout

```
src/
  auth/            JWT strategy, guard, current-user decorator
  supabase/         Supabase client + JWKS verification
  organizations/    Org entity and lookups
  users/            Users, SCIM 2.0 provisioning endpoints, CQRS commands
  roles/            RBAC: roles, role<->module and role<->integration mappings
  modules/          Onboarding learning modules (docs + tasks), live
                     Confluence document/space search for building them
  integrations/     Integration factory, per-provider services, OAuth
                     callback handling, encrypted credential storage
  jamf/             Jamf Pro connection endpoint (credential-based)
  simplemdm/        SimpleMDM connection endpoint (credential-based)
```

## Local setup

```bash
npm install
cp .env.example .env   # fill in Supabase + DB credentials
npm run start:dev
```

Swagger docs are served at `http://localhost:3000/api` once the app is running.

## Testing

```bash
npm run test        # unit tests
npm run test:e2e     # e2e tests
npm run test:cov     # coverage
```
