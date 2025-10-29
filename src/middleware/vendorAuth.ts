import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export function vendorAuth(req:Request, res:Response, next:NextFunction){

    const auth = req.headers.authorization

    if(!auth?.startsWith("Bearer")){
        return res.status(400).json({
            error: "Invalid authorization token"
        })
    }

    const token = auth.slice(7)
    const payload = jwt.verify(token, env.JWT_SECRET)

    const vendorId = Number(payload.sub)
    if(!vendorId){
        return res.status(400).json({
            message: "Invalid token payload"
        })
    }

    (req as any).vendorId = vendorId
    return next()

}