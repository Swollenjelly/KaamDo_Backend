import { AppDataSource } from "../config/data-source";
import { Bid } from "../entities/bid";
import { JobListings } from "../entities/job-listing";
import { Vendor } from "../entities/vendor";

export class BidService {
    /**
     * Fetch bids for a customer's job
     */
    async getBidsForJob(userId: number, jobId: number) {
        const jobRepo = AppDataSource.getRepository(JobListings);
        const bidRepo = AppDataSource.getRepository(Bid);

        const job = await jobRepo.findOne({
            where: { id: jobId },
            relations: { user: true },
        });
        if (!job) throw new Error("Job not found");
        if (job.user.id !== userId) throw new Error("Not your job");

        const bids = await bidRepo.find({
            where: { job: { id: jobId } },
            relations: { vendor: true },
            order: { created_at: "DESC" },
        });

        return { job, bids };
    }

    /**
     * Customer accepts a bid (ACID Transaction)
     * Rejects all other bids and assigns job to vendor.
     */
    async acceptBid(userId: number, bidId: number) {
        // Wrapping all three dependent updates in one ACID transaction
        return await AppDataSource.transaction(async (manager) => {
            const bid = await manager.findOne(Bid, {
                where: { id: bidId },
                relations: { job: { user: true }, vendor: true },
            });

            if (!bid) throw new Error("Bid not found");
            if (bid.job.user.id !== userId) throw new Error("Not your job");
            if (bid.status === ("accepted" as any)) {
                throw new Error("Already accepted");
            }

            // 1. Accept the target bid
            bid.status = "accepted" as any;
            await manager.save(bid);

            // 2. Reject all other bids on this job
            await manager
                .createQueryBuilder()
                .update(Bid)
                .set({ status: "rejected" as any })
                .where("jobId = :jobId AND id <> :bidId", {
                    jobId: bid.job.id,
                    bidId: bid.id,
                })
                .execute();

            // 3. Mark job as assigned
            const job = await manager.findOne(JobListings, {
                where: { id: bid.job.id },
            });
            if (!job) throw new Error("Job not found");

            job.status = "assigned" as any;
            job.assignedVendor = bid.vendor as any;
            await manager.save(job);

            return { acceptedBidId: bid.id };
        });
    }

    /**
     * Customer manually rejects a specific bid
     */
    async rejectBid(userId: number, bidId: number) {
        return await AppDataSource.transaction(async (manager) => {
            const bid = await manager.findOne(Bid, {
                where: { id: bidId },
                relations: { job: { user: true } },
            });

            if (!bid) throw new Error("Bid not found");
            if (bid.job.user.id !== userId) throw new Error("Not your job");

            if (bid.status === ("accepted" as any)) {
                throw new Error("Cannot reject an already accepted bid");
            }
            if (bid.status === ("rejected" as any)) {
                throw new Error("Already rejected");
            }

            bid.status = "rejected" as any;
            await manager.save(bid);

            return { bidId: bid.id };
        });
    }

    /**
   * Vendor places a bid on an open job
   */
    async placeBid(vendorId: number, jobId: number, amount: number, message: string) {
        return await AppDataSource.transaction(async (manager) => {
            const findJob = await manager.findOne(JobListings, {
                where: { id: jobId }
            });
            if (!findJob) throw new Error("Job not found");

            const findVendor = await manager.findOne(Vendor, {
                where: { id: vendorId }
            });
            if (!findVendor) throw new Error("Vendor not found");

            const existingBid = await manager.findOne(Bid, {
                where: {
                    job: { id: jobId },
                    vendor: { id: vendorId }
                }
            });
            if (existingBid) throw new Error("You have already placed the bet on this job");

            const bid = manager.create(Bid, {
                job: findJob,
                vendor: findVendor,
                amount: String(amount),
                message,
                status: "open" as any
            });

            await manager.save(bid);
            return bid;
        });
    }
}

export const bidService = new BidService();
