"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }
    const token = auth.slice(7);
    const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET); // sub?: string
    const userId = Number(payload.sub);
    if (!payload.sub || Number.isNaN(userId)) {
        return res.status(401).json({ message: "Invalid token payload" });
    }
    req.userId = userId;
    return next();
}
//# sourceMappingURL=auth.js.map