import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import authRouter from './routes/auth.routes.js';
import connectDB from './config/database.js';

const app = express();

// ── Middleware ──
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize()); // must be after app is created

// ── Routes ──
app.use('/api/auth', authRouter);

// ── Database ──
connectDB();

export default app;