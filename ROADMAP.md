# ShareV — Development Roadmap

This document is the single source of truth for the project plan.
Each module is self-contained and testable before the next one begins.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Complete |
| 🔄 | In progress |
| ⏳ | Not started |
| 🔒 | Blocked by a previous module |

---

## Module Overview

| # | Title | Layer | Status |
|---|-------|-------|--------|
| 1 | React Frontend Shell | Frontend | ✅ |
| 2 | File Selection & Client-Side Validation | Frontend | ✅ |
| 3 | AWS Account & IAM Setup | Cloud infra | ✅ |
| 4 | S3 Bucket Setup | Cloud infra | ✅ |
| 5 | DynamoDB Table Setup | Cloud infra | ✅ |
| 6 | Upload Lambda | Backend | ✅ |
| 7 | API Gateway — Upload Route | Backend | ✅ |
| 8 | Retrieve Lambda | Backend | ✅ |
| 9 | API Gateway — Retrieve Route | Backend | ✅ |
| 10 | Connect Frontend to Backend | Frontend + Backend | ✅ |
| 11 | File Expiry & Cleanup | Backend | ✅ |
| 12 | CloudFront & Production Deployment | DevOps | 🔒 |
| 13 | Monitoring & Logging | DevOps | 🔒 |
| 14 | WebRTC Peer-to-Peer (Optional) | Frontend + Backend | 🔒 |

---

## Detailed Module Plans

---

### ✅ Module 1 — React Frontend Shell

**Goal:** Build the complete UI skeleton. No backend. All behaviour is mocked.

**What you learn:**
- React project structure with Vite
- Components, JSX, props
- `useState` and `useRef`
- React Router (BrowserRouter, Routes, Route)
- CSS custom properties as a design system
- Responsive layout with CSS Grid and media queries
- Dark mode with `prefers-color-scheme`

**Steps completed:**
1. Scaffolded Vite + React project
2. Installed `react-router-dom`
3. Created page and component folder structure
4. Built `Header`, `FileUpload`, `CodeEntry`, `Footer` components
5. Built `Home` page composing all components
6. Written full CSS design system in `index.css`
7. Updated `index.html` title and meta description
8. Verified production build passes

**Test:** `npm run dev` → verify upload zone, mock code generation, mock code lookup (try `DEMO12` and `EXPIRY`), dark mode, mobile layout.

---

### ✅ Module 2 — File Selection & Client-Side Validation

**Goal:** Add real file validation in the browser. No server involved.

**What you learn:**
- MIME types and why they are more reliable than file extensions
- Separation of concerns: logic vs UI
- Derived state vs stored state
- Accessible error announcements (`aria-live`, `role="alert"`)
- Event bubbling and `stopPropagation()`

**Steps completed:**
1. Created `src/utils/fileValidation.js` with all rules and helpers
2. Defined `ALLOWED_TYPES` Map and `ACCEPT_STRING`
3. Implemented `validateFile()` returning `{ valid, error?, hint? }`
4. Added `formatBytes()`, `getFileIcon()`, `getReadableType()` helpers
5. Rewrote `FileUpload.jsx` with `processFile()` centralising validation
6. Added `validationError` state and error banner component
7. Implemented `dropzoneClass()` derived CSS modifier logic
8. Fixed `dragLeave` flicker with `contains()` check
9. Added validation CSS classes to `index.css`
10. Verified production build passes

**Allowed file types:** Images (JPEG, PNG, GIF, WebP, SVG), PDF, Word (.doc/.docx), Excel (.xls/.xlsx), plain text, HTML, CSS, JavaScript, TypeScript, JSON, XML, CSV, ZIP, TAR, GZip.

**Size limit:** 25 MB

**Test:**
- Pick a valid file → drop zone turns purple, Upload button enables
- Pick an `.exe` → red border, error banner, button stays disabled
- Pick a file over 25 MB → size error with exact size shown
- Drag-and-drop a valid file → teal border while dragging, purple after drop
- Remove file with ✕ → resets completely

---

### ✅ Module 3 — AWS Account & IAM Setup

**Goal:** Create the AWS account and configure secure credentials. No resources deployed yet.

**What you learned:**
- AWS account structure (root vs IAM users)
- Why you never use root credentials for day-to-day work
- IAM: users, groups, roles, policies
- Principle of least privilege
- AWS CLI installation and credential configuration
- Environment variables for secrets (never hardcode keys)

**Steps completed:**
1. Created AWS account
2. Enabled MFA (multi-factor authentication) on the root account
3. Created IAM user `sharev-dev` with programmatic access
4. Attached a custom policy scoped to S3, DynamoDB, Lambda, and API Gateway permissions
5. Installed AWS CLI v2
6. Ran `aws configure` with the IAM user credentials
7. Verified with `aws sts get-caller-identity`
8. Credentials stored securely — not committed to the repository

**Deliverable:** ✅ `aws sts get-caller-identity` returns account ID without error. AWS CLI is authenticated and ready.

---

### ✅ Module 4 — S3 Bucket Setup

**Depends on:** Module 3

**Goal:** Create the S3 bucket that will store uploaded files. No public access.

**What you learned:**
- S3 buckets and objects
- Why you never make a storage bucket fully public
- Bucket policies vs ACLs
- CORS — what it is and why the browser needs it configured
- Server-side encryption at rest

**Steps completed:**
1. Added `s3:CreateBucket` and bucket-management permissions to the `shareV` IAM policy
2. Created bucket `sharev-files-764988199438` in `ap-south-1`
3. Blocked all public access (all four flags set to true)
4. Enabled server-side encryption (SSE-S3 / AES256) with BucketKey
5. Added bucket policy scoped to `arn:aws:iam::764988199438:user/shareV`
6. Configured CORS to allow `http://localhost:5173` (to be updated with CloudFront URL in Module 12)
7. Tested upload with `aws s3 cp` — object appeared in `aws s3 ls`
8. Verified `curl` on the object URL returns `AccessDenied`

**AWS resources created:**
- S3 bucket: `sharev-files-764988199438` (region: `ap-south-1`)

**Deliverable:** ✅ File uploads via the AWS CLI work. Direct browser access returns `AccessDenied`.

---

### ✅ Module 5 — DynamoDB Table Setup

**Depends on:** Module 3

**Goal:** Create the DynamoDB table that stores access codes and metadata.

**What you learned:**
- DynamoDB: tables, items, attributes
- How NoSQL differs from SQL (no fixed schema, key-based access)
- Primary keys (partition key)
- TTL (Time To Live) — automatic record deletion after expiry
- `PAY_PER_REQUEST` billing — no capacity planning needed at this stage

**Steps completed:**
1. Created table `sharev-files` with partition key `accessCode` (String), billing mode `PAY_PER_REQUEST`
2. Enabled TTL on attribute `expiresAt`
3. Wrote a test item with `aws dynamodb put-item`
4. Read it back with `aws dynamodb get-item` — all fields returned correctly

**AWS resources created:**
- DynamoDB table: `sharev-files` (region: `ap-south-1`)
- ARN: `arn:aws:dynamodb:ap-south-1:764988199438:table/sharev-files`

**Table schema:**
```
accessCode   (String, PK)   — the 6-char code e.g. "AB12CD"
s3Key        (String)       — path to the file in S3
contentType  (String)       — MIME type of the file
fileName     (String)       — original file name
fileSize     (Number)       — bytes
expiresAt    (Number)       — Unix timestamp, TTL attribute
createdAt    (String)       — ISO date string
```

**Deliverable:** ✅ `aws dynamodb get-item` returns a test record. TTL enabled on `expiresAt`.

---

### ✅ Module 6 — Upload Lambda

**Depends on:** Modules 4 and 5

**Goal:** Write the Lambda function that receives a file, stores it in S3, saves metadata to DynamoDB, and returns an access code.

**What you learned:**
- Lambda function structure (handler, event, context)
- AWS SDK v3 (modular, tree-shakeable)
- Generating cryptographically random access codes
- Environment variables in Lambda
- Error handling and HTTP status codes
- Multipart form-data parsing in a Lambda context
- IAM execution roles for Lambda

**Steps completed:**
1. Created `backend/functions/upload/handler.js`
2. Parses `multipart/form-data` from API Gateway event
3. Generates a unique 6-char alphanumeric access code (no ambiguous chars 0/O/1/I)
4. Uploads file buffer to S3 under `uploads/{code}/{filename}`
5. Writes all metadata to DynamoDB with `expiresAt = now + 24 hours`
6. Returns `{ accessCode, expiresAt, fileName, fileSize }` with status 200
7. Created `sharev-lambda-role` IAM role with S3, DynamoDB, and CloudWatch Logs permissions
8. Deployed to Lambda (`sharev-upload`) via AWS CLI with `nodejs22.x` runtime
9. Tested locally with `test-event.js` — returned valid access code
10. Tested live Lambda invoke — returned access code `33GCW3`, file confirmed in S3 and DynamoDB

**AWS resources created:**
- Lambda function: `sharev-upload` (region: `ap-south-1`)
- ARN: `arn:aws:lambda:ap-south-1:764988199438:function:sharev-upload`
- IAM role: `sharev-lambda-role`
- ARN: `arn:aws:iam::764988199438:role/sharev-lambda-role`

**Deliverable:** ✅ Invoking the Lambda with a test event returns a valid access code and the file appears in S3.

---

### ✅ Module 7 — API Gateway — Upload Route

**Depends on:** Module 6

**Goal:** Expose the upload Lambda as an HTTP endpoint.

**What you learned:**
- REST API vs HTTP API in API Gateway (HTTP API is simpler and cheaper)
- How API Gateway acts as a managed HTTP router in front of Lambda
- Lambda resource-based policies — why API Gateway needs explicit permission to invoke Lambda
- AWS_PROXY integration — API Gateway forwards the full request to Lambda and returns its response as-is
- Stages and auto-deploy — `dev` stage auto-deploys on every change

**Steps completed:**
1. Created HTTP API `sharev-api` with CORS configured for `http://localhost:5173`
2. Granted API Gateway permission to invoke `sharev-upload` Lambda
3. Created AWS_PROXY integration pointing to `sharev-upload`
4. Created route `POST /upload` mapped to the integration
5. Created `dev` stage with auto-deploy enabled
6. Tested with `curl -F` — returned live access code `5XKHRD`

**AWS resources created:**
- API Gateway HTTP API: `sharev-api`
- API ID: `imecvsfr4l`
- Upload endpoint: `https://imecvsfr4l.execute-api.ap-south-1.amazonaws.com/dev/upload`

**Deliverable:** ✅ `curl -X POST .../dev/upload -F "file=@test.txt"` returns a JSON access code.

---

### ✅ Module 8 — Retrieve Lambda

**Depends on:** Modules 4 and 5

**Goal:** Write the Lambda that looks up an access code and returns a secure pre-signed download URL.

**What you learned:**
- DynamoDB `GetItem` operation
- Checking TTL / expiry manually (TTL deletion is not instant — can lag up to 48 h)
- Pre-signed S3 URLs — temporary signed links that let the browser download directly from S3
- Returning different HTTP status codes (200, 400, 404, 410 Gone, 500)
- Why files should never proxy through Lambda (pre-signed URLs are the right pattern)

**Steps completed:**
1. Created `backend/functions/retrieve/handler.js`
2. Reads `accessCode` from path parameter, validates format
3. Looks up code in DynamoDB with `GetItem`
4. Returns 404 if not found
5. Checks `expiresAt` manually — returns 410 if expired
6. Generates a pre-signed S3 URL valid for 15 minutes with `attachment` disposition
7. Returns `{ url, fileName, fileSize, contentType, expiresAt }`
8. Deployed to Lambda (`sharev-retrieve`) reusing `sharev-lambda-role`
9. Created integration and `GET /retrieve/{code}` route on existing API Gateway
10. Tested live — `curl .../dev/retrieve/5XKHRD` returned a valid pre-signed URL

**AWS resources created:**
- Lambda function: `sharev-retrieve` (region: `ap-south-1`)
- ARN: `arn:aws:lambda:ap-south-1:764988199438:function:sharev-retrieve`
- API Gateway route: `GET /retrieve/{code}` → `sharev-retrieve`

**Deliverable:** ✅ `curl .../dev/retrieve/{code}` returns a pre-signed URL that downloads the correct file.

---

### ✅ Module 9 — API Gateway — Retrieve Route

**Depends on:** Module 8

**Goal:** Expose the retrieve Lambda as an HTTP endpoint.

**Steps completed:**
1. Created AWS_PROXY integration pointing to `sharev-retrieve` (IntegrationId: `228avgo`)
2. Created route `GET /retrieve/{code}` mapped to the integration
3. Auto-deploy on existing `dev` stage pushed it live immediately
4. End-to-end test: uploaded via Module 7, retrieved via this route — full cycle works

**Deliverable:** ✅ Full upload → retrieve cycle works entirely through HTTP.

---

### ✅ Module 10 — Connect Frontend to Backend

**Depends on:** Modules 7 and 9

**Goal:** Replace all mock behaviour in the React app with real API calls.

**What you learned:**
- `fetch` API and async/await for real network calls
- `FormData` for sending files from the browser
- Environment variables in Vite (`import.meta.env.VITE_*`)
- Handling loading, success, and error states for real network calls
- Pre-signed URL file downloads via a programmatically created `<a>` tag
- Separation of concerns — all fetch logic in `services/api.js`

**Steps completed:**
1. Created `src/services/api.js` with `uploadFile()` and `retrieveFile()` functions
2. Created `frontend/.env.local` with `VITE_API_BASE_URL` pointing to API Gateway
3. Rewrote `FileUpload.jsx` — replaced mock `setTimeout` with real `uploadFile()` call
4. Rewrote `CodeEntry.jsx` — replaced mock lookup with real `retrieveFile()` call
5. Download button triggers browser download via pre-signed S3 URL
6. Error states map API responses to user-facing messages (404, 410, 500)
7. End-to-end test: uploaded a file in the browser, received the code, downloaded on the same device

**Files created/modified:**
- `frontend/src/services/api.js` — new
- `frontend/.env.local` — new (gitignored)
- `frontend/src/components/FileUpload.jsx` — real upload replacing mock
- `frontend/src/components/CodeEntry.jsx` — real lookup + download replacing mock

**Deliverable:** ✅ A file uploaded in the browser can be downloaded by entering the code. Full end-to-end flow working.

---

### ✅ Module 11 — File Expiry & Cleanup

**Depends on:** Modules 4 and 5

**Goal:** Make expiry automatic and clean up S3 storage to avoid paying for abandoned files.

**What you learned:**
- DynamoDB TTL behaviour — deletion can lag up to 48 h, so always check `expiresAt` manually in code
- S3 lifecycle rules — automatic object deletion by prefix and age
- Three-layer expiry strategy: TTL (metadata) + lifecycle rule (S3 objects) + manual check (Lambda)

**Steps completed:**
1. Wrote a test record with `expiresAt = now + 120s` — confirmed TTL is set correctly
2. Added S3 lifecycle rule `delete-expired-uploads` — deletes all objects under `uploads/` after 2 days
3. Verified lifecycle rule applied with `get-bucket-lifecycle-configuration`
4. Wrote `GONE01` record with `expiresAt` in the past
5. Confirmed `GET /retrieve/GONE01` returns `{"error":"This link has expired."}` (410)

**AWS resources modified:**
- S3 bucket `sharev-files-764988199438` — lifecycle rule added
- DynamoDB table `sharev-files` — TTL already enabled in Module 5, verified working

**Deliverable:** ✅ Expired codes return 410. S3 objects are automatically deleted by lifecycle rules after 2 days.

---

### ⏳ Module 12 — CloudFront & Production Deployment

**Depends on:** Module 10

**Goal:** Deploy the React app to S3 + CloudFront for fast, globally distributed, HTTPS delivery.

**What you learn:**
- Static site hosting on S3
- CloudFront distributions, origins, and behaviours
- Cache invalidation after a new deployment
- HTTPS with ACM (AWS Certificate Manager) — free certificates
- Custom domain setup (optional)

**Steps to complete:**
1. Create an S3 bucket for the frontend (separate from the file storage bucket)
2. Configure it for static website hosting
3. Run `npm run build` and upload `dist/` to the bucket
4. Create a CloudFront distribution pointing to the S3 bucket
5. Configure the distribution to redirect HTTP → HTTPS
6. Set up a cache invalidation on each new deployment
7. (Optional) Add a custom domain via Route 53 + ACM

**Deliverable:** The app loads at a CloudFront HTTPS URL from anywhere in the world.

---

### ⏳ Module 13 — Monitoring & Logging

**Depends on:** Modules 6, 8

**Goal:** Add observability so you can debug problems and track usage.

**What you learn:**
- CloudWatch Logs — where Lambda output goes
- Structured logging (JSON logs vs plain text)
- CloudWatch Metrics and custom metrics
- CloudWatch Alarms — get notified when errors spike
- Log Insights for querying logs

**Steps to complete:**
1. Add structured JSON logging to both Lambda functions
2. Create a CloudWatch dashboard with key metrics (invocation count, error rate, duration)
3. Create an alarm that triggers when the error rate exceeds 5% in 5 minutes
4. Test by deliberately triggering an error and watching the alarm

**Deliverable:** You can query Lambda logs in CloudWatch Insights and receive an email when error rate spikes.

---

### ⏳ Module 14 — WebRTC Peer-to-Peer Transfer (Optional)

**Depends on:** Module 10

**Goal:** Add an optional P2P transfer mode where files go directly from User A's browser to User B's browser without touching S3.

**What you learn:**
- WebRTC and how peer-to-peer connections work in a browser
- Signaling — why two browsers need a server to introduce themselves before going direct
- WebSocket API in API Gateway
- Data channels for binary file transfer

**Steps to complete:**
1. Create a WebSocket API in API Gateway
2. Write a signaling Lambda that relays SDP offers/answers and ICE candidates between peers
3. Add P2P mode toggle to the frontend
4. Implement WebRTC data channel file transfer in the browser
5. Fall back to S3 mode if WebRTC fails (e.g. strict corporate firewalls)

**Deliverable:** Two browsers on different networks can transfer a file directly, with no data passing through S3.

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      USER'S BROWSER                          │
│   React + Vite (served by CloudFront + S3)                   │
│                                                              │
│   Upload Page              Receive Page                      │
│   - file picker            - code input                      │
│   - drag & drop            - file preview                    │
│   - validation             - download button                 │
│   - access code display    - expiry warning                  │
└────────────────────┬─────────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼─────────────────────────────────────────┐
│                   API Gateway (HTTP API)                      │
│   POST /upload          GET /retrieve/{code}                 │
└───────┬─────────────────────────┬────────────────────────────┘
        │                         │
┌───────▼──────────┐   ┌──────────▼──────────┐
│ Lambda: upload   │   │ Lambda: retrieve     │
│                  │   │                      │
│ 1. validate      │   │ 1. read DynamoDB     │
│ 2. store → S3    │   │ 2. check expiry      │
│ 3. write →       │   │ 3. generate          │
│    DynamoDB      │   │    pre-signed URL    │
│ 4. return code   │   │ 4. return URL        │
└──────┬───────────┘   └──────────┬───────────┘
       │                          │
       ▼                          ▼
┌──────────────┐       ┌─────────────────────┐
│  Amazon S3   │       │   Amazon DynamoDB   │
│              │       │                     │
│  uploads/    │       │  accessCode  (PK)   │
│  {code}/     │       │  s3Key              │
│  {filename}  │       │  fileName           │
│              │       │  fileSize           │
│              │       │  contentType        │
│              │       │  expiresAt  (TTL)   │
│              │       │  createdAt          │
└──────────────┘       └─────────────────────┘
```

---

## Data Flow

**Upload:**
1. User picks a file in the browser
2. Browser validates type and size locally (Module 2)
3. Browser `POST /upload` to API Gateway with the file
4. Lambda stores file in S3, writes metadata to DynamoDB, returns a 6-char code
5. Browser shows the code and a QR code

**Retrieve:**
1. User enters the 6-char code
2. Browser `GET /retrieve/{code}` to API Gateway
3. Lambda reads DynamoDB, checks expiry, generates a 15-minute pre-signed S3 URL
4. Browser receives the URL and lets the user download the file directly from S3

---

*This roadmap is updated at the end of each module. Last updated: 2026-09-10 — Module 11 complete.*
