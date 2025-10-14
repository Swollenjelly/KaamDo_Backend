import { email, z } from "zod";
import e, { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/user";
import { Vendor } from "../entities/vendor";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env as ENV } from "../config/env";
import { DeepPartial } from "typeorm";
// import { AuthService } from "../services/auth.service";

const registerSchema = z.object({
    name: z.string().min(2).max(40),
    phone: z.string().min(10).max(10),
    email: z.email().optional(),
    password: z.string().min(1).max(100),
    gender: z.enum(["male", "female", "other"]),
    location: z.string(),
});

const loginSchema = z.object({
    phone: z.string().min(10).max(10),
    password: z.string().min(1).max(100),
});

const vendorRegisterSchema = z.object({
    name: z.string().min(3).max(30),
    phone: z.string().min(10).max(10),
    email: z.email().optional(),
    password: z.string().min(1).max(100),
    gender: z.enum(["male", "female", "other"]),
    location: z.string(),
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
    password: z.string().min(1).max(100)
})

export const authenticationController = {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, phone, email, password, gender, location } =
                registerSchema.parse(req.body);

            const userRepo = AppDataSource.getRepository(User);

            // Check if phonealready exists
            const existingUser = await userRepo.findOne({ where: [{ phone }] });
            if (existingUser) {
                return res.status(409).json({
                    message: "User already exists with this phone or email",
                });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create user
            const newUser = userRepo.create({
                name,
                phone,
                email: email || null,
                passwordHash,
                gender,
                location,
            });
            await userRepo.save(newUser);

            res.status(201).json({
                message: "User registered successfully",
                data: {
                    id: newUser.id,
                    name: newUser.name,
                    phone: newUser.phone,
                    email: newUser.email,
                    gender: newUser.gender,
                    location: newUser.location,
                },
            });
        } catch (error) {
            next(error);
        }
    },

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { phone, password } = loginSchema.parse(req.body);
            const userRepo = AppDataSource.getRepository(User);
            const user = await userRepo.findOne({ where: { phone } });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const valid = await bcrypt.compare(password, user.passwordHash);
            if (!valid) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            // Put the id into the standard subject (as string)
            const token = jwt.sign(
                {}, // no custom payload needed
                ENV.JWT_SECRET,
                { subject: String(user.id), expiresIn: "2h" }
            );

            res.status(200).json({
                message: "User logged in successfully",
                data: {
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    email: user.email,
                    token,
                },
            });
        } catch (error) {
            next(error);
        }
    },

    // inside authenticationController
    async deleteuser(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).userId;
            if (!userId)
                return res.status(401).json({ message: "Unauthorized" });

            const userRepo = AppDataSource.getRepository(User);

            // Hard delete:
            const result = await userRepo.delete({ id: userId });
            if (result.affected === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            return res.status(200).json({ message: "Profile deleted" });
        } catch (error) {
            next(error);
        }
    },

    async updateuser(req: Request, res: Response, next: NextFunction) {
        console.log("updateuser called");
        console.log("Request body:", req.body);
        console.log("User ID from request:", (req as any).userId);
        try {
            const userId = (req as any).userId;
            if (!userId)
                return res.status(401).json({ message: "Unauthorized" });

            const { name, phone, email, password, gender, location } = req.body;

            const userRepo = AppDataSource.getRepository(User);
            const user = await userRepo.findOne({ where: { id: userId } });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (name) user.name = name;
            if (phone) user.phone = phone;
            if (email) user.email = email;
            if (gender) user.gender = gender;
            if (location) user.location = location;
            if (password) {
                const passwordHash = await bcrypt.hash(password, 10);
                user.passwordHash = passwordHash;
            }

            await userRepo.save(user);

            return res.status(200).json({
                message: "User updated successfully",
                data: {
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    email: user.email,
                    gender: user.gender,
                    location: user.location,
                },
            });
        } catch (error) {
            next(error);
        }
    },

    // Vendor related controllers can be added here
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
                    .json({ message: "This vendor already exists please login" });
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
                documentType
            } as DeepPartial<Vendor>) 

            await vendorRepo.save(newVendor)

            return res.status(200).json({ message: newVendor})
        } catch (error) {
            next(error)            
        }
    },

    // vendor login controller 
    async loginVendor(req: Request, res:Response, next: NextFunction){
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
                ENV.JWT_SECRET,
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
    }
};
