import { Router } from "express";

// all the "user" controller here
import { authenticationController } from "../controllers/auth.controller";

// all the "vendor" controller here 
import { vendorController } from "../controllers/vendorController";
import { requireAuth } from "../middleware/auth";
import { jobController } from "../controllers/job.controller";
import { bidController, customerController } from "../controllers/custjob.controller";
import { vendorAuth } from "../middleware/vendorAuth";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// ---------- Multer config ----------
const uploadDir = path.join(process.cwd(), "uploads", "profile");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req: any, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    cb(null, `user-${req.userId || Date.now()}${ext}`);
  },
});

const upload = multer({ storage });
// profile routes
router.get("/me", authenticationController.getMe);

// user routes

// open user routes
router.post("/register", authenticationController.register);
router.post("/login", authenticationController.login);
router.post("/job-item", jobController.createJobitem);
router.post("/createJob", requireAuth, customerController.createJob);
router.get("/viewJob", requireAuth, customerController.viewJob)
router.get("/job-item", jobController.listJobItems);
// router.post("/welcome", (req, res) => {return res.status(200).send("Done")});


// open vendor routes 
router.post("/vendorRegister", vendorController.registerVendor)
router.post("/vendorLogin", vendorController.loginVendor)

// ================= PROTECTED USER ROUTES =================
router.post("/Delete_user", requireAuth, authenticationController.deleteuser);
router.put("/updateuser", requireAuth, authenticationController.updateuser);
router.post("/createJob", requireAuth, customerController.createJob);
router.get("/viewJob", requireAuth, customerController.viewJob);
router.get("/jobs/:jobId/bids", requireAuth, bidController.getBidsForJob);
router.post("/bids/:bidId/accept", requireAuth, bidController.acceptBid);
router.post("/bids/:bidId/reject", requireAuth, bidController.rejectBid);
router.post("/jobs/:jobId/review", requireAuth, customerController.addReview);
router.get("/profile", requireAuth, authenticationController.getProfile);
router.post("/profile/avatar", requireAuth, upload.single("avatar"), authenticationController.uploadProfilePicture);

// ================= PROTECTED VENDOR ROUTES =================
router.delete("/vendorDelete", vendorAuth, vendorController.deleteVendor);
router.post("/vendorUpdate", vendorAuth, vendorController.updateVendor);
router.get("/jobListing", vendorAuth, vendorController.jobListing);
router.post("/placeBid/:jobId", vendorAuth, vendorController.placeBid);
router.get("/assigned-jobs", vendorAuth, vendorController.assignedJob);
router.put("/completeJob/:jobId", vendorAuth, vendorController.jobCompleted);
router.get("/completedJob", vendorAuth, vendorController.completedJob);

export default router;