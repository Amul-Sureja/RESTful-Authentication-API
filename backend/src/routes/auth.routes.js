import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import multer from "multer";
import passport from "../config/passport.js";

const upload = multer({ storage: multer.memoryStorage() });

const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.get("/signupVerifyOtp", authController.signupVerifyOtp);
authRouter.post("/login", authController.login);
authRouter.get('/loginVerifyOtp', authController.loginVerifyOtp);
authRouter.get('/refreshToken', authController.refreshToken);
authRouter.get('/profile', authController.getProfile);
authRouter.patch('/update-profile', upload.single("image"), authController.updateProfile);
authRouter.get('/logout', authController.logout);
authRouter.get('/logout-all', authController.logoutAll);
authRouter.post('/resend-otp', authController.resendOtp);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password/:token', authController.resetPassword);
authRouter.post('/send-verify-otp', authController.sendVerifyOtp);
authRouter.post('/verify-contact-otp', authController.verifyContactOtp);
authRouter.post('/send-email-otp', (req, res, next) => { req.body = { ...(req.body || {}), type: 'email' }; return authController.sendVerifyOtp(req, res, next); });
authRouter.post('/verify-email-otp', (req, res, next) => { req.body = { ...(req.body || {}), type: 'email' }; return authController.verifyContactOtp(req, res, next); });
authRouter.post('/send-phone-otp', (req, res, next) => { req.body = { ...(req.body || {}), type: 'phone' }; return authController.sendVerifyOtp(req, res, next); });
authRouter.post('/verify-phone-otp', (req, res, next) => { req.body = { ...(req.body || {}), type: 'phone' }; return authController.verifyContactOtp(req, res, next); });

// ── Google OAuth routes (must be after authRouter is defined) ──
authRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false, prompt: 'select_account' }));
authRouter.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login', session: false }), authController.googleCallback);

export default authRouter;