import { Request, Response } from "express";
import { userModel } from "../models/user.schema";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken";
import { AuthRequest } from "../constants/interfaces";
import { generateOTP, transporter } from "../utils/mailSender";

const registerUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).send({
        success: false,
        message: "All fields are required",
      });
    }

    const checkUser = await userModel.findOne({ email });
    if (checkUser) {
      return res.status(400).send({
        success: false,
        message: "User already exists try with another email.",
      });
    }

    let hashedPassword: string = await bcrypt.hash(password, 10);

    const student = await userModel.create({
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
  } catch (error) {
    return res.status(500).send({
      success: true,
      message: "Internal server error",
      error,
    });
  }
};

const userLogin = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({
      success: false,
      message: "All fields are required",
    });
  }

  const user = await userModel.findOne({ email });
  if (!user) {
    return res.status(400).send({
      success: false,
      message: "User not found please register first.",
    });
  }

  const checkPassword = await bcrypt.compare(password, user.password);

  if (!checkPassword) {
    return res.status(400).send({
      success: false,
      message: "Invalid Email or Password",
    });
  }

  if (checkPassword) {
    generateToken(user, res, `welcome back ${user.firstName}`);
  }
};

const getUser = async (req: AuthRequest, res: Response): Promise<any> => {
  const userId: string = req.id as string;
  const user = await userModel.findOne({ _id: userId }).select("-password");

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
};

const sendResetOtp = async (req: Request, res: Response): Promise<any> => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  const user = await userModel.findOne({ email });
  if (!user)
    return res.status(404).json({ message: "User not found to send otp" });

  const otp = generateOTP();
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
    await transporter.sendMail(mailOptions);
    await userModel.findByIdAndUpdate(user._id, {
      emailOtp: otp,
      emailOtpExpiresAt: expiry,
    });

    return res
      .status(200)
      .json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send OTP" });
  }
};

const resetPassword = async (req: Request, res: Response): Promise<any> => {
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

    const user = await userModel.findOne({ email });
    if (!user || user.emailOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.emailOtpExpiresAt && user.emailOtpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Clear OTP after successful verification
    user.emailOtp = undefined;
    user.emailOtpExpiresAt = undefined;
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.log("Internal server error:", error);
    return res
      .status(500)
      .send({ success: false, message: "Internal server error" });
  }
};

const logoutUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.query;
    return res
      .cookie("token", "", { maxAge: 0 })
      .cookie("verifiedOtp", "", { maxAge: 0 })
      .send({
        success: true,
        message: "User logged out successfully",
      });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Unable to logout",
    });
  }
};
export {
  registerUser,
  userLogin,
  getUser,
  sendResetOtp,
  resetPassword,
  logoutUser,
};
