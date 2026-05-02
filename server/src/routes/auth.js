import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db.js';
import { sign, auth } from '../middleware/auth.js';

const r = Router();

const signupBody = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6)
});

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

r.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = signupBody.parse(req.body);
    const exists = await db.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const u = await db.user.create({ data: { name, email, passwordHash: hash } });
    const token = sign({ id: u.id, email: u.email });
    res.status(201).json({ token, user: { id: u.id, name: u.name, email: u.email } });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    next(e);
  }
});

r.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginBody.parse(req.body);
    const u = await db.user.findUnique({ where: { email } });
    if (!u || !(await bcrypt.compare(password, u.passwordHash)))
      return res.status(401).json({ error: 'invalid credentials' });
    const token = sign({ id: u.id, email: u.email });
    res.json({ token, user: { id: u.id, name: u.name, email: u.email } });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    next(e);
  }
});

r.get('/me', auth, async (req, res, next) => {
  try {
    const u = await db.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, createdAt: true }
    });
    if (!u) return res.status(404).json({ error: 'not found' });
    res.json(u);
  } catch (e) { next(e); }
});

export { r as authRoutes };
