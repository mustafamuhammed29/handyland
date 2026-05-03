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

const { decrypt } = require('../utils/encryption');

// ─── Initialize Social Strategies (Dynamic DB Fallback) ────────────────────────
const initSocialStrategies = async () => {
    try {
        const Settings = require('../models/Settings');
        const settings = await Settings.findOne().lean();
        const dbSocial = settings?.socialAuth || {};

        // 1. Google Setup
        const googleClientId = (dbSocial.google?.isConfigured && dbSocial.google.clientId) ? dbSocial.google.clientId : process.env.GOOGLE_CLIENT_ID;
        const googleClientSecret = (dbSocial.google?.isConfigured && dbSocial.google.clientSecret) ? decrypt(dbSocial.google.clientSecret) : process.env.GOOGLE_CLIENT_SECRET;

        passport.unuse('google'); // Remove old strategy if exists
        
        // Only initialize if enabled AND credentials exist
        const isGoogleEnabled = dbSocial.google?.enabled !== undefined ? dbSocial.google.enabled : true;

        if (isGoogleEnabled && googleClientId && googleClientSecret) {
            passport.use(new GoogleStrategy({
                clientID: googleClientId,
                clientSecret: googleClientSecret,
                callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
                scope: ['profile', 'email']
            }, async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    if (!email) return done(new Error('No email from Google account'), null);

                    let user = await User.findOne({ googleId: profile.id });
                    if (!user && email) user = await User.findOne({ email });

                    if (user) {
                        if (!user.googleId) {
                            user.googleId = profile.id;
                            user.provider = 'google';
                            if (!user.avatar && profile.photos?.[0]?.value) user.avatar = profile.photos[0].value;
                            user.isVerified = true;
                            await user.save();
                        }
                    } else {
                        user = await User.create({
                            name: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
                            email,
                            googleId: profile.id,
                            provider: 'google',
                            avatar: profile.photos?.[0]?.value || null,
                            isVerified: true
                        });
                    }
                    return done(null, user);
                } catch (err) {
                    return done(err, null);
                }
            }));
            console.log('✅ Google OAuth Strategy Initialized');
        } else {
            console.warn('⚠️  Google OAuth Disabled or Not Configured');
        }

        // 2. Facebook Setup
        const facebookAppId = (dbSocial.facebook?.isConfigured && dbSocial.facebook.appId) ? dbSocial.facebook.appId : process.env.FACEBOOK_APP_ID;
        const facebookAppSecret = (dbSocial.facebook?.isConfigured && dbSocial.facebook.appSecret) ? decrypt(dbSocial.facebook.appSecret) : process.env.FACEBOOK_APP_SECRET;

        passport.unuse('facebook'); // Remove old strategy if exists

        const isFacebookEnabled = dbSocial.facebook?.enabled !== undefined ? dbSocial.facebook.enabled : true;

        if (isFacebookEnabled && facebookAppId && facebookAppSecret) {
            passport.use(new FacebookStrategy({
                clientID: facebookAppId,
                clientSecret: facebookAppSecret,
                callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/facebook/callback`,
                profileFields: ['id', 'emails', 'name', 'picture.type(large)']
            }, async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;

                    let user = await User.findOne({ facebookId: profile.id });
                    if (!user && email) user = await User.findOne({ email });

                    if (user) {
                        if (!user.facebookId) {
                            user.facebookId = profile.id;
                            if (!user.avatar && profile.photos?.[0]?.value) user.avatar = profile.photos[0].value;
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
            console.log('✅ Facebook OAuth Strategy Initialized');
        } else {
            console.warn('⚠️  Facebook OAuth Disabled or Not Configured');
        }
    } catch (err) {
        console.error('❌ Failed to initialize social strategies:', err);
    }
};

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

module.exports = { passport, issueSocialTokens, initSocialStrategies };
