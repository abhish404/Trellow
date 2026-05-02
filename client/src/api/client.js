import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api')
});

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  e => {
    // #region agent log
    if (!e.response) { fetch('http://127.0.0.1:7798/ingest/3368b27f-854e-4326-adf9-0e121c4c230d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6cf5fd'},body:JSON.stringify({sessionId:'6cf5fd',hypothesisId:'D',location:'client.js:axios-no-response',message:'request failed before HTTP response',data:{baseURL:e.config?.baseURL,url:e.config?.url,code:e.code,msg:String(e.message||'').slice(0,120)},timestamp:Date.now()})}).catch(()=>{}); }
    // #endregion
    const isAuthRoute = e.config?.url?.startsWith('/auth/login') || e.config?.url?.startsWith('/auth/signup');
    if (e.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(e);
  }
);

export default api;
