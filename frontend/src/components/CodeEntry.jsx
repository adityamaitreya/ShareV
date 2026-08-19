import { useState } from 'react'

/*
  CodeEntry.jsx — lets User B enter an access code to retrieve a file.

  Key concepts used here:
  -----------------------
  - Controlled input: the <input> value is always driven by React state.
    Every keystroke calls setCode(), which updates state, which re-renders
    the input with the new value. React stays the "single source of truth"
    for what is typed.

  - Form submission: we listen for the Enter key AND the button click,
    so keyboard users don't have to reach for the mouse.

  Note: No real lookup happens yet. In Module 9 we will replace
  handleAccess with a real API call to the retrieve Lambda.
*/

// A valid code is exactly 6 uppercase alphanumeric characters
function isValidCode(code) {
  return /^[A-Z0-9]{6}$/.test(code)
}

function CodeEntry() {
  // The text currently typed in the input
  const [code, setCode] = useState('')

  // 'idle' | 'loading' | 'found' | 'not-found' | 'expired'
  const [status, setStatus] = useState('idle')

  // Mock file info returned after a successful lookup
  const [fileInfo, setFileInfo] = useState(null)

  // ── Helpers ─────────────────────────────────────────────────

  // Keep input uppercase and max 6 chars as user types
  function handleChange(e) {
    const cleaned = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setCode(cleaned)
    // Clear previous result when the user starts retyping
    if (status !== 'idle') {
      setStatus('idle')
      setFileInfo(null)
    }
  }

  /*
    handleAccess — MOCK only for now.
    Simulates three scenarios based on the code entered:
      DEMO12 → "found" with a mock PDF file
      EXPIRY → "expired"
      anything else → "not found"
  */
  function handleAccess() {
    if (!isValidCode(code)) return
    setStatus('loading')

    setTimeout(() => {
      if (code === 'DEMO12') {
        setFileInfo({
          name: 'project-brief.pdf',
          size: '1.2 MB',
          type: 'application/pdf',
          uploadedAt: 'Just now',
        })
        setStatus('found')
      } else if (code === 'EXPIRY') {
        setStatus('expired')
      } else {
        setStatus('not-found')
      }
    }, 1200)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAccess()
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

      {/* ── Result states ── */}

      {status === 'found' && fileInfo && (
        <div className="result-box result-box--success" role="status" aria-live="polite">
          <p className="result-box__label">File found</p>
          <div className="file-preview file-preview--result">
            <span className="file-preview__icon" aria-hidden="true">📄</span>
            <div className="file-preview__info">
              <p className="file-preview__name">{fileInfo.name}</p>
              <p className="file-preview__meta">
                {fileInfo.size} &middot; Shared {fileInfo.uploadedAt}
              </p>
            </div>
          </div>
          <button className="btn btn--primary" aria-label={`Download ${fileInfo.name}`}>
            Download File
          </button>
        </div>
      )}

      {status === 'not-found' && (
        <div className="result-box result-box--error" role="alert">
          <p>
            <strong>Code not found.</strong> Double-check the code and try again.
          </p>
        </div>
      )}

      {status === 'expired' && (
        <div className="result-box result-box--warning" role="alert">
          <p>
            <strong>This code has expired.</strong> Ask the sender to share a new one.
          </p>
        </div>
      )}

      {/* Demo hint for testers */}
      {/* <p className="demo-hint">
        Try code <strong>DEMO12</strong> to see a found result, or <strong>EXPIRY</strong> for an expired one.
      </p> */}
    </section>
  )
}

export default CodeEntry
