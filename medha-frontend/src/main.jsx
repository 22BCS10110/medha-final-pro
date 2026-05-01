// Global safety shim: some third-party / Chromium inline handlers reference
// a `dragEvent` symbol that isn't defined in this build, throwing
// "ReferenceError: dragEvent is not defined" and interrupting React's render
// cycle. Defining a no-op on window before React mounts neutralizes it.
if (typeof window !== "undefined") {
  window.dragEvent = function () {};
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
