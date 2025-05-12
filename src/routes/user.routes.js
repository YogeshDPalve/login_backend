"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const validationMiddleware_1 = require("../validations/validationMiddleware");
const router = (0, express_1.Router)();
router.post("/register", validationMiddleware_1.validateRegistration, user_controller_1.registerUser);
router.post("/login", validationMiddleware_1.validateLogin, user_controller_1.userLogin);
router.post("/send-otp", validationMiddleware_1.validateSendOtp, user_controller_1.sendResetOtp);
router.put("/reset-password", validationMiddleware_1.validateResetPassword, user_controller_1.resetPassword);
router.get("/", authMiddleware_1.default, user_controller_1.getUser);
router.get("/logout", authMiddleware_1.default, user_controller_1.logoutUser);
exports.default = router;
