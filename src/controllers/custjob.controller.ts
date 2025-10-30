import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppDataSource } from "../config/data-source";
import { JobListings } from "../entities/job-listing";
import { JobItem } from "../entities/job-item";

// ---------- Zod Schemas ----------
const createSchema = z.object({
  jobTaskId: z.number().int().positive(),
  details: z.string().min(3).max(5000).optional(),
  budget_amount: z.number().nonnegative().optional(),
  city: z.string().min(2).max(100).optional(),
  pincode: z.string().min(4).max(10).optional(),
//   scheduled_at: z.string().datetime().optional(),
});

const jobListQuerySchem = z.object({
  page: z.coerce.number().int().default(1),
  pageSize: z.coerce.number().int().min(1).max(20).default(10),
  status: z.string(),
  sort: z.enum(["newest", "oldest"]).default("newest"),



})

// ---------- Helpers ----------
function toDateOrNull(s?: string) {
  return s ? new Date(s) : null;
}

export const customerController = {
  async createJob(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId as number | undefined;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const body = createSchema.parse(req.body);

      const jobItemRepo = AppDataSource.getRepository(JobItem);
      const item = await jobItemRepo.findOne({
        where: { id: body.jobTaskId },
        relations: { parent: true },
      });
      if (!item) return res.status(400).json({ message: "Invalid jobTaskId" });

      if (item.kind !== "sub-category") {
        return res.status(400).json({ message: "jobTaskId must reference a sub-category (task)" });
      }
      if (!item.parent) {
        return res.status(400).json({ message: "Selected task has no parent category" });
      }

if (!item.parent || !["sub-category"].includes(item.kind)) {
  return res.status(400).json({ message: "jobTaskId must reference a sub-category (task)" });
}


      const listingRepo = AppDataSource.getRepository(JobListings);
      const listing = listingRepo.create({
        user: { id: userId } as any,
        job_item: item,
        details: body.details ?? null,
        // budget_amount: body.budget_amount != null ? body.budget_amount.toString() : null,
        city: body.city ?? null,
        pincode: body.pincode ?? null,
        // scheduled_at: toDateOrNull(req.body.scheduled_at),
        status: "open",
      });
      await listingRepo.save(listing);

      return res.status(201).json({
        message: "Job created",
        data: {
          id: listing.id,
          status: listing.status,
          jobTask: { id: item.id, name: item.name, categoryId: item.parent.id, categoryName: item.parent.name },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async viewJob(req: Request, res: Response, next: NextFunction){

    try{
      const userId = (req as any).userId as number | undefined;
      if (!userId) return res.status(401).json({message: "Unauthorised"});

      const { page, pageSize, status, sort } = jobListQuerySchem.parse(req.query);
      
            const repo = AppDataSource.getRepository(JobListings);
      
            const where: any = { user: { id: userId } };
            if (status) where.status = status;
      
            const qb = repo
              
      


    }

  },
}












