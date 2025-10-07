import { Router } from "express";
import { authenticationController } from "../controllers/auth.controller";

const router = Router();
router.post("/register", authenticationController.register);
router.post("/login", authenticationController.login);
router.post("/Delete_user", authenticationController.deleteuser);
router.post("/update_user", authenticationController.updateuser);
// router.post("/welcome", (req, res) => {return res.status(200).send("Done")});

export default router;
