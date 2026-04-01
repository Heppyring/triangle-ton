import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { TonConnectUIProvider } from '@tonconnect/ui-react'

ReactDOM.createRoot(document.getElementById('root')).render(
  <TonConnectUIProvider manifestUrl="https://chronically-brightish-freida.ngrok-free.dev/tonconnect-manifest.json">
    <App />
  </TonConnectUIProvider>
)