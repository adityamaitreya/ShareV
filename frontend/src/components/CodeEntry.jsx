import { useState } from 'react'
import { retrieveFile } from '../services/api'
import { formatBytes, getFileIcon } from '../utils/fileValidation'

// A valid code is exactly 6 uppercase alphanumeric characters
function isValidCode(code) {
  return /^[A-Z0-9]{6}$/.test(code)
}

function CodeEntry() {
  const [code,     setCode]     = useState('')
  const [status,   setStatus]   = useState('idle')  // 'idle'|'loading'|'found'|'not-found'|'expired'|'error'
  const [fileInfo, setFileInfo] = useState(null)    // response from API
  const [apiError, setApiError] = useState(null)    // user-facing error message

  // ── Helpers ─────────────────────────────────────────────────
  function handleChange(e) {
    const cleaned = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setCode(cleaned)
    if (status !== 'idle') {
      setStatus('idle')
      setFileInfo(null)
      setApiError(null)
    }
  }

  // ── Real lookup — calls API Gateway → Lambda → DynamoDB ─────
  async function handleAccess() {
    if (!isValidCode(code)) return
    setStatus('loading')
    setApiError(null)

    try {
      const data = await retrieveFile(code)
      setFileInfo(data)
      setStatus('found')
    } catch (err) {
      // Map specific error messages to the right UI state
      if (err.message.includes('not found')) {
        setStatus('not-found')
      } else if (err.message.includes('expired')) {
        setStatus('expired')
      } else {
        setApiError(err.message)
        setStatus('error')
      }
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAccess()
  }

  // Trigger the browser download using the pre-signed URL
  function handleDownload() {
    if (!fileInfo?.url) return
    const a = document.createElement('a')
    a.href = fileInfo.url
    a.download = fileInfo.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <section className="card" aria-label="Retrieve a shared file">
      <h2 className="card-title">
        <span className="card-icon" aria-hidden="true">🔑</span>
        Receive a File
      </h2>
      <p className="card-subtitle">
        Got a code? Enter it below to access the shared file.
      </p>

      <div className="code-input-row">
        <input
          className="code-input"
          type="text"
          value={code}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="e.g. AB12CD"
          maxLength={6}
          aria-label="Enter access code"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          className="btn btn--primary"
          onClick={handleAccess}
          disabled={!isValidCode(code) || status === 'loading'}
          aria-busy={status === 'loading'}
        >
          {status === 'loading' ? (
            <><span className="spinner" aria-hidden="true" /> Checking…</>
          ) : (
            'Access File'
          )}
        </button>
      </div>

      {/* Character counter hint */}
      <p className="code-hint" aria-live="polite">
        {code.length}/6 characters
        {code.length === 6 && !isValidCode(code) && ' — letters and numbers only'}
      </p>

      {/* ── Result: file found ──────────────────────────────────── */}
      {status === 'found' && fileInfo && (
        <div className="result-box result-box--success" role="status" aria-live="polite">
          <p className="result-box__label">File found</p>
          <div className="file-preview file-preview--result">
            <span className="file-preview__icon" aria-hidden="true">
              {getFileIcon(fileInfo.contentType)}
            </span>
            <div className="file-preview__info">
              <p className="file-preview__name">{fileInfo.fileName}</p>
              <p className="file-preview__meta">
                {formatBytes(fileInfo.fileSize)} · Expires {new Date(fileInfo.expiresAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            className="btn btn--primary"
            onClick={handleDownload}
            aria-label={`Download ${fileInfo.fileName}`}
          >
            Download File
          </button>
        </div>
      )}

      {/* ── Result: not found ───────────────────────────────────── */}
      {status === 'not-found' && (
        <div className="result-box result-box--error" role="alert">
          <p>
            <strong>Code not found.</strong> Double-check the code and try again.
          </p>
        </div>
      )}

      {/* ── Result: expired ─────────────────────────────────────── */}
      {status === 'expired' && (
        <div className="result-box result-box--warning" role="alert">
          <p>
            <strong>This link has expired.</strong> Ask the sender to share a new one.
          </p>
        </div>
      )}

      {/* ── Result: unexpected error ─────────────────────────────── */}
      {status === 'error' && (
        <div className="result-box result-box--error" role="alert">
          <p>{apiError || 'Something went wrong. Please try again.'}</p>
        </div>
      )}
    </section>
  )
}

export default CodeEntry
