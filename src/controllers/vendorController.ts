import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { Vendor } from "../entities/vendor";
import { Bid } from "../entities/bid";
import { JobListings } from "../entities/job-listing";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import bcrypt from "bcrypt"

const vendorRegisterSchema = z.object({
    name: z.string().min(3).max(30),
    phone: z.string().min(10).max(10),
    email: z.string().optional().transform(val => val === "" ? null : val),
    password: z.string().min(1).max(100),
    gender: z.enum(["male", "female", "other"]),
    location: z.enum(["mumbai" , "pune" , "banglore" , "delhi" , "chennai" , "hyderabad" , "kolkata"]),
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
        const {
            name,
            phone,
            email,
            password,
            gender,
            location,
            preferredWorkLocation,
            vendorType,
            documentType,
        } = vendorRegisterSchema.parse(req.body);

        //await getRepo
        const vendorRepo = AppDataSource.getRepository(Vendor);

        const existingVendor = await vendorRepo.findOne({
            where: [{ phone }],
        });

        if (existingVendor) {
            return res
            .status(409)
            .json({ message: "Vendor with this phone number already exists" });
        }

        const hashedPass = await bcrypt.hash(password,10);

        const documentFile = req.file ? req.file.filename : null

        const newVendor = vendorRepo.create({
            name,
            phone,
            email: email || null,
            password: hashedPass,
            gender,
            location,
            preferredWorkLocation,
            vendorType,
            documentType,
            documentFile
        });

        // multer

        await vendorRepo.save(newVendor);

        return res.status(200).json({ message: newVendor });
        } catch (error) {
        next(error);
        }
    },

    // vendor login controller
    async loginVendor(req: Request, res: Response, next: NextFunction) {
        try {
        const { phone, password } = vendorLoginSchema.parse(req.body);
        const vendorRepo = AppDataSource.getRepository(Vendor);
        const vendor = await vendorRepo.findOne({ where: { phone } });

        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        const valid = await bcrypt.compare(password, vendor.password);
        if (!valid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Put the id into the standard subject (as string)
        const token = jwt.sign(
            {},
            env.JWT_SECRET,
            { subject: String(vendor.id), expiresIn: "2h" }
        );

        res.status(200).json({
            message: "Vendor logged in successfully",
            data: {
                vendor,
                token,
            },
        });
        } catch (error) {
            next(error);
        }
    },

    // vendor delete controller
    async deleteVendor(req: Request, res: Response, next: NextFunction) {
        try {
            // get the vendor id
            const vendorId = (req as any).vendorId
            console.log(vendorId)
            const vendorRepo = AppDataSource.getRepository(Vendor);

            const result = await vendorRepo.delete({ id: vendorId });

            if (result.affected === 0) {
                return res.status(404).json({ message: "Vendor not found" });
            }

            return res.status(200).json({ message: "Vendor profile successfully deleted" });
        } catch (error) {
            next(error)
        }
    },
    
    // vendor data update controller 
    async updateVendor(req:Request, res:Response, next:NextFunction){

        try {
            
            // get the user id 
            const vendorId = (req as any).vendorId
            if(!vendorId){
                return res.status(400).json({
                    message: "Invalid request"
                })
            }

            const {name, phone, email, password, gender, location, preferredWorkLocation, vendorType, documentType} = req.body

            const vendorRepo = AppDataSource.getRepository(Vendor)
            const vendor = await vendorRepo.findOne({ where : {id: vendorId}})
            if(!vendor){
                return res.status(400).json({
                    message: "Invalid request"
                })
            }

            if (name) vendor.name = name;
            if (phone) vendor.phone = phone;
            if (email) vendor.email = email;
            if (password){
                const hashPass = await bcrypt.hash(password, 10)
                vendor.password = hashPass
            } // ideally hash before saving
            if (gender) vendor.gender = gender;
            if (location) vendor.location = location;
            if (preferredWorkLocation) vendor.preferredWorkLocation = preferredWorkLocation;
            if (vendorType) vendor.vendorType = vendorType;
            if (documentType) vendor.documentType = documentType;

            await vendorRepo.save(vendor)

            return res.status(200).json({
                data: vendor
            })

        } catch (error) {
            
                next(error)
        }

    },

    // job listing api to view all the job
    async jobListing(req:Request, res:Response){
        try {
            
            const jobRepo = AppDataSource.getRepository(JobListings)
            const openJobs = await jobRepo.find({
                where: {status: "open"},
                relations: ["job_item", "user"]
            })

            const formattedOutput = openJobs.map((job) => ({
                jobId: job.id,
                jobName: job.job_item?.name,
                postedBy: job.user?.name,
                location: job.user?.location,
                details: job.details,
                schedule_date: job.scheduled_date,
                schedule_time: job.scheduled_time
            }))

            
            res.status(200).json({
                message: "Jobs fetched successfully",
                data: formattedOutput
            })

        } catch (error) {
            res.status(500).json({
                message: "Unable to load jobs at the moment",
                data: error
            })
        } 
    },   

    // place bid controller 
    async placeBid(req:Request, res:Response, next:NextFunction){
        try {
          
            // get the job id from the routes
            const jobId = req.params.jobId
            // convert the id into number
            const jobNumber = Number(jobId)

            const vendorId = (req as any).vendorId

            const { amount, message } = req.body

            const jobRepo = AppDataSource.getRepository(JobListings)
            const bidRepo = AppDataSource.getRepository(Bid)
            const vendorRepo = AppDataSource.getRepository(Vendor)

            // check if the job exist 
            const findJob = await jobRepo.findOne({ where: {
                id: jobNumber
            } })
            if(!findJob){ 
                return res.status(400).json({
                    message: "Job not found"
                })
            }

            // check if the vendor exists 
            const findVendor = await vendorRepo.findOne({ where: 
                {id: vendorId}
            })
            if(!findVendor){
                return res.status(400).json({
                    message: "Vendor not found"
                })
            }

            // check if the vendor has already placed the bid once because once placed cannot bid again 
            const existingBid = await bidRepo.findOne({
                where: {
                    job: {id: jobNumber},
                    vendor: {id: vendorId}
                }
            })
            if(existingBid){
                return res.status(400).json({
                    message: "You have already placed the bet on this job"
                })
            }

            const bid = bidRepo.create({
                job: findJob,
                vendor: vendorId,
                amount,
                message,
                status: "open"
            })

            await bidRepo.save(bid)

            return res.status(200).json({
                message: "Bid for the job has been placed successfully",
                data: bid
            })

        } catch (error) {
            next(error)
        }
    }

}

