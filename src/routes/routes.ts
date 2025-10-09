import { Router } from "express";
import { authenticationController } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import {jobController} from "../controllers/job.controller";

const router = Router();
router.post("/register", authenticationController.register);
router.post("/login", authenticationController.login);
router.post("/Delete_user",requireAuth, authenticationController.deleteuser);
router.put("/updateuser", requireAuth, authenticationController.updateuser);
router.post("/job-item", jobController.createJobitem);
// router.post("/welcome", (req, res) => {return res.status(200).send("Done")});

export default router;
