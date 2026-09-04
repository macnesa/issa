# ISSA Teacher CMS

Teacher-facing CMS built with React 18, Vite, Redux, React Query, and an IndexedDB-backed offline workspace.

## Requirements

- Node.js 20+
- npm
- API base URL for the environment you are running

## Local development

```bash
cp .env.example .env.local
npm ci
npm run dev
```

The Vite development server runs on:

```text
http://localhost:3001
```

By default, `.env.example` points the CMS to a local API on `http://localhost:3000`. Change `VITE_API_BASE_URL` in `.env.local` if your local API uses another address.

## Environment

The frontend reads:

```text
VITE_API_BASE_URL
```

Rules:

- `issa.macnesa.com` and `issa-cms.macnesa.com` always use `https://issa-api.macnesa.com`.
- Local development may use a localhost API target.
- A production build is rejected when `VITE_API_BASE_URL` points to localhost, preventing a deployable artifact from accidentally embedding a local API address.
- Preview environments should set an explicit deployable HTTPS API URL.

## Tests

Run the complete test suite:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Feature-specific test commands remain available:

```bash
npm run test:student-insights
npm run test:student-evidence
npm run test:student-learning-journal
```

## Production build

Set a deployable API URL, then build:

```bash
VITE_API_BASE_URL=https://issa-api.macnesa.com npm run build
```

Vite writes the production artifact to:

```text
dist/
```

`npm run check` runs the full test suite followed by a production build.

## Firebase Hosting

`firebase.json` serves `dist/` and rewrites application routes to `index.html`.

Typical release flow:

```bash
npm ci
npm test
VITE_API_BASE_URL=https://issa-api.macnesa.com npm run build
firebase deploy --only hosting
```

The Firebase configuration also applies baseline security headers. A successful deploy command is not a substitute for production verification.

## Fieldwork architecture documents

The active teacher experience is governed by separate layers:

- `src/shared/ui/FIELDWORK_UI_SYSTEM.md` — visual and interaction system.
- `FIELDWORK_DOMAIN_MODEL.md` — domain, canonicality, time, and UI truth contract.
- `FIELDWORK_DATA_CONTRACT_AUDIT.md` — source-grounded mapping of current APIs/data to the Fieldwork model and the bounded next architecture step.
- `src/shared/data/RESOURCE_TRUTH_CONTRACT.md` — runtime status/provenance semantics used by the migrated Student data surfaces.
- `src/navigation/WORKFLOW_OWNERSHIP.md` — canonical task ownership and shortcut rules for the low-learning-curve teacher flow.

The domain documents remain architecture constraints rather than backend-migration approval. The Resource Truth contract is now implemented client-side; it does not alter persistence schemas.

## Offline behavior

The CMS includes an offline application shell and IndexedDB-backed teacher workspace. Pending mutations are synchronized when connectivity returns. Do not clear browser storage on a device with unsynchronized teacher work unless that data loss is intentional.

## Codebook scripts

The repository still exposes:

```bash
npm run codebook:check
npm run codebook:index
```

Those commands expect `../scripts/check-codebook.js`. They only work when this CMS directory is inside the parent workspace that provides that script.
