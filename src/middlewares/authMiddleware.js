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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_schema_1 = require("../models/user.schema");
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.cookies;
    if (!token) {
        res.status(404).send({
            success: false,
            message: "Token not exists",
        });
        return;
    }
    const decode = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    if (!decode) {
        return res.status(404).send({
            success: false,
            message: "Invalid Token",
        });
    }
    const { userId } = decode;
    const user = yield user_schema_1.userModel.findById(userId);
    if (!user) {
        return res.status(404).send({
            success: false,
            message: "User not found",
        });
    }
    req.id = decode.userId;
    next();
});
exports.default = authMiddleware;
