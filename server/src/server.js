import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  // #region agent log
  console.log('[debug-6cf5fd]', JSON.stringify({ sessionId: '6cf5fd', hypothesisId: 'F', location: 'server.js:listen', message: 'server listening', data: { port: PORT, nodeEnv: process.env.NODE_ENV, hasDatabaseUrl: Boolean(process.env.DATABASE_URL) }, timestamp: Date.now() }));
  // #endregion
  console.log(`trellow api on :${PORT}`);
});