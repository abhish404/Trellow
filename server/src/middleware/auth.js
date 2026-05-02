import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'dev-secret';

export const sign = (payload) => jwt.sign(payload, secret, { expiresIn: '7d' });

export const auth = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
  try {
    req.user = jwt.verify(h.slice(7), secret);
    next();
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
};
