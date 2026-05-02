import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// #region agent log
fetch('http://127.0.0.1:7798/ingest/3368b27f-854e-4326-adf9-0e121c4c230d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6cf5fd'},body:JSON.stringify({sessionId:'6cf5fd',runId:typeof window!=='undefined'&&window.location?.hostname? 'browser':'pre',hypothesisId:'A',location:'main.jsx:boot',message:'vite env at runtime',data:{viteApiUrl:import.meta.env.VITE_API_URL,mode:import.meta.env.MODE,prod:import.meta.env.PROD,origin:typeof window!=='undefined'?window.location?.origin:null,host:typeof window!=='undefined'?window.location?.hostname:null},timestamp:Date.now()})}).catch(()=>{});
// #endregion

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
