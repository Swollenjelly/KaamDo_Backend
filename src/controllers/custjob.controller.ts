import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { custJobService } from "../services/custjob.service";
import { bidService } from "../services/bid.service";

// ---------- Zod Schemas ----------
const createSchema = z.object({
  jobTaskId: z.number().int().positive(),
  details: z.string().min(3).max(5000).optional(),
  city: z.string().min(2).max(100).optional(),
  pincode: z.string().min(4).max(10).optional(),
  scheduled_date: z.iso.date().optional(),
  scheduled_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .optional(),
});

const reviewBodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3).max(2000),
});

const JobIdParams = z.object({ jobId: z.coerce.number().int().positive() });
const BidIdParams = z.object({ bidId: z.coerce.number().int().positive() });

export const customerController = {
  async createJob(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId as number | undefined;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const body = createSchema.parse(req.body);

      const { listing, item } = await custJobService.createJob(userId, body);

      return res.status(201).json({
        message: "Job created",
        data: {
          id: listing.id,
          status: listing.status,
          jobTask: {
            id: item.id,
            name: item.name,
            categoryId: item.parent!.id,
            categoryName: item.parent!.name,
          },
          scheduled_date: listing.scheduled_date,
          scheduled_time: listing.scheduled_time,
        },
      });
    } catch (err: any) {
      if (err.message.includes("Invalid jobTaskId") || err.message.includes("jobTaskId must reference")) {
        return res.status(400).json({ message: err.message });
      }
      next(err);
    }
  },

  async viewJob(req: Request & { userId?: number }, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const page = Number(req.query.page ?? 1);
      const pageSize = Number(req.query.pageSize ?? 10);
      const status = String(req.query.status ?? "open");

      const result = await custJobService.viewJobs(userId, page, pageSize, status);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async addReview(req: Request & { userId?: number }, res: any, next: NextFunction) {
    try {
      const userId = req.userId ?? (req as any).userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { jobId } = JobIdParams.parse(req.params);
      const { rating, comment } = reviewBodySchema.parse(req.body);

      const job = await custJobService.addReview(userId, jobId, rating, comment);

      return res.json({
        message: "Review saved",
        jobId: job.id,
        rating,
        comment,
      });
    } catch (err: any) {
      if (err.message === "Job not found") return res.status(404).json({ message: err.message });
      if (err.message === "Not your job") return res.status(403).json({ message: err.message });
      if (err.message === "You can review only completed jobs") return res.status(400).json({ message: err.message });
      next(err);
    }
  },
};

export const bidController = {
  // 1) Fetch bids for a job
  async getBidsForJob(req: Request, res: any, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { jobId } = JobIdParams.parse(req.params);
      const result = await bidService.getBidsForJob(userId, jobId);

      return res.json({
        job: {
          id: result.job.id,
          status: result.job.status,
          customer_rating: (result.job as any).customer_rating ?? null,
          customer_review: (result.job as any).customer_review ?? null,
        },
        bids: result.bids,
      });
    } catch (err: any) {
      if (err.message === "Job not found") return res.status(404).json({ message: err.message });
      if (err.message === "Not your job") return res.status(403).json({ message: err.message });
      next(err);
    }
  },

  // 2) Accept one bid -> reject all others for the same job
  async acceptBid(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId ?? (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { bidId } = BidIdParams.parse(req.params);
      const result = await bidService.acceptBid(userId, bidId);

      return res.json({
        message: "Bid accepted; others rejected",
        acceptedBidId: result.acceptedBidId,
      });
    } catch (err: any) {
      if (err.message === "Bid not found" || err.message === "Job not found") return res.status(404).json({ message: err.message });
      if (err.message === "Not your job") return res.status(403).json({ message: err.message });
      if (err.message === "Already accepted") return res.json({ message: "Already accepted", bidId: req.params.bidId });
      next(err);
    }
  },

  // customer: reject a single bid (keeps others untouched)
  async rejectBid(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId ?? (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { bidId } = BidIdParams.parse(req.params);
      const result = await bidService.rejectBid(userId, bidId);

      return res.json({ message: "Bid rejected", bidId: result.bidId });
    } catch (err: any) {
      if (err.message === "Bid not found") return res.status(404).json({ message: err.message });
      if (err.message === "Not your job") return res.status(403).json({ message: err.message });
      if (err.message === "Cannot reject an already accepted bid") return res.status(409).json({ message: err.message });
      if (err.message === "Already rejected") return res.json({ message: "Already rejected", bidId: req.params.bidId });
      next(err);
    }
  },
};
