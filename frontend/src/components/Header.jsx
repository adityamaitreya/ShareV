/*
  Header.jsx — the top bar of every page.

  What is a "component"?
  ----------------------
  A component is just a JavaScript function that returns HTML-like
  code (called JSX). React calls this function and puts its output
  on the screen. You can reuse a component anywhere, as many times
  as you want, like a reusable building block.

  This component holds:
    - The ShareV logo (text-based, no image needed yet)
    - The tagline
*/

function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        {/* Logo — the lightning bolt + name */}
        <div className="logo">
          <span className="logo-icon" aria-hidden="true">⚡</span>
          <span className="logo-text">ShareV</span>
        </div>

        {/* Tagline shown next to the logo on wide screens */}
        <p className="tagline">Share files. No login required.</p>
      </div>
    </header>
  )
}

export default Header
