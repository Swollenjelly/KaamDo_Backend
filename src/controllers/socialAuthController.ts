import { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";
import appleSigninAuth from "apple-signin-auth";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/user";
import { Vendor } from "../entities/vendor";
import { env as ENV } from "../config/env";
import { z } from "zod";

const googleClient = new OAuth2Client(ENV.GOOGLE_CLIENT_ID);

const socialLoginSchema = z.object({
    provider: z.enum(["google", "apple"]),
    token: z.string().min(1),
    role: z.enum(["user", "vendor"]),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
});

export const socialAuthController = {
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { provider, token, role, firstName, lastName } = socialLoginSchema.parse(req.body);

            let externalId = "";
            let email: string | null = null;
            let name = "Unknown";

            // Combine firstName and lastName for Apple if provided
            if (firstName || lastName) {
                name = `${firstName || ''} ${lastName || ''}`.trim();
            }

            if (provider === "google") {
                const ticket = await googleClient.verifyIdToken({
                    idToken: token,
                    audience: ENV.GOOGLE_CLIENT_ID,
                });
                const payload = ticket.getPayload();
                if (!payload) {
                    return res.status(401).json({ message: "Invalid Google token" });
                }
                externalId = payload.sub;
                email = payload.email || null;
                if (payload.name) name = payload.name;
            } else if (provider === "apple") {
                try {
                    const appleIdTokenClaims = await appleSigninAuth.verifyIdToken(token, {
                        // audience: ENV.APPLE_CLIENT_ID, // Use if specific Client ID validation is strictly needed
                        ignoreExpiration: false,
                    });
                    externalId = appleIdTokenClaims.sub;
                    email = appleIdTokenClaims.email || null;
                } catch (err) {
                    return res.status(401).json({ message: "Invalid Apple token" });
                }
            }

            if (!externalId) {
                return res.status(400).json({ message: "Failed to resolve external provider ID" });
            }

            const idField = provider === "google" ? "googleId" : "appleId";

            // Role specific logic
            if (role === "user") {
                const userRepo = AppDataSource.getRepository(User);
                let user = await userRepo.findOne({
                    where: [{ [idField]: externalId }, ...(email ? [{ email }] : [])]
                });

                if (user) {
                    // Unify account if matching by email
                    if (provider === "google" && !user.googleId) user.googleId = externalId;
                    if (provider === "apple" && !user.appleId) user.appleId = externalId;
                    if (user.authProvider === "local") user.authProvider = provider;

                    await userRepo.save(user);
                } else {
                    // Register new user
                    user = userRepo.create({
                        name,
                        email,
                        [idField]: externalId,
                        authProvider: provider,
                        isProfileComplete: false,
                    });
                    await userRepo.save(user);
                }

                const appToken = jwt.sign({ role: "user" }, ENV.JWT_SECRET, {
                    subject: String(user.id),
                    expiresIn: "2h",
                });

                return res.status(200).json({
                    message: "Social login successful",
                    data: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        isProfileComplete: user.isProfileComplete,
                        token: appToken,
                    },
                });
            } else if (role === "vendor") {
                const vendorRepo = AppDataSource.getRepository(Vendor);
                let vendor = await vendorRepo.findOne({
                    where: [{ [idField]: externalId }, ...(email ? [{ email }] : [])]
                });

                if (vendor) {
                    // Unify account if matching by email
                    if (provider === "google" && !vendor.googleId) vendor.googleId = externalId;
                    if (provider === "apple" && !vendor.appleId) vendor.appleId = externalId;
                    if (vendor.authProvider === "local") vendor.authProvider = provider;

                    await vendorRepo.save(vendor);
                } else {
                    // Register new vendor
                    vendor = vendorRepo.create({
                        name,
                        email,
                        [idField]: externalId,
                        authProvider: provider,
                        isProfileComplete: false,
                    });
                    await vendorRepo.save(vendor);
                }

                const appToken = jwt.sign({ role: "vendor" }, ENV.JWT_SECRET, {
                    subject: String(vendor.id),
                    expiresIn: "2h",
                });

                return res.status(200).json({
                    message: "Social login successful",
                    data: {
                        id: vendor.id,
                        name: vendor.name,
                        email: vendor.email,
                        phone: vendor.phone,
                        isProfileComplete: vendor.isProfileComplete,
                        token: appToken,
                    },
                });
            }
        } catch (error) {
            console.error(error);
            next(error);
        }
    },

    async completeUserProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).userId;
            if (!userId) return res.status(401).json({ message: "Unauthorized" });

            const { phone, gender, location } = req.body;
            if (!phone || !gender || !location) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            const userRepo = AppDataSource.getRepository(User);
            const user = await userRepo.findOne({ where: { id: userId } });
            if (!user) return res.status(404).json({ message: "User not found" });

            user.phone = phone;
            user.gender = gender;
            user.location = location;
            user.isProfileComplete = true;

            await userRepo.save(user);

            return res.status(200).json({
                message: "Profile completed successfully",
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    isProfileComplete: user.isProfileComplete
                }
            });
        } catch (error) {
            next(error);
        }
    },

    async completeVendorProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const vendorId = (req as any).vendorId;
            if (!vendorId) return res.status(401).json({ message: "Unauthorized" });

            const { phone, gender, location, preferredWorkLocation, vendorType, documentType } = req.body;
            if (!phone || !gender || !location || !preferredWorkLocation || !vendorType || !documentType) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            const vendorRepo = AppDataSource.getRepository(Vendor);
            const vendor = await vendorRepo.findOne({ where: { id: vendorId } });
            if (!vendor) return res.status(404).json({ message: "Vendor not found" });

            vendor.phone = phone;
            vendor.gender = gender;
            vendor.location = location;
            vendor.preferredWorkLocation = preferredWorkLocation;
            vendor.vendorType = vendorType;
            vendor.documentType = documentType;
            vendor.isProfileComplete = true;

            await vendorRepo.save(vendor);

            return res.status(200).json({
                message: "Profile completed successfully",
                data: {
                    id: vendor.id,
                    name: vendor.name,
                    email: vendor.email,
                    phone: vendor.phone,
                    isProfileComplete: vendor.isProfileComplete
                }
            });
        } catch (error) {
            next(error);
        }
    }
};
