import { db } from '../db.js';

export const requireRole = (...roles) => async (req, res, next) => {
  const { projectId } = req.params;
  if (!projectId) return res.status(400).json({ error: 'project id required' });

  const m = await db.projectMember.findUnique({
    where: { userId_projectId: { userId: req.user.id, projectId } }
  });
  if (!m) return res.status(403).json({ error: 'not a member' });
  if (roles.length && !roles.includes(m.role)) return res.status(403).json({ error: 'insufficient role' });

  req.membership = m;
  next();
};
