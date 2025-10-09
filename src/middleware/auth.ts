// import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';
// interface AuthRequest extends Request {
//  user?: string;
// }
// export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
//  const token = req.headers.authorization?.split(' ')[1];
//  if (!token) return res.status(401).json({ error: 'Token missing' });
//  try {
//    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
//    req.user = (decoded as any).sub;
//    next();
//  } catch (err) {
//    res.status(403).json({ error: 'Invalid token' });
//  }
// };


import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env as ENV } from "../config/env";


export function requireAuth(req: Request, res: Response, next: NextFunction) {
  console.log("requireAuth called");
  console.log("Headers:", req.headers);
  req.header
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid Authorization header" });
  }

  

  const token = auth.slice(7);
  const payload = jwt.verify(token, ENV.JWT_SECRET) as jwt.JwtPayload; // sub?: string

  const userId = Number(payload.sub);
  if (!payload.sub || Number.isNaN(userId)) {
    return res.status(401).json({ message: "Invalid token payload" });
  }

 (req as any).userId = userId;
  return next();
}

