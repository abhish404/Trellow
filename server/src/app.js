import express from 'express';
import cors from 'cors';
import { appendFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { authRoutes } from './routes/auth.js';
import { projectRoutes } from './routes/projects.js';
import { taskRoutes } from './routes/tasks.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { errorHandler } from './middleware/error.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

if (process.env.NODE_ENV === 'production') {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const clientDist = join(__dirname, '../../client/dist');
  // #region agent log
  try {
    const logLine = JSON.stringify({ sessionId: '6cf5fd', hypothesisId: 'C', location: 'app.js:production-static', message: 'production client dist path', data: { clientDist, cwd: process.cwd(), distExists: existsSync(clientDist), indexExists: existsSync(join(clientDist, 'index.html')) }, timestamp: Date.now() }) + '\n';
    appendFileSync(join(__dirname, '../../debug-6cf5fd.log'), logLine);
  } catch (_) {}
  // #endregion
  app.use(express.static(clientDist));
  app.get('*path', (_, res) => res.sendFile(join(clientDist, 'index.html')));
}

app.use(errorHandler);

export default app;
