import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { UserDataProvider } from './store/UserDataProvider'
import { registerPWA } from './pwa'
import './styles.css'

registerPWA()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UserDataProvider>
      <App />
    </UserDataProvider>
  </React.StrictMode>,
)
