function Footer() {
  return (
    <footer className="footer">
      <span className="footer__text">© {new Date().getFullYear()} ShareV</span>
      <div className="footer__links">
        <a className="footer__link" href="#">Privacy</a>
        <a className="footer__link" href="#">Security</a>
      </div>
    </footer>
  )
}

export default Footer
