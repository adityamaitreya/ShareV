function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <p className="footer__text">
        &copy; {year} ShareV — Secure, temporary file sharing. No account required.
      </p>
      <div className="footer__links">
        <a className="footer__link" href="#">Privacy</a>
        <a className="footer__link" href="#">Security</a>
        <a className="footer__link" href="#">Status</a>
      </div>
    </footer>
  )
}

export default Footer
