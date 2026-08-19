import Header from '../components/Header'
import FileUpload from '../components/FileUpload'
import CodeEntry from '../components/CodeEntry'
import Footer from '../components/Footer'

/*
  Home.jsx — the single page of ShareV for Module 1.

  What is a "page" vs a "component"?
  -----------------------------------
  There is no technical difference in React — both are just functions.
  The convention is:
    components/ → reusable building blocks (Header, Button, Card…)
    pages/      → full screens that the router maps a URL to

  This page composes smaller components together into a full layout.
  It does not contain any logic itself — that lives inside each component.
*/

function Home() {
  return (
    <div className="page">
      <Header />

      <main className="main">
        {/* Hero section — brief description of what ShareV does */}
        {/* <section className="hero">
          <h1 className="hero__title">
            Share anything.<br />
            <span className="hero__accent">Instantly.</span>
          </h1>
          <p className="hero__body">
            Upload a file or text — get a short code. Share the code.
            The recipient downloads it. No accounts, no sign-up, no friction.
          </p>
        </section> */}

        {/* Two-column grid on desktop, stacked on mobile */}
        <div className="cards-grid">
          <FileUpload />
          <CodeEntry />
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Home
