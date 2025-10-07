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

// Shape of the token you issued in login(): { sub: user.id, ... }
interface JwtClaims {
  sub: number; // user id
  iat: number;
  exp: number;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid Authorization header" });
  }

  const token = auth.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, ENV.JWT_SECRET) as JwtClaims;
    req.userId = payload.sub; // set from JWT "sub"
    return next();
  } catch (err: any) {
    if (err?.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
}
