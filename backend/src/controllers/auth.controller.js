import userModel from '../models/user.model.js';
import crypto, { generateKey } from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import sessionModel from '../models/session.model.js';
import { generateOtp, getOtpHtmlEmail } from '../utils/utils.js';
import otpModel from '../models/otp.model.js';
import storageService from "../services/storage.services.js";

export async function register(req, res) {
    try {
        const { firstName, lastName, email, phone, password, countryCode } = req.body;

        const isAlreadyRegistered = await userModel.findOne({
            $or: [
                { email },
                { phone },
            ]
        })

        if (isAlreadyRegistered) {
            return res.status(400).json({
                message: "User already exists, please login to your account"
            });
        }

        // const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            firstName,
            lastName,
            name: `${firstName} ${lastName}`,
            email,
            countryCode,
            phone,
            password: hashedPassword,
            role: "user",
            isVerified: false,
            status: "active",
            lockUtil: 0
        });

        const refreshToken = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: '7d' });

        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        const session = await sessionModel.create({
            user: user._id,
            refreshTokenHash,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            login_method: "email"
        });

        const accessToken = jwt.sign({ id: user._id, sessionId: session._id }, config.JWT_SECRET, { expiresIn: '15m' });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        const otp1 = generateOtp();
        const otp2 = generateOtp();
        const html = getOtpHtmlEmail(otp1);

        const emailOtpHash = crypto.createHash('sha256').update(otp1).digest('hex');
        const phoneOtpHash = crypto.createHash('sha256').update(otp2).digest('hex');

        const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
        await otpModel.create({
            email,
            phone,
            countryCode,
            user: user._id,
            emailOtpHash,
            phoneOtpHash,
            expiresAt,
            failedAttempts: 0,
            lockUntil: null
        });

        // await sendEmail(email, "Verify your email", "Please verify your account using the OTP below", html);
        // await sendPhone(phone, "Verify your phone number", "Please verify your account using the OTP below", html);
        console.log(`OTP for ${email}: ${otp1}`);
        console.log(`OTP for ${phone}: ${otp2}`);

        return res.status(201).json({
            message: "User registered successfully, please verify your email using the OTP sent to your email address",
            user: {
                _id: user._id,
                name: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                password: user.password,
                role: user.role,
                isVerified: user.isVerified,
                status: user.status,
                lockUtil: user.lockUtil,
                verifyBy: user.verifyBy
            },
            accessToken
        });
    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({ message: error.message || "Registration failed" });
    }
}

export async function signupVerifyOtp(req, res) {
    try {
        const { email, phone, otp } = req.query;

        if (!email && !phone) {
            return res.status(400).json({
                message: "Please provide either email or phone to verify"
            });
        }

        if (!otp) {
            return res.status(400).json({
                message: "OTP is required"
            });
        }

        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

        let otpDocument;
        let successMessage;

        if (email) {
            otpDocument = await otpModel.findOne({ email, emailOtpHash: otpHash });
            successMessage = "Email verified successfully, you can now login to your account";
        } else {
            otpDocument = await otpModel.findOne({ phone: phone, phoneOtpHash: otpHash });
            successMessage = "Phone verified successfully, you can now login to your account";
        }

        if (!otpDocument) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        await userModel.findByIdAndUpdate(otpDocument.user, {
            isVerified: true,
            verifyBy: email ? "email" : "phone",
            emailVerified: email ? true : false,
            phoneVerified: phone ? true : false
        });

        await otpModel.deleteMany({ user: otpDocument.user });

        return res.status(200).json({
            message: successMessage,
        });
    } catch (error) {
        console.error("signupVerifyOtp error:", error);
        return res.status(500).json({ message: error.message || "OTP verification failed" });
    }
}

export async function login(req, res) {
    try {
        const { email, password, phone, countryCode } = req.body;

        if (!email && !phone) {
            return res.status(400).json({
                message: "Please provide email or phone number"
            });
        }

        // ==========================
        // EMAIL + PASSWORD LOGIN
        // ==========================
        if (email) {
            if (!password) {
                return res.status(400).json({
                    message: "Password is required"
                });
            }

            const user = await userModel.findOne({ email });

            if (!user) {
                return res.status(404).json({
                    message: "No account found with this email"
                });
            }

            if (!user.isVerified) {
                return res.status(401).json({
                    message: "Please verify your account before logging in"
                });
            }

            if (user.status === "blocked") {
                return res.status(403).json({
                    message: "Your account has been blocked"
                });
            }

            if (user.lockUntil && user.lockUntil > Date.now()) {
                const remaining = Math.ceil(
                    (user.lockUntil - Date.now()) / 60000
                );

                return res.status(403).json({
                    message: `Account is locked. Try again in ${remaining} minute(s).`
                });
            }

            // const hashedPassword = crypto
            //     .createHash("sha256")
            //     .update(password)
            //     .digest("hex");

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                user.loginAttempts = (user.loginAttempts || 0) + 1;

                if (user.loginAttempts >= 5) {
                    user.lockUntil = new Date(
                        Date.now() + 15 * 60 * 1000
                    );

                    await user.save();

                    return res.status(403).json({
                        message:
                            "Account locked due to 5 failed attempts. Try again after 15 minutes."
                    });
                }

                await user.save();

                return res.status(401).json({
                    message: `Invalid password. ${5 - user.loginAttempts
                        } attempt(s) remaining.`
                });
            }

            user.loginAttempts = 0;
            user.lockUntil = null;

            await user.save();

            return await _createSession(
                req,
                res,
                user,
                { email: user.email }
            );
        }

        // ==========================
        // PHONE LOGIN (SEND OTP)
        // ==========================
        const user = await userModel.findOne({ phone });

        if (!user) {
            return res.status(404).json({
                message: "No account found with this phone number"
            });
        }

        if (!user.isVerified) {
            return res.status(401).json({
                message: "Please verify your account before logging in"
            });
        }

        if (user.status === "blocked") {
            return res.status(403).json({
                message: "Your account has been blocked"
            });
        }

        if (user.lockUntil && user.lockUntil > Date.now()) {
            const remaining = Math.ceil(
                (user.lockUntil - Date.now()) / 60000
            );

            return res.status(403).json({
                message: `Account is locked. Try again in ${remaining} minute(s).`
            });
        }

        await otpModel.deleteMany({
            user: user._id
        });

        const otp = generateOtp();

        const phoneOtpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        const expiresAt = new Date(
            Date.now() + 2 * 60 * 1000
        );

        await otpModel.create({
            email: user.email,
            phone: user.phone,
            countryCode: user.countryCode,
            user: user._id,
            emailOtpHash: "N/A",
            phoneOtpHash,
            expiresAt,
            failedAttempts: 0,
            lockUntil: null
        });

        console.log(
            `[LOGIN OTP] ${phone} : ${otp}`
        );

        return res.status(200).json({
            message:
                "OTP sent successfully. Please verify OTP to login."
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: error.message || "Login failed" });
    }
}

export async function loginVerifyOtp(req, res) {
    try {
        const { countryCode, phone, otp } = req.query;

        if (!phone || !otp) {
            return res.status(400).json({ message: "Phone number and OTP are required" });
        }

        const user = await userModel
            .findOne({ phone: phone })

        if (!user) {
            return res.status(404).json({ message: "No account found with this phone number" });
        }

        if (user.status === 'blocked') {
            return res.status(403).json({ message: "Your account has been blocked" });
        }

        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

        const otpDocument = await otpModel.findOne({
            user: user._id,
            phoneOtpHash: otpHash,
        });

        if (!otpDocument) {
            return res.status(400).json({ message: "Invalid OTP. Please request a new one." });
        }

        if (otpDocument.expiresAt && otpDocument.expiresAt < Date.now()) {
            await otpModel.deleteMany({ user: user._id });
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        if (otpDocument.lockUntil && otpDocument.lockUntil > new Date()) {
            const remaining = Math.ceil((otpDocument.lockUntil - new Date()) / 60000);
            return res.status(403).json({ message: `Too many attempts. Try again after ${remaining} minute(s).` });
        }

        const MAX_ATTEMPTS = 5;

        if (otpDocument.phoneOtpHash !== otpHash) {
            otpDocument.failedAttempts = (otpDocument.failedAttempts || 0) + 1;
            const attemptsLeft = MAX_ATTEMPTS - otpDocument.failedAttempts;

            if (attemptsLeft <= 0) {
                otpDocument.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
                await otpDocument.save();
                return res.status(403).json({ message: "Too many failed attempts. OTP locked for 15 minutes." });
            }

            await otpDocument.save();
            return res.status(400).json({
                message: `Invalid OTP. ${attemptsLeft} attempt(s) remaining.`,
                attemptsLeft,
            });
        }

        await otpModel.deleteMany({ user: user._id });

        return await _createSession(req, res, user, { phone: user.phone });
    } catch (error) {
        console.error("loginVerifyOtp error:", error);
        return res.status(500).json({ message: error.message || "OTP verification failed" });
    }
}

async function _createSession(req, res, user, publicFields) {
    const refreshToken = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: '7d' });

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const session = await sessionModel.create({
        user: user._id,
        refreshTokenHash,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        login_method: publicFields.phone ? 'phone' : 'email'
    });

    const accessToken = jwt.sign(
        { id: user._id, sessionId: session._id },
        config.JWT_SECRET,
        { expiresIn: '15m' }
    );

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
        message: "Login successful",
        user: {
            username: user.name,
            ...publicFields,
        },
        accessToken,
    });
}

export async function refreshToken(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token not found, please login again"
            })
        }

        const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        const session = await sessionModel.findOne({
            refreshTokenHash,
            revoked: false,
        });

        if (!session) {
            return res.status(401).json({
                message: "Invalid refresh token, please login again"
            })
        }

        const accessToken = jwt.sign({ id: decoded.id, sessionId: session._id }, config.JWT_SECRET, { expiresIn: '15m' });

        const newRefreshToken = jwt.sign({ id: decoded.id }, config.JWT_SECRET, { expiresIn: "7d" })

        const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

        session.refreshTokenHash = newRefreshTokenHash;
        await session.save();

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            message: "Token refreshed successfully",
            accessToken,
        });
    } catch (error) {
        console.error("refreshToken error:", error);
        return res.status(401).json({ message: "Invalid or expired refresh token" });
    }
}

export async function getProfile(req, res) {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                message: "token not found"
            })
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);

        const session = await sessionModel.findOne({
            _id: decoded.sessionId,
            revoked: false,
        });
        if (!session) {
            return res.status(401).json({ message: "Session revoked, please login again" });
        }

        const user = await userModel.findById(decoded.id);

        res.status(200).json({
            message: "User profile fetched successfully",
            user: {
                username: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                countryCode: user.countryCode,
                profilePictureURL: user.profilePictureURL,
                profilePictureName: user.profilePictureName,
                role: user.role,
                isVerified: user.isVerified,
                status: user.status,
                lockUtil: user.lockUtil,
                emailVerified: user.emailVerified,
                phoneVerified: user.phoneVerified,
                authProvider: user.authProvider
            }
        })
    } catch (error) {
        console.error("getProfile error:", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}

export async function updateProfile(req, res) {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Token not found"
            });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);

        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const {
            firstName,
            lastName,
            email,
            phone,
            countryCode
        } = req.body;

        // Email cannot be changed
        if (email && email !== user.email) {
            return res.status(400).json({
                message: "Email cannot be changed"
            });
        }

        // Phone cannot be changed once set, but can be added if empty
        if (phone && user.phone && phone !== user.phone) {
            return res.status(400).json({ message: "Phone number cannot be changed" });
        }

        // Allow adding phone if user doesn't have one (Google users)
        if (phone && !user.phone) {
            const phoneExists = await userModel.findOne({ phone, _id: { $ne: user._id } });
            if (phoneExists) {
                return res.status(400).json({ message: "This phone number is already registered" });
            }
            user.phone = phone;
            user.countryCode = countryCode || '+91';
        }

        // Update name fields
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;

        // Upload image if provided
        if (req.file) {
            const result = await storageService.uploadFile(
                req.file.buffer
            );

            user.profilePictureURL = result.url;
            user.profilePictureName = req.file.originalname;
        }

        user.name = `${user.firstName} ${user.lastName}`;

        await user.save();

        return res.status(200).json({
            message: "Profile updated successfully",
            user: {
                username: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                countryCode: user.countryCode,
                profilePictureURL: user.profilePictureURL,
                profilePictureName: user.profilePictureName,
            }
        });
    } catch (error) {
        console.error("updateProfile error:", error);
        return res.status(500).json({ message: error.message || "Update failed" });
    }
}

export async function logout(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({
                message: "Refresh token not found, please login again"
            })
        }

        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        const session = await sessionModel.findOne({
            refreshTokenHash,
            revoked: false,
        });

        if (!session) {
            return res.status(401).json({
                message: "Invalid refresh token, please login again"
            })
        }

        session.revoked = true;
        await session.save();

        res.clearCookie('refreshToken');

        return res.status(200).json({
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error("logout error:", error);
        return res.status(500).json({ message: error.message || "Logout failed" });
    }
}

export async function logoutAll(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({
                message: "Refresh token not found, please login again"
            })
        }

        const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

        await sessionModel.updateMany({
            user: decoded.id,
            revoked: false
        }, {
            revoked: true
        });

        res.clearCookie('refreshToken');

        return res.status(200).json({
            message: "Logged out from all devices successfully"
        });
    } catch (error) {
        console.error("logoutAll error:", error);
        return res.status(500).json({ message: error.message || "Logout all failed" });
    }
}

export async function resendOtp(req, res) {
    try {
        const { email, phone, countryCode, type } = req.body;

        if (!email && !phone) {
            return res.status(400).json({
                message: "Please provide email or phone number"
            });
        }

        const user = email
            ? await userModel.findOne({ email })
            : await userModel.findOne({ phone });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (type === "signup") {
            if (email && user.emailVerified) {
                return res.status(400).json({
                    message: "Email already verified"
                });
            }
            if (phone && user.phoneVerified) {
                return res.status(400).json({
                    message: "Phone already verified"
                });
            }
        }

        if (type === "login") {
            if (!user.isVerified) {
                return res.status(400).json({
                    message: "Please verify your account first"
                });
            }

            if (user.status === "blocked") {
                return res.status(403).json({
                    message: "Your account has been blocked"
                });
            }
        }

        let otpRecord = await otpModel.findOne({
            user: user._id
        });

        if (!otpRecord) {
            otpRecord = new otpModel({
                user: user._id,
                email: user.email,
                phone: user.phone,
                failedAttempts: 0,
                lockUntil: null
            });
        }

        if (otpRecord.lockUntil && otpRecord.lockUntil > new Date()) {
            const remaining = Math.ceil(
                (otpRecord.lockUntil - new Date()) / 60000
            );

            return res.status(403).json({
                message: `Try again after ${remaining} minute(s)`
            });
        }
        const otp = generateOtp();

        const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

        otpRecord.expiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        );

        otpRecord.failedAttempts = 0;
        otpRecord.lockUntil = null;

        if (email) {
            otpRecord.emailOtpHash = otpHash;
        } else {
            otpRecord.phoneOtpHash = otpHash;
        }

        await otpRecord.save();

        if (email) {
            console.log(`Email OTP: ${otp}`);
        } else {
            console.log(`Phone OTP: ${otp}`);
        }

        return res.status(200).json({
            message: "OTP resent successfully"
        });
    } catch (error) {
        console.error("resendOtp error:", error);
        return res.status(500).json({ message: error.message || "Resend OTP failed" });
    }
}

export async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(200).json({
                message: "If this email exists, a reset link has been sent."
            });
        }

        // if (!user) {
        //     return res.status(404).json({
        //         message: "No account found with this email"
        //     });
        // }

        const ONE_HOUR = 60 * 60 * 1000;
        const now = Date.now();

        if (
            user.resetRequestCount >= 3 &&
            user.resetRequestWindowStart &&
            now - user.resetRequestWindowStart.getTime() < ONE_HOUR
        ) {
            return res.status(429).json({
                message: "Too many reset requests. Please try again after 1 hour."
            });
        }

        if (
            !user.resetRequestWindowStart ||
            now - user.resetRequestWindowStart.getTime() >= ONE_HOUR
        ) {
            user.resetRequestCount = 0;
            user.resetRequestWindowStart = new Date();
        }

        user.resetRequestCount = (user.resetRequestCount || 0) + 1;

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpires = new Date(
            Date.now() + 1 * 60 * 1000
        );

        await user.save();

        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
        console.log(`[RESET LINK] ${email} → ${resetUrl}`);

        return res.status(200).json({
            message: "If this email exists, a reset link has been sent."
        });

        // const resetUrl =
        //     `http://localhost:5173/reset-password/${resetToken}`;
        // console.log(`[RESET LINK] ${resetUrl}`);

        // Send email here

        // return res.status(200).json({
        //     message: "Password reset link sent to your email",
        //     resetLink: resetUrl
        // });
    } catch (error) {
        console.error("forgotPassword error:", error);
        return res.status(500).json({ message: error.message || "Forgot password failed" });
    }
}

export async function resetPassword(req, res) {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                message: "Token and new password are required",
            });
        }

        const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");

        const user = await userModel.findOne({
            resetPasswordToken: resetTokenHash,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired link",
            });
        }

        // const newPasswordHash = crypto.createHash("sha256").update(newPassword).digest("hex");

        // const isSamePassword = await bcrypt.compare(
        //     newPasswordHash,
        //     user.password
        // );

        const isSamePassword = await bcrypt.compare(newPassword, user.password);

        if (isSamePassword) {
            return res.status(400).json({
                message: "This password is already used. Please choose a new password.",
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        return res.status(200).json({
            message: "Password reset successfully",
        });
    } catch (error) {
        console.error("resetPassword error:", error);
        return res.status(500).json({ message: error.message || "Reset password failed" });
    }
}

export async function sendVerifyOtp(req, res) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: "Token not found" });

        const decoded = jwt.verify(token, config.JWT_SECRET);

        const session = await sessionModel.findOne({ _id: decoded.sessionId, revoked: false });
        if (!session) return res.status(401).json({ message: "Session revoked, please login again" });

        const user = await userModel.findById(decoded.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const { type } = req.body;   // "email" or "phone"
        if (!type || !['email', 'phone'].includes(type)) {
            return res.status(400).json({ message: "type must be 'email' or 'phone'" });
        }

        if (type === 'email' && user.emailVerified) {
            return res.status(400).json({ message: "Email is already verified" });
        }

        // For phone OTP, user must have a phone number saved first
        if (type === 'phone' && !user.phone) {
            return res.status(400).json({ message: "Please save your phone number first before verifying" });
        }

        if (type === 'phone' && user.phoneVerified) {
            return res.status(400).json({ message: "Phone is already verified" });
        }

        const otp = generateOtp();
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

        await otpModel.findOneAndUpdate(
            { user: user._id, otpType: `profile_${type}` },
            {
                $set: {
                    email: user.email,
                    phone: user.phone,
                    countryCode: user.countryCode || '+91',
                    emailOtpHash: type === 'email' ? otpHash : 'N/A',
                    phoneOtpHash: type === 'phone' ? otpHash : 'N/A',
                    otpType: `profile_${type}`,
                    expiresAt,
                    failedAttempts: 0,
                    lockUntil: null,
                }
            },
            { upsert: true, new: true }
        );

        console.log(`[PROFILE VERIFY OTP] ${type === 'email' ? user.email : user.phone} → ${otp}`);

        return res.status(200).json({
            message: type === 'email'
                ? "OTP sent to your email address"
                : "OTP sent to your phone number"
        });
    } catch (error) {
        console.error("sendVerifyOtp error:", error);
        return res.status(500).json({ message: error.message || "Failed to send OTP" });
    }
}

export async function verifyContactOtp(req, res) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: "Token not found" });

        const decoded = jwt.verify(token, config.JWT_SECRET);

        const session = await sessionModel.findOne({ _id: decoded.sessionId, revoked: false });
        if (!session) return res.status(401).json({ message: "Session revoked, please login again" });

        const user = await userModel.findById(decoded.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const { type, otp } = req.body;
        if (!type || !['email', 'phone'].includes(type)) {
            return res.status(400).json({ message: "type must be 'email' or 'phone'" });
        }
        if (!otp) return res.status(400).json({ message: "OTP is required" });

        const otpHash = crypto.createHash('sha256').update(otp.toString()).digest('hex');

        const otpDoc = await otpModel.findOne({ user: user._id, otpType: `profile_${type}` });

        if (!otpDoc) {
            return res.status(400).json({ message: "OTP not found. Please request a new one." });
        }

        if (otpDoc.lockUntil && otpDoc.lockUntil > new Date()) {
            const remaining = Math.ceil((otpDoc.lockUntil - new Date()) / 60000);
            return res.status(403).json({ message: `Too many attempts. Try again after ${remaining} minute(s).` });
        }

        if (otpDoc.expiresAt < new Date()) {
            await otpModel.deleteOne({ _id: otpDoc._id });
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        const expectedHash = type === 'email' ? otpDoc.emailOtpHash : otpDoc.phoneOtpHash;
        if (expectedHash !== otpHash) {
            const MAX_ATTEMPTS = 5;
            otpDoc.failedAttempts = (otpDoc.failedAttempts || 0) + 1;
            const attemptsLeft = MAX_ATTEMPTS - otpDoc.failedAttempts;

            if (attemptsLeft <= 0) {
                otpDoc.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
                await otpDoc.save();
                return res.status(403).json({ message: "Too many failed attempts. OTP locked for 15 minutes." });
            }

            await otpDoc.save();
            return res.status(400).json({
                message: `Invalid OTP. ${attemptsLeft} attempt(s) remaining.`,
                attemptsLeft,
            });
        }

        const updateFields = {};
        if (type === 'email') {
            updateFields.emailVerified = true;
            updateFields.verifyBy = 'email';
        } else {
            updateFields.phoneVerified = true;
            updateFields.verifyBy = 'phone';
        }

        await userModel.findByIdAndUpdate(user._id, updateFields);

        await otpModel.deleteOne({ _id: otpDoc._id });

        return res.status(200).json({
            message: type === 'email'
                ? "Email verified successfully"
                : "Phone number verified successfully"
        });
    } catch (error) {
        console.error("verifyContactOtp error:", error);
        return res.status(500).json({ message: error.message || "OTP verification failed" });
    }
}

export async function googleCallback(req, res) {
    try {
        const user = req.user;

        const refreshToken = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: '7d' });
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        const session = await sessionModel.create({
            user: user._id,
            refreshTokenHash,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            login_method: "google"
        });

        const accessToken = jwt.sign(
            { id: user._id, sessionId: session._id },
            config.JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,        // false for localhost
            sameSite: 'lax',      // lax for cross-port redirect
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const userData = JSON.stringify({
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePictureURL: user.profilePictureURL,
        });

        // Redirect to frontend GoogleAuthSuccess page with token
        res.redirect(
            `${process.env.FRONTEND_URL}/auth/google/success?token=${accessToken}&user=${encodeURIComponent(userData)}`
        );

    } catch (err) {
        console.error("Google callback error:", err);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
    }
}