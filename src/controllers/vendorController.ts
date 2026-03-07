import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { vendorService } from "../services/vendor.service";
import { bidService } from "../services/bid.service";

const vendorRegisterSchema = z.object({
    name: z.string().min(3).max(30),
    phone: z.string().min(10).max(10),
    email: z.string().optional().transform(val => val === "" ? null : val),
    password: z.string().min(1).max(100),
    gender: z.enum(["male", "female", "other"]),
    location: z.enum(["mumbai", "pune", "banglore", "delhi", "chennai", "hyderabad", "kolkata"]),
    preferredWorkLocation: z.enum(["inside", "outside", "both"]),
    vendorType: z.enum(["individual", "company"]),
    documentType: z.enum([
        "aadhar",
        "pan",
        "driving_license",
        "voter_id",
        "passport",
    ]),
});

const vendorLoginSchema = z.object({
    phone: z.string().min(10).max(10),
    password: z.string().min(1).max(100),
});

export const vendorController = {
    // vendor register controller
    async registerVendor(req: Request, res: Response, next: NextFunction) {
        try {
            const body = vendorRegisterSchema.parse(req.body);
            const result = await vendorService.registerVendor(body);
            return res.status(201).json({
                message: "Vendor registered successfully",
                data: result
            });
        } catch (error: any) {
            if (error.message === "Vendor with this phone number already exists") {
                return res.status(409).json({ message: error.message });
            }
            next(error);
        }
    },

    // vendor login controller
    async loginVendor(req: Request, res: Response, next: NextFunction) {
        try {
            const body = vendorLoginSchema.parse(req.body);
            const result = await vendorService.loginVendor(body);

            res.status(200).json({
                message: "Vendor logged in successfully",
                data: result,
            });
        } catch (error: any) {
            if (error.message === "Vendor not found") return res.status(404).json({ message: error.message });
            if (error.message === "Invalid credentials") return res.status(401).json({ message: error.message });
            next(error);
        }
    },

    // vendor delete controller
    async deleteVendor(req: Request, res: Response, next: NextFunction) {
        try {
            const vendorId = (req as any).vendorId;
            await vendorService.deleteVendor(vendorId);
            return res.status(200).json({ message: "Vendor profile successfully deleted" });
        } catch (error: any) {
            if (error.message === "Vendor not found") return res.status(404).json({ message: error.message });
            next(error);
        }
    },

    // vendor data update controller 
    async updateVendor(req: Request, res: Response, next: NextFunction) {
        try {
            const vendorId = (req as any).vendorId;
            if (!vendorId) return res.status(400).json({ message: "Invalid request" });

            const updatedUser = await vendorService.updateVendor(vendorId, req.body);
            return res.status(200).json({ data: updatedUser });
        } catch (error: any) {
            if (error.message === "Invalid request") return res.status(400).json({ message: error.message });
            next(error);
        }
    },

    // job listing api to view all the job
    async jobListing(req: Request, res: Response) {
        try {
            const vendorId = (req as any).vendorId;
            const city = req.query.city as string;
            const formattedOutput = await vendorService.getOpenJobs(vendorId, city);

            res.status(200).json({
                message: "Jobs fetched successfully",
                data: formattedOutput
            });
        } catch (error) {
            res.status(500).json({
                message: "Unable to load jobs at the moment",
                data: error
            });
        }
    },

    async assignedJob(req: Request, res: Response) {
        try {
            const vendorId = (req as any).vendorId;
            const formattedOutput = await vendorService.getAssignedJobs(vendorId);

            res.status(200).json({
                message: "Jobs fetched successfully",
                data: formattedOutput
            });
        } catch (error) {
            res.status(500).json({
                message: "Unable to load jobs at the moment",
                data: error
            });
        }
    },

    // place bid controller 
    async placeBid(req: Request, res: Response, next: NextFunction) {
        try {
            const jobId = Number(req.params.jobId);
            const vendorId = (req as any).vendorId;

            if (!vendorId) return res.status(401).json({ message: "Unauthorized" });

            const { amount, message } = req.body;
            const bid = await bidService.placeBid(vendorId, jobId, amount, message);

            return res.status(200).json({
                message: "Bid for the job has been placed successfully",
                data: bid
            });
        } catch (error: any) {
            if (error.message === "Job not found" || error.message === "Vendor not found" || error.message === "You have already placed the bet on this job") {
                return res.status(400).json({ message: error.message });
            }
            next(error);
        }
    },

    // change status to completed
    async jobCompleted(req: Request, res: Response, next: NextFunction) {
        try {
            const jobId = Number(req.params.jobId);
            const vendorId = (req as any).vendorId;

            await vendorService.completeJob(vendorId, jobId);

            return res.status(200).json({ message: "Job completed" });
        } catch (error: any) {
            if (error.message === "Job not found or not available") {
                return res.status(400).json({ message: error.message });
            }
            next(error);
        }
    },

    async completedJob(req: Request, res: Response, next: NextFunction) {
        try {
            const vendorId = (req as any).vendorId;
            const formattedOutput = await vendorService.getCompletedJobs(vendorId);

            return res.status(200).json({
                message: "Completed jobs fetched",
                data: formattedOutput
            });
        } catch (error) {
            next(error);
        }
    }
};
