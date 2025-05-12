"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutUser = exports.resetPassword = exports.sendResetOtp = exports.getUser = exports.userLogin = exports.registerUser = void 0;
const user_schema_1 = require("../models/user.schema");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const generateToken_1 = __importDefault(require("../utils/generateToken"));
const mailSender_1 = require("../utils/mailSender");
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firstName, lastName, email, password } = req.body;
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).send({
                success: false,
                message: "All fields are required",
            });
        }
        const checkUser = yield user_schema_1.userModel.findOne({ email });
        if (checkUser) {
            return res.status(400).send({
                success: false,
                message: "User already exists try with another email.",
            });
        }
        let hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const student = yield user_schema_1.userModel.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
        });
        return res.status(200).send({
            success: true,
            message: "User created Successfully",
            student,
        });
    }
    catch (error) {
        return res.status(500).send({
            success: true,
            message: "Internal server error",
            error,
        });
    }
});
exports.registerUser = registerUser;
const userLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).send({
            success: false,
            message: "All fields are required",
        });
    }
    const user = yield user_schema_1.userModel.findOne({ email });
    if (!user) {
        return res.status(400).send({
            success: false,
            message: "User not found please register first.",
        });
    }
    const checkPassword = yield bcryptjs_1.default.compare(password, user.password);
    if (!checkPassword) {
        return res.status(400).send({
            success: false,
            message: "Invalid Email or Password",
        });
    }
    if (checkPassword) {
        (0, generateToken_1.default)(user, res, `welcome back ${user.firstName}`);
    }
});
exports.userLogin = userLogin;
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.id;
    const user = yield user_schema_1.userModel.findOne({ _id: userId }).select("-password");
    if (!user) {
        return res.status(404).send({
            success: false,
            message: "Invalid Email or Password",
        });
    }
    return res.status(200).send({
        success: true,
        message: "student details get successfully",
        user,
    });
});
exports.getUser = getUser;
const sendResetOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ message: "Email is required" });
    const user = yield user_schema_1.userModel.findOne({ email });
    if (!user)
        return res.status(404).json({ message: "User not found to send otp" });
    const otp = (0, mailSender_1.generateOTP)();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins from now
    const mailOptions = {
        from: `"Your App Name" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Reset Password - OTP Verification",
        html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Reset Your Password</h2>
        <p>Your OTP for password reset is:</p>
        <h3 style="color: #2e6da4;">${otp}</h3>
        <p>This OTP is valid for 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
    };
    try {
        yield mailSender_1.transporter.sendMail(mailOptions);
        yield user_schema_1.userModel.findByIdAndUpdate(user._id, {
            emailOtp: otp,
            emailOtpExpiresAt: expiry,
        });
        return res
            .status(200)
            .json({ success: true, message: "OTP sent successfully" });
    }
    catch (error) {
        console.error("Error sending OTP email:", error);
        return res
            .status(500)
            .json({ success: false, message: "Failed to send OTP" });
    }
});
exports.sendResetOtp = sendResetOtp;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp, password, confirmPassword } = req.body;
        if (!email || !otp || !password || !confirmPassword) {
            return res
                .status(400)
                .json({ success: false, message: "All fields are required" });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and confirm password must be same",
            });
        }
        const user = yield user_schema_1.userModel.findOne({ email });
        if (!user || user.emailOtp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }
        if (user.emailOtpExpiresAt && user.emailOtpExpiresAt < new Date()) {
            return res.status(400).json({ message: "OTP has expired" });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        // Clear OTP after successful verification
        user.emailOtp = undefined;
        user.emailOtpExpiresAt = undefined;
        user.password = hashedPassword;
        yield user.save();
        return res.status(200).json({ message: "Password reset successfully" });
    }
    catch (error) {
        console.log("Internal server error:", error);
        return res
            .status(500)
            .send({ success: false, message: "Internal server error" });
    }
});
exports.resetPassword = resetPassword;
const logoutUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.query;
        return res
            .cookie("token", "", { maxAge: 0 })
            .cookie("verifiedOtp", "", { maxAge: 0 })
            .send({
            success: true,
            message: "User logged out successfully",
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).send({
            success: false,
            message: "Unable to logout",
        });
    }
});
exports.logoutUser = logoutUser;
