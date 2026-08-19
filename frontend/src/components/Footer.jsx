/*
  Footer.jsx — a simple footer shown at the bottom of every page.

  Keeping this in its own component means if you ever want to
  update the footer text, you change it in one place and every
  page reflects the update automatically.
*/

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <p className="footer__text">
        &copy; {year} ShareV &mdash; Secure, temporary file sharing. No account required.
      </p>
    </footer>
  )
}

export default Footer
