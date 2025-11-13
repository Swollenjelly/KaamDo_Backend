import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppDataSource } from "../config/data-source";
import { JobListings } from "../entities/job-listing";
import { JobItem } from "../entities/job-item";
import { connect } from "http2";
import { Bid } from "../entities/bid";

// ---------- Zod Schemas ----------
const createSchema = z.object({
    jobTaskId: z.number().int().positive(),
    details: z.string().min(3).max(5000).optional(),
    // budget_amount: z.number().nonnegative().optional(),
    city: z.string().min(2).max(100).optional(),
    pincode: z.string().min(4).max(10).optional(),
    scheduled_date: z.iso.date().optional(),
    scheduled_time: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/) // HH:mm or HH:mm:ss
        .optional(),
});

const jobListQuerySchem = z.object({
    page: z.coerce.number().int().default(1),
    pageSize: z.coerce.number().int().min(1).max(20).default(10),
    status: z.string(),
    sort: z.enum(["newest", "oldest"]).default("newest"),



})

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
                city: body.city ?? null,
                pincode: body.pincode ?? null,
                scheduled_date: body.scheduled_date ?? null, // Date | null
                scheduled_time: body.scheduled_time ?? null, // string | null
                status: "open",
            });
            await listingRepo.save(listing);

            return res.status(201).json({
                message: "Job created",
                data: {
                    id: listing.id,
                    status: listing.status,
                    jobTask: { id: item.id, name: item.name, categoryId: item.parent.id, categoryName: item.parent.name },
                    scheduled_date: listing.scheduled_date,
                    scheduled_time: listing.scheduled_time,
                },
            });
        } catch (err) {
            next(err);
        }
    },

    // src/controllers/custjob.controller.ts

  async viewJob(req: Request & { userId?: number }, res: Response) {
  const userId = req.userId!;
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 10);
  const status = String(req.query.status ?? "open") as any;

  const repo = AppDataSource.getRepository(JobListings);

  // Load job_item and its parent so we can compute category & subcategory
  const [rows, total] = await repo.findAndCount({
    where: { user: { id: userId }, status },
    relations: { job_item: { parent: true } },   // <<< IMPORTANT
    order: { id: "DESC" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const data = rows.map((r) => {
    const ji = r.job_item;
    const isSub = ji?.kind === "sub-category";
    const categoryName = isSub ? (ji?.parent?.name ?? "") : (ji?.name ?? "");
    const subCategoryName = isSub ? (ji?.name ?? "") : "";

    return {
      id: r.id,
      details: r.details ?? "",
      city: r.city ?? "",
      status: r.status,
      scheduled_date: (r as any).scheduled_date ?? null,
      scheduled_time: (r as any).scheduled_time ?? null, // string/ISO/time
      jobItemId: ji?.id ?? null,
      categoryName,
      subCategoryName,
      created_at: (r as any).createdAt ?? null,
    };
  });

  res.json({ data, total, page, pageSize });
  },

};


const JobIdParams = z.object({ jobId: z.coerce.number().int().positive() });
const BidIdParams = z.object({ bidId: z.coerce.number().int().positive() });

export const bidController = {
  // 1) Fetch bids for a job (only if the logged-in user owns the job)
  async getBidsForJob(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobId } = JobIdParams.parse(req.params);

      const jobRepo = AppDataSource.getRepository(JobListings);
      const bidRepo = AppDataSource.getRepository(Bid);

      // confirm ownership
      const job = await jobRepo.findOne({
        where: { id: jobId },
        relations: { user: true },
      });
      if (!job) return res.status(404).json({ message: "Job not found" });

      
      const userId = (req as any).userId;
      if (!userId || job.user.id !== userId) {
        return res.status(403).json({ message: "Not your job" });
      }

      const bids = await bidRepo.find({
        where: { job: { id: jobId } },
        relations: { vendor: true },
        order: { created_at: "DESC" },
      });

      return res.json({ bids });
    } catch (err) {
      next(err);
    }
  },

  // 2) Accept one bid -> reject all others for the same job
  async acceptBid(req: Request, res: Response, next: NextFunction) {
    try {
      const { bidId } = BidIdParams.parse(req.params);

      const bidRepo = AppDataSource.getRepository(Bid);
      const jobRepo = AppDataSource.getRepository(JobListings);

      // fetch the target bid and confirm ownership
      const bid = await bidRepo.findOne({
        where: { id: bidId },
        relations: { job: { user: true } },
      });
      if (!bid) return res.status(404).json({ message: "Bid not found" });

      const userId = (req as any).userId ?? (req as any).user?.id;
      if (!userId || bid.job.user.id !== userId) {
        return res.status(403).json({ message: "Not your job" });
      }

      // if already accepted, short-circuit
      if (bid.status === ("accepted" as any)) {
        return res.json({ message: "Already accepted", bidId: bid.id });
      }

      // A) accept this bid
      await bidRepo.update({ id: bidId }, { status: "accepted" as any });

      // B) reject every other bid on this job
      await bidRepo
        .createQueryBuilder()
        .update(Bid)
        .set({ status: "rejected" as any })
        .where("jobId = :jobId AND id <> :bidId", {
          jobId: bid.job.id,
          bidId: bid.id,
        })
        .execute();

      // C) (optional) move job to assigned so vendors don’t see it
      await jobRepo.update(bid.job.id, { status: "assigned" as any });

      return res.json({ message: "Bid accepted; others rejected", acceptedBidId: bid.id });
    } catch (err) {
      next(err);
    }
  },



  // customer: reject a single bid (keeps others untouched)
  async rejectBid(req: Request, res: Response, next: NextFunction) {
    try {
      const { bidId } = BidIdParams.parse(req.params);
      const bidRepo = AppDataSource.getRepository(Bid);

      // fetch bid + ensure the logged-in user owns the job
      const bid = await bidRepo.findOne({
        where: { id: bidId },
        relations: { job: { user: true } },
      });
      if (!bid) return res.status(404).json({ message: "Bid not found" });

      const userId = (req as any).userId ?? (req as any).user?.id;
      if (!userId || bid.job.user.id !== userId) {
        return res.status(403).json({ message: "Not your job" });
      }

      if (bid.status === "accepted" as any) {
        return res.status(409).json({ message: "Cannot reject an already accepted bid" });
      }
      if (bid.status === "rejected" as any) {
        return res.json({ message: "Already rejected", bidId: bid.id });
      }

      // simple update
      await bidRepo.update(bidId, { status: "rejected" as any });
      return res.json({ message: "Bid rejected", bidId: bid.id });
    } catch (err) {
      next(err);
    }
  },
  };