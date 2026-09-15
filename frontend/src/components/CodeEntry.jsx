import { useState } from 'react'
import { retrieveFile } from '../services/api'
import { formatBytes, getFileIcon } from '../utils/fileValidation'

function isValid(code) {
  return /^[A-Z0-9]{6}$/.test(code)
}

function CodeEntry() {
  const [code,    setCode]    = useState('')
  const [status,  setStatus]  = useState('idle') // idle | loading | found | notfound | expired | error
  const [info,    setInfo]    = useState(null)
  const [errMsg,  setErrMsg]  = useState('')

  function change(e) {
    const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setCode(v)
    if (status !== 'idle') { setStatus('idle'); setInfo(null); setErrMsg('') }
  }

  async function access() {
    if (!isValid(code)) return
    setStatus('loading')
    try {
      const data = await retrieveFile(code)
      setInfo(data)
      setStatus('found')
    } catch (e) {
      if (e.message.includes('not found'))  setStatus('notfound')
      else if (e.message.includes('expired')) setStatus('expired')
      else { setErrMsg(e.message); setStatus('error') }
    }
  }

  function download() {
    if (!info?.url) return
    const a = document.createElement('a')
    a.href = info.url
    a.download = info.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="card">
      <div>
        <p className="card__title">Receive a file</p>
        <p className="card__desc">Enter the 6-character code to download</p>
      </div>

      {/* Code input */}
      <div className="code-row">
        <input
          className="code-input"
          type="text"
          value={code}
          onChange={change}
          onKeyDown={e => e.key === 'Enter' && access()}
          placeholder="AB12CD"
          maxLength={6}
          aria-label="Enter access code"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          className="btn btn--primary"
          onClick={access}
          disabled={!isValid(code) || status === 'loading'}
          aria-busy={status === 'loading'}
        >
          {status === 'loading'
            ? <><span className="spinner" aria-hidden="true" /> Checking…</>
            : 'Access'
          }
        </button>
      </div>

      <p className="code-hint" aria-live="polite">{code.length}/6</p>

      {/* Found */}
      {status === 'found' && info && (
        <div className="result result--success" role="status" aria-live="polite">
          <p className="result__label">File found</p>
          <div className="result__file">
            <p className="result__file-name">
              {getFileIcon(info.contentType)} {info.fileName}
            </p>
            <p className="result__file-meta">
              {formatBytes(info.fileSize)} · expires {new Date(info.expiresAt).toLocaleString()}
            </p>
          </div>
          <button className="btn btn--primary btn--full" onClick={download}>
            Download file
          </button>
        </div>
      )}

      {/* Not found */}
      {status === 'notfound' && (
        <div className="result result--error" role="alert">
          <p className="result__error-msg">Code not found. Check and try again.</p>
        </div>
      )}

      {/* Expired */}
      {status === 'expired' && (
        <div className="result result--warning" role="alert">
          <p className="result__warning-msg">This link has expired.</p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="result result--error" role="alert">
          <p className="result__error-msg">{errMsg || 'Something went wrong. Try again.'}</p>
        </div>
      )}

      {/* Info */}
      <div className="info-strip" aria-label="Security info">
        {['Pre-signed URL', '15 min download link', 'AES-256'].map(t => (
          <span className="info-strip__tag" key={t}>{t}</span>
        ))}
      </div>
    </div>
  )
}

export default CodeEntry
