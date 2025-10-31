import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      // Here you can save user data in MongoDB
      // e.g. check if user exists or create new one
      return done(null, profile);
    }
  )
);

// Serialize & Deserialize
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
