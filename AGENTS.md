# AGENTS.md — Well-Architected IaC Analyzer

Single entry point and source of truth for coding agents (and humans) working in this repository.
It describes what the project is, how the pieces fit together, where everything lives, how to build
and verify changes, and the conventions and traps you must respect. `CLAUDE.md` contains only
`@AGENTS.md` (an import of this file); `README.md` is the end-user deployment guide.

---

## 1. What this project is

**Well-Architected IaC Analyzer** is an AWS sample (MIT-0, explicitly *non-production*) that uses
Amazon Bedrock to review infrastructure artifacts against AWS Well-Architected best practices:

- **Inputs:** a single IaC file (CloudFormation YAML/JSON, Terraform, CDK source in TS/PY/GO/JAVA/C#),
  a multi-file IaC project (multiple files or a `.zip`), an architecture diagram (PNG/JPEG), or up to
  five architecture PDFs. An optional *supporting document* (PDF/TXT/PNG/JPEG ≤ 4.5 MB) adds context.
- **Analysis:** for every question of the selected **lens** (the WA Framework or one of 15 AWS official
  lenses, plus customer **custom lenses**) and selected pillars, the backend retrieves guidance from a
  Bedrock Knowledge Base (RAG) and asks a Claude model to mark each best practice
  *relevant / applied / not applied*, with reasons, recommendations and a **prioritization**
  (Criticality, Complexity, Priority → Eisenhower matrix).
- **Outputs:** an interactive results table, a Priorities matrix, CSV export, "Get more details"
  Markdown deep-dives, IaC template generation from diagrams, a chat assistant grounded in the
  results, and push-back of answers/milestones/reports into the **AWS Well-Architected Tool**.
- **Persistence:** every upload is a *work item* (DynamoDB + S3) keyed per user and per lens, so
  results survive dropped connections and can be reloaded from the side navigation.

It ships as **three deliverables that must stay consistent**:

| # | Deliverable | Location |
|---|-------------|----------|
| 1 | NestJS backend + React/Cloudscape frontend, containerized, on ECS Fargate | `ecs_fargate_app/backend`, `ecs_fargate_app/frontend`, `ecs_fargate_app/finch` |
| 2 | Python CDK stack that builds the whole environment (network, ECS, ALB+auth, Bedrock KB, DynamoDB, S3, Lambdas) | `app.py`, `ecs_fargate_app/wa_genai_stack.py` |
| 3 | CloudFormation "deployment stack": a throw-away EC2 that clones this repo from GitHub, rewrites `config.ini`, runs the CDK deploy, then self-deletes | `cfn_deployment_stacks/iac-analyzer-deployment-stack.yaml` |

Upstream: `https://github.com/aws-samples/well-architected-iac-analyzer` (branch `main`).
Dependabot PRs are the normal dependency-update path — versions are pinned everywhere.

---

## 2. Tech stack (pinned versions as of this file)

| Layer | Technology |
|-------|-----------|
| Infra-as-code | Python 3.11+ CDK v2 (`aws-cdk-lib==2.253.0`, `cdklabs.generative_ai_cdk_constructs==0.1.312`, `cdk-nag`), CDK CLI ≥ 2.x, Docker or Finch for image assets |
| Backend | Node ≥ 20.19 / 22.12 at runtime (Nest 12 packages are ESM-only and load via `require(esm)`; images use `node:alpine3.23`, the CFN deployer installs Node 24), NestJS 12 (`@nestjs/common`, `core`, `platform-express`, `platform-socket.io`, `websockets` 12.0.3, `@nestjs/config` 12.0.0, `@nestjs/throttler` 6.7.0; `@nestjs/cli` 11.0.21 / `schematics` 11.1.0 kept on 11 because schematics 12 requires TypeScript ≥ 6), `socket.io` 4.8.3, AWS SDK v3 `3.1000.0` (bedrock-runtime, bedrock-agent-runtime, dynamodb, s3, wellarchitected, lib-storage), `adm-zip` 0.6.0, `class-validator` 0.14.3, TypeScript 5.9.3 (CommonJS, ES2021, **lenient**: `strictNullChecks: false`, `noImplicitAny: false`) |
| Frontend | React 19.2.3, Vite 8.0.16, TypeScript 5.9.3 (**strict**, `noUnusedLocals`/`noUnusedParameters` on), Cloudscape (`components` 3.0.1174, `chat-components` 1.0.89, `code-view` 3.0.94, `design-tokens` 3.0.68, `global-styles` 1.0.49, `collection-hooks`), `axios` 1.18.0, `socket.io-client` 4.8.3, `react-markdown` 10.1.0, `react-syntax-highlighter` 16.1.0, `react-rnd` 10.5.2 |
| Containers | `node:alpine3.23` (backend, multi-stage), `nginx:stable-alpine-slim` (frontend, serves SPA + reverse proxy), both run as non-root |
| Lambdas | Python (latest runtime via `determine_latest_python_runtime`), `boto3==1.37.2` (migration, cleanup), `requests` (KB synchronizer) |
| AI | Amazon Bedrock Converse API (Claude family), Bedrock Knowledge Base `RetrieveAndGenerate` with Titan Embed Text v2 (1024-dim), vector store = **S3 Vectors** (default) or OpenSearch Serverless |
| Data | DynamoDB (`AnalysisMetadataTable`, `LensMetadataTable`), S3 (analysis storage, WA docs/KB source, access logs), SSM Parameter Store (custom lenses) |
| Edge / identity | ALB (HTTPS, TLS 1.3 policy) with Cognito or OIDC `authenticate-*` listener actions; no app-level login |

No test suite and no ESLint config exist in the repo (`npm run lint` fails in both packages; `vitest`
is a devDependency without tests/config). **Type-checking via `npm run build` is the only automated
verification** for TS; `cdk synth` (with `cdk_nag`) is the gate for the CDK.

---

## 3. Repository layout (every tracked file)

Generated/ignored directories not shown: `.git/`, `.venv/`, `cdk.out/`, `node_modules/`, `dist/`,
`.vscode/`, `.finch/`, `npm-cache/`, `__pycache__/`, `.DS_Store`. A root `.env` (never committed)
is required for local dev.

```
well-architected-iac-analyzer/
├── AGENTS.md                                   ← This file: agent-facing entry point and architecture reference.
├── CLAUDE.md                                   ← Claude Code entry point; contains only `@AGENTS.md` so this file stays the single source of truth.
├── README.md                                   ← End-user docs: features, 3 deployment options, CFN parameters, config.ini options, clean-up, local dev.
├── CONTRIBUTING.md                             ← Standard aws-samples contribution/PR/security-reporting guidelines.
├── CODE_OF_CONDUCT.md                          ← Amazon Open Source Code of Conduct pointer.
├── LICENSE                                     ← MIT No Attribution (MIT-0).
├── .gitignore                                  ← Python/Node/CDK ignores (.venv, cdk.out, node_modules, .env, .vscode, .finch, npm-cache…).
├── .semgrepignore                              ← Excludes */prompts/system-prompts.ts from html-in-template-string rules (prompts use XML-like tags).
├── package.json                                ← Root npm scripts only: dev:up / dev:down (docker) and dev:up:finch / dev:down:finch → ./dev.sh.
├── package-lock.json                           ← Lockfile for the (dependency-less) root package.
├── requirements.txt                            ← CDK Python deps: aws-cdk-lib 2.253.0, constructs, cdklabs.generative_ai_cdk_constructs 0.1.312, cdk-nag.
├── cdk.json                                    ← CDK app entry (`python3 app.py`) + feature-flag context.
├── app.py                                      ← CDK app: instantiates WAGenAIStack as `WA-IaC-Analyzer-{region}-GenAIStack`, registers cdk_nag AwsSolutionsChecks + centralized suppressions list.
├── config.ini                                  ← [settings] source of truth for manual/script deploys: model_id, batch_size, vector_store_type, public_load_balancer, authentication, auth_type, certificate_arn, cognito/existing-cognito/oidc blocks.
├── finch-compose.dev.yaml                      ← Local dev compose: backend (:3000, hot reload, AUTH_DEV_MODE) + frontend (Vite :8080). Reads env from .env.
├── deploy-wa-analyzer.sh                       ← Script deploy: prereq checks, config.ini validation, venv + npm installs, `cdk bootstrap` + `cdk deploy`. `-a <stack>` enables auto-cleanup of the CFN deployer stack.
├── destroy-wa-analyzer.sh                      ← Script teardown: prereq checks, venv, `cdk destroy --force` (5 s warning). Prefer CloudFormation console deletion.
├── dev.sh                                      ← Local dev manager: validates tools/creds (.env), installs all deps, runs `docker|finch compose -f finch-compose.dev.yaml up --build|down`.
├── assets/                                     ← Images used by README.
│   ├── wa_genai_app_diagram.png                ← Solution architecture diagram.
│   ├── wa_aic_analyzer_screenshot_main.png     ← UI screenshot: main upload/settings screen.
│   ├── wa_aic_analyzer_screenshot_priorities.png  ← UI screenshot: Priorities (Eisenhower matrix) tab.
│   ├── wa_aic_analyzer_screenshot_results.png  ← UI screenshot: analysis results table.
│   ├── wa_aic_analyzer_screenshot_chat.png     ← UI screenshot: Analyzer Assistant chat.
│   └── wa_aic_analyzer_screenshot_template_generation.png  ← UI screenshot: generated IaC document tab.
├── cfn_deployment_stacks/
│   └── iac-analyzer-deployment-stack.yaml      ← Option-1 deployer: parameters/rules for all config.ini settings, VPC + EC2 (t3.xlarge AL2023) with cfn-init configsets that install tooling, clone GitHub `main`, sed-rewrite config.ini, run deploy-wa-analyzer.sh, cfn-signal, then emit an EventBridge "Stack Cleanup Request" to self-delete.
├── custom_lenses_use_case/
│   └── README.md                               ← Step-by-step guide for adding Custom Lenses (WA Tool lens JSON → publish → SSM parameter → run KB synchronizer → upload PDF → sync KB), plus removal & troubleshooting.
├── localization/
│   └── README.md                               ← i18n guide: the three files to edit to add a UI/output language.
├── local_development/                          ← Reduced CDK app deploying only the KB + storage layer for local dev.
│   ├── cdk.json                                ← `python3 kb_storage_app.py`; context vector_store_type=s3_vectors.
│   ├── kb_storage_app.py                       ← App: stack `dev-wa-iac-analyzer-kb-storage-{region}`; honours deploy_storage context.
│   ├── kb_storage_stack.py                     ← KBStorageStack: WA docs bucket, KB (S3 Vectors or OSS), test workload, SSM custom-lenses param, KB synchronizer Lambda + weekly rule + trigger, optional analysis bucket/table, outputs for .env. Duplicates KB code from wa_genai_stack.py — change both.
│   └── requirements.txt                        ← Same CDK deps as root (without cdk-nag).
└── ecs_fargate_app/                            ← Everything deployed by the CDK stack.
    ├── wa_genai_stack.py                       ← THE main CDK stack (WAGenAIStack): config.ini parsing, auth actions (new/existing Cognito, OIDC), S3/DynamoDB, KB (2 variants), test workload CR, custom-lenses SSM param, KB synchronizer Lambda + weekly rule + deploy-time trigger, Docker image assets, task role IAM, VPC/ECS/Cloud Map, ALB-fronted frontend service, backend service, migration Lambda + trigger, optional stack-cleanup Lambda/rule, CfnOutputs.
    ├── finch/                                  ← Container build + nginx config (used by both Docker and Finch).
    │   ├── backend.Dockerfile                  ← Prod backend: multi-stage node:alpine3.23, `npm ci` → `nest build` → prod deps only, non-root `node`, HEALTHCHECK :3000, `node dist/main`.
    │   ├── backend.dev.Dockerfile              ← Dev backend: full deps + global @nestjs/cli, `npm run start:dev` (watch); src mounted by compose.
    │   ├── frontend.Dockerfile                 ← Prod frontend: build with Vite, serve from nginx:stable-alpine-slim as non-root on :8080; copies nginx.main.conf + nginx.conf.
    │   ├── frontend.dev.Dockerfile             ← Dev frontend: Vite dev server on :8080 (`--host 0.0.0.0`), symlinks /app/public/public.
    │   ├── nginx.conf                          ← Server block: SPA fallback, 100 MB body limit, 1 h proxy timeouts, `/socket.io/` WS proxy (websocket-only upgrade), `/api/(.*)` → `http://backend.internal:3000/$1` (strips /api), `/health` → 200. Uses VPC resolver 169.254.169.253.
    │   └── nginx.main.conf                     ← Main nginx.conf for non-root execution (pid/temp paths under /tmp).
    ├── lambda_kb_synchronizer/
    │   ├── kb_synchronizer.py                  ← Deploy-time + weekly Lambda: cleans stale temp workloads (>24 h), downloads the 6 WA pillar PDFs + 15 official lens PDFs, writes `*.metadata.json`, associates each lens with a scratch workload to dump pillars/questions/best practices to S3 JSON/CSV, upserts LensMetadataTable rows, processes custom lenses from SSM, starts a KB ingestion job.
    │   └── requirements.txt                    ← `requests` (unpinned).
    ├── lambda_migration/
    │   ├── migration.py                        ← One-time (on stack create) migration from the pre-April-2025 single-lens storage layout to per-lens maps/paths; also deletes legacy root-level files from the WA docs bucket.
    │   └── requirements.txt                    ← boto3/botocore 1.37.2.
    ├── lambda_stack_cleanup/
    │   ├── stack_cleanup.py                    ← EventBridge-triggered Lambda that deletes the CFN deployer stack (name allow-listed via DEPLOYMENT_STACK_NAME).
    │   └── requirements.txt                    ← boto3/botocore 1.37.2.
    ├── well_architected_docs/                  ← Seed content copied to the KB bucket under `wellarchitected/` by BucketDeployment (refreshed by the synchronizer).
    │   ├── wellarchitected-cost-optimization-pillar.pdf
    │   ├── wellarchitected-operational-excellence-pillar.pdf
    │   ├── wellarchitected-performance-efficiency-pillar.pdf
    │   ├── wellarchitected-reliability-pillar.pdf
    │   ├── wellarchitected-security-pillar.pdf
    │   ├── wellarchitected-sustainability-pillar.pdf
    │   ├── wellarchitected_best_practices.json  ← Flat list [{Pillar, Question, "Best Practice"}] for the WA Framework (seed; regenerated per lens by the synchronizer).
    │   └── wellarchitected_best_practices.csv  ← Same data as CSV (307 rows).
    ├── backend/                                ← NestJS API (port 3000). Controllers are mounted at bare paths; nginx/Vite strip the `/api` prefix.
    │   ├── package.json                        ← Scripts: build (nest build), start:dev (watch), lint (no config → fails). Pinned deps.
    │   ├── package-lock.json
    │   ├── nest-cli.json                       ← sourceRoot src, deleteOutDir.
    │   ├── tsconfig.json                       ← CommonJS/ES2021, decorators, lenient strictness.
    │   ├── tsconfig.build.json                 ← Excludes tests/dist.
    │   └── src/
    │       ├── main.ts                         ← Bootstrap: trust proxy, 100 MB body parsers, requestGuardMiddleware, CORS (FRONTEND_URL), global ValidationPipe, listen 3000.
    │       ├── app.module.ts                   ← Root module: global ConfigModule(configuration), ThrottlerModule 100 req/60 s (in-memory) as APP_GUARD, feature modules.
    │       ├── config/
    │       │   ├── configuration.ts            ← Env → config tree (auth, storage, aws.{region,s3,bedrock,ddb}, language.output, analysis.batchSize).
    │       │   └── aws.config.ts               ← AwsConfigService: factories for S3, BedrockRuntime, WellArchitected, BedrockAgentRuntime, DynamoDB clients (region from config).
    │       ├── modules/
    │       │   ├── analyzer/
    │       │   │   ├── analyzer.module.ts      ← Wires controller, service, gateway, AwsConfigService; imports StorageModule.
    │       │   │   ├── analyzer.controller.ts  ← `/analyzer`: analyze, generate-iac, get-more-details, cancel-iac-generation, cancel-analysis, chat. Resolves user from `x-amzn-oidc-data`.
    │       │   │   ├── analyzer.service.ts     ← CORE (~3.1k lines): analysis pipeline, batching, retries, KB retrieval, model parameter shaping, JSON parsing/sanitizing, IaC generation loop, details generation, chat.
    │       │   │   └── analyzer.gateway.ts     ← Socket.IO gateway (`/socket.io/`), emits `analysisProgress` and `implementationProgress`; @SkipThrottle.
    │       │   ├── auth/
    │       │   │   ├── auth.module.ts
    │       │   │   └── auth.controller.ts      ← `/auth`: config, user-info (decodes ALB OIDC headers / dev mode / disabled), logout (expires AWSELBAuthSessionCookie-0/1, returns sign-out URL).
    │       │   ├── report/
    │       │   │   ├── report.module.ts
    │       │   │   ├── report.controller.ts    ← `/report`: generate (WA Tool PDF report as base64), recommendations (CSV).
    │       │   │   └── report.service.ts       ← GetLensReviewReport wrapper; 13-column CSV builder (incl. criticality/complexity/priority + reasons).
    │       │   ├── storage/
    │       │   │   ├── storage.module.ts       ← Multer (100 MB) + StorageService export.
    │       │   │   ├── storage.controller.ts   ← `/storage/work-items/*`: uploads (main + supporting), list/get/delete work items, content/analysis/IaC/chat-history download, update, chat-history CRUD. Magic-byte validation on uploads.
    │       │   │   └── storage.service.ts      ← DynamoDB + S3 persistence: user-id hashing, S3 key layout, work item CRUD/merge, per-lens results/IaC/supporting docs, chat history, zip/multi-file/PDF intake via ProjectPacker.
    │       │   └── well-architected/
    │       │       ├── well-architected.module.ts
    │       │       ├── well-architected.controller.ts  ← `/well-architected`: lens-metadata, review/:id, risk-summary, milestone, answer/:id, associate-lens/:id, workload/create, workload/:id (DELETE), workloads.
    │       │       └── well-architected.service.ts    ← WA Tool SDK wrapper (list answers, update answers with ChoiceUpdates, milestones, risk summary, create/delete/list workloads with naming + tags) and LensMetadataTable scan.
    │       ├── prompts/                        ← All LLM prompt text. Re-exported via index.ts and imported as `* as Prompts`.
    │       │   ├── index.ts                    ← Barrel export.
    │       │   ├── system-prompts.ts           ← System prompts: buildSystemPrompt (IaC), buildProjectSystemPrompt, buildImageSystemPrompt, buildPdfSystemPrompt, details/IaC-generation variants, shared prioritization framework block. Defines the JSON response contract.
    │       │   ├── analysis-prompts.ts         ← User prompts for analysis: buildPrompt (IaC, embeds <uploaded_document>), buildProjectPrompt (<uploaded_project>), buildImagePrompt; <best_practices_json>, <kb>, <supporting_document> blocks.
    │       │   ├── details-prompts.ts          ← buildDetailsPrompt / buildImageDetailsPrompt for "Get more details".
    │       │   ├── iac-generation-prompts.ts   ← buildIacGenerationPrompt (previous sections, recommendations, supporting doc).
    │       │   ├── knowledge-base-prompts.ts   ← KB input prompt + RetrieveAndGenerate prompt template producing **Risk Level** and **Technical Relevancy score:** per best practice.
    │       │   ├── chat-prompts.ts             ← buildChatSystemPrompt (Analyzer Assistant persona + analysis JSON context).
    │       │   └── languages.ts                ← Backend SUPPORTED_LANGUAGES (en, ja, ko, es, pt_BR, fr) + getLanguageName helpers used for "respond in X" instructions.
    │       └── shared/
    │           ├── dto/
    │           │   └── analysis.dto.ts         ← FileUploadMode enum, AnalyzeRequestDto (class-validator), GenerateReportDto, CreateMilestoneDto, IaCTemplateType (3 values), MultipleFilesUploadDto.
    │           ├── interfaces/
    │           │   ├── analysis.interface.ts   ← AnalysisResult, BestPractice (+ Criticality/Complexity/Priority level types), RiskSummary, QuestionGroup.
    │           │   ├── storage.interface.ts    ← WorkItem / WorkItemUpdate (per-lens Record maps), LensInfo, WorkloadIdInfo, S3Locations, StorageConfig.
    │           │   └── project-file.interface.ts  ← ProjectFile, PackedProject.
    │           ├── middleware/
    │           │   └── request-guard.middleware.ts  ← Rejects cross-site `Sec-Fetch-Site`; requires `X-Requested-With: XMLHttpRequest` on non-safe methods (socket.io polling exempt).
    │           └── utils/
    │               ├── file-validator.ts       ← Magic-byte validation for pdf/png/jpeg/zip; UTF-8 sanity for text IaC extensions (yaml, yml, json, tf, ts, py, go, java, cs, txt).
    │               └── project-packer.ts       ← Safe zip extraction + single-file "packed" text (limits: 500 MB total, 10k files, 20 MB/file, 1000:1 ratio, ≤5 nested archives, path checks, symlink skip, 60 s timeout); ~4 chars/token estimate, 200k-token warning.
    └── frontend/                               ← Vite + React 19 + Cloudscape SPA.
        ├── package.json                        ← Scripts: dev (vite), build (`tsc -b && vite build`), lint (no config → fails), preview. Pinned deps.
        ├── package-lock.json
        ├── index.html                          ← SPA shell, favicon /aws-wa-logo.png, mounts src/main.tsx.
        ├── vite.config.ts                      ← Dev server :8080, polling watch, proxies `/api` (rewrite → strip prefix) and `/socket.io` (ws) to `http://backend:3000`; build target es2020 with sourcemaps.
        ├── tsconfig.json                       ← Project references → tsconfig.app.json + tsconfig.node.json.
        ├── tsconfig.app.json                   ← Strict app config (ES2020, bundler resolution, noEmit, noUnusedLocals/Parameters).
        ├── tsconfig.node.json                  ← Config for vite.config.ts (and a non-existent vitest.config.ts).
        ├── public/
        │   ├── aws-wa-logo.png                 ← Logo used by TopNavigation, favicon, chat button/header.
        │   └── chat-gradient.svg               ← Chat button loading gradient asset (referenced from chat/styles.css).
        └── src/
            ├── main.tsx                        ← createRoot + StrictMode, imports index.css.
            ├── App.tsx                         ← Provider tree (AuthProvider → LanguageProvider → HelpPanelProvider → ChatProvider), TopNavigation (user menu + language menu), AppLayout with WorkSideNavigation, HelpPanel; bridges side-nav selection to the analyzer via `workItemSelected`/`loadComplete` DOM events.
            ├── App.css                         ← Vite scaffold leftover; not imported anywhere.
            ├── index.css                       ← Global base styles (Vite scaffold, imported by main.tsx).
            ├── vite-env.d.ts                   ← Vite client types + `VITE_API_URL` typing (env var is set by compose/CDK but not read in code).
            ├── assets/
            │   └── react.svg                   ← Vite scaffold leftover; unreferenced.
            ├── contexts/
            │   ├── AuthContext.tsx             ← Fetches /api/auth/config + /api/auth/user-info; exposes authState + logout (POST /api/auth/logout → redirect).
            │   ├── LanguageContext.tsx         ← Current UI language (localStorage `wa-analyzer-language`, legacy `preferredLanguage`), `strings` object, helpers; falls back to English strings.
            │   └── HelpPanelContext.tsx        ← Tools/help panel open state + content.
            ├── hooks/
            │   └── useAnalyzer.ts              ← All analysis/WA Tool API state: analyze (temp workload lifecycle, NETWORK_INTERRUPTION detection), cancel, updateWorkload (answers + milestone + risk summary + workloadIds persistence), deleteWorkload, generateReport (PDF), downloadRecommendations (CSV), refreshSummary; subscribes to `analysisProgress` socket events.
            ├── i18n/
            │   ├── languages.ts                ← SUPPORTED_LANGUAGES (en default, ja, ko, es, pt_BR, fr), LanguageCode type, helpers.
            │   └── strings.ts                  ← I18nStrings interface (19 sections) + full translations for en, ja, es, pt_BR, fr, ko (~3.4k lines).
            ├── services/
            │   ├── api.ts                      ← axios (`baseURL: '/api'`, `X-Requested-With`, no timeout) — analyzer, well-architected, report endpoints; converts network drops into `NETWORK_INTERRUPTION:`-prefixed errors.
            │   ├── storage.ts                  ← axios (`baseURL: '/api/storage'`) — uploads (multipart), work item list/get/delete, downloads (original, supporting doc, chat history), analysis/IaC fetch, chat-history CRUD.
            │   └── socket.ts                   ← Socket.IO client singleton (same origin, path `/socket.io/`), onAnalysisProgress / onImplementationProgress subscriptions.
            ├── types/
            │   ├── index.ts                    ← Frontend domain types: BestPractice/AnalysisResult (+ level types), UploadedFiles, FileUploadMode, IaCTemplateType (8 values incl. 5 CDK languages), WorkItem (per-lens maps), LensMetadata, RiskSummary*, WorkItemResponse.
            │   └── auth.ts                     ← UserProfile, AuthState.
            └── components/
                ├── WellArchitectedAnalyzer.tsx  ← The single stateful screen (~1.5k lines): upload → pillar selection → Optional Settings tabs (lens, output language, supporting doc, WA Tool workload, IaC type) → Start/Cancel review → progress → current work item/lens/status panel → result Tabs (analysis | priorities | wat | diff) → Chat. Handles work-item loading per lens.
                ├── WorkSideNavigation.tsx      ← "My Work Items" SideNavigation: per item lens badges (status colours), load results, download original, chat-history download/delete, delete item (modals); exposes `loadWorkItems` via ref.
                ├── FileUpload.tsx              ← Main upload control: mode SegmentedControl (single/multiple, zip project, PDFs), client-side type/size/count validation, multipart POST, returns UploadedFiles + fileId.
                ├── SupportingDocumentUpload.tsx  ← Single supporting doc (pdf/txt/png/jpg ≤ 4.5 MB) + required description, tied to active work item + lens ARN.
                ├── PillarSelector.tsx          ← Multiselect of pillars for the selected lens.
                ├── LensSelector.tsx            ← Select populated from GET /well-architected/lens-metadata (WA Framework first, then alphabetical); defaults to WA Framework.
                ├── WorkloadIdInput.tsx         ← Select of existing WA Tool workloads (`IaCAnalyzer_*`, temp/scratch ones filtered out) or "none".
                ├── IaCTemplateSelector.tsx     ← Select of IaCTemplateType for diagram → IaC generation.
                ├── AnalysisResults.tsx         ← Cloudscape Table with property filter/pagination/preferences, summary KPIs, badges for priority/criticality/complexity, doc links, "Get more details" (multi-select), "Generate IaC document" (images only), CSV download, per-row "ask assistant".
                ├── PrioritiesView.tsx          ← Priorities tab: KPI + two donut charts, Eisenhower matrix plot (deterministic dot layout, pillar/priority colouring, pillar filter chips), detail side panel with "Ask assistant".
                ├── PrioritiesView.css          ← Matrix/legend/tooltip styles.
                ├── RiskSummary.tsx             ← WA Tool tab: workload id + console link, KPIs, per-pillar risk table, "Complete review" dropdown (generate report / delete workload w/ confirm), refresh.
                ├── DocumentView.tsx            ← Generated IaC document viewer (Cloudscape CodeView, yaml/json highlight), copy + download.
                ├── DetailsModal.tsx            ← Markdown modal for "Get more details" output with copy/download (.md).
                ├── UserMenu.tsx                ← `useUserMenuUtilities` hook → TopNavigation user dropdown with Sign out (hidden when auth disabled).
                ├── chat/                       ← Analyzer Assistant.
                │   ├── index.tsx               ← `<Chat>` = ChatButton + ChatWindow, rendered only once analysis results exist.
                │   ├── ChatContext.tsx         ← ChatProvider: messages, send (POST /analyzer/chat), history load/store/download/delete, pending prompt + support prompts, listens for `chatHistoryDeleted` DOM event.
                │   ├── ChatWindow.tsx          ← Draggable/resizable (react-rnd) window, PromptInput, SupportPromptGroup, expand/collapse; exposes `__setSupportPrompts` on `[data-component="chat-window"]`.
                │   ├── ChatMessage.tsx         ← Cloudscape ChatBubble with Markdown rendering + copy action.
                │   ├── ChatButton.tsx          ← Floating launcher button with loading gradient.
                │   ├── types.ts                ← ChatMessage, ChatContextType, Message, SupportPrompt.
                │   ├── styles.css              ← Chat window/button/animation styles.
                │   └── utils/
                │       ├── common-components.tsx  ← ChatBubbleAvatar, ScrollableContainer, Actions (copy).
                │       └── config.tsx          ← AUTHORS map, FileTokenGroup i18n strings.
                └── utils/
                    ├── HelpButton.tsx          ← Inline "?" button opening the help panel with a contentId.
                    ├── help-content.tsx        ← `useHelpContent()` → localized help panel content for every contentId.
                    ├── CopyButton.tsx          ← Clipboard copy with execCommand fallback for non-HTTPS contexts.
                    ├── CodeBlock.tsx           ← react-markdown code renderer (Prism, IaC language aliases).
                    ├── CodeBlock.css           ← Code block styles.
                    ├── LanguageSelector.tsx    ← Alternative language dropdown/toggle components; currently not imported anywhere (language menu lives in App.tsx).
                    ├── priority-matrix.ts      ← Pure helpers for the Priorities tab: flatten, hasPrioritizationData, quadrant mapping, deterministic non-overlapping layout, distributions, colour maps, doc URLs.
                    └── table-configs/
                        └── analysis-table-config.ts  ← Localized PropertyFilter properties/i18n + pagination labels for AnalysisResults.
```

---

## 4. Runtime architecture

### 4.1 Request path (deployed)

```
Browser ──HTTPS──▶ ALB (Cognito/OIDC authenticate action, TLS 1.3, idle 3600 s, access logs)
                    │  injects x-amzn-oidc-data / x-amzn-oidc-identity, AWSELBAuthSessionCookie-*
                    ▼
        Frontend Fargate task (public/private per config) — nginx :8080
          ├─ /            → SPA (dist/) with no-cache headers; /healthz falls through to index.html (ALB health check)
          ├─ /api/(.*)    → http://backend.internal:3000/$1   (prefix stripped)
          ├─ /socket.io/  → http://backend.internal:3000      (websocket upgrade only)
          └─ /health      → 200 "healthy" (container HEALTHCHECK)
                    ▼  ECS Cloud Map private DNS namespace "internal", service "backend"
        Backend Fargate task (private subnets, NAT egress) — NestJS :3000
          ├─ Bedrock Runtime (Converse)  ├─ Bedrock Agent Runtime (KB RetrieveAndGenerate)
          ├─ Well-Architected Tool API   ├─ DynamoDB (work items, lens metadata)
          └─ S3 (analysis storage, WA docs / best-practice lists)
```

Locally, the Vite dev server (`vite.config.ts`) plays nginx's role, proxying `/api` and `/socket.io`
to the compose service `backend:3000`. Controllers are therefore mounted at **bare paths**
(`/analyzer`, `/storage`, `/well-architected`, `/report`, `/auth`) while the frontend always calls
`/api/...`.

### 4.2 Identity

There is no application-level login.

- **Auth enabled (prod):** the ALB authenticates and forwards `x-amzn-oidc-data` (JWT). Controllers
  decode the payload segment (`split('.')[1]`, base64) and read `email`. No signature verification is
  performed in the app — the ALB is the trust boundary and the backend is not reachable directly.
- **Dev mode:** `AUTH_ENABLED=true` + `AUTH_DEV_MODE=true` + `AUTH_DEV_EMAIL` → fixed email
  (`dev-user@example.com` in compose).
- **Auth disabled:** everything runs as the literal user `iac-analyzer` (shared profile; user menu hidden).
- **User id:** `StorageService.createUserIdHash(email)` = SHA-256 of trimmed, lower-cased email.
  This is the DynamoDB partition key and S3 prefix. Every controller repeats the
  `getUserEmail(header) → userId hash` pattern — follow it, don't invent a new one.
- **Logout:** `POST /auth/logout` expires `AWSELBAuthSessionCookie-0/1` and returns `AUTH_SIGN_OUT_URL`
  (built by CDK: Cognito `/logout?client_id=…&logout_uri=…` or the OIDC logout URL).

### 4.3 Backend HTTP API (all JSON unless noted; user derived from `x-amzn-oidc-data`)

Global: `@nestjs/throttler` 100 req/min per source (in-memory — single-task semantics), body limit
100 MB, `requestGuardMiddleware` (see §9), CORS origin = `FRONTEND_URL`, global `ValidationPipe`.

| Method & path | Throttle | Purpose |
|---------------|----------|---------|
| `POST /analyzer/analyze` | 5/min | Run analysis (`AnalyzeRequestDto`). Persists `workloadIds[lens]` as protected when a user-provided workload is used. Returns `{results, isCancelled, error?, fileId}`. |
| `POST /analyzer/generate-iac` | 5/min | Generate IaC from a diagram work item (`fileId, recommendations, templateType, lensAliasArn, lensName, outputLanguage`). |
| `POST /analyzer/get-more-details` | 5/min | Markdown deep-dive for selected not-applied best practices. |
| `POST /analyzer/cancel-analysis` | 100/min | Fires the **process-global** `cancelAnalysis$` subject. |
| `POST /analyzer/cancel-iac-generation` | 100/min | Fires the **process-global** `cancelGeneration$` subject. |
| `POST /analyzer/chat` | 20/min | Analyzer Assistant turn (`fileId, message, lensName, lensAliasArn`). Requires analysis COMPLETED/PARTIAL for that lens. |
| `POST /storage/work-items/upload-files` (multipart `files[]`, `mode`) | 10/min | Create a work item for single/multiple/zip/pdf uploads. Magic-byte validated. Returns `{fileId, tokenCount?, exceedsTokenLimit?}`. |
| `POST /storage/work-items/upload-supporting` (multipart `file`, `description`, `mainFileId`, `lensAliasArn`) | 10/min | Attach a supporting document to a work item + lens. |
| `GET /storage/work-items` | — | List the caller's work items. |
| `POST /storage/work-items/get` (`{fileId, lensAliasArn?}`) | — | Work item + original content + per-lens analysis/IaC/supporting-doc info. |
| `DELETE /storage/work-items/:fileId` | — | Delete DynamoDB item and every S3 object under `{userId}/{fileId}`. |
| `POST /storage/work-items/:fileId/update` | — | Partial `WorkItemUpdate` merge (used for `workloadIds`). |
| `GET /storage/work-items/:fileId/content` | — | Download original upload (binary). |
| `GET /storage/work-items/:fileId/analysis/:lensAlias` | — | Analysis results JSON for a lens. |
| `GET /storage/work-items/:fileId/iac-document/:extension/:lensAlias` | — | Generated IaC text. |
| `GET /storage/work-items/:fileId/supporting-document/:supportingDocId/:lensAlias` | — | Download supporting doc. |
| `GET/POST/DELETE /storage/work-items/:fileId/chat-history` | — | Read / replace / delete chat history; `GET …/chat-history/download` streams JSON. |
| `GET /well-architected/lens-metadata` | — | Scan `LensMetadataTable` (drives LensSelector). |
| `GET /well-architected/workloads` | — | List WA Tool workloads with prefix `IaCAnalyzer_`. |
| `POST /well-architected/workload/create` (`{isTemp, lensAliasArn?}`) | — | Create temp or permanent workload (see naming in §7.3). |
| `DELETE /well-architected/workload/:workloadId` | — | Delete workload (IAM restricts to app-tagged workloads). |
| `POST /well-architected/associate-lens/:workloadId` | — | Associate a non-default lens. |
| `POST /well-architected/answer/:workloadId` | — | `UpdateAnswer` with SelectedChoices + ChoiceUpdates (NOT_APPLICABLE / UNSELECTED). |
| `POST /well-architected/milestone` | — | Create milestone. |
| `POST /well-architected/risk-summary` | — | Per-pillar answered/high/medium counts + region. |
| `GET /well-architected/review/:workloadId` | — | Raw `GetLensReview` (WA Framework lens only). |
| `POST /report/generate` | — | WA Tool lens review report PDF (base64 string). |
| `POST /report/recommendations` | — | CSV text from results array (13 columns). |
| `GET /auth/config`, `GET /auth/user-info`, `POST /auth/logout` | — | Auth bootstrap for the SPA. |

**WebSocket** (Socket.IO, path `/socket.io/`, `@SkipThrottle`, CORS `*`): server → client events
`analysisProgress {processedQuestions, totalQuestions, currentPillar}` and
`implementationProgress {status, progress}`. Events are broadcast to *all* connected clients.

### 4.4 Analysis pipeline (`AnalyzerService.analyze`)

1. **Load content** via `StorageService.getOriginalContent` by `uploadMode`:
   `single_file` → text or `data:image/…;base64` string; `multiple_files`/`zip_file` → packed text
   (`packed_content`), falling back to original; `pdf_file` → array of `{filename, buffer, size}`
   extracted from the stored zip (`application/pdf-collection`).
2. **Resolve the lens name** from `LensMetadataTable` by ARN (`resolveLensName`) — never trust the
   client-supplied `lensName`. Default lens alias is `wellarchitected`.
3. **Attach supporting document** (if `supportingDocumentId`) and record it in the work item's
   per-lens maps; add the lens to `usedLenses`; set `analysisStatus[lens]=IN_PROGRESS`, progress 0.
4. **Build question groups** per selected pillar (`retrieveBestPractices` → `loadBestPractices`):
   read `{lensId}/best_practices_list/{lensId}_best_practices.json` from the WA docs bucket, then
   `ListAnswers` on the workload to map question titles → `QuestionId` and
   `"{Question}|||{Best Practice}"` → `ChoiceId` (fallback: slugified ids). Pillar ids come from
   `lensPillars` (id → name) sent by the client.
5. **Batch** all `QuestionAnalysisTask`s in chunks of `BATCH_SIZE` (default 5). Each task:
   - `retrieveFromKnowledgeBase` → Bedrock KB `RetrieveAndGenerate` (10 results, metadata filter
     `lens_name` [+ `pillar` for the WA Framework], prompt template that yields **Risk Level** and
     **Technical Relevancy score** per best practice).
   - `analyzeQuestion` → `Converse` with the mode-specific system prompt and user prompt
     (`<uploaded_document>` / `<uploaded_project>` / image or PDF content blocks, `<best_practices_json>`,
     `<kb>`, optional `<supporting_document>`).
   - Both wrapped in `retryWithExponentialBackoff` (5 retries, 30 s → 60 → 120 → 240 → 480 s, only
     for throttling errors) and, for model calls, `sendAndParseModelResponse` (re-invokes up to 5×
     on JSON `SyntaxError`, 1 s × attempt back-off).
6. **After every batch**: emit `analysisProgress`, persist `analysisProgress[lens]` to the work item.
   Between batches, check `cancelAnalysis$` → store partial results, status `PARTIAL`, error
   "Analysis cancelled by user." Batch errors also store partials as `PARTIAL` and return an `error`.
7. **Parse**: model output is JSON inside `<json_response>` → `cleanJsonString` (strips tags, `<cite>`
   noise, whitespace, Python booleans) → `parseModelResponse` maps by index onto
   `bestPracticeIds`, forces `N/A` prioritization for not-relevant/applied items, runs
   `sanitizeCriticality/Complexity/Priority` and `truncateReason` (300 chars).
8. **Finish**: store `analysis/{lens}/analysis_results.json`, `analysisStatus[lens]=COMPLETED`,
   progress 100, clear error/partial flags.

Related flows in the same service:

- **`generateIacDocument`** (images only): loops `Converse` calls, each returning
  `# Section N - description` chunks until `<end_of_iac_document_generation>`; `<message_truncated>`
  means "continue". Sections are sorted by number and joined; partials are stored on cancel/error.
  Races each model call against `cancelGeneration$`. Stored under `iac_templates/{lens}/generated_template.{yaml|json|tf}`.
- **`getMoreDetails`**: per selected item (filtered to `relevant && !applied`), loops until
  `<end_of_details_generation>` (`<details_truncated>` → continue; incomplete trailing `#` section is
  dropped). Text/IaC, image and PDF variants; supporting doc attached when present. Emits
  `implementationProgress`.
- **`chat`**: system prompt embeds the stored analysis results; last 25 history messages replayed;
  file content (text ≤ 500k chars, image, or ≤5 PDFs) attached to the user turn; history appended
  to `chat_history.json` and `hasChatHistory` set.

### 4.5 Model-specific request shaping (`getModelParameters`) — most fragile area

Detection is by **substring match on `MODEL_ID`**. Order of evaluation matters — `claude-fable-5` is a
substring of `claude-fable-5-1`, so `isFable51()` is checked first and `isFable5()` excludes it; a future
`claude-opus-5-1` would likewise collide with `isOpus5()`.

| Predicate (substring) | `thinking` | `output_config.effort` | `maxTokens` | Sampling params | 1M context |
|-----------------------|-----------|------------------------|-------------|-----------------|------------|
| `isFable51` (`claude-fable-5-1`) | *omitted* (always-on adaptive; cannot be disabled) | `high` | 64000 | none | native |
| `isFable5` (`claude-fable-5`, excluding `-5-1`) | *omitted* (always-on adaptive; sending it errors) | `high` | 32000 | none | native |
| `isSonnet5` (`claude-sonnet-5`, does **not** match `sonnet-4-5`) | *omitted* | `high` | 64000 (new tokenizer ≈ +30 % tokens) | none | `anthropic_beta: ["context-1m-2025-08-07"]` when `EXTENDED_CONTEXT_WINDOW=true` |
| `isOpus5` (`claude-opus-5`) | `{type: "adaptive"}` (on by default; disabling only allowed at effort ≤ high) | `high` (Anthropic: re-sweep, don't carry over 4.7/4.8's xhigh) | 64000 | none | native |
| `isOpus47` / `isOpus48` | `{type: "adaptive"}` | `xhigh` | 32000 | none | native |
| `supportsAdaptiveThinking` (`opus-4-7`, `opus-4-6`, `sonnet-4-6`) | `{type: "adaptive"}` | `high` | 32000 | none | beta header when enabled |
| `supportsExtendedThinking` (`3-7-sonnet`, `haiku-4-5`, `sonnet-4-5`, `opus-4-5`, `opus-4-6`, `sonnet-4-6`) | `{type: "enabled", budget_tokens: 8000}` | — | 32000 | none | — |
| anything else (legacy) | — | — | 8192 | `temperature: 0.7` | — |

- **KB retrieval model** (`getKnowledgeBaseModelArn`): models not validated with `RetrieveAndGenerate`
  (`opus-4-7`, `opus-4-8`, `opus-5`, `fable-5`, `fable-5-1`, `sonnet-5`) fall back to
  `{us|eu|global}.anthropic.claude-sonnet-4-6` (prefix taken from `MODEL_ID`), and
  `kbModelForbidsSamplingParams` drops `temperature` from the KB generation config. Analysis itself
  still uses `MODEL_ID`.
- `prompts/system-prompts.ts` has its **own** `supportsExtendedThinking(modelId)` list (broader) used
  only to pick output-length guidance in details/IaC prompts.
- `sendAndParseModelResponse` fails fast (no JSON re-invoke) when `stopReason` is `content_filtered`,
  `guardrail_intervened` or `refusal` — Fable 5.1 / Opus 5 ship with blocking safety classifiers.
- **Claude Fable 5.1 is an Anthropic Covered Model**: the account must opt in to `aws_review` data
  retention or invocations fail; only `us.`/`global.` inference profiles exist for it.
- **Adding a model = add a predicate + branch here, update the KB allow-list, update the prompts list,
  update README/config.ini/CFN parameter descriptions.** Never fold a new model into an existing branch
  without checking the Bedrock API differences.

### 4.6 Prompts (`backend/src/prompts/`)

- System prompts define the exact JSON contract: `bestPractices[]` with `name, relevant, applied,
  reasonApplied, reasonNotApplied, recommendations, criticality, criticalityReason, complexity,
  complexityReason, priority, priorityReason`. Relevance rule: KB `**Technical Relevancy score:**`
  ≥ 7 ⇒ relevant. The shared `<prioritization_framework>` block (Criticality from KB **Risk Level**;
  Complexity Low/Medium/High heuristic; Priority Immediate 0–30 d / Short-term 30–90 d / Long-term
  90–180 d via Eisenhower rules) is appended to every analysis system prompt.
- Long-form content is placed **first** in the user message (`<uploaded_document>` / `<uploaded_project>`),
  followed by `<best_practices_json>`, `<kb>`, `<supporting_document>`.
- Output language: non-English `outputLanguage` adds an instruction to answer in that language while
  keeping best-practice names/AWS terms in English (`prompts/languages.ts` maps codes → names).
- Prompts use XML-like tags and carry `// nosemgrep: html-in-template-string` comments plus the
  `.semgrepignore` entry — keep both when editing.
- **If you rename/add a JSON field**, update together: the prompts, backend `BestPractice`/
  `AnalysisResult` interfaces, `parseModelResponse` + sanitizers, `frontend/src/types`, the
  `AnalysisResults` table columns/preferences, `priority-matrix.ts`, and `ReportService` CSV columns.

### 4.7 Storage model (`StorageService`)

**DynamoDB `AnalysisMetadataTable`** — pk `userId` (email hash), sk `fileId` (SHA-256 of
`fileName + Date.now()`). One `WorkItem` per upload:

```
fileName, fileType, uploadDate, s3Prefix, lastModified, uploadMode, hasChatHistory,
tokenCount, exceedsTokenLimit, tags?, workloadId? (legacy)
usedLenses: [{lensAlias, lensName, lensAliasArn}]
workloadIds: { [lensAlias]: {id, protected, lastUpdated} }
analysisStatus / analysisProgress / analysisError / analysisPartialResults: { [lensAlias]: … }
iacGenerationStatus / iacGenerationProgress / iacGenerationError / iacGeneratedFileType / iacPartialResults: { [lensAlias]: … }
supportingDocumentId / Added / Description / Name / Type: { [lensAlias]: … }
```

`WorkItemStatus = NOT_STARTED | IN_PROGRESS | COMPLETED | FAILED | PARTIAL`. **Everything is keyed by
`lensAlias`** (the last ARN segment, e.g. `wellarchitected`, `serverless`, a custom lens id). Always
merge: `{ ...(workItem.x || {}), [lensAlias]: value }` — never replace a map. `updateWorkItem` writes
whole maps with `SET`, so callers must pass the merged map.

**S3 `AnalysisStorageBucket`** — under `{userId}/{fileId}/`:

```
metadata.json                                 (single-file uploads only)
original_content                              (raw file; zip for multi/zip/pdf uploads)
packed_content                                (single-file packed text for multi/zip)
chat_history.json
analysis/{lensAlias}/analysis_results.json
iac_templates/{lensAlias}/generated_template.{yaml|json|tf}
supporting_documents/{lensAlias}/{docId}  and  {docId}_metadata.json
```

**DynamoDB `LensMetadataTable`** — pk `lensAlias` = **full lens ARN**; attributes `lensName`,
`lensDescription`, `lensPillars` (pillarId → name), `pdfUrl`, `uploadDate`, `lensAuthor`
(`"AWS"` | `"custom"`). Written by the KB synchronizer; read by `getLensMetadata` and `resolveLensName`.

`lambda_migration/migration.py` converts pre-April-2025 single-lens items/paths into the maps/paths
above; it runs once on stack creation (custom resource with a fixed physical id).

### 4.8 Lenses & the Knowledge Base

- **WA docs bucket** (`wafr-accelerator-kb-docs`, KB data source) layout:
  ```
  wellarchitected/<pillar>.pdf + <pillar>.pdf.metadata.json      (6 pillar PDFs; metadata has "pillar")
  wellarchitected/best_practices_list/wellarchitected_best_practices.{json,csv}
  <lensId>/<lens>.pdf + .metadata.json                            (15 official lenses)
  <lensId>/best_practices_list/<lensId>_best_practices.{json,csv}
  <customLensId>/<your.pdf> (uploaded by admin) + .metadata.json  (created by synchronizer, lens_author=custom)
  <customLensId>/best_practices_list/<customLensId>_best_practices.{json,csv}
  ```
  `*.metadata.json` = `{"metadataAttributes": {lens_name, lens_arn, lens_author, pillar?}}`. These are
  **exactly** the keys `retrieveFromKnowledgeBase` filters on — metadata shape and retrieval filter must
  change together.
- **`kb_synchronizer.py`** runs on every `cdk deploy` (custom resource whose physical id embeds a
  deploy timestamp) and weekly (EventBridge cron, Mondays 00:00 UTC). Steps: delete temp workloads
  (`DO_NOT_DELETE_temp_IaCAnalyzer_*`) older than 24 h → process WA Framework (upgrade lens review,
  dump best practices) → 15 official lenses (download PDF, associate with scratch workload, dump, store
  metadata, disassociate) → custom lenses from SSM → `StartIngestionJob`. Timeout 15 min.
- **Custom lenses**: SSM `/wa-iac-analyzer/{region}/custom-lenses` (Advanced tier, default `[]`) holds
  `[{lensName, lensArn, lensDescription, fileNameWithExtension, s3Prefix?}]`. Full procedure and removal
  steps in `custom_lenses_use_case/README.md`.
- **Vector store** (`config.ini vector_store_type`): `s3_vectors` (default; `CfnVectorBucket` +
  `CfnIndex` 1024-dim euclidean, hand-rolled KB role, `CfnKnowledgeBase`/`CfnDataSource` with
  hierarchical chunking 2000/800/60) or `opensearch_serverless` (`bedrock.VectorKnowledgeBase` +
  `S3DataSource` from generative_ai_cdk_constructs). Both implemented in `wa_genai_stack.py` **and**
  duplicated in `local_development/kb_storage_stack.py` — change both.

### 4.9 Frontend architecture

- **Providers** (`App.tsx`): `AuthProvider` → `LanguageProvider` → `HelpPanelProvider` → `ChatProvider`.
  `ChatProvider` receives the active `fileId`, `lensName`, `lensAliasArn` from App state.
- **Screen**: `WellArchitectedAnalyzer.tsx` owns upload/lens/pillar/settings state and the results
  tabs `analysis | priorities | wat | diff`; `useAnalyzer.ts` owns API/analysis/WA Tool state and the
  socket subscription; `services/api.ts` + `services/storage.ts` are the only places HTTP calls are
  defined.
- **Side navigation ↔ analyzer handshake** is DOM-event based, not props: App dispatches
  `CustomEvent('workItemSelected', {detail: {workItem, lensAliasArn}})` on
  `[data-testid="well-architected-analyzer"]` and awaits a bubbled `loadComplete` event. Other DOM
  couplings: `chatHistoryDeleted` on `document`, and `__setSupportPrompts` attached to
  `[data-component="chat-window"]`.
- **Work item load** (`handleWorkItemSelect`): `POST /storage/work-items/get` with the lens ARN, then
  restores upload state, supporting doc, analysis results, IaC document, workload id/protection and
  refreshes the WA Tool risk summary.
- **Analysis lifecycle** (`useAnalyzer.analyze`): creates a **temporary WA workload** when none is
  selected (`createWorkload(true, lens)`), associates the lens on user-provided workloads, calls
  `/analyzer/analyze`, and deletes the temp workload in `finally`. Network drops surface as
  `NETWORK_INTERRUPTION:`-prefixed errors → the UI shows "your analysis is still running; load it from
  the side navigation" (preserve this prefix contract).
- **WA Tool "Complete review"** (`updateWorkload`): creates a permanent workload if needed
  (`IaCAnalyzer_…`), associates lens, `UpdateAnswer` per question (applied → SelectedChoices,
  not-relevant → NOT_APPLICABLE, not-applied → UNSELECTED), creates milestone
  `Review completed on <ISO>`, fetches risk summary, persists `workloadIds[lens]`. Only tool-created
  (non-protected) workloads can be deleted from the UI.
- **Client-side limits** (`FileUpload.tsx`): IaC/zip ≤ 100 MB, images ≤ 3.75 MB (one image, not mixed
  with other files), PDFs ≤ 5 × 4.5 MB; accepted `.yaml .yml .json .tf .png .jpg .jpeg .zip .ts .py .go .java .cs`.
- **Download filename conventions**: `IaCAnalyzer_{lens}_Analysis_Results_{file}.csv`,
  `IaCAnalyzer_Review_Report_{lens}_{file}.pdf`, `IaCAnalyzer_{lens}_Recommendation_Details_{file}.md`,
  `IaCAnalyzer_{lens}_Generated_IaC_Doc_{file}{ext}`, `chat_history_{file}.json`.
- **Priorities tab** math is pure and isolated in `components/utils/priority-matrix.ts`:
  quadrant = (impactHigh: criticality High|Medium) × (lowEffort: complexity Low|Medium) →
  `quick-wins | major-initiatives | delegate | reconsider`; deterministic per-cell grid layout so dots
  never overlap; `hasPrioritizationData()` disables the tab for legacy analyses — keep that check.
- **i18n**: six languages `en` (default), `ja`, `ko`, `es`, `pt_BR` (underscore!), `fr`. Adding one =
  edit exactly `frontend/src/i18n/languages.ts`, `frontend/src/i18n/strings.ts` (implement the whole
  `I18nStrings` interface — 19 sections) and `backend/src/prompts/languages.ts`. Language preference
  persists in localStorage (`wa-analyzer-language`, legacy `preferredLanguage`).

---

## 5. Infrastructure (CDK `WAGenAIStack`) — what gets created

| Area | Resources / notes |
|------|-------------------|
| Config | `config.ini` parsed with `configparser` in `__init__`; `AUTO_CLEANUP` / `DEPLOYMENT_STACK_NAME` env vars (set by `deploy-wa-analyzer.sh -a`) enable the cleanup Lambda. Container image platform follows the **host CPU** (`platform.machine()` → amd64/arm64) for both Fargate runtime and Docker build args. |
| Storage | `S3AccessLogsBucket` (365-day lifecycle), `AnalysisStorageBucket`, WA docs bucket (all SSE-S3, block public, enforce SSL, `RemovalPolicy.DESTROY` + auto-delete), `AnalysisMetadataTable` (userId/fileId), `LensMetadataTable` (lensAlias) — both PAY_PER_REQUEST with PITR. `BucketDeployment` seeds `well_architected_docs/` → `wellarchitected/`. |
| KB | S3 Vectors (default) or OSS variant (§4.8). |
| WA Tool | `TestWorkload` custom resource (`DO-NOT-DELETE_WAIaCAnalyzerApp_{region}_{rand}`) used by the synchronizer; deleted on stack delete. |
| Lambdas | `KbLambdaSynchronizer` (+ role, weekly rule, `KbLambdaTrigger` CR that re-invokes on every deploy), `MigrationLambda` (+ `MigrationTrigger` CR, create-only), optional `StackCleanupLambda` + EventBridge rule (`source: iac.analyzer.deployment`, `detail-type: Stack Cleanup Request`, `detail.stack-name`). All bundled with `pip install -r requirements.txt` in the runtime's bundling image. |
| SSM | `CustomLensesParameter` `/wa-iac-analyzer/{region}/custom-lenses`. |
| Network | VPC `10.0.0.0/16`, 2 AZs, 1 NAT, public + private-with-egress subnets; ECS cluster with Container Insights v2; Cloud Map private namespace `internal`. Security groups: ALB → frontend :8080, frontend → backend :3000. |
| Frontend service | `ApplicationLoadBalancedFargateService` (image asset `finch/frontend.Dockerfile`, port 8080, `public_load_balancer` from config, `min_healthy_percent=100`). With auth: ACM cert, HTTPS + HTTP→HTTPS redirect, `SslPolicy.TLS13_13`, listener default action replaced by `AuthenticateCognitoAction` or `authenticate_oidc` (`DefaultAuth`). ALB attributes: idle timeout 3600 s, drop invalid headers, access logs to the logs bucket. Health check `/healthz`. |
| Cognito | `new-cognito`: `WAAnalyzerUserPool` (email sign-in, self-signup off, strong password policy), domain prefix with **new managed login** + `CfnManagedLoginBranding`, client with secret (id/access 2 h, refresh 1 day, code grant, `openid`). `existing-cognito`: imports pool/client/domain. `oidc`: reads Secrets Manager secret **`WAIaCAnalyzerOIDCSecret`** (must pre-exist in the region). |
| Backend service | `FargateTaskDefinition` with **task role `AppExecuteRole`** (WA Tool actions scoped by `aws:ResourceTag/WorkloadName` ∈ `DO_NOT_DELETE_temp_IaCAnalyzer_*`, `IaCAnalyzer_*`; Bedrock InvokeModel/Retrieve/RetrieveAndGenerate/GetInferenceProfile on foundation models, inference profiles and the KB; S3 RW on analysis bucket, R on docs bucket; DynamoDB RW on metadata table, R on lens table), container env (§6), Cloud Map name `backend`, private subnets. |
| Outputs | `FrontendURL`, `KnowledgeBaseID`, `WellArchitectedDocsS3Bucket`, `VpcId`, `PublicSubnetId`, `VectorStoreType`, `AuthenticationType`/`CognitoDomain` (when auth), `AnalysisStorageBucketName`, `AnalysisMetadataTableName`, `LensMetadataTableName`, `CustomLensesSSMParameter`, `S3AccessLogsBucketName`. |
| cdk_nag | `AwsSolutionsChecks(verbose=True)` on every synth; suppressions are a single list in `app.py` with written justifications (L1, IAM4, IAM5, S1, VPC7, ELB2, EC23, ECS2, COG2, COG3, COG8). Prefer fixing the resource; add a suppression there only with a reason. |

**CFN deployment stack** (`cfn_deployment_stacks/iac-analyzer-deployment-stack.yaml`): parameters
mirror `config.ini`; `Rules` enforce required combinations; an EC2 (`t3.xlarge`, AL2023, encrypted
50 GB gp3, EIP, no inbound SG rules, `AmazonSSMManagedInstanceCore`, least-privilege CDK bootstrap/
deploy policy) runs cfn-init configsets `01_setup_basic_logs … 07_cleanup`: install git/docker/
python3.13/aws-cli/CloudWatch agent, Node 24 via nvm, `npm i -g aws-cdk`; `update-config.sh`
sed-rewrites `config.ini`; `run-deployment.sh` clones **GitHub `main`** and runs
`./deploy-wa-analyzer.sh -r <region> -c docker -a <stackName>`; cfn-signal (2 h timeout); on success
sends the EventBridge cleanup event (twice) so the CDK-created cleanup Lambda deletes the deployer
stack. Logs: log group `iac-deployment-logs-{region}-{id}` (90 days, retained), streams
`{instance_id}-user-data` and `{instance_id}-deploy`. **Local edits are not deployed by this path.**

**`local_development/`**: `KBStorageStack` (`dev-wa-iac-analyzer-kb-storage-{region}`) deploys only
the WA docs bucket, KB, scratch workload, SSM param, synchronizer, and (unless `-c deploy_storage=false`)
the analysis bucket/table, and prints the outputs needed for `.env`.

---

## 6. Configuration parity

`config.ini [settings]` → `wa_genai_stack.py` → container env → `backend/src/config/configuration.ts`.

| `config.ini` | CDK variable | Container env (backend) | Backend config path | Also in |
|--------------|--------------|-------------------------|---------------------|---------|
| `model_id` | `model_id` | `MODEL_ID` | `aws.bedrock.modelId` | CFN `ModelId`, compose, README |
| `batch_size` | `batch_size` | `BATCH_SIZE` | `analysis.batchSize` (default 5) | CFN `BatchSize` (1–30), compose |
| `vector_store_type` | `vector_store_type` | — | — | CFN `VectorStoreType`, `local_development/cdk.json` context |
| `public_load_balancer` | `public_lb` | — | — | CFN `PublicLoadBalancer` |
| `authentication` | `auth_config.enabled` | `AUTH_ENABLED` | `auth.enabled` | CFN `Authentication` |
| `auth_type` | `auth_config.authType` | (drives `AUTH_SIGN_OUT_URL`) | `auth.signOutUrl` | CFN `AuthType` |
| `certificate_arn` | `auth_config.certificateArn` | — | — | CFN `CertificateArn` |
| `cognito_domain_prefix`, `callback_urls`, `logout_url` | `auth_config.cognito` | — | — | CFN `CognitoDomainPrefix`, `CallbackUrls`, `LogoutUrl` |
| `existing_user_pool_arn`, `existing_user_pool_client_id`, `existing_user_pool_domain`, `existing_cognito_logout_url` | `auth_config.cognito` | — | — | CFN `Existing*` |
| `oidc_issuer`, `oidc_client_id`, `oidc_authorization_endpoint`, `oidc_token_endpoint`, `oidc_user_info_endpoint`, `oidc_logout_url` | `auth_config.oidc` | — | — | CFN `Oidc*`; secret `WAIaCAnalyzerOIDCSecret` |
| `extended_context_window` (**not present in shipped config.ini**; fallback `False`) | `extended_context_window` | `EXTENDED_CONTEXT_WINDOW` | `aws.bedrock.extendedContextWindow` | not in CFN stack |

Other backend env: `AWS_REGION` (fallback `CDK_DEPLOY_REGION`), `WA_DOCS_S3_BUCKET`,
`KNOWLEDGE_BASE_ID`, `LENS_METADATA_TABLE`, `ANALYSIS_STORAGE_BUCKET`, `ANALYSIS_METADATA_TABLE`,
`STORAGE_ENABLED` (effectively always true — see §10), `FRONTEND_URL` (CORS), `AUTH_DEV_MODE`,
`AUTH_DEV_EMAIL`, `OUTPUT_LANGUAGE` (default `en`), `PORT` (default 3000).

Deploy-time env: `CDK_DEPLOY_REGION`, `CDK_DOCKER=docker|finch`, `AWS_ECR_IGNORE_CREDS_STORAGE=true`,
`AUTO_CLEANUP`, `DEPLOYMENT_STACK_NAME`.

**When adding or renaming a setting, update all of:** `config.ini` → `wa_genai_stack.py` → CFN
`Parameters` + `update-config.sh` sed block → `configuration.ts` → `finch-compose.dev.yaml` →
`local_development/kb_storage_stack.py` (if KB/storage) → `README.md` (+ this file).

---

## 7. Working in the repo

### 7.1 Local development (containers, hot reload)

1. Deploy backing resources: an existing full stack's outputs, or `cd local_development && cdk deploy`.
2. Create root `.env` with `AWS_REGION`, temporary `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/
   `AWS_SESSION_TOKEN`, `WA_DOCS_S3_BUCKET`, `LENS_METADATA_TABLE`, `KNOWLEDGE_BASE_ID`, `MODEL_ID`,
   `BATCH_SIZE`, `STORAGE_ENABLED=true`, `ANALYSIS_STORAGE_BUCKET`, `ANALYSIS_METADATA_TABLE`.
3. `npm run dev:up` (docker) or `npm run dev:up:finch` → frontend `http://localhost:8080`, backend
   `http://localhost:3000` (both bound to 127.0.0.1). `dev.sh -up` re-installs all dependencies
   (python venv, root/frontend/backend `npm install`) before starting. Auth is stubbed
   (`AUTH_DEV_MODE=true`, `dev-user@example.com`). Stop with `npm run dev:down[:finch]`.

### 7.2 Build / verify (run after every change to the relevant area)

```bash
# Backend type-check + compile (nest build → dist/)
cd ecs_fargate_app/backend && npm ci && npm run build

# Frontend type-check (strict) + bundle
cd ecs_fargate_app/frontend && npm ci && npm run build

# CDK synth with cdk_nag (from repo root)
python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
export CDK_DEPLOY_REGION=us-west-2 CDK_DOCKER=docker AWS_ECR_IGNORE_CREDS_STORAGE=true
cdk synth            # cdk_nag errors fail the synth; fix or suppress in app.py with a reason

# Lambdas (no tests) — at least byte-compile
python3 -m py_compile ecs_fargate_app/lambda_*/**.py
```

There are no unit tests; `npm run lint` fails in both packages (no eslint config). Don't claim a
change is verified unless the relevant `npm run build` / `cdk synth` passed.

### 7.3 Deploy / destroy (state-changing — confirm with the user first)

- Script: `./deploy-wa-analyzer.sh -r <region> -c docker|finch [-a <deployerStack>]`,
  `./destroy-wa-analyzer.sh -r <region> -c docker|finch`.
- Manual: `export CDK_DEPLOY_REGION=… CDK_DOCKER=… AWS_ECR_IGNORE_CREDS_STORAGE=true && cdk bootstrap && cdk deploy`.
- Stack name `WA-IaC-Analyzer-{region}-GenAIStack`. Prefer deleting via the CloudFormation console.
- WA Tool workload naming: CDK scratch `DO-NOT-DELETE_WAIaCAnalyzerApp_{region}_{rand}` (local dev:
  `…AppKB_…`), app temp `DO_NOT_DELETE_temp_IaCAnalyzer_{rand}` (auto-deleted after analysis / >24 h),
  permanent `IaCAnalyzer_{YYYYMMDD_HHMMSS}_UTC_{rand}`. Tags: `WorkloadName`, `CreatedBy=IaCAnalyzer`,
  `IsProtected`. IAM conditions depend on these prefixes — keep them in sync between
  `well-architected.service.ts`, `wa_genai_stack.py`, `kb_synchronizer.py`, `kb_storage_stack.py`
  and `WorkloadIdInput.tsx` (filter).

### 7.4 Common change recipes

| Task | Touch |
|------|-------|
| Add a Bedrock model | `analyzer.service.ts` (predicate + `getModelParameters` branch, `getKnowledgeBaseModelArn`, `kbModelForbidsSamplingParams`), `prompts/system-prompts.ts` `supportsExtendedThinking`, `config.ini` comments, CFN `ModelId` description, README |
| Add a UI/output language | `frontend/src/i18n/languages.ts`, `frontend/src/i18n/strings.ts`, `backend/src/prompts/languages.ts` (see `localization/README.md`) |
| Add a response field | §4.6 list (prompts, interfaces both sides, sanitizers, table config/columns, priority-matrix, CSV) |
| Add an HTTP endpoint | Controller (+ `@Throttle` if it calls Bedrock), service, `services/api.ts` or `services/storage.ts`, and the `getUserEmail → userId` pattern; the client must send `X-Requested-With: XMLHttpRequest` |
| Add a per-lens work item attribute | `storage.interface.ts` (`WorkItem`, `WorkItemUpdate`), `updateWorkItem` `mapFields`, `frontend/src/types/index.ts`, `migration.py` if it needs back-fill |
| Change KB metadata / filters | `kb_synchronizer.py` `create_metadata_json` **and** `retrieveFromKnowledgeBase` filter |
| Change KB/vector store infra | `wa_genai_stack.py` **and** `local_development/kb_storage_stack.py` |
| Add an official lens | `additional_lenses` list in `kb_synchronizer.py` (URL, pdfName, lensName, lensArn, description); README lens list |
| Add a config setting | §6 checklist |

---

## 8. Prioritization framework (data contract)

Per best practice with `relevant=true && applied=false` (otherwise all `"N/A"`):

- `criticality` ∈ High/Medium/Low — from the KB **Risk Level** (or inferred).
- `complexity` ∈ High/Medium/Low — remediation effort heuristic.
- `priority` ∈ Immediate/Short-term/Long-term — Eisenhower combination (High crit + Low/Medium
  complexity ⇒ Immediate; Medium/Medium or High/High ⇒ Short-term; Low crit or Medium/High ⇒ Long-term;
  security hot-spots always Immediate).
- `*Reason` ≤ 300 chars (backend truncates to 297 + `...`).
- Backend sanitizers accept case-insensitive values and `short term`/`long term` variants; anything
  else → `N/A`. Legacy analyses without these fields keep working (`hasPrioritizationData` gate).
- Frontend sort ranks: priority Immediate < Short-term < Long-term < N/A; levels High < Medium < Low < N/A.

---

## 9. Security & hardening in place (don't regress)

- `request-guard.middleware.ts`: 403 on `Sec-Fetch-Site` other than `same-origin`/`none`/absent;
  non-safe methods need `X-Requested-With: XMLHttpRequest` (socket.io polling exempt).
- Throttling: 100/min global; 5/min `analyze`, `generate-iac`, `get-more-details`; 20/min `chat`;
  10/min uploads.
- Uploads validated by magic bytes / UTF-8 plausibility (`file-validator.ts`); supporting docs limited
  to pdf/txt/png/jpeg ≤ 4.5 MB; PDFs ≤ 5 × 4.5 MB; Multer/nginx/body-parser 100 MB.
- `project-packer.ts` zip-slip/zip-bomb defenses (path validation, symlink skipping, size/count/ratio
  limits, nested archive cap, timeout, temp dir cleanup).
- Lens names come from `LensMetadataTable`, never from the client; `supportingDocId` must match the
  work item record for that lens.
- Containers run as non-root; ALB drops invalid headers; S3 buckets private/SSL-only/encrypted;
  IAM scoped by workload tags; VPC DNS resolver pinned in nginx.
- Never echo secret values; `WAIaCAnalyzerOIDCSecret` is referenced by name only.

---

## 10. Known quirks, inconsistencies and traps (verified in code)

1. **`IaCTemplateType` mismatch**: backend enum has 3 values (CFN YAML/JSON, Terraform); frontend has
   8 (adds CDK TypeScript/Python/Go/Java/C#). The backend accepts the string untyped;
   `buildIacGenerationSystemPrompt` detects CDK via `includes('AWS CDK')` and parses the language from
   `split('-')[1]`; the stored extension is always `yaml|json|tf` (`templateType.includes('yaml'|'json')`
  else `tf`), and `DocumentView` highlights only yaml/json. Adjust all of these if you touch template types.
2. **Cancellation is process-global**: `cancelAnalysis$` / `cancelGeneration$` are single RxJS Subjects —
   a cancel from any user cancels every in-flight run on that task. Throttler storage is in-memory too.
   Running more than one backend task changes semantics (needs Redis-style shared state + per-run ids).
3. **Health checks**: ALB targets `/healthz`, which nginx serves via the SPA fallback (`index.html`, 200);
   the explicit `/health` location is only used by the container `HEALTHCHECK`.
4. **`storage.enabled`** in `configuration.ts` is `process.env.STORAGE_ENABLED === 'true' || true` —
   always true; `STORAGE_ENABLED` is effectively ignored.
5. **`extended_context_window`** is read by the stack (fallback `False`) but absent from `config.ini`
   and from the CFN deployment stack parameters.
6. **Dead/unused code**: `analyzerApi.storeAnalysisResults` → `/analyzer/store-results/:fileId` (no
   backend route); `components/utils/LanguageSelector.tsx` (not imported); `src/App.css` and
   `src/assets/react.svg` (Vite scaffold leftovers); `VITE_API_URL` is set but never read; frontend
   `package.json` lists `@aws-sdk/*` clients that the SPA never imports; the frontend
   `WorkItemUpdate` type still has the legacy flat shape; `create_alb_auth_action` contains an
   unreachable "create user pool" branch (the stack always passes the pre-created pool).
7. **Duplicated logic to keep in sync**: `getUserEmail`/`getUserId` in `AnalyzerController` and
   `StorageController` (mirror `StorageService.createUserIdHash`); model predicate lists in
   `analyzer.service.ts` vs `system-prompts.ts`; KB construction in `wa_genai_stack.py` vs
   `local_development/kb_storage_stack.py`; workload name prefixes across TS/Python/CDK.
8. **Language code is `pt_BR`** (underscore) in code; README/docs say "pt-BR". `strings.ts` object
   order is en, ja, es, pt_BR, fr, ko.
9. **README drift**: `.env` example `MODEL_ID` uses an older `claude-sonnet-4-5…` id while defaults are
   `global.anthropic.claude-sonnet-5`; config example typo `allback_urls`.
10. **Pinning gaps**: `lambda_kb_synchronizer/requirements.txt` (`requests`) and root `requirements.txt`
    (`cdk-nag`) are unpinned; everything else is exact-pinned — keep new deps pinned.
11. **CDK API drift**: `local_development/kb_storage_stack.py` uses deprecated
    `point_in_time_recovery=True`; the main stack uses `point_in_time_recovery_specification`.
12. **`WellArchitectedService.getLensReview`** hardcodes the WA Framework lens (used only by
    `GET /well-architected/review/:workloadId`).
13. **Build strictness differs**: backend TS is lenient; frontend TS is strict with `noUnusedLocals`
    — an unused import breaks `npm run build` in the frontend only.
14. **Deployment stack deploys GitHub `main`**, not your working copy. Only `deploy-wa-analyzer.sh` /
    `cdk deploy` use local code.
15. **Image platform follows the build host**: building the stack on Apple Silicon produces arm64
    images and an ARM64 Fargate runtime platform; dev Dockerfiles default `PLATFORM=arm64`, prod
    Dockerfiles default `amd64` (CDK passes the correct build arg).
16. The KB synchronizer re-runs on **every** `cdk deploy` (timestamped custom resource) and can take
    several minutes; results appear asynchronously (`InvocationType: Event`).
17. **All `@nestjs/*` runtime packages must share one major version.** Dependabot's grouped bump
    (PR #198) moved `core`/`platform-express`/`platform-socket.io`/`websockets` to 12.x but left
    `@nestjs/common` on 11.x and `@nestjs/config` on 4.x (peer `^10 || ^11`), so `npm install` in
    `ecs_fargate_app/backend` failed with `ERESOLVE` and every deploy broke (Sept 2026). When
    accepting a Nest bump, also bump `common`, `config` (4.x → 12.x, no 5–11 exist) and `throttler`,
    regenerate `package-lock.json` with `npm install`, then verify with `npm ci && npm run build`.

---

## 11. Conventions

- Match existing style: NestJS `Logger` per class on the backend; Cloudscape components and
  `useLanguage().strings` for all user-visible text on the frontend (no hard-coded English in new UI —
  add keys to `I18nStrings` and all six languages); Python CDK with explicit `node.add_dependency`
  where ordering matters.
- Keep dependency versions **exact-pinned** in both `package.json` files, `requirements.txt` files and
  Dockerfile base tags (Dependabot handles bumps).
- Preserve `// nosemgrep` comments and `.semgrepignore`, and the `checkov`/`cfn_nag` metadata in the
  CFN template — they document deliberate exceptions.
- Always merge per-lens maps in `WorkItem` updates; never replace them.
- Keep the `NETWORK_INTERRUPTION:` error prefix contract between `services/api.ts` and `useAnalyzer.ts`.
- Prompts: XML-like tags, JSON inside `<json_response>`, section/detail terminators
  (`<end_of_iac_document_generation>`, `<message_truncated>`, `<end_of_details_generation>`,
  `<details_truncated>`) — parsers depend on these exact strings.
- Inclusive language only (primary/replica, allowlist/denylist).
- Treat deploy/destroy, IAM, and data-deleting operations as production changes: explain impact and
  get explicit confirmation before running them. Prefer read-only AWS credentials for inspection.

---

## 12. Glossary

| Term | Meaning |
|------|---------|
| **Lens / lensAlias / lensAliasArn** | A WA Tool question set. `lensAliasArn` is the full ARN (`arn:aws:wellarchitected::aws:lens/serverless`, custom: `arn:aws:wellarchitected:{region}:{acct}:lens/{id}`); `lensAlias` is its last segment, used as the key for all per-lens storage. |
| **Pillar** | Grouping of questions within a lens (`lensPillars`: id → display name). |
| **Question group** (`QuestionGroup`) | One WA question with its best practices and WA Tool `ChoiceId`s. |
| **Best practice** | A WA Tool "choice"; analysed as relevant/applied + prioritization fields. |
| **Work item** | One upload (single/multi/zip/pdf) and everything derived from it, per user. |
| **Supporting document** | Optional extra context file attached to a work item for one lens. |
| **Temp workload** | Short-lived WA Tool workload created per analysis when the user didn't pick one; deleted afterwards / after 24 h. |
| **KB** | Bedrock Knowledge Base over the WA docs bucket (PDFs + metadata), queried per question. |
| **Packed content** | Single-text rendering of a multi-file/zip project (`ProjectPacker`). |
| **Priorities / Eisenhower matrix** | Criticality × Complexity plot of not-applied best practices into quick-wins / major-initiatives / delegate / reconsider. |
| **Deployment stack** | The CloudFormation template that provisions a temporary EC2 to run the CDK deploy. |
