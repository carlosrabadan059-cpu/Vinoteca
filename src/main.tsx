import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useSyncStore } from './store/syncStore'
import { syncQueue } from './lib/syncQueue'

window.addEventListener('online',  () => { useSyncStore.getState().setIsOnline(true);  syncQueue().catch(console.error) })
window.addEventListener('offline', () => { useSyncStore.getState().setIsOnline(false) })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
