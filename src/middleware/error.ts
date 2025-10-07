import { Request, Response, NextFunction } from 'express';
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  const status = err?.status ?? 400;
  const msg = typeof err?.message === 'string' ? err.message : 'Server error';
  res.status(status).json({ error: msg });
}
