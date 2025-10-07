# MineComply API<p align="center">

<a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>

Backend service for the MineComply platform. This NestJS project powers Supabase-backed authentication, evidence capture, PDF generation, and Supabase Storage integrations used by the Expo mobile app and reviewer dashboard.</p>

## 🗂️ Database schema cheat sheet

| Table / Enum                                                                    | Purpose                                                                                                                                               |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`, `UserRole`                                                              | Supabase-backed identities with global roles (Proponent, MMT, Regulator, Admin) and contact metadata.                                                 |
| `Organization`, `OrganizationType`, `UserOrganization`                          | Mining companies, monitoring teams, and regulators plus membership roles to manage who can act on behalf of each group.                               |
| `Project`, `ProjectAssignment`                                                  | Individual mine sites or projects, including ECC/EPEP references, locations, and user assignments (e.g., MMT reviewers).                              |
| `ComplianceCondition`, `ConditionType`                                          | ECC and EPEP conditions tracked per project to scope reporting obligations.                                                                           |
| `Submission`, `SubmissionStatus`                                                | Proponent compliance submissions covering a reporting window, lifecycle states (draft → submitted → review → approval), and ties to projects.         |
| `ComplianceRecord`, `ComplianceCategory`                                        | Individual monitoring datapoints (air, water, noise, financial, hazardous waste, etc.) linked to specific conditions with thresholds, GPS, and notes. |
| `Evidence`, `EvidenceType`                                                      | Rich media artifacts (photos, videos, lab reports, drone footage) with metadata, file storage keys, GPS, and optional record-level linkage.           |
| `ValidationSession`, `ValidationEntry`, `ValidationStatus`, `ValidationOutcome` | Multipartite Monitoring Team reviews, side-by-side field checks, recommendations, and workflow outcomes.                                              |
| `Report`, `ReportType`                                                          | Generated CMR/CMVR PDFs (plus future summaries) with storage metadata and provenance.                                                                 |
| `DigitalSignature`                                                              | Captures pen/stylus-based signatures, signatories, and device info for legally binding reports.                                                       |

Every table is wired through Prisma to the Supabase Postgres instance (see `prisma/schema.prisma`), and migrations live in `prisma/migrations/`. Review that folder for the latest SQL applied to the environment.

## 🔐 Row level security (RLS)

- RLS is enabled on all core tables (users, organizations, projects, submissions, validation, reports, evidence) to prevent cross-company data leakage.
- Policies limit `authenticated` clients to records linked to their Supabase account through assignments or organization membership; privileged service-role traffic (the Nest API) continues to operate unrestricted.
- The SQL used to enable RLS and define policies lives in `prisma/policies/enable_rls.sql`. To reapply after schema changes, run:

```bash
npm exec prisma db execute --file prisma/policies/enable_rls.sql --schema prisma/schema.prisma
```

- When you add new tables, mirror the policy pattern: enable RLS, create a readable predicate based on project/organization membership, and keep write access behind the service role or dedicated mutations.

## 📡 Compliance API (mobile beta)

All routes live under the global prefix (default `/api`) and require a Supabase bearer token. Each request auto-syncs the Supabase profile into the local `User` table, so the first hit from a new login seeds the database.

| Method | Path                                            | Description                                                                                                       |
| ------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/compliance/me`                                | Returns the authenticated user's profile, organization memberships, project assignments, and accessible projects. |
| `GET`  | `/compliance/projects`                          | Lists projects the user can act on, including counts of submissions and conditions.                               |
| `GET`  | `/compliance/projects/:projectId/conditions`    | Fetches ECC/EPEP conditions for a project.                                                                        |
| `GET`  | `/compliance/projects/:projectId/submissions`   | Lists submissions within a project plus basic counts (records, evidence, validations).                            |
| `POST` | `/compliance/projects/:projectId/submissions`   | Creates a draft submission linked to the current user.                                                            |
| `GET`  | `/compliance/submissions/:submissionId`         | Retrieves a submission with records, evidence, validations, and reports.                                          |
| `GET`  | `/compliance/submissions/:submissionId/records` | Lists compliance records (with evidence + validation entries) for a submission.                                   |
| `POST` | `/compliance/submissions/:submissionId/records` | Adds a compliance datapoint to a submission.                                                                      |

### Request payloads

Create submission:

```json
{
  "title": "Q3 2025 Environmental Report",
  "summary": "Dust and water sampling results",
  "reportingFrom": "2025-07-01T00:00:00Z",
  "reportingTo": "2025-09-30T23:59:59Z"
}
```

Create compliance record:

```json
{
  "category": "WATER",
  "parameter": "pH",
  "measuredValue": 7.2,
  "unit": "pH",
  "recordedAt": "2025-08-15T09:30:00Z",
  "latitude": 16.0403123,
  "longitude": 120.3301128,
  "notes": "Downstream sampling point"
}
```

> Tip: The mobile app can safely assume that project and submission IDs are Supabase UUID strings; invalid IDs yield a 400 via the UUID pipe before hitting the database.

> **Workspace note:** The backend lives in `minecomplyapp/minecomplyapi` so it can be managed alongside the Expo app in this workspace. If you prefer both projects as siblings (`minecomplyapp` and `minecomplyapi`), move the folder one level up once configuration is complete.[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456

[circleci-url]: https://circleci.com/gh/nestjs/nest

## 📦 Project structure

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>

````<p align="center">

minecomplyapi/<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>

├── src/<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>

│   ├── app.controller.ts      # Root metadata endpoint<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>

│   ├── app.module.ts          # Global config + Health module<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>

│   ├── app.service.ts         # API metadata service<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>

│   ├── config/                # Application + Supabase config factories<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>

│   └── health/                # Liveness/readiness endpoints<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>

├── .env.example               # Environment variable template  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>

├── package.json    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>

└── README.md  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>

```</p>

  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)

## ✅ Prerequisites  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->



- Node.js 20+ and npm 10+## Description

- Supabase project credentials (URL, anon key, service-role key, JWKS URL)

- Supabase Storage bucket for evidence uploads (bucket name, optional uploads prefix)[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.



## 🚀 Getting started## Project setup



```bash```bash

# 1. Install dependencies$ npm install

npm install```



# 2. Bootstrap environment variables## Compile and run the project

cp .env.example .env

# Edit .env with your Supabase credentials (auth + storage)```bash

# development

# 3. Start the API in watch mode$ npm run start

npm run start:dev

```# watch mode

$ npm run start:dev

The server listens on `http://localhost:3000` by default (configurable via `PORT`). A global prefix of `/api` is applied, so:

# production mode

- `GET http://localhost:3000/api` → API metadata (name, version, uptime)$ npm run start:prod

- `GET http://localhost:3000/health` → General health summary```

- `GET http://localhost:3000/health/live` → Liveness probe

- `GET http://localhost:3000/health/ready` → Readiness probe with Supabase auth/storage config checks## Run tests



## 🔧 Environment variables```bash

# unit tests

| Variable | Description |$ npm run test

| --- | --- |

| `NODE_ENV` | Runtime environment (`development`, `production`, etc.) |# e2e tests

| `PORT` | Port exposed by the Nest server |$ npm run test:e2e

| `GLOBAL_PREFIX` | Global API prefix applied to all routes |

| `CORS_ORIGINS` | Comma-separated list of allowed origins for CORS |# test coverage

| `SUPABASE_URL` | Base URL of your Supabase project |$ npm run test:cov

| `SUPABASE_ANON_KEY` | Public anon key (used for client-side auth) |```

| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for privileged operations |

| `SUPABASE_JWKS_URL` | JWKS endpoint for Supabase JWT verification |## Deployment

| `SUPABASE_STORAGE_BUCKET` | Supabase Storage bucket for evidence uploads |

| `SUPABASE_STORAGE_UPLOADS_PATH` | Optional prefix inside the bucket (`uploads/` by default) |

## 🪣 Supabase Storage configuration

1. In the Supabase dashboard open **Storage → Buckets** and create a private bucket (e.g. `minecomplyapp-bucket`).
2. Add storage policies that allow the `service_role` to `insert`, `select`, and `delete` objects within that bucket:

   ```sql
   create policy "Allow service role inserts"
   on storage.objects for insert
   with check (
     auth.role() = 'service_role'
     and bucket_id = 'minecomplyapp-bucket'
   );

   create policy "Allow service role selects"
   on storage.objects for select
   using (
     auth.role() = 'service_role'
     and bucket_id = 'minecomplyapp-bucket'
   );

   create policy "Allow service role deletes"
   on storage.objects for delete
   using (
     auth.role() = 'service_role'
     and bucket_id = 'minecomplyapp-bucket'
   );
   ```

3. Configure the API by setting `SUPABASE_STORAGE_BUCKET` and (optionally) `SUPABASE_STORAGE_UPLOADS_PATH` in `.env`.
4. Use the new REST endpoints to generate upload/download URLs:

   - `POST /storage/upload-url` → `{ url, path, token }`
   - `POST /storage/download-url` → `{ url }`

5. On the Expo client call `uploadFileFromUri({ uri, fileName })` in `minecomplyapp/lib/storage.ts` to request a signed URL and push the file to Supabase Storage. Persist the returned `path` with your evidence record.

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.



Environment validation is handled via Joi, ensuring required values are present at boot.```bash

$ npm install -g @nestjs/mau

## 🧪 Available scripts$ mau deploy

````

````bash

npm run start        # Production modeWith Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

npm run start:dev    # Watch mode for local development

npm run lint         # ESLint + Prettier autofix## Resources

npm run test         # Unit tests (Jest)

```Check out a few resources that may come in handy when working with NestJS:



## 📌 Next steps

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit the [NestJS Discord channel](https://discord.gg/G7Qnnhy).
- Build out the evidence capture UI on the mobile app using the new Supabase storage endpoints.
- Integrate Prisma for any new data models and keep RLS policies aligned.
- Add Puppeteer-based PDF generation for CMR/CMVR reports when ready.
- Stay in the loop via [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).

This scaffold is ready for Supabase authentication hooks, Supabase Storage integration, and future modules that will support the MineComply workflow. Looking for a job, or have a job to offer? Check out the [NestJS Jobs board](https://jobs.nestjs.com).


## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
````
