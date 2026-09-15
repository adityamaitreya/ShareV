import { useState, useRef } from 'react'
import {
  validateFile,
  formatBytes,
  getFileIcon,
  ACCEPT_STRING,
} from '../utils/fileValidation'
import { uploadFile } from '../services/api'

function FileUpload() {
  const [file,        setFile]        = useState(null)
  const [error,       setError]       = useState(null)   // { message, hint }
  const [status,      setStatus]      = useState('idle') // idle | uploading | success | fail
  const [accessCode,  setAccessCode]  = useState('')
  const [expiresAt,   setExpiresAt]   = useState(null)
  const [failMsg,     setFailMsg]     = useState('')
  const [isDragging,  setIsDragging]  = useState(false)
  const [copied,      setCopied]      = useState(false)

  const inputRef = useRef(null)

  function pick(f) {
    if (!f) return
    setStatus('idle'); setAccessCode(''); setExpiresAt(null); setFailMsg(''); setCopied(false)
    setFile(f)
    const v = validateFile(f)
    setError(v.valid ? null : { message: v.error, hint: v.hint })
  }

  function dropzoneClass() {
    if (isDragging)          return 'dropzone dropzone--dragging'
    if (error && file)       return 'dropzone dropzone--invalid'
    if (file && !error)      return 'dropzone dropzone--valid'
    return 'dropzone'
  }

  function remove(e) {
    e.stopPropagation()
    setFile(null); setError(null); setStatus('idle')
    setAccessCode(''); setExpiresAt(null); setFailMsg(''); setCopied(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function upload() {
    if (!file || error) return
    setStatus('uploading')
    try {
      const data = await uploadFile(file)
      setAccessCode(data.accessCode)
      setExpiresAt(data.expiresAt)
      setStatus('success')
    } catch (e) {
      setFailMsg(e.message)
      setStatus('fail')
    }
  }

  function copy() {
    navigator.clipboard?.writeText(accessCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card">
      <div>
        <p className="card__title">Upload a file</p>
        <p className="card__desc">Max 25 MB — file auto-expires in 24 h</p>
      </div>

      {/* Drop zone */}
      <div
        className={dropzoneClass()}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false) }}
        onDrop={e => { e.preventDefault(); setIsDragging(false); pick(e.dataTransfer.files[0]) }}
        role="button"
        tabIndex={0}
        aria-label="Click or drag a file here"
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_STRING}
          onChange={e => pick(e.target.files[0])}
          style={{ display: 'none' }}
          aria-hidden="true"
        />

        {file ? (
          <div className="file-preview">
            <span aria-hidden="true">{getFileIcon(file.type)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="file-preview__name" title={file.name}>{file.name}</p>
              <p className="file-preview__meta">{formatBytes(file.size)}</p>
            </div>
            <button className="file-preview__remove" onClick={remove} aria-label="Remove file">✕</button>
          </div>
        ) : (
          <div>
            <p className="dropzone__text">{isDragging ? 'Drop file here' : 'Click to browse or drag & drop'}</p>
            <p className="dropzone__hint">Images, PDFs, documents, code, ZIP — up to 25 MB</p>
          </div>
        )}
      </div>

      {/* Validation error */}
      {error && (
        <div className="error-banner" role="alert">
          <p>{error.message}</p>
          {error.hint && <p className="error-banner__hint">{error.hint}</p>}
        </div>
      )}

      {/* Upload button */}
      <button
        className="btn btn--primary btn--full"
        onClick={upload}
        disabled={!file || !!error || status === 'uploading'}
        aria-busy={status === 'uploading'}
      >
        {status === 'uploading'
          ? <><span className="spinner" aria-hidden="true" /> Uploading…</>
          : 'Upload & get code'
        }
      </button>

      {/* Success */}
      {status === 'success' && (
        <div className="result result--success" role="status" aria-live="polite">
          <p className="result__label">Your access code</p>
          <p className="result__code" aria-label={`Access code: ${accessCode}`}>{accessCode}</p>
          <p className="result__hint">
            Share this code. Expires {expiresAt ? new Date(expiresAt).toLocaleString() : 'in 24 hours'}.
          </p>
          <button className="btn btn--outline" onClick={copy}>
            {copied ? 'Copied!' : 'Copy code'}
          </button>
        </div>
      )}

      {/* Fail */}
      {status === 'fail' && (
        <div className="result result--error" role="alert">
          <p className="result__error-msg">{failMsg || 'Upload failed. Please try again.'}</p>
        </div>
      )}

      {/* Info */}
      <div className="info-strip" aria-label="Security info">
        {['Encrypted at rest', 'No account needed', 'Auto-deleted'].map(t => (
          <span className="info-strip__tag" key={t}>{t}</span>
        ))}
      </div>
    </div>
  )
}

export default FileUpload
