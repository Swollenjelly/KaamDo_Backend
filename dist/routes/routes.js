"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post("/register", auth_controller_1.authenticationController.register);
router.post("/login", auth_controller_1.authenticationController.login);
router.post("/Delete_user", auth_1.requireAuth, auth_controller_1.authenticationController.deleteuser);
router.post("/update_user", auth_controller_1.authenticationController.updateuser);
// router.post("/welcome", (req, res) => {return res.status(200).send("Done")});
exports.default = router;
//# sourceMappingURL=routes.js.map