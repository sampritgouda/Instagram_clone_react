import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { WebSocketProvider } from './context/WebSocketContext'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <WebSocketProvider>
      <App />
    </WebSocketProvider>
  </BrowserRouter>,
)
