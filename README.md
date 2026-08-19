# ShareV

> **Share files. No login required.**

ShareV is a login-free, cloud-based file and text sharing platform. User A uploads a file and receives a unique access code. User B enters the code to view or download the file. Shared content expires automatically after a configured time.

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Vite 8 | UI, file picker, code entry |
| Routing | React Router DOM 7 | SPA page navigation |
| Backend | AWS Lambda (Node.js) | Upload and retrieve logic |
| API | Amazon API Gateway | HTTP endpoints |
| File storage | Amazon S3 | Stores uploaded files |
| Metadata | Amazon DynamoDB | Stores access codes + expiry |
| Security | AWS IAM + Pre-signed URLs | Least-privilege access control |
| Monitoring | Amazon CloudWatch | Logs, metrics, alarms |
| CDN | Amazon CloudFront + S3 | Frontend hosting and delivery |
| Optional | WebRTC | Peer-to-peer direct transfer |

---

## Repository Structure

```
ShareV/
├── README.md                        ← this file
├── ROADMAP.md                       ← full module roadmap
│
└── frontend/                        ← React + Vite application
    ├── index.html                   ← HTML entry point
    ├── vite.config.js               ← Vite configuration
    ├── package.json
    └── src/
        ├── main.jsx                 ← React root mount
        ├── App.jsx                  ← Router setup
        ├── index.css                ← Global styles + design tokens
        ├── App.css                  ← App-level overrides (placeholder)
        │
        ├── pages/
        │   └── Home.jsx             ← Main page (Upload + Receive)
        │
        ├── components/
        │   ├── Header.jsx           ← Logo + tagline
        │   ├── FileUpload.jsx       ← File picker, drag-drop, validation
        │   ├── CodeEntry.jsx        ← Access code input + mock lookup
        │   └── Footer.jsx           ← Footer bar
        │
        └── utils/
            └── fileValidation.js    ← Validation rules, helpers, constants
```

> **Planned additions** (added as modules are completed):
> ```
> backend/
> ├── functions/
> │   ├── upload/handler.js
> │   └── retrieve/handler.js
> └── infra/          ← AWS config and deployment scripts
> ```

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Run the frontend locally

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Other commands

```powershell
npm run build      # Production build → dist/
npm run preview    # Preview the production build locally
npm run lint       # Run oxlint
```

---

## Module Change Log

### Module 1 — React Frontend Shell
**Date completed:** 2026-08-13

**Goal:** Build the full UI skeleton with no backend connected. All upload and code-entry interactions use mock data.

**Files created:**
- `frontend/src/App.jsx` — replaced Vite default; sets up `BrowserRouter` with a single `/` route
- `frontend/src/pages/Home.jsx` — composes Header, FileUpload, CodeEntry, Footer into one page
- `frontend/src/components/Header.jsx` — sticky header with ⚡ ShareV logo and tagline
- `frontend/src/components/FileUpload.jsx` — drop zone, file preview, mock upload returning a fake 6-char code
- `frontend/src/components/CodeEntry.jsx` — code input with mock lookup (try `DEMO12` or `EXPIRY`)
- `frontend/src/components/Footer.jsx` — copyright footer
- `frontend/src/index.css` — complete design system: tokens, reset, layout, all component styles, dark mode, mobile responsive at 640 px

**Files modified:**
- `frontend/src/App.css` — cleared Vite defaults, now an empty placeholder
- `frontend/index.html` — updated `<title>` and added `<meta name="description">`

**Dependencies added:**
- `react-router-dom@7.18.2`

**Key concepts introduced:**
- React components, JSX, `useState`, `useRef`
- `BrowserRouter` / `Routes` / `Route`
- CSS custom properties (design tokens)
- Drag-and-drop with `onDragOver` / `onDrop`
- Controlled vs uncontrolled inputs

---

### Module 2 — File Selection & Client-Side Validation
**Date completed:** 2026-08-13

**Goal:** Add real file validation entirely in the browser — no network calls. Validate MIME type and file size, show clear error messages, disable the upload button on invalid state.

**Files created:**
- `frontend/src/utils/fileValidation.js` — pure validation utility:
  - `MAX_FILE_SIZE_MB = 25` and `MAX_FILE_SIZE_BYTES`
  - `ALLOWED_TYPES` Map (MIME type → readable label)
  - `ACCEPT_STRING` auto-built from `ALLOWED_TYPES` for `<input accept="">`
  - `validateFile(file)` → `{ valid: true }` or `{ valid: false, error, hint }`
  - `formatBytes(bytes)` → `"2.5 MB"`
  - `getFileIcon(mimeType)` → emoji per file category
  - `getReadableType(mimeType)` → `"PDF document"`

**Files modified:**
- `frontend/src/components/FileUpload.jsx` — full rewrite:
  - Imports all helpers from `fileValidation.js`
  - `processFile()` centralises validation for both input and drag-drop paths
  - `validationError` state drives the error banner
  - `dropzoneClass()` computes CSS modifier: `--valid`, `--invalid`, `--dragging`
  - Button disabled when: no file, validation error, or upload in flight
  - `dragLeave` fix: uses `e.currentTarget.contains(e.relatedTarget)` to prevent border flicker
- `frontend/src/index.css` — appended new CSS:
  - `.dropzone--dragging`, `.dropzone--valid`, `.dropzone--invalid`
  - `.validation-error`, `.validation-error__icon`, `.validation-error__message`, `.validation-error__hint`
  - Dark mode overrides for new states

**Key concepts introduced:**
- MIME types and why they're more reliable than file extensions
- Separation of concerns: logic in `utils/`, UI in `components/`
- Derived values (computed from state) vs stored state
- `aria-live="polite"` and `role="alert"` for accessible error announcements
- Event bubbling and `stopPropagation()`

---

### Module 3 — AWS Account & IAM Setup
**Date completed:** 2026-08-13

**Goal:** Create the AWS account and configure secure credentials so the AWS CLI can interact with AWS services on behalf of ShareV.

**AWS resources created:**
- IAM user `sharev-dev` with programmatic access (access key + secret)
- Custom IAM policy attached to `sharev-dev` scoped to the minimum permissions needed:
  - `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on the ShareV files bucket
  - `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:DeleteItem` on the ShareV table
  - `lambda:CreateFunction`, `lambda:UpdateFunctionCode`, `lambda:InvokeFunction`
  - `apigateway:*` on ShareV API resources

**No code files changed** — this module is entirely AWS Console + CLI setup.

**Key concepts introduced:**
- Root account vs IAM users — root has unlimited power, never use it for daily work
- Principle of least privilege — grant only the permissions a user or service actually needs
- Programmatic access — access key ID + secret key used by the CLI and SDKs
- `aws configure` — stores credentials in `~/.aws/credentials` (not in the project repo)
- `aws sts get-caller-identity` — the simplest way to verify your CLI is authenticated correctly

**Security notes:**
- MFA enabled on the root account
- IAM user credentials are stored in the local AWS credentials file only — never in code or `.env` files committed to git
- The custom policy uses resource-level restrictions (ARNs) rather than wildcard `*` resources

---

*This file is updated at the end of every module.*
