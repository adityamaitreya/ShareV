/*
  fileValidation.js — all file validation rules for ShareV.

  WHY a separate file?
  --------------------
  Keeping validation logic out of the component has two benefits:
    1. The component stays focused on UI — it just calls validateFile()
       and reacts to the result.
    2. When the backend enforces the same rules later (Module 5), you
       only need to update limits in ONE place: this file.

  HOW validation works here
  -------------------------
  validateFile(file) returns an object with two fields:
    { valid: true }                       → file is fine
    { valid: false, error: "message" }    → file is rejected, show message

  The component checks `valid` to decide whether to enable the upload
  button and `error` to know what message to show.
*/

// ── Configuration ────────────────────────────────────────────
// Change these values in one place to update the rules everywhere.

export const MAX_FILE_SIZE_MB = 25
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024   // 26,214,400 bytes

/*
  ALLOWED_TYPES maps a MIME type pattern to a human-readable label.

  What is a MIME type?
  --------------------
  Every file has a MIME type — a standardised string the browser uses
  to describe what kind of data a file contains.
  Examples:
    "image/png"         → a PNG image
    "application/pdf"   → a PDF document
    "text/plain"        → a plain .txt file

  The browser reads the MIME type from the file itself (not just the
  extension), so a user cannot sneak in a renamed executable.

  We use a Map (an ordered key-value structure) so we can iterate
  over it to build the <input accept="…"> string automatically.
*/
export const ALLOWED_TYPES = new Map([
  // Images
  ['image/jpeg',      'JPEG image'],
  ['image/png',       'PNG image'],
  ['image/gif',       'GIF image'],
  ['image/webp',      'WebP image'],
  ['image/svg+xml',   'SVG image'],

  // Documents
  ['application/pdf', 'PDF document'],
  ['application/msword',
   'Word document (.doc)'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document',
   'Word document (.docx)'],
  ['application/vnd.ms-excel',
   'Excel spreadsheet (.xls)'],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
   'Excel spreadsheet (.xlsx)'],

  // Plain text & code  (text/* covers text/plain, text/html, text/css, etc.)
  ['text/plain',      'Text file'],
  ['text/html',       'HTML file'],
  ['text/css',        'CSS file'],
  ['text/javascript', 'JavaScript file'],
  ['text/typescript', 'TypeScript file'],
  ['text/csv',        'CSV file'],
  ['text/xml',        'XML file'],
  ['application/json','JSON file'],
  ['application/xml', 'XML file'],

  // Archives
  ['application/zip',             'ZIP archive'],
  ['application/x-zip-compressed','ZIP archive'],
  ['application/x-tar',           'TAR archive'],
  ['application/gzip',            'GZip archive'],
])

/*
  ACCEPT_STRING is the value passed to <input type="file" accept="…">.
  It tells the browser's file picker which files to show by default.
  Built automatically from ALLOWED_TYPES so it is always in sync.
*/
export const ACCEPT_STRING = [...ALLOWED_TYPES.keys()].join(',')

// ── Helpers ──────────────────────────────────────────────────

/*
  formatBytes(bytes) → human-readable string
  e.g.  0          → "0 Bytes"
        1024       → "1.0 KB"
        2621440    → "2.5 MB"
*/
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const units = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

/*
  getFileIcon(mimeType) → an emoji that matches the file category.
  Used in the file preview so users get a visual cue about what
  type of file they picked.
*/
export function getFileIcon(mimeType = '') {
  if (mimeType.startsWith('image/'))       return '🖼️'
  if (mimeType === 'application/pdf')      return '📕'
  if (mimeType.includes('word'))           return '📝'
  if (mimeType.includes('excel') ||
      mimeType.includes('spreadsheet'))    return '📊'
  if (mimeType.startsWith('text/') ||
      mimeType === 'application/json' ||
      mimeType === 'application/xml')      return '💻'
  if (mimeType.includes('zip') ||
      mimeType.includes('tar') ||
      mimeType.includes('gzip'))           return '🗜️'
  return '📄'
}

/*
  isMimeTypeAllowed(mimeType) → boolean
  Returns true if the MIME type is in our allowed list.

  Note: some browsers report an empty string for MIME type on
  unusual files. We treat that as "unknown" and reject it to be safe.
*/
function isMimeTypeAllowed(mimeType) {
  if (!mimeType) return false
  return ALLOWED_TYPES.has(mimeType)
}

/*
  getReadableType(mimeType) → string like "PDF document" or "JPEG image"
  Falls back to the raw MIME string if we don't have a label for it.
*/
export function getReadableType(mimeType = '') {
  return ALLOWED_TYPES.get(mimeType) ?? mimeType ?? 'Unknown type'
}

// ── Main validation function ─────────────────────────────────

/*
  validateFile(file) — the single function FileUpload.jsx calls.

  Parameters:
    file — a browser File object (from input.files[0] or drag-drop)

  Returns:
    { valid: true }
    { valid: false, error: string, hint?: string }

  We check three things in order:
    1. Does the file exist?        (safety guard)
    2. Is the MIME type allowed?   (type check)
    3. Is the file small enough?   (size check)

  Returning on the first failure gives the user a focused error
  message — one thing to fix at a time.
*/
export function validateFile(file) {
  // 1. Existence guard (should never happen, but be safe)
  if (!file) {
    return { valid: false, error: 'No file selected.' }
  }

  // 2. Type check
  if (!isMimeTypeAllowed(file.type)) {
    // Build a short, readable list of allowed categories for the hint
    const categories = 'Images, PDFs, Word/Excel documents, text & code files, ZIP archives'
    return {
      valid: false,
      error: `"${file.name}" is not a supported file type.`,
      hint:  `Allowed: ${categories}.`,
    }
  }

  // 3. Size check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${formatBytes(file.size)}).`,
      hint:  `Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`,
    }
  }

  // All checks passed
  return { valid: true }
}
