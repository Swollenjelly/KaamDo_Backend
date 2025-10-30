// src/controllers/vendorBid.controller.ts
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppDataSource } from "../config/data-source";
import { Bid } from "../entities/bid";
import { JobListings } from "../entities/job-listing";

const createSchema = z.object({
  amount: z.coerce.number().positive(),
  message: z.string().max(500).optional(),
});

export const vendorBidController = {
  async placeBid(req: Request, res: Response, next: NextFunction) {

    // testing if the vendor Id actually exists
    try {
      const vendorId = (req as any).vendorId as number | undefined;
      if (!vendorId) return res.status(403).json({ message: "Vendor account required" });


      // testing if the job Id actually exists
      const jobId = Number(req.params.jobId);
      if (!Number.isInteger(jobId)) return res.status(400).json({ message: "Invalid job id" });


      // onc the basic checks are done, proceed to parse the body data present on the request
      const body = createSchema.parse(req.body);

      const jobRepo = AppDataSource.getRepository(JobListings);
      const job = await jobRepo.findOne({
        where: { id: jobId },
        relations: { user: true, /* assigned_vendor: true */ },
      });
      if (!job) return res.status(404).json({ message: "Job not found" });
      if (job.status !== "open") return res.status(400).json({ message: "Bidding closed for this job" });

      //if same vendor already bif, update it
      const bidRepo = AppDataSource.getRepository(Bid);
      let bid = await bidRepo.findOne({ where: { job: { id: jobId }, vendor: { id: vendorId } } });

      if (bid) {
        bid.amount = body.amount.toFixed(2);
        bid.message = body.message ?? null;
        bid.status = "pending";
      } else {
        bid = bidRepo.create({
          job: { id: jobId } as any,
          vendor: { id: vendorId } as any,
          amount: body.amount.toFixed(2),
          message: body.message ?? null,
          status: "pending",
        });
      }
      await bidRepo.save(bid);

      return res.status(201).json({ message: "Bid placed", data: { id: bid.id, amount: bid.amount, status: bid.status } });
    } catch (err: any) {
      if (err?.code === "23505") return res.status(409).json({ message: "You already bid on this job" });
      next(err);
    }
  },

  // Optional: vendor withdraw bid
//   async withdrawBid(req: Request, res: Response, next: NextFunction) {
//     try {
//       const vendorId = (req as any).vendorId as number | undefined;
//       const bidId = Number(req.params.bidId);
//       const repo = AppDataSource.getRepository(Bid);
//       const bid = await repo.findOne({ where: { id: bidId }, relations: { vendor: true, job: true } });
//       if (!bid || bid.vendor.id !== vendorId) return res.status(404).json({ message: "Bid not found" });

//       bid.status = "withdrawn";
//       await repo.save(bid);
//       return res.json({ message: "Bid withdrawn" });
//     } catch (err) { next(err); }
//   },
};
