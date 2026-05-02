import { Router } from 'express';
import { db } from '../db.js';
import { auth } from '../middleware/auth.js';

const r = Router();
r.use(auth);

r.get('/stats', async (req, res, next) => {
  try {
    const projects = await db.project.findMany({
      where: { members: { some: { userId: req.user.id } } },
      select: { id: true }
    });
    const pIds = projects.map(p => p.id);

    const [total, byStatus, byPriority, overdue, byUser] = await Promise.all([
      db.task.count({ where: { projectId: { in: pIds } } }),
      db.task.groupBy({ by: ['status'], where: { projectId: { in: pIds } }, _count: true }),
      db.task.groupBy({ by: ['priority'], where: { projectId: { in: pIds } }, _count: true }),
      db.task.count({
        where: { projectId: { in: pIds }, dueDate: { lt: new Date() }, status: { not: 'DONE' } }
      }),
      db.task.groupBy({
        by: ['assigneeId'],
        where: { projectId: { in: pIds }, assigneeId: { not: null } },
        _count: true
      })
    ]);

    const assignees = byUser.length
      ? await db.user.findMany({
          where: { id: { in: byUser.map(b => b.assigneeId) } },
          select: { id: true, name: true }
        })
      : [];
    const nameMap = Object.fromEntries(assignees.map(a => [a.id, a.name]));

    res.json({
      total,
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
      byPriority: Object.fromEntries(byPriority.map(p => [p.priority, p._count])),
      overdue,
      byUser: byUser.map(b => ({ name: nameMap[b.assigneeId] || 'Unassigned', count: b._count })),
      projectCount: pIds.length
    });
  } catch (e) { next(e); }
});

export { r as dashboardRoutes };
