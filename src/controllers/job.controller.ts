import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env as ENV } from "../config/env";
import { JobItem } from "../entities/job-item";

const createSchema = z.object({
  name: z.string().min(2).max(150),
  slug: z.string().min(2).max(180),
  kind: z.enum(["category", "sub-category"]),
  parentId: z.number().int().positive().optional(),
  is_active: z.boolean().optional()
}).refine((v) => v.kind === "category" || (v.kind === "sub-category" && !!v.parentId), {
  message: "parentId is required when kind='task'",
  path: ["parentId"]
});

export const jobController = {
  async createJobitem(req: Request, res: Response, next: NextFunction) {
    console.log("createJobitem called by userId:", (req as any).userId);
    try {
      const { name, slug, kind, parentId = 100, is_active = true } = createSchema.parse(req.body);
      const repo = AppDataSource.getRepository(JobItem);
      console.log("Creating job itme with the given data:", { name, slug, kind, parentId, is_active });

      let parent: JobItem | null = null;
      if (kind === "sub-category") {
        parent = await repo.findOne({ where: { id: parentId! } });
        if (!parent) return res.status(400).json({ message: "Invalid parentId" });
        if (parent.kind !== "category") return res.status(400).json({ message: "parentId must reference a category" });
      }

      const item = repo.create({ name, slug, kind, parent, is_active });
      await repo.save(item);

      res.status(201).json({
        message: "Job item created",
        data: { id: item.id, name: item.name, slug: item.slug, kind: item.kind, parentId: parent?.id ?? null }
      });
    } catch (err: any) {
      // Handle unique violations nicely
      if (err?.code === "23505") return res.status(409).json({ message: "Duplicate name/slug under same parent" });
      next(err);
    }
  },
};