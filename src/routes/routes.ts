import { Router } from "express";
import { authenticationController } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import {jobController} from "../controllers/job.controller";
import { customerController } from "../controllers/custjob.controller";

const router = Router();
router.post("/register", authenticationController.register);
router.post("/login", authenticationController.login);
router.post("/Delete_user",requireAuth, authenticationController.deleteuser);
router.put("/updateuser", requireAuth, authenticationController.updateuser);
router.post("/job-item", jobController.createJobitem);
router.post("/createJob", requireAuth, customerController.createJob);    
// router.post("/welcome", (req, res) => {return res.status(200).send("Done")});

// vendor routes 
router.post("/vendorRegister", authenticationController.registerVendor)
router.post("/vendorLogin", authenticationController.loginVendor)

export default router;
