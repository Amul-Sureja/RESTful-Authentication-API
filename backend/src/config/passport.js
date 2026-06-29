import dotenv from 'dotenv';
dotenv.config();

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import userModel from '../models/user.model.js';
import e from 'express';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const firstName = profile.name.givenName;
        const lastName = profile.name.familyName || '';
        const profilePictureURL = profile.photos[0]?.value;

        let user = await userModel.findOne({ googleId: profile.id });

        if (!user) {
            user = await userModel.findOne({ email });

            if (user) {
                user.googleId = profile.id;
                user.authProvider = "google";
                user.profilePictureURL = profilePictureURL; 
                await user.save();
            } else {
                user = await userModel.create({
                    googleId: profile.id,
                    firstName,
                    lastName,
                    name: `${firstName} ${lastName}`.trim(),
                    email,
                    profilePictureURL,
                    authProvider: "google",
                    isVerified: true,
                    emailVerified: true,
                    role: "user",
                    status: "active",
                });
            }
        } else {
            user.firstName = firstName;
            user.lastName = lastName;
            user.name = `${firstName} ${lastName}`.trim();
            user.profilePictureURL = profilePictureURL;
            await user.save();
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

export default passport;