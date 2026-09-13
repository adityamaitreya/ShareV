# ShareV

> **Secure, temporary file sharing. No login required.**

ShareV is a serverless, cloud-native file sharing platform built with security-first principles. Upload a file, receive a unique 6-character access code, share the code — the recipient downloads the file directly from encrypted cloud storage. All shared content auto-expires after 24 hours with no manual cleanup required.

**Live:** [https://share-v.vercel.app](https://share-v.vercel.app)

---

## Why ShareV is a Cybersecurity Project

ShareV was deliberately designed around security principles — not bolted on afterwards. Every architectural decision has a security rationale:

| Decision | Security Rationale |
|----------|--------------------|
| No user accounts | Zero PII collected — nothing to breach |
| Pre-signed S3 URLs | Files never proxy through the server — Lambda never touches file bytes on download |
| Private S3 bucket | Zero public access — `AccessDenied` on direct URL access |
| AES-256 SSE at rest | Files encrypted on disk in S3 |
| TTL-based expiry | Data minimisation by design — records auto-delete |
| MIME type validation | Prevents extension spoofing (e.g. `malware.exe` renamed to `file.pdf`) |
| Least-privilege IAM | Every role scoped to minimum required permissions |
| Security headers | CSP, HSTS, X-Frame-Options, X-Content-Type-Options on every response |
| Brute-force protection | 10 failed code guesses per IP → 429 for 5 minutes |
| Rate limiting | API Gateway throttling prevents upload abuse |
| File malware scanning | ClamAV scans every upload — infected files quarantined before serving |
| Audit logging | Every upload, retrieve, and scan event logged with hashed IP |

---

## Project Status

| # | Module | Layer | Status |
|---|--------|-------|--------|
| 1 | React Frontend Shell | Frontend | ✅ Complete |
| 2 | File Selection & Client-Side Validation | Frontend | ✅ Complete |
| 3 | AWS Account & IAM Setup | Cloud infra | ✅ Complete |
| 4 | S3 Bucket Setup | Cloud infra | ✅ Complete |
| 5 | DynamoDB Table Setup | Cloud infra | ✅ Complete |
| 6 | Upload Lambda | Backend | ✅ Complete |
| 7 | API Gateway — Upload Route | Backend | ✅ Complete |
| 8 | Retrieve Lambda | Backend | ✅ Complete |
| 9 | API Gateway — Retrieve Route | Backend | ✅ Complete |
| 10 | Connect Frontend to Backend | Full-stack | ✅ Complete |
| 11 | File Expiry & Cleanup | Backend | ✅ Complete |
| 12 | Production Deployment (Vercel) | DevOps | ✅ Complete |
| 13 | Monitoring & Logging | DevOps | ✅ Complete |
| 14 | WebRTC Peer-to-Peer | Optional | ⏳ Not started |
| **15** | **Security Headers** | **Security** | ✅ **Complete** |
| **16** | **Brute-Force Protection** | **Security** | ⏳ In progress |
| **17** | **Rate Limiting** | **Security** | ⏳ In progress |
| **18** | **File Malware Scanning** | **Security** | ⏳ In progress |
| **19** | **Audit Logging** | **Security** | ⏳ In progress |

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Vite 8 | UI, drag-drop upload, code entry, dashboard |
| Routing | React Router DOM 7 | SPA navigation |
| Deployment | Vercel (global CDN) | Frontend hosting, HTTPS, auto-deploy on push |
| Backend | AWS Lambda (Node.js 22) | Upload and retrieve business logic |
| API | Amazon API Gateway (HTTP API) | HTTPS endpoints, throttling, CORS |
| File storage | Amazon S3 | Encrypted private file storage |
| Metadata | Amazon DynamoDB | Access codes, expiry TTL, audit logs, rate-limit counters |
| Malware scanning | ClamAV (Lambda layer) | Scans every uploaded file before serving |
| IAM | AWS IAM | Least-privilege roles and policies |
| Monitoring | Amazon CloudWatch + SNS | Structured JSON logs, error alarms, email alerts |
| Security headers | `vercel.json` | CSP, HSTS, X-Frame-Options, Referrer-Policy |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER'S BROWSER                              │
│   React + Vite (Vercel CDN — HTTPS enforced, security headers)  │
│                                                                 │
│   Upload Panel              Receive Panel                       │
│   - drag & drop             - code input                        │
│   - MIME + size validation  - brute-force protected             │
│   - access code display     - download via pre-signed URL       │
└──────────────────┬──────────────────────────────────────────────┘
                   │ HTTPS (TLS 1.3)
┌──────────────────▼──────────────────────────────────────────────┐
│          API Gateway (HTTP API) — ap-south-1                    │
│   POST /upload          GET /retrieve/{code}                    │
│   Rate limited          Brute-force protected                   │
└──────┬──────────────────────────┬───────────────────────────────┘
       │                          │
┌──────▼──────────┐   ┌───────────▼──────────┐
│ Lambda: upload  │   │ Lambda: retrieve      │
│                 │   │                       │
│ 1. parse body   │   │ 1. check rate limit   │
│ 2. MIME check   │   │ 2. DynamoDB lookup    │
│ 3. write to     │   │ 3. check expiry       │
│    quarantine/  │   │ 4. check scan status  │
│ 4. write dynamo │   │ 5. pre-signed URL     │
│ 5. return code  │   │ 6. audit log          │
│ 6. audit log    │   └──────────┬────────────┘
└──────┬──────────┘              │
       │ S3 ObjectCreated        ▼
       │              ┌─────────────────────┐
┌──────▼──────────┐   │   Amazon DynamoDB   │
│ Lambda: scan    │   │                     │
│ (ClamAV)        │   │  sharev-files       │
│                 │   │  sharev-ratelimit   │
│ clean →         │   │  sharev-audit       │
│   move to       │   └─────────────────────┘
│   uploads/      │
│ infected →      │
│   delete +      │
│   alert         │
└──────┬──────────┘
       │
┌──────▼──────────┐
│   Amazon S3     │
│                 │
│  quarantine/    │  ← files land here first
│  uploads/       │  ← moved here after clean scan
│                 │
│  AES-256 SSE    │
│  Private bucket │
│  Lifecycle: 2d  │
└─────────────────┘
```

---

## Security Features

### ✅ 1. Security Headers (Module 15)

All responses from the frontend include:

| Header | Value | Protection |
|--------|-------|-----------|
| `Content-Security-Policy` | `default-src 'self'; connect-src 'self' https://*.amazonaws.com` | XSS, data injection |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HTTPS downgrade attacks |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | Reflected XSS (legacy browsers) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | URL leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Feature abuse |

Configured via `frontend/vercel.json`.

---

### ⏳ 2. Brute-Force Protection (Module 16)

Prevents automated guessing of 6-character access codes.

- DynamoDB table `sharev-ratelimit` tracks failed attempts per `IP#code`
- After **10 failed attempts** in a 5-minute window → `429 Too Many Requests`
- Counter resets automatically via DynamoDB TTL after 5 minutes
- Successful lookup resets the counter immediately

---

### ⏳ 3. Rate Limiting (Module 17)

Prevents upload abuse at the infrastructure level — before Lambda even runs.

- API Gateway usage plan on `POST /upload`
- **10 req/s burst**, **5 req/s steady state**
- Excess requests return `429` from API Gateway — zero Lambda cost

---

### ⏳ 4. File Malware Scanning (Module 18)

Every uploaded file is scanned with ClamAV before it becomes downloadable.

**Two-phase upload flow:**
1. File lands in `s3://sharev-files-764988199438/quarantine/`
2. S3 `ObjectCreated` event triggers the scan Lambda
3. ClamAV (via Lambda layer) scans the file buffer
4. **Clean** → moved to `uploads/`, DynamoDB status set to `clean`
5. **Infected** → deleted from S3, DynamoDB status set to `infected`, CloudWatch alarm fired
6. Retrieve Lambda checks `status` field — only serves `clean` files

Test vector: EICAR test file (standard harmless malware test string — detected by all AV engines).

---

### ⏳ 5. Audit Logging (Module 19)

Privacy-preserving audit trail for every security-relevant event.

- DynamoDB table `sharev-audit` — append-only
- IPs are **SHA-256 hashed** before storage — never stored raw
- Events logged:
  - `UPLOAD` — accessCode, fileName, fileSize, contentType, hashedIp, timestamp
  - `RETRIEVE` — accessCode, result (found/expired/not-found), hashedIp, timestamp
  - `SCAN_RESULT` — accessCode, result (clean/infected), timestamp

---

## Data Flow

**Upload:**
```
1. Browser validates MIME type and size locally (Module 2)
2. POST /upload → API Gateway (rate limited, Module 17)
3. Lambda writes file to quarantine/ in S3
4. Lambda writes metadata to DynamoDB (status: pending)
5. Lambda returns { accessCode, expiresAt }
6. S3 event triggers scan Lambda
7. ClamAV scans the file
8. Clean → moved to uploads/, status: clean
9. Infected → deleted, status: infected, alarm fired
10. Audit event written to sharev-audit
```

**Retrieve:**
```
1. Browser sends GET /retrieve/{code}
2. API Gateway forwards to Lambda
3. Lambda checks rate-limit counter for this IP+code (Module 16)
4. Lambda queries DynamoDB — checks existence, expiry, scan status
5. If status != clean → 403 Forbidden
6. Lambda generates 15-minute pre-signed S3 URL
7. Browser downloads file directly from S3 (Lambda never touches bytes)
8. Audit event written to sharev-audit
```

---

## Repository Structure

```
ShareV/
├── README.md                         ← this file
├── ROADMAP.md                        ← full module roadmap
│
├── frontend/                         ← React + Vite SPA
│   ├── vercel.json                   ← security headers config
│   ├── index.html
│   ├── vite.config.js
│   ├── .env.local                    ← API base URL (gitignored)
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css                 ← dashboard design system
│       ├── pages/
│       │   └── Home.jsx              ← dashboard layout
│       ├── components/
│       │   ├── Header.jsx            ← top nav bar
│       │   ├── FileUpload.jsx        ← upload panel
│       │   ├── CodeEntry.jsx         ← retrieve panel
│       │   └── Footer.jsx
│       ├── services/
│       │   └── api.js                ← all fetch calls (uploadFile, retrieveFile)
│       └── utils/
│           └── fileValidation.js     ← MIME validation, size limits, helpers
│
└── backend/
    └── functions/
        ├── upload/
        │   ├── handler.js            ← multipart parse, S3 write, DynamoDB write
        │   ├── package.json
        │   └── test-event.js
        └── retrieve/
            ├── handler.js            ← DynamoDB lookup, expiry check, pre-signed URL
            ├── package.json
            └── test-event.js
```

---

## AWS Resources

| Resource | Name | Purpose |
|----------|------|---------|
| S3 bucket | `sharev-files-764988199438` | File storage (private, AES-256, lifecycle 2d) |
| S3 bucket | `sharev-frontend-764988199438` | Frontend build artifacts |
| DynamoDB table | `sharev-files` | Access codes + metadata + TTL |
| DynamoDB table | `sharev-ratelimit` | Brute-force counters (TTL 5min) |
| DynamoDB table | `sharev-audit` | Audit trail (append-only) |
| Lambda | `sharev-upload` | Upload handler (Node.js 22, 256MB, 30s) |
| Lambda | `sharev-retrieve` | Retrieve handler (Node.js 22, 256MB, 30s) |
| Lambda | `sharev-scan` | ClamAV malware scanner (triggered by S3) |
| API Gateway | `sharev-api` | HTTP API — `POST /upload`, `GET /retrieve/{code}` |
| IAM role | `sharev-lambda-role` | Lambda execution role (least privilege) |
| CloudWatch | `sharev-upload-errors` | Alarm: ≥3 errors in 5min → SNS |
| CloudWatch | `sharev-retrieve-errors` | Alarm: ≥3 errors in 5min → SNS |
| SNS topic | `sharev-alerts` | Email notifications for alarms |

**Region:** `ap-south-1` (Mumbai)

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later
- AWS CLI v2 configured (`aws configure`)

### Run locally

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The app connects to the live API Gateway — no local backend needed.

### Environment variables

Create `frontend/.env.local`:

```bash
VITE_API_BASE_URL=https://imecvsfr4l.execute-api.ap-south-1.amazonaws.com/dev
```

### Other commands

```bash
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm run lint       # Run oxlint
```

### Deploy

Push to `main` — Vercel auto-deploys the frontend. Lambda functions are deployed manually:

```bash
cd backend/functions/upload
zip -r upload.zip handler.js package.json node_modules/
aws lambda update-function-code --function-name sharev-upload --zip-file fileb://upload.zip --region ap-south-1
```

---

## Module Change Log

### Module 1 — React Frontend Shell
**Date completed:** 2026-08-13

Built the full UI skeleton with mock data. React 19 + Vite 8, React Router 7, complete CSS design system with dark mode and mobile responsiveness.

**Key files:** `App.jsx`, `pages/Home.jsx`, `components/Header.jsx`, `components/FileUpload.jsx`, `components/CodeEntry.jsx`, `components/Footer.jsx`, `index.css`

---

### Module 2 — File Selection & Client-Side Validation
**Date completed:** 2026-08-13

Real MIME type and file size validation in the browser before any upload. `validateFile()` rejects extension-spoofed files by checking actual MIME type, not filename. 25 MB hard limit.

**Key files:** `utils/fileValidation.js`, `components/FileUpload.jsx`

**Security concept:** MIME validation prevents attackers from renaming `.exe` to `.pdf` to bypass basic extension checks.

---

### Module 3 — AWS Account & IAM Setup
**Date completed:** 2026-08-13

AWS account with MFA on root, IAM user `shareV` with least-privilege policy scoped to specific ARNs. Credentials in `~/.aws/credentials`, never in the repo.

**Security concept:** Principle of least privilege — every permission explicitly granted, never wildcarded.

---

### Module 4 — S3 Bucket Setup
**Date completed:** 2026-09-10

Bucket `sharev-files-764988199438` created with all public access blocked, AES-256 server-side encryption, bucket policy restricting access to the Lambda role only, CORS for the frontend origin.

**Verification:** `curl` on a direct object URL returns `AccessDenied`.

---

### Module 5 — DynamoDB Table Setup
**Date completed:** 2026-09-10

Table `sharev-files` with partition key `accessCode`, `PAY_PER_REQUEST` billing, TTL on `expiresAt`. Records auto-delete after 24 hours.

**Security concept:** TTL-based data minimisation — data doesn't accumulate indefinitely.

---

### Module 6 — Upload Lambda
**Date completed:** 2026-09-10

Node.js Lambda that parses multipart form data, generates a cryptographically random 6-char code (avoiding ambiguous chars 0/O/1/I), writes to S3, writes metadata to DynamoDB, returns `{ accessCode, expiresAt }`.

**Key files:** `backend/functions/upload/handler.js`

---

### Module 7 — API Gateway — Upload Route
**Date completed:** 2026-09-10

HTTP API with `POST /upload` route, CORS configured for `localhost:5173` and `share-v.vercel.app`, auto-deploy stage.

**Live endpoint:** `https://imecvsfr4l.execute-api.ap-south-1.amazonaws.com/dev/upload`

---

### Module 8 — Retrieve Lambda
**Date completed:** 2026-09-10

Lambda that looks up an access code in DynamoDB, manually checks `expiresAt` (TTL deletion can lag 48h), generates a 15-minute pre-signed S3 URL. Returns 404 (not found) or 410 (expired).

**Security concept:** Pre-signed URLs — the file bytes never pass through the Lambda. The browser downloads directly from S3 with a time-limited signed URL.

**Key files:** `backend/functions/retrieve/handler.js`

---

### Module 9 — API Gateway — Retrieve Route
**Date completed:** 2026-09-10

`GET /retrieve/{code}` route added to the existing API. End-to-end test: upload via curl → retrieve via curl → valid pre-signed URL returned.

---

### Module 10 — Connect Frontend to Backend
**Date completed:** 2026-09-10

Replaced all mock behaviour with real API calls. `api.js` centralises all fetch logic. `FileUpload.jsx` calls `uploadFile()`, `CodeEntry.jsx` calls `retrieveFile()`. Download triggered via programmatic `<a>` click with pre-signed URL.

**Key files:** `services/api.js`, `components/FileUpload.jsx`, `components/CodeEntry.jsx`, `.env.local`

---

### Module 11 — File Expiry & Cleanup
**Date completed:** 2026-09-10

Three-layer expiry strategy:
1. DynamoDB TTL — auto-deletes metadata records after `expiresAt`
2. S3 lifecycle rule `delete-expired-uploads` — deletes all objects under `uploads/` after 2 days
3. Retrieve Lambda checks `expiresAt` manually — returns 410 before TTL kicks in

---

### Module 12 — Production Deployment
**Date completed:** 2026-09-10

Frontend deployed to Vercel via GitHub integration. Every push to `main` auto-redeploys. `VITE_API_BASE_URL` set as Vercel environment variable. API Gateway CORS updated to allow `https://share-v.vercel.app`.

**Live URL:** [https://share-v.vercel.app](https://share-v.vercel.app)

---

### Module 13 — Monitoring & Logging
**Date completed:** 2026-09-10

Structured JSON logging added to both Lambdas (`log.info`, `log.warn`, `log.error` — each line is a parseable JSON object queryable in CloudWatch Insights). CloudWatch alarms fire email via SNS when either Lambda errors ≥3 times in 5 minutes.

**AWS resources:** SNS topic `sharev-alerts`, alarms `sharev-upload-errors` and `sharev-retrieve-errors`.

---

### Module 15 — Security Headers
**Date completed:** 2026-09-10

Full HTTP security header suite added via `frontend/vercel.json`. Protects against XSS, clickjacking, MIME sniffing, HTTPS downgrade attacks, and feature abuse.

**Headers added:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy.

**Key file:** `frontend/vercel.json`

---

### Module 16 — Brute-Force Protection
**Status:** In progress

DynamoDB-backed rate limiting on the retrieve endpoint. 10 failed attempts per IP per 5-minute window → 429. Atomic `UpdateItem` increments with TTL-based auto-reset.

---

### Module 17 — Rate Limiting
**Status:** In progress

API Gateway usage plan throttling on `POST /upload`. 10 req/s burst, 5 req/s steady state. Excess requests return 429 before Lambda is invoked.

---

### Module 18 — File Malware Scanning
**Status:** In progress

ClamAV Lambda layer scans every upload. Two-phase flow: quarantine → scan → approve or reject. Infected files deleted before they can be retrieved. EICAR test file used for validation.

---

### Module 19 — Audit Logging
**Status:** In progress

Append-only DynamoDB audit table. Every upload, retrieve, and scan event recorded. IPs stored as SHA-256 hashes — never raw values. Provides forensic trail without storing PII.

---

*This file is updated at the end of every module. Last updated: 2026-09-10*
