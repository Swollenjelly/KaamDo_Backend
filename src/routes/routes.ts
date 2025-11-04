import { Router } from "express";

// all the "user" controller here
import { authenticationController } from "../controllers/auth.controller";

// all the "vendor" controller here 
import { vendorController } from "../controllers/vendorController";
import { requireAuth } from "../middleware/auth";
import {jobController} from "../controllers/job.controller";
import { customerController } from "../controllers/custjob.controller";
import { vendorAuth } from "../middleware/vendorAuth";

const router = Router();
router.post("/register", authenticationController.register);
router.post("/login", authenticationController.login);
router.post("/Delete_user",requireAuth, authenticationController.deleteuser);
router.put("/updateuser", requireAuth, authenticationController.updateuser);
router.post("/job-item", jobController.createJobitem);
router.post("/createJob", requireAuth, customerController.createJob);    
router.post("/viewJob", requireAuth, customerController.viewJob)
// router.post("/welcome", (req, res) => {return res.status(200).send("Done")});

// vendor routes 

// open routes 
router.post("/vendorRegister", vendorController.registerVendor) 
router.post("/vendorLogin", vendorController.loginVendor)

// protect routes
router.use(vendorAuth)
router.delete("/vendorDelete", vendorController.deleteVendor)
router.post("/vendorUpdate", vendorController.updateVendor)
// route to list all the jobs available (status = open)
router.get("/jobListing", vendorController.jobListing)


export default router;