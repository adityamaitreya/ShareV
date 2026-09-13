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
  const [validationError, setValidationError] = useState(null)
  const [uploadStatus,    setUploadStatus]    = useState('idle')  // idle | uploading | success | error
  const [accessCode,      setAccessCode]      = useState('')
  const [expiresAt,       setExpiresAt]       = useState(null)
  const [uploadError,     setUploadError]     = useState(null)
  const [isDragging,      setIsDragging]      = useState(false)
  const [copied,          setCopied]          = useState(false)

  const fileInputRef = useRef(null)

  function processFile(file) {
    if (!file) return
    setUploadStatus('idle')
    setAccessCode('')
    setExpiresAt(null)
    setUploadError(null)
    setCopied(false)
    setSelectedFile(file)
    const result = validateFile(file)
    setValidationError(result.valid ? null : { error: result.error, hint: result.hint })
  }

  function handleFileChange(e)  { processFile(e.target.files[0]) }
  function handleDragOver(e)    { e.preventDefault(); setIsDragging(true) }
  function handleDrop(e)        { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files[0]) }
  function handleDragLeave(e)   {
    if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false)
  }

  function handleRemoveFile() {
    setSelectedFile(null); setValidationError(null); setUploadStatus('idle')
    setAccessCode(''); setExpiresAt(null); setUploadError(null); setCopied(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

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

  function handleCopy() {
    navigator.clipboard?.writeText(accessCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isButtonDisabled = !selectedFile || !!validationError || uploadStatus === 'uploading'
  const isFileValid      = selectedFile && !validationError

  function dropzoneClass() {
    if (isDragging)                      return 'dropzone dropzone--dragging'
    if (validationError && selectedFile) return 'dropzone dropzone--invalid'
    if (isFileValid)                     return 'dropzone dropzone--valid'
    return 'dropzone'
  }

  function formatExpiry(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  }

  return (
    <section className="panel" aria-label="Upload a file">
      <div className="panel__header">
        <div className="panel__title-group">
          <h2 className="panel__title">Share a File</h2>
          <p className="panel__subtitle">Upload and get a 6-character access code</p>
        </div>
        <div className="panel__icon-wrap panel__icon-wrap--upload" aria-hidden="true">📤</div>
      </div>

      {/* Drop zone */}
      <div
        className={dropzoneClass()}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Click or drag a file here to upload"
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
              <p className="file-preview__name" title={selectedFile.name}>{selectedFile.name}</p>
              <p className="file-preview__meta">
                {formatBytes(selectedFile.size)} · {getReadableType(selectedFile.type)}
              </p>
            </div>
            <button
              className="file-preview__remove"
              onClick={(e) => { e.stopPropagation(); handleRemoveFile() }}
              aria-label={`Remove ${selectedFile.name}`}
            >✕</button>
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
              Images, PDFs, Word, Excel, code files, ZIPs — up to 25 MB
            </p>
          </div>
        )}
      </div>

      {/* Validation error */}
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

      {/* Upload button */}
      <button
        className="btn btn--primary btn--full"
        onClick={handleUpload}
        disabled={isButtonDisabled}
        aria-busy={uploadStatus === 'uploading'}
      >
        {uploadStatus === 'uploading'
          ? <><span className="spinner" aria-hidden="true" /> Encrypting & uploading…</>
          : '⬆ Upload & Get Code'
        }
      </button>

      {/* Success */}
      {uploadStatus === 'success' && (
        <div className="result-box result-box--success" role="status" aria-live="polite">
          <p className="result-box__label">Your access code</p>
          <p className="result-box__code" aria-label={`Access code: ${accessCode}`}>
            {accessCode}
          </p>
          <p className="result-box__hint">
            Share this code with anyone. Expires <strong>{formatExpiry(expiresAt)}</strong>.
          </p>
          <div className="result-box__actions">
            <button className="btn btn--accent btn--full" onClick={handleCopy} aria-live="polite">
              {copied ? '✓ Copied!' : '📋 Copy Code'}
            </button>
          </div>
        </div>
      )}

      {/* Upload error */}
      {uploadStatus === 'error' && (
        <div className="result-box result-box--error" role="alert">
          <p>{uploadError || 'Upload failed. Please try again.'}</p>
        </div>
      )}

      {/* Security badges */}
      <div className="security-strip" aria-label="Security features">
        {['E2E Encrypted', 'No Login', 'Auto-Expires', 'Private S3'].map(label => (
          <div className="security-strip__badge" key={label}>
            <span className="security-strip__dot" aria-hidden="true" />
            {label}
          </div>
        ))}
      </div>
    </section>
  )
}

export default FileUpload
