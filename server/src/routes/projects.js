import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const r = Router();
r.use(auth);

const projectBody = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

r.get('/', async (req, res, next) => {
  try {
    const projects = await db.project.findMany({
      where: { members: { some: { userId: req.user.id } } },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { tasks: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const d = projectBody.parse(req.body);
    const p = await db.project.create({
      data: {
        ...d,
        members: { create: { userId: req.user.id, role: 'ADMIN' } }
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { tasks: true } }
      }
    });
    res.status(201).json(p);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    next(e);
  }
});

r.get('/:projectId', requireRole(), async (req, res, next) => {
  try {
    const p = await db.project.findUnique({
      where: { id: req.params.projectId },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!p) return res.status(404).json({ error: 'not found' });
    res.json(p);
  } catch (e) { next(e); }
});

r.put('/:projectId', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const d = projectBody.parse(req.body);
    const p = await db.project.update({ where: { id: req.params.projectId }, data: d });
    res.json(p);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    next(e);
  }
});

r.delete('/:projectId', requireRole('ADMIN'), async (req, res, next) => {
  try {
    await db.project.delete({ where: { id: req.params.projectId } });
    res.status(204).end();
  } catch (e) { next(e); }
});

r.get('/:projectId/members', requireRole(), async (req, res, next) => {
  try {
    const members = await db.projectMember.findMany({
      where: { projectId: req.params.projectId },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    res.json(members);
  } catch (e) { next(e); }
});

r.post('/:projectId/members', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { email, role } = z.object({
      email: z.string().email(),
      role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER')
    }).parse(req.body);
    const u = await db.user.findUnique({ where: { email } });
    if (!u) return res.status(404).json({ error: 'user not found' });
    const exists = await db.projectMember.findUnique({
      where: { userId_projectId: { userId: u.id, projectId: req.params.projectId } }
    });
    if (exists) return res.status(409).json({ error: 'already a member' });
    const m = await db.projectMember.create({
      data: { userId: u.id, projectId: req.params.projectId, role },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    res.status(201).json(m);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    next(e);
  }
});

r.delete('/:projectId/members/:userId', requireRole('ADMIN'), async (req, res, next) => {
  try {
    await db.projectMember.delete({
      where: { userId_projectId: { userId: req.params.userId, projectId: req.params.projectId } }
    });
    res.status(204).end();
  } catch (e) { next(e); }
});

export { r as projectRoutes };
