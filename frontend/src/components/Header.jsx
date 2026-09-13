function Header() {
  return (
    <header className="topbar" aria-label="Site header">
      <div className="topbar__logo">
        <div className="topbar__logo-icon" aria-hidden="true">⚡</div>
        <span className="topbar__logo-text">ShareV</span>
      </div>
      <div className="topbar__right">
        <div className="topbar__badge">
          <span className="topbar__badge-dot" aria-hidden="true" />
          All systems operational
        </div>
      </div>
    </header>
  )
}

export default Header
