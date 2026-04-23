import { AppDataSource } from "../config/data-source";
import { JobListings } from "../entities/job-listing";
import { JobItem } from "../entities/job-item";
import { Vendor } from "../entities/vendor";
import { calculateHaversineDistance, getDistanceTier } from "../utils/distance";

export class CustJobService {
    /**
     * Creates a new job listing
     */
    async createJob(userId: number, body: any, imageUrls?: string[]) {
        return await AppDataSource.transaction(async (manager) => {
            const item = await manager.findOne(JobItem, {
                where: { id: body.jobTaskId },
                relations: { parent: true },
            });

            if (!item) {
                throw new Error("Invalid jobTaskId");
            }
            if (item.kind !== "sub-category" || !item.parent) {
                throw new Error("jobTaskId must reference a sub-category (task)");
            }

            const listing = manager.create(JobListings, {
                user: { id: userId } as any,
                job_item: item,
                details: body.details ?? null,
                city: body.city ?? null,
                pincode: body.pincode ?? null,
                scheduled_date: body.scheduled_date ?? null,
                scheduled_time: body.scheduled_time ?? null,
                status: "open",
                imageUrls: imageUrls && imageUrls.length > 0 ? imageUrls : null,
                address: body.address ?? null,
                latitude: body.latitude ?? null,
                longitude: body.longitude ?? null,
                placeId: body.placeId ?? null,
                locality: body.locality ?? null,
            });

            await manager.save(listing);
            return { listing, item };
        });
    }

    /**
     * Retrieves paginated job listings for a customer
     */
    async viewJobs(userId: number, page: number, pageSize: number, status: string) {
        const repo = AppDataSource.getRepository(JobListings);

        const whereCondition: any = { user: { id: userId } };
        if (status !== "all") {
            whereCondition.status = status;
        }

        const [rows, total] = await repo.findAndCount({
            where: whereCondition,
            relations: { job_item: { parent: true } },
            order: { id: "DESC" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        const data = rows.map((r) => {
            const ji = r.job_item;
            const isSub = ji?.kind === "sub-category";
            const categoryName = isSub ? ji?.parent?.name ?? "" : ji?.name ?? "";
            const subCategoryName = isSub ? ji?.name ?? "" : "";

            return {
                id: r.id,
                details: r.details ?? "",
                city: r.city ?? "",
                status: r.status,
                scheduled_date: (r as any).scheduled_date ?? null,
                scheduled_time: (r as any).scheduled_time ?? null,
                jobItemId: ji?.id ?? null,
                categoryName,
                subCategoryName,
                createdAt: (r as any).createdAt ?? null,
                customer_rating: (r as any).customer_rating ?? null,
                customer_review: (r as any).customer_review ?? null,
            };
        });

        return { data, total, page, pageSize };
    }

    /**
     * Adds a review to a completed job
     */
    async addReview(userId: number, jobId: number, rating: number, comment: string) {
        return await AppDataSource.transaction(async (manager) => {
            const job = await manager.findOne(JobListings, {
                where: { id: jobId },
                relations: { user: true },
            });

            if (!job) throw new Error("Job not found");
            if (job.user.id !== userId) throw new Error("Not your job");
            if (job.status !== "completed") {
                throw new Error("You can review only completed jobs");
            }

            job.customer_rating = rating;
            job.customer_review = comment;

            await manager.save(job);
            return job;
        });
    }

    /**
     * Finds nearby vendors for a job
     */
    async getNearbyVendorsForJob(jobId: number) {
        const jobRepo = AppDataSource.getRepository(JobListings);
        const vendorRepo = AppDataSource.getRepository(Vendor);

        const job = await jobRepo.findOne({ where: { id: jobId } });
        if (!job || job.latitude === null || job.longitude === null) {
            throw new Error("Job not found or coordinates missing");
        }

        const vendors = await vendorRepo.find();

        const vendorsWithDistance = vendors
            .filter(v => v.baseLat !== null && v.baseLng !== null)
            .map(v => {
                const distance = calculateHaversineDistance(
                    Number(job.latitude), Number(job.longitude),
                    Number(v.baseLat), Number(v.baseLng)
                );
                return { ...v, distance, tier: getDistanceTier(distance) };
            })
            // Filter out those beyond their service radius
            .filter(v => v.distance <= v.serviceRadiusKm);

        // Sort by tier first, then by distance inside that tier
        vendorsWithDistance.sort((a, b) => {
            if (a.tier !== b.tier) return a.tier - b.tier; // 0 first, then 1, 2...
            return a.distance - b.distance; 
        });

        return {
            jobId: job.id,
            jobLocation: { lat: job.latitude, lng: job.longitude, address: job.address },
            nearbyVendors: vendorsWithDistance.map(v => ({
                vendorId: v.id,
                name: v.name,
                distanceKm: Number(v.distance.toFixed(1)),
                priorityTier: v.tier
            }))
        };
    }
}

export const custJobService = new CustJobService();
