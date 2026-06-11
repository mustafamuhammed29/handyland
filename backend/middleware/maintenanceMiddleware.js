const { supabaseAdmin } = require('../config/supabase');

let cachedMaintenance = null;
let lastCheckTime = 0;
const CACHE_TTL = 3000; // 3 seconds cache

async function getMaintenanceConfig() {
    const now = Date.now();
    if (cachedMaintenance !== null && (now - lastCheckTime < CACHE_TTL)) {
        return cachedMaintenance;
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('settings')
            .select('value')
            .eq('key', 'maintenanceMode')
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // Row not found
                cachedMaintenance = { enabled: false };
                lastCheckTime = now;
                return cachedMaintenance;
            }
            throw error;
        }

        if (data && data.value) {
            const config = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
            cachedMaintenance = config || { enabled: false };
        } else {
            cachedMaintenance = { enabled: false };
        }
    } catch (err) {
        console.error('Failed to fetch maintenance mode settings:', err.message);
        if (cachedMaintenance === null) {
            return { enabled: false };
        }
    }

    lastCheckTime = now;
    return cachedMaintenance;
}

async function checkIsAdmin(req) {
    try {
        let token = (req.cookies && req.cookies.adminToken) || (req.cookies && req.cookies.accessToken);
        
        // Support Authorization header for cross-domain admin panels (e.g. Vercel frontend calling Render backend)
        if (!token && req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) return false;
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (user && !error) {
            const { data: userProfile } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single();
            if (userProfile && userProfile.role === 'admin') {
                return true;
            }
        }
    } catch (err) {
        console.error('Maintenance Admin Check Error:', err.message);
    }
    return false;
}

exports.maintenanceGate = async (req, res, next) => {
    // Skip: health, auth (all endpoints), admin status, maintenance info, translations, and public promo
    const bypass = ['/health', '/auth', '/status', '/maintenance-info', '/translations', '/coupons/latest-promo'];
    if (bypass.some(p => req.path.startsWith(p))) {
        return next();
    }

    const config = await getMaintenanceConfig();
    if (config && config.enabled) {
        const isAdmin = await checkIsAdmin(req);
        if (isAdmin) {
            return next(); // Admin bypassed
        }

        const title = config.title || 'Wartungsarbeiten';
        const message = config.message || 'Wir führen gerade wichtige Systemwartungen durch, um Ihnen ein noch besseres Erlebnis zu bieten. Wir sind gleich wieder für Sie da!';
        const estimatedTime = config.estimatedTime || '';

        return res.status(503).json({
            success: false,
            maintenance: true,
            title,
            message,
            estimatedTime
        });
    }
    next();
};

exports.maintenanceInfo = async (req, res) => {
    // Prevent browser caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const config = await getMaintenanceConfig();
    if (config && config.enabled) {
        const isAdmin = await checkIsAdmin(req);
        const title = config.title || 'Wartungsarbeiten';
        const message = config.message || 'Wir führen gerade wichtige Systemwartungen durch, um Ihnen ein noch besseres Erlebnis zu bieten. Wir sind gleich wieder für Sie da!';
        const estimatedTime = config.estimatedTime || '';
        const statusText1 = config.statusText1 || 'System wird diagnostiziert...';
        const statusText2 = config.statusText2 || 'Neue Reparaturen werden angewendet...';

        if (isAdmin) {
            return res.json({ 
                maintenance: false, 
                bypassActive: true, 
                title, 
                message, 
                estimatedTime, 
                statusText1, 
                statusText2 
            });
        }

        return res.json({ 
            maintenance: true, 
            title, 
            message, 
            estimatedTime, 
            statusText1, 
            statusText2 
        });
    }
    res.json({ maintenance: false });
};

