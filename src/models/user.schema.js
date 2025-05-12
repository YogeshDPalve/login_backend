"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    firstName: {
        required: true,
        type: String,
    },
    lastName: {
        required: true,
        type: String,
    },
    email: {
        required: true,
        unique: true,
        type: String,
    },
    emailOtp: {
        type: String,
    },
    emailOtpExpiresAt: {
        type: Date,
    },
    password: {
        required: true,
        type: String,
    },
}, { timestamps: true, strict: true });
exports.userModel = (0, mongoose_1.model)("User", userSchema);
