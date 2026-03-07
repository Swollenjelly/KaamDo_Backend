import { AppDataSource } from "../config/data-source";
import { Vendor } from "../entities/vendor";
import { JobListings } from "../entities/job-listing";
import { MoreThanOrEqual } from "typeorm";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import bcrypt from "bcrypt";

export class VendorService {
    /**
     * Registers a new vendor
     */
    async registerVendor(body: any) {
        const vendorRepo = AppDataSource.getRepository(Vendor);

        const existingVendor = await vendorRepo.findOne({
            where: [{ phone: body.phone }],
        });

        if (existingVendor) {
            throw new Error("Vendor with this phone number already exists");
        }

        const hashedPass = await bcrypt.hash(body.password, 10);

        const newVendor = vendorRepo.create({
            ...body,
            password: hashedPass,
            email: body.email || null,
        });

        await vendorRepo.save(newVendor);

        const token = jwt.sign({ role: "vendor" }, env.JWT_SECRET, {
            subject: String((newVendor as any).id),
            expiresIn: "2h",
        });

        return { vendor: newVendor, token };
    }

    /**
     * Logs in a vendor
     */
    async loginVendor(body: any) {
        const vendorRepo = AppDataSource.getRepository(Vendor);
        const vendor = await vendorRepo.findOne({ where: { phone: body.phone } });

        if (!vendor) throw new Error("Vendor not found");

        const valid = await bcrypt.compare(body.password, vendor.password);
        if (!valid) throw new Error("Invalid credentials");

        const token = jwt.sign({ role: "vendor" }, env.JWT_SECRET, {
            subject: String(vendor.id),
            expiresIn: "2h",
        });

        return { vendor, token };
    }

    /**
     * Deletes a vendor profile
     */
    async deleteVendor(vendorId: number) {
        return await AppDataSource.transaction(async (manager) => {
            const result = await manager.delete(Vendor, { id: vendorId });
            if (result.affected === 0) throw new Error("Vendor not found");
            return true;
        });
    }

    /**
     * Updates a vendor profile
     */
    async updateVendor(vendorId: number, body: any) {
        const vendorRepo = AppDataSource.getRepository(Vendor);
        const vendor = await vendorRepo.findOne({ where: { id: vendorId } });

        if (!vendor) throw new Error("Invalid request");

        // Don't accidentally allow updating ID or rewriting complex properties arbitrarily.
        // Assuming simple flat properties for now per original code.
        const updatedUser = await vendorRepo.save({ ...vendor, ...body, id: vendor.id });
        return updatedUser;
    }

    /**
     * View all active, reasonably scheduled open jobs
     */
    async getOpenJobs(vendorId: number, city?: string) {
        const jobRepo = AppDataSource.getRepository(JobListings);

        const whereCondition: any = {
            status: "open",
            scheduled_date: MoreThanOrEqual(new Date()),
        };

        if (city && city !== "all") {
            whereCondition.city = city;
        }

        const openJobs = await jobRepo.find({
            where: whereCondition,
            relations: ["job_item", "user", "bids", "bids.vendor"],
            order: { id: "DESC" },
        });

        return openJobs.map((job) => {
            const hasBidded = job.bids?.some(bid => bid.vendor?.id === vendorId) || false;

            return {
                jobId: job.id,
                jobName: job.job_item?.name,
                postedBy: job.user?.name,
                location: job.city,
                details: job.details,
                schedule_date: job.scheduled_date,
                schedule_time: job.scheduled_time,
                hasBidded
            };
        });
    }

    /**
     * Fetch jobs assigned specifically to this vendor
     */
    async getAssignedJobs(vendorId: number) {
        const jobRepo = AppDataSource.getRepository(JobListings);

        const assignedJob = await jobRepo.find({
            where: {
                status: "assigned" as any,
                assignedVendor: { id: vendorId } as any,
            },
            relations: ["job_item", "user"],
        });

        return assignedJob.map((data) => ({
            jobId: data.id,
            jobName: data.job_item?.name,
            jobDetails: data.details,
            postedBy: data.user?.name,
            customerPhoneNumber: data.user?.phone,
            schedule_date: data.scheduled_date,
            schedule_time: data.scheduled_time,
            location: data.city,
        }));
    }

    /**
     * Finalizes a job to the completed state via transaction (ensuring sanity)
     */
    async completeJob(vendorId: number, jobId: number) {
        return await AppDataSource.transaction(async (manager) => {
            const job = await manager.findOne(JobListings, {
                where: {
                    id: jobId,
                    assignedVendor: { id: vendorId } as any,
                    status: "assigned" as any,
                },
            });

            if (!job) throw new Error("Job not found or not available");

            job.status = "completed" as any;
            await manager.save(job);
            return job;
        });
    }

    /**
     * Lists completed jobs
     */
    async getCompletedJobs(vendorId: number) {
        const jobRepo = AppDataSource.getRepository(JobListings);

        const data = await jobRepo.find({
            where: {
                status: "completed" as any,
                assignedVendor: { id: vendorId } as any
            },
            relations: ["job_item", "user", "bids"],
            order: { id: "DESC" }
        });

        return data.map((item) => ({
            jobId: item.id,
            jobName: item?.job_item?.name,
            customerName: item?.user?.name,
            customerPhoneNumber: item?.user?.phone,
            jobDate: item.scheduled_date,
            jobTime: item.scheduled_time,
            details: item.details
        }));
    }
}

export const vendorService = new VendorService();
