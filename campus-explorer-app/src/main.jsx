import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// const hasBootstrap = getComputedStyle(document.documentElement).getPropertyValue('--bs-gutter-x') !== "";
// console.log(hasBootstrap ? 'Bootstrap is loaded' : 'Bootstrap is not loaded');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
