import { useState, useRef } from 'react'
import {
  validateFile,
  formatBytes,
  getFileIcon,
  getReadableType,
  ACCEPT_STRING,
} from '../utils/fileValidation'
import { uploadFile } from '../services/api'

function FileUpload() {
  const [selectedFile,    setSelectedFile]    = useState(null)
  const [validationError, setValidationError] = useState(null)   // null | { error, hint }
  const [uploadStatus,    setUploadStatus]    = useState('idle')  // 'idle'|'uploading'|'success'|'error'
  const [accessCode,      setAccessCode]      = useState('')
  const [expiresAt,       setExpiresAt]       = useState(null)   // ISO string from API
  const [uploadError,     setUploadError]     = useState(null)   // user-facing error message
  const [isDragging,      setIsDragging]      = useState(false)

  const fileInputRef = useRef(null)

  // ── Core: process any picked/dropped file ────────────────────
  function processFile(file) {
    if (!file) return
    setUploadStatus('idle')
    setAccessCode('')
    setExpiresAt(null)
    setUploadError(null)
    setSelectedFile(file)

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
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e) {
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
    setExpiresAt(null)
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Real upload — sends file to API Gateway → Lambda → S3 + DynamoDB
  async function handleUpload() {
    if (!selectedFile || validationError) return
    setUploadStatus('uploading')
    setUploadError(null)

    try {
      const data = await uploadFile(selectedFile)
      setAccessCode(data.accessCode)
      setExpiresAt(data.expiresAt)
      setUploadStatus('success')
    } catch (err) {
      setUploadError(err.message)
      setUploadStatus('error')
    }
  }

  // ── Derived values ───────────────────────────────────────────
  const isButtonDisabled = !selectedFile || !!validationError || uploadStatus === 'uploading'
  const isFileValid      = selectedFile && !validationError

  function dropzoneClass() {
    const base = 'dropzone'
    if (isDragging)                        return `${base} dropzone--dragging`
    if (validationError && selectedFile)   return `${base} dropzone--invalid`
    if (isFileValid)                       return `${base} dropzone--valid`
    return base
  }

  // Format the expiry timestamp into a readable string
  function formatExpiry(isoString) {
    if (!isoString) return ''
    return new Date(isoString).toLocaleString()
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
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_STRING}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-hidden="true"
        />

        {selectedFile ? (
          <div className="file-preview">
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
      <button
        className="btn btn--primary"
        onClick={handleUpload}
        disabled={isButtonDisabled}
        aria-busy={uploadStatus === 'uploading'}
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
          <p className="result-box__code" aria-label={`Access code: ${accessCode}`}>
            {accessCode}
          </p>
          <p className="result-box__hint">
            Share this code with anyone. Expires on <strong>{formatExpiry(expiresAt)}</strong>.
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
          <p>{uploadError || 'Something went wrong during upload. Please try again.'}</p>
        </div>
      )}
    </section>
  )
}

export default FileUpload
