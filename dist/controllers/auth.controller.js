"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticationController = void 0;
const zod_1 = require("zod");
const data_source_1 = require("../config/data-source");
const user_1 = require("../entities/user");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
// import { AuthService } from "../services/auth.service";
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(40),
    phone: zod_1.z.string().min(10).max(10),
    email: zod_1.z.email().optional(),
    password: zod_1.z.string().min(1).max(100),
    gender: zod_1.z.enum(["male", "female", "other"]),
    location: zod_1.z.string()
});
const loginSchema = zod_1.z.object({
    phone: zod_1.z.string().min(10).max(10),
    password: zod_1.z.string().min(1).max(100),
});
exports.authenticationController = {
    async register(req, res, next) {
        try {
            const { name, phone, email, password, gender, location } = registerSchema.parse(req.body);
            const userRepo = data_source_1.AppDataSource.getRepository(user_1.User);
            // Check if phonealready exists
            const existingUser = await userRepo.findOne({ where: [{ phone }] });
            if (existingUser) {
                return res.status(409).json({ message: "User already exists with this phone or email" });
            }
            // Hash password
            const passwordHash = await bcrypt_1.default.hash(password, 10);
            // Create user
            const newUser = userRepo.create({
                name,
                phone,
                email: email || null,
                passwordHash,
                gender,
                location
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
                    location: newUser.location
                },
            });
        }
        catch (error) {
            next(error);
        }
    },
    async login(req, res, next) {
        try {
            const { phone, password } = loginSchema.parse(req.body);
            const userRepo = data_source_1.AppDataSource.getRepository(user_1.User);
            const user = await userRepo.findOne({ where: { phone } });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            const valid = await bcrypt_1.default.compare(password, user.passwordHash);
            if (!valid) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            // Put the id into the standard subject (as string)
            const token = jsonwebtoken_1.default.sign({}, // no custom payload needed
            env_1.env.JWT_SECRET, { subject: String(user.id), expiresIn: "2h" });
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
        }
        catch (error) {
            next(error);
        }
    },
    // inside authenticationController
    async deleteuser(req, res, next) {
        try {
            const userId = req.userId;
            if (!userId)
                return res.status(401).json({ message: "Unauthorized" });
            const userRepo = data_source_1.AppDataSource.getRepository(user_1.User);
            // Hard delete:
            const result = await userRepo.delete({ id: userId });
            if (result.affected === 0) {
                return res.status(404).json({ message: "User not found" });
            }
            return res.status(200).json({ message: "Profile deleted" });
        }
        catch (error) {
            next(error);
        }
    },
    async updateuser(req, res, next) {
        // try {
        //   const { phone, name, email, password } = req.body;
        //   const user = await AuthService.updateuser(phone, name, email, password);
        //   res.status(200).json({ message: "User updated successfully", data: user });
        // } catch (error) {
        //   next(error);
        // }
    }
};
//# sourceMappingURL=auth.controller.js.map