import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppDataSource } from "../config/data-source";
import { JobListings } from "../entities/job-listing";
import { JobItem } from "../entities/job-item";

// ---------- Existing createSchema ----------
const createSchema = z.object({
  jobTaskId: z.number().int().positive(),
  details: z.string().min(3).max(5000).optional(),
  budget_amount: z.number().nonnegative().optional(),
  city: z.string().min(2).max(100).optional(),
  pincode: z.string().min(4).max(10).optional(),
});

// ---------- Query schema (no search) ----------
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  status: z.string().optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
});

// ---------- Controller ----------
export const customerController = {
  // ---------------- Create Job ----------------
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

      const listingRepo = AppDataSource.getRepository(JobListings);
      const listing = listingRepo.create({
        user: { id: userId } as any,
        job_item: item,
        details: body.details ?? null,
        city: body.city ?? null,
        pincode: body.pincode ?? null,
        status: "open",
      });
      await listingRepo.save(listing);

      return res.status(201).json({
        message: "Job created",
        data: {
          id: listing.id,
          status: listing.status,
          jobTask: {
            id: item.id,
            name: item.name,
            categoryId: item.parent.id,
            categoryName: item.parent.name,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // ---------------- List My Jobs ----------------
  async listMyJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId as number | undefined;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { page, pageSize, status, sort } = listQuerySchema.parse(req.query);

      const repo = AppDataSource.getRepository(JobListings);

      const qb = repo
        .createQueryBuilder("job")
        .leftJoinAndSelect("job.job_item", "job_item")
        .leftJoinAndSelect("job_item.parent", "parent")
        .where("job.userId = :userId", { userId });

      if (status) {
        qb.andWhere("job.status = :status", { status });
      }

      qb.orderBy("job.id", sort === "newest" ? "DESC" : "ASC")
        .skip((page - 1) * pageSize)
        .take(pageSize);

      const [rows, total] = await qb.getManyAndCount();

      const data = rows.map((j) => ({
        id: j.id,
        status: j.status,
        details: j.details,
        city: j.city,
        pincode: j.pincode,
        jobTask: {
          id: j.job_item?.id,
          name: j.job_item?.name,
          categoryId: j.job_item?.parent?.id,
          categoryName: j.job_item?.parent?.name,
        },
      }));

      return res.json({
        message: "OK",
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        data,
      });
    } catch (err) {
      next(err);
    }
  },

  // ---------------- Get Job by ID ----------------
  async getMyJobById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId as number | undefined;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ message: "Invalid job id" });
      }

      const repo = AppDataSource.getRepository(JobListings);
      const job = await repo.findOne({
        where: { id, user: { id: userId } },
        relations: {
          job_item: { parent: true },
          user: true,
        } as any,
      });

      if (!job) return res.status(404).json({ message: "Job not found" });

      return res.json({
        message: "OK",
        data: {
          id: job.id,
          status: job.status,
          details: job.details,
          city: job.city,
          pincode: job.pincode,
          jobTask: {
            id: job.job_item?.id,
            name: job.job_item?.name,
            categoryId: job.job_item?.parent?.id,
            categoryName: job.job_item?.parent?.name,
          },
          customer: {
            id: job.user?.id,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
