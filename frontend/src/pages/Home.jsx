import Header from '../components/Header'
import FileUpload from '../components/FileUpload'
import CodeEntry from '../components/CodeEntry'
import Footer from '../components/Footer'

function Home() {
  return (
    <>
      <Header />
      <main className="main">
        <div>
          <h1 className="page-title">File sharing, no account required</h1>
          <p className="page-subtitle">
            Upload a file — get a 6-character code. Share the code. File auto-deletes after 24 hours.
          </p>
        </div>
        <div className="grid">
          <FileUpload />
          <CodeEntry />
        </div>
      </main>
      <Footer />
    </>
  )
}

export default Home
