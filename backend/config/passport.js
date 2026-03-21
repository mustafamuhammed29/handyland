const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');

// Helper to issue tokens after social login
const issueSocialTokens = async (userId) => {
    const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({ token: refreshToken, user: userId, expiryDate: refreshExpiry });
    return { accessToken, refreshToken };
};

// ─── Google Strategy ─────────────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
        scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            if (!email) {return done(new Error('No email from Google account'), null);}

            // Find existing user by googleId or email
            let user = await User.findOne({ googleId: profile.id });
            if (!user && email) {
                user = await User.findOne({ email });
            }

            if (user) {
                // Link Google account if not already linked
                if (!user.googleId) {
                    user.googleId = profile.id;
                    user.provider = 'google';
                    if (!user.avatar && profile.photos?.[0]?.value) {
                        user.avatar = profile.photos[0].value;
                    }
                    user.isVerified = true;
                    await user.save();
                }
            } else {
                // Create new user
                user = await User.create({
                    name: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
                    email,
                    googleId: profile.id,
                    provider: 'google',
                    avatar: profile.photos?.[0]?.value || null,
                    isVerified: true // Social users skip email verification
                });
            }

            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));
} else {
    console.warn('⚠️  Google OAuth not configured — add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env');
}

// ─── Facebook Strategy ───────────────────────────────────────────────────────
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/facebook/callback`,
        profileFields: ['id', 'emails', 'name', 'picture.type(large)']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;

            let user = await User.findOne({ facebookId: profile.id });
            if (!user && email) {
                user = await User.findOne({ email });
            }

            if (user) {
                if (!user.facebookId) {
                    user.facebookId = profile.id;
                    if (!user.avatar && profile.photos?.[0]?.value) {
                        user.avatar = profile.photos[0].value;
                    }
                    user.isVerified = true;
                    await user.save();
                }
            } else {
                user = await User.create({
                    name: `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() || profile.displayName,
                    email: email || `fb_${profile.id}@handyland.local`,
                    facebookId: profile.id,
                    provider: 'facebook',
                    avatar: profile.photos?.[0]?.value || null,
                    isVerified: true
                });
            }

            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));
} else {
    console.warn('⚠️  Facebook OAuth not configured — add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to .env');
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

module.exports = { passport, issueSocialTokens };
