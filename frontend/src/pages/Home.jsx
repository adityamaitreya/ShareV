import Header from '../components/Header'
import FileUpload from '../components/FileUpload'
import CodeEntry from '../components/CodeEntry'
import Footer from '../components/Footer'

function Home() {
  return (
    <div className="dashboard">
      <div className="dashboard-main">

        <Header />

        {/* Stats bar */}
        <div className="stats-bar" role="region" aria-label="Service statistics">
          <div className="stat-card">
            <div className="stat-card__icon" aria-hidden="true">📤</div>
            <div className="stat-card__label">Max File Size</div>
            <div className="stat-card__value">25<span style={{fontSize:'1rem',fontWeight:500}}>MB</span></div>
            <div className="stat-card__sub">Per upload</div>
          </div>

          <div className="stat-card stat-card--accent">
            <div className="stat-card__icon" aria-hidden="true">⏱️</div>
            <div className="stat-card__label">Code Expiry</div>
            <div className="stat-card__value">24<span style={{fontSize:'1rem',fontWeight:500}}>h</span></div>
            <div className="stat-card__sub">Auto-deleted after</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon" aria-hidden="true">🔑</div>
            <div className="stat-card__label">Code Length</div>
            <div className="stat-card__value">6</div>
            <div className="stat-card__sub">Alphanumeric chars</div>
          </div>

          <div className="stat-card stat-card--brand">
            <div className="stat-card__icon" aria-hidden="true">🛡️</div>
            <div className="stat-card__label">Encryption</div>
            <div className="stat-card__value" style={{fontSize:'1.25rem'}}>AES-256</div>
            <div className="stat-card__sub">At rest + in transit</div>
          </div>
        </div>

        {/* Main panels */}
        <div className="content-grid">
          <FileUpload />
          <CodeEntry />
        </div>

        <Footer />
      </div>
    </div>
  )
}

export default Home
