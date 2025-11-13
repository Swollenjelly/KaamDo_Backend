import { Router } from "express";

// all the "user" controller here
import { authenticationController } from "../controllers/auth.controller";

// all the "vendor" controller here 
import { vendorController } from "../controllers/vendorController";
import { requireAuth } from "../middleware/auth";
import {jobController} from "../controllers/job.controller";
import { bidController, customerController } from "../controllers/custjob.controller";
import { vendorAuth } from "../middleware/vendorAuth";


const router = Router();

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

// protected user routes
router.use(requireAuth)
router.post("/Delete_user", authenticationController.deleteuser);
router.put("/updateuser",  authenticationController.updateuser);
router.post("/createJob",  customerController.createJob);    
router.get("/viewJob", customerController.viewJob);
router.get("/jobs/:jobId/bids", bidController.getBidsForJob);
router.post("/bids/:bidId/accept", bidController.acceptBid);
router.post("/bids/:bidId/reject", bidController.rejectBid);




// protected vendor routes
router.use(vendorAuth)
router.delete("/vendorDelete", vendorController.deleteVendor)
router.post("/vendorUpdate", vendorController.updateVendor)

// route to list all the jobs available (status = open)
router.get("/jobListing", vendorController.jobListing)
router.post("/placeBid/:jobId", vendorController.placeBid)

export default router;