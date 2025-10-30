import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { Vendor } from "../entities/vendor";
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

        const vendorRepo = AppDataSource.getRepository(Vendor);

        const existingVendor = await vendorRepo.findOne({
            where: [{ phone }],
        });

        if (existingVendor) {
            return res
            .status(409)
            .json({ message: "Vendor with this phone number already exists" });
        }

        const hashedPass = await bcrypt.hash(password, 10);

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
        });

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
            {}, // no custom payload needed
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

    }
     
}