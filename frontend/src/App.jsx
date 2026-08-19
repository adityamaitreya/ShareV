import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'

/*
  App.jsx — the root of the entire React application.

  What is BrowserRouter?
  ----------------------
  React by itself only renders UI — it has no concept of "pages".
  BrowserRouter gives us URL-based navigation (e.g. /receive)
  without the page ever fully reloading. This is called a
  Single Page Application (SPA).

  What is Routes / Route?
  -----------------------
  Routes looks at the current URL and decides which component
  to show. Each <Route> maps one URL path to one component.

  Right now we only have one page (Home). In Module 9 we will
  add a second page for the Receive flow.
*/

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
