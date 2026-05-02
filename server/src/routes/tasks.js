import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const r = Router({ mergeParams: true });
r.use(auth, requireRole());

const taskBody = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable()
});

const updateBody = taskBody.partial().extend({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional()
});

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  creator: { select: { id: true, name: true } }
};

r.get('/', async (req, res, next) => {
  try {
    const { status, priority, assigneeId } = req.query;
    const where = { projectId: req.params.projectId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    const tasks = await db.task.findMany({
      where,
      include: taskInclude,
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    if (req.membership.role !== 'ADMIN') return res.status(403).json({ error: 'admins only' });
    const d = taskBody.parse(req.body);
    if (d.assigneeId) {
      const m = await db.projectMember.findUnique({
        where: { userId_projectId: { userId: d.assigneeId, projectId: req.params.projectId } }
      });
      if (!m) return res.status(400).json({ error: 'assignee not a member' });
    }
    const t = await db.task.create({
      data: {
        ...d,
        dueDate: d.dueDate ? new Date(d.dueDate) : null,
        projectId: req.params.projectId,
        creatorId: req.user.id
      },
      include: taskInclude
    });
    res.status(201).json(t);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    next(e);
  }
});

r.get('/:taskId', async (req, res, next) => {
  try {
    const t = await db.task.findUnique({
      where: { id: req.params.taskId },
      include: taskInclude
    });
    if (!t || t.projectId !== req.params.projectId) return res.status(404).json({ error: 'not found' });
    res.json(t);
  } catch (e) { next(e); }
});

r.put('/:taskId', async (req, res, next) => {
  try {
    if (req.membership.role !== 'ADMIN') return res.status(403).json({ error: 'admins only' });
    const d = updateBody.parse(req.body);
    if (d.dueDate) d.dueDate = new Date(d.dueDate);
    if (d.assigneeId) {
      const m = await db.projectMember.findUnique({
        where: { userId_projectId: { userId: d.assigneeId, projectId: req.params.projectId } }
      });
      if (!m) return res.status(400).json({ error: 'assignee not a member' });
    }
    const t = await db.task.update({
      where: { id: req.params.taskId },
      data: d,
      include: taskInclude
    });
    res.json(t);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    next(e);
  }
});

r.patch('/:taskId/status', async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']) }).parse(req.body);
    const t = await db.task.findUnique({ where: { id: req.params.taskId } });
    if (!t || t.projectId !== req.params.projectId) return res.status(404).json({ error: 'not found' });
    if (req.membership.role !== 'ADMIN' && t.assigneeId !== req.user.id)
      return res.status(403).json({ error: 'can only update own tasks' });
    const updated = await db.task.update({
      where: { id: req.params.taskId },
      data: { status },
      include: taskInclude
    });
    res.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    next(e);
  }
});

r.delete('/:taskId', async (req, res, next) => {
  try {
    if (req.membership.role !== 'ADMIN') return res.status(403).json({ error: 'admins only' });
    await db.task.delete({ where: { id: req.params.taskId } });
    res.status(204).end();
  } catch (e) { next(e); }
});

export { r as taskRoutes };
