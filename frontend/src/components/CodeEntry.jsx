import { useState } from 'react'
import { retrieveFile } from '../services/api'
import { formatBytes, getFileIcon } from '../utils/fileValidation'

function isValidCode(code) {
  return /^[A-Z0-9]{6}$/.test(code)
}

function CodeEntry() {
  const [code,     setCode]     = useState('')
  const [status,   setStatus]   = useState('idle')  // idle | loading | found | not-found | expired | error
  const [fileInfo, setFileInfo] = useState(null)
  const [apiError, setApiError] = useState(null)

  function handleChange(e) {
    const cleaned = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setCode(cleaned)
    if (status !== 'idle') { setStatus('idle'); setFileInfo(null); setApiError(null) }
  }

  async function handleAccess() {
    if (!isValidCode(code)) return
    setStatus('loading')
    setApiError(null)
    try {
      const data = await retrieveFile(code)
      setFileInfo(data)
      setStatus('found')
    } catch (err) {
      if (err.message.includes('not found'))  setStatus('not-found')
      else if (err.message.includes('expired')) setStatus('expired')
      else { setApiError(err.message); setStatus('error') }
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAccess()
  }

  function handleDownload() {
    if (!fileInfo?.url) return
    const a = document.createElement('a')
    a.href = fileInfo.url
    a.download = fileInfo.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <section className="panel" aria-label="Retrieve a shared file">
      <div className="panel__header">
        <div className="panel__title-group">
          <h2 className="panel__title">Receive a File</h2>
          <p className="panel__subtitle">Enter your 6-character code to download</p>
        </div>
        <div className="panel__icon-wrap panel__icon-wrap--retrieve" aria-hidden="true">🔑</div>
      </div>

      {/* Code input */}
      <div className="code-input-row">
        <input
          className="code-input"
          type="text"
          value={code}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="AB12CD"
          maxLength={6}
          aria-label="Enter 6-character access code"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          className="btn btn--primary"
          onClick={handleAccess}
          disabled={!isValidCode(code) || status === 'loading'}
          aria-busy={status === 'loading'}
        >
          {status === 'loading'
            ? <><span className="spinner" aria-hidden="true" /> Checking…</>
            : 'Access'
          }
        </button>
      </div>

      <p className="code-hint" aria-live="polite">
        {code.length}/6 characters
        {code.length > 0 && code.length < 6 && ' — keep typing'}
        {code.length === 6 && isValidCode(code) && ' — press Access or Enter'}
      </p>

      {/* How it works strip */}
      {status === 'idle' && (
        <div className="security-strip" aria-label="How it works">
          {[
            { icon: '1️⃣', label: 'Enter code' },
            { icon: '2️⃣', label: 'Verify & decrypt' },
            { icon: '3️⃣', label: 'Download file' },
          ].map(({ icon, label }) => (
            <div className="security-strip__badge" key={label}>
              <span aria-hidden="true">{icon}</span>
              {label}
            </div>
          ))}
        </div>
      )}

      {/* File found */}
      {status === 'found' && fileInfo && (
        <div className="result-box result-box--success" role="status" aria-live="polite">
          <p className="result-box__label">✓ File found</p>
          <div className="file-preview file-preview--result">
            <span className="file-preview__icon" aria-hidden="true">
              {getFileIcon(fileInfo.contentType)}
            </span>
            <div className="file-preview__info">
              <p className="file-preview__name">{fileInfo.fileName}</p>
              <p className="file-preview__meta">
                {formatBytes(fileInfo.fileSize)} · Expires {new Date(fileInfo.expiresAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>
          <button
            className="btn btn--accent btn--full"
            onClick={handleDownload}
            aria-label={`Download ${fileInfo.fileName}`}
          >
            ⬇ Download File
          </button>
        </div>
      )}

      {/* Not found */}
      {status === 'not-found' && (
        <div className="result-box result-box--error" role="alert">
          <p><strong>Code not found.</strong> Double-check the code and try again.</p>
        </div>
      )}

      {/* Expired */}
      {status === 'expired' && (
        <div className="result-box result-box--warning" role="alert">
          <p><strong>This link has expired.</strong> Ask the sender to share a new one.</p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="result-box result-box--error" role="alert">
          <p>{apiError || 'Something went wrong. Please try again.'}</p>
        </div>
      )}

      {/* Security info */}
      <div className="security-strip" aria-label="Security info">
        {['Pre-signed URL', '15min Download Link', 'AES-256', 'Zero Logging'].map(label => (
          <div className="security-strip__badge" key={label}>
            <span className="security-strip__dot" aria-hidden="true" />
            {label}
          </div>
        ))}
      </div>
    </section>
  )
}

export default CodeEntry
