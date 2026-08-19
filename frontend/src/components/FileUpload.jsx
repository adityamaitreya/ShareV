import { useState, useRef } from 'react'
import {
  validateFile,
  formatBytes,
  getFileIcon,
  getReadableType,
  ACCEPT_STRING,
} from '../utils/fileValidation'

/*
  FileUpload.jsx — Module 2: file selection + client-side validation.

  STATE DESIGN
  ────────────
  We track five independent pieces of state. Each one has a single
  clear job:

    selectedFile      The File object the user picked, or null.
    validationError   Object { error, hint } when the file is invalid,
                      or null when everything is fine.
    uploadStatus      The lifecycle of the upload action itself:
                      'idle' | 'uploading' | 'success' | 'error'
    accessCode        The code returned after a successful upload.
    isDragging        Whether a file is being dragged over the zone.

  VALIDATION FLOW
  ───────────────
  Every time the user picks or drops a file we immediately call
  validateFile(file). Three outcomes are possible:

    ┌─────────────────────┬───────────────┬────────────────────┐
    │ What happened        │ selectedFile  │ validationError    │
    ├─────────────────────┼───────────────┼────────────────────┤
    │ No file              │ null          │ null               │
    │ Invalid file         │ file (set)    │ { error, hint }    │
    │ Valid file           │ file (set)    │ null               │
    └─────────────────────┴───────────────┴────────────────────┘

  We always store the file even when it is invalid. This lets us
  show the file name in the error message ("resume.exe is not a
  supported type") so the user knows exactly which file was rejected.

  BUTTON DISABLE LOGIC
  ────────────────────
  The Upload button is disabled when ANY of these is true:
    • no file is selected
    • there is a validation error
    • an upload is already in progress

  Written as:  disabled={!selectedFile || !!validationError || uploadStatus === 'uploading'}
*/

function FileUpload() {
  const [selectedFile,    setSelectedFile]    = useState(null)
  const [validationError, setValidationError] = useState(null)   // null | { error, hint }
  const [uploadStatus,    setUploadStatus]    = useState('idle')  // 'idle'|'uploading'|'success'|'error'
  const [accessCode,      setAccessCode]      = useState('')
  const [isDragging,      setIsDragging]      = useState(false)

  const fileInputRef = useRef(null)

  // ── Core: process any picked/dropped file ────────────────────
  /*
    processFile is called both from the <input onChange> handler and
    from the drag-and-drop handler. Centralising it means the same
    validation runs no matter HOW the user selects a file.
  */
  function processFile(file) {
    if (!file) return

    // Always reset upload state when a new file is chosen
    setUploadStatus('idle')
    setAccessCode('')
    setSelectedFile(file)

    // Run validation and store the result
    const result = validateFile(file)
    if (result.valid) {
      setValidationError(null)
    } else {
      setValidationError({ error: result.error, hint: result.hint })
    }
  }

  // ── Event handlers ───────────────────────────────────────────

  function handleFileChange(e) {
    processFile(e.target.files[0])
  }

  function handleDragOver(e) {
    e.preventDefault()          // required — without this, drop won't fire
    setIsDragging(true)
  }

  function handleDragLeave(e) {
    /*
      Only set isDragging=false when the cursor actually leaves the
      drop zone element. Without this check, moving the mouse over a
      child element (like the icon text) would incorrectly fire
      DragLeave and flash the border back to normal.
    */
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    processFile(e.dataTransfer.files[0])
  }

  function handleRemoveFile() {
    setSelectedFile(null)
    setValidationError(null)
    setUploadStatus('idle')
    setAccessCode('')
    // Reset the hidden input so selecting the same file again fires onChange
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /*
    handleUpload — still a mock for now.
    The guard at the top mirrors the disabled attribute on the button,
    so even if someone calls this function programmatically it won't run.
    In Module 5 this is replaced with a real fetch() call to API Gateway.
  */
  function handleUpload() {
    if (!selectedFile || validationError) return
    setUploadStatus('uploading')

    setTimeout(() => {
      const mockCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      setAccessCode(mockCode)
      setUploadStatus('success')
    }, 1500)
  }

  // ── Derived values (computed from state, not stored) ─────────
  /*
    Why derived values instead of more state?
    -----------------------------------------
    If you store "isButtonDisabled" in state you have to remember
    to update it every time selectedFile or validationError changes.
    Computing it on the fly from existing state is simpler and
    can never get out of sync.
  */
  const isButtonDisabled = !selectedFile || !!validationError || uploadStatus === 'uploading'
  const isFileValid      = selectedFile && !validationError

  /*
    dropzoneClass — builds the CSS class string for the drop zone.
    We use three modifier classes that can be combined:
      dropzone--dragging   user is hovering with a file
      dropzone--invalid    the dropped/picked file failed validation
      dropzone--valid      the file passed validation
  */
  function dropzoneClass() {
    const base = 'dropzone'
    if (isDragging)    return `${base} dropzone--dragging`
    if (validationError && selectedFile) return `${base} dropzone--invalid`
    if (isFileValid)   return `${base} dropzone--valid`
    return base
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <section className="card" aria-label="Upload a file">
      <h2 className="card-title">
        <span className="card-icon" aria-hidden="true">📤</span>
        Share a File
      </h2>
      <p className="card-subtitle">
        Upload a file and get a shareable access code — no account needed.
      </p>

      {/* ── Drop zone ─────────────────────────────────────────── */}
      <div
        className={dropzoneClass()}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Click or drag a file here to select it"
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
      >
        {/* The real file input is hidden — the drop zone triggers it */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_STRING}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-hidden="true"
        />

        {selectedFile ? (
          /*
            File selected — show preview regardless of validity.
            The error banner below the drop zone explains the problem.
            Keeping the file name visible in the preview helps the user
            confirm they picked the wrong file before removing it.
          */
          <div className="file-preview">
            {/* Icon changes based on MIME type */}
            <span className="file-preview__icon" aria-hidden="true">
              {getFileIcon(selectedFile.type)}
            </span>

            <div className="file-preview__info">
              <p className="file-preview__name" title={selectedFile.name}>
                {selectedFile.name}
              </p>
              <p className="file-preview__meta">
                {formatBytes(selectedFile.size)}
                {' · '}
                {getReadableType(selectedFile.type)}
              </p>
            </div>

            {/*
              stopPropagation() prevents the click from bubbling up to
              the drop zone div, which would reopen the file picker.
            */}
            <button
              className="file-preview__remove"
              onClick={(e) => { e.stopPropagation(); handleRemoveFile() }}
              aria-label={`Remove ${selectedFile.name}`}
              title="Remove file"
            >
              ✕
            </button>
          </div>
        ) : (
          /* No file yet — invitation text */
          <div className="dropzone__invite">
            <span className="dropzone__icon" aria-hidden="true">
              {isDragging ? '📂' : '📁'}
            </span>
            <p className="dropzone__primary">
              {isDragging ? 'Drop it here!' : 'Click to browse or drag & drop'}
            </p>
            <p className="dropzone__secondary">
              Images, PDFs, Word/Excel, code files, ZIPs — up to 25 MB
            </p>
          </div>
        )}
      </div>

      {/* ── Validation error banner ────────────────────────────── */}
      {/*
        This renders ONLY when there is a validation error.
        It sits outside the drop zone so the error message never
        competes for space with the file preview inside.

        aria-live="polite" tells screen readers to announce this
        region when its content changes, without interrupting the
        user if they are in the middle of something.
      */}
      {validationError && (
        <div className="validation-error" role="alert" aria-live="polite">
          <span className="validation-error__icon" aria-hidden="true">⚠️</span>
          <div className="validation-error__body">
            <p className="validation-error__message">{validationError.error}</p>
            {validationError.hint && (
              <p className="validation-error__hint">{validationError.hint}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Upload button ──────────────────────────────────────── */}
      {/*
        Three disable conditions explained:
          !selectedFile         → nothing picked yet
          !!validationError     → file failed validation (!! converts to boolean)
          uploading             → request in flight, don't double-submit
      */}
      <button
        className="btn btn--primary"
        onClick={handleUpload}
        disabled={isButtonDisabled}
        aria-busy={uploadStatus === 'uploading'}
        aria-describedby={validationError ? 'validation-error-msg' : undefined}
      >
        {uploadStatus === 'uploading' ? (
          <><span className="spinner" aria-hidden="true" /> Uploading…</>
        ) : (
          'Upload & Get Code'
        )}
      </button>

      {/* ── Success result ─────────────────────────────────────── */}
      {uploadStatus === 'success' && (
        <div className="result-box result-box--success" role="status" aria-live="polite">
          <p className="result-box__label">Your access code</p>
          <p
            className="result-box__code"
            aria-label={`Access code: ${accessCode}`}
          >
            {accessCode}
          </p>
          <p className="result-box__hint">
            Share this code with anyone. It expires in <strong>24 hours</strong>.
          </p>
          <button
            className="btn btn--ghost"
            onClick={() => navigator.clipboard?.writeText(accessCode)}
            aria-label="Copy access code to clipboard"
          >
            Copy Code
          </button>
        </div>
      )}

      {/* ── Upload error ───────────────────────────────────────── */}
      {uploadStatus === 'error' && (
        <div className="result-box result-box--error" role="alert">
          <p>Something went wrong during upload. Please try again.</p>
        </div>
      )}
    </section>
  )
}

export default FileUpload
