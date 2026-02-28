const express = require('express');
const router = express.Router();
const { passport, issueSocialTokens } = require('../config/passport');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Helper: redirect to frontend with tokens as query params
const handleSocialCallback = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.redirect(`${FRONTEND_URL}/login?error=social_auth_failed`);
        }

        const { accessToken, refreshToken } = await issueSocialTokens(user._id);

        const isProduction = process.env.NODE_ENV === 'production';

        // Set cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000,
            path: '/'
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/'
        });

        // Redirect to frontend callback page with token
        res.redirect(`${FRONTEND_URL}/auth/callback?token=${accessToken}`);
    } catch (err) {
        console.error('Social auth callback error:', err);
        res.redirect(`${FRONTEND_URL}/login?error=social_auth_failed`);
    }
};

// ─── Google ───────────────────────────────────────────────────────────────────
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login?error=google_failed`, session: false }),
    handleSocialCallback
);

// ─── Facebook ─────────────────────────────────────────────────────────────────
router.get('/facebook',
    passport.authenticate('facebook', { scope: ['email'], session: false })
);

router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: `${FRONTEND_URL}/login?error=facebook_failed`, session: false }),
    handleSocialCallback
);

module.exports = router;
