import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppDataSource } from "../config/data-source";
import { JobPost } from "../entities/job-listing";
import { JobItem } from "../entities/job-item"; // adjust path if it's job-items.ts

// ---------- Zod Schemas ----------
const createSchema = z.object({
  jobTaskId: z.number().int().positive(),
  details: z.string().min(3).max(5000).optional(),
  budget_amount: z.number().nonnegative().optional(),
  city: z.string().min(2).max(100).optional(),
  pincode: z.string().min(4).max(10).optional(),
//   scheduled_at: z.string().datetime().optional(),
});

// ---------- Helpers ----------
function toDateOrNull(s?: string) {
  return s ? new Date(s) : null;
}

export const customerController = {
  /** Create a new job post (user → job_task/sub-category) */
  async createJob(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId as number | undefined;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const body = createSchema.parse(req.body);

      const jobItemRepo = AppDataSource.getRepository(JobItem);
      const task = await jobItemRepo.findOne({
        where: { id: body.jobTaskId },
        relations: { parent: true },
      });
      if (!task) return res.status(400).json({ message: "Invalid jobTaskId" });

      // Accept either naming: 'sub-category' (your current) or 'task' (older)
      if (task.kind !== "sub-category") {
        return res.status(400).json({ message: "jobTaskId must reference a sub-category (task)" });
      }
      if (!task.parent) {
        return res.status(400).json({ message: "Selected task has no parent category" });
      }

      // after loading `task`
if (!task.parent || !["task", "sub-category"].includes(task.kind)) {
  return res.status(400).json({ message: "jobTaskId must reference a sub-category (task)" });
}


      const postRepo = AppDataSource.getRepository(JobPost);
      const post = postRepo.create({
        user: { id: userId } as any,
        job_task: task,
        details: body.details ?? null,
        budget_amount: body.budget_amount != null ? body.budget_amount.toString() : null,
        city: body.city ?? null,
        pincode: body.pincode ?? null,
        // scheduled_at: toDateOrNull(req.body.scheduled_at),
        status: "open",
      });
      await postRepo.save(post);

      return res.status(201).json({
        message: "Job created",
        data: {
          id: post.id,
          status: post.status,
          jobTask: { id: task.id, name: task.name, categoryId: task.parent.id, categoryName: task.parent.name },
        },
      });
    } catch (err) {
      next(err);
    }
  },
}