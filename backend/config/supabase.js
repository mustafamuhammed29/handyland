/**
 * backend/config/supabase.js
 * Supabase client for server-side (admin/service role) operations
 */
'use strict';

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
}

/**
 * Admin client — uses service_role key.
 * Bypasses RLS. Use ONLY in backend controllers.
 * NEVER expose this key to the frontend.
 */
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * Public client — uses anon key.
 * Respects RLS. Use for operations that should respect user permissions.
 */
const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * Get a client authenticated as a specific user (via their JWT).
 * Use this when you want RLS to apply based on the user's identity.
 * @param {string} accessToken - User's JWT from request
 */
const getAuthenticatedClient = (accessToken) => {
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

/**
 * Upload an image to Supabase Storage with automatic compression info.
 * Actual compression should be done with sharp BEFORE calling this.
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path inside bucket
 * @param {Buffer} fileBuffer - File buffer (pre-compressed)
 * @param {string} mimeType - MIME type (e.g., 'image/webp')
 */
const uploadImage = async (bucket, path, fileBuffer, mimeType = 'image/webp') => {
    const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(path, fileBuffer, {
            contentType: mimeType,
            upsert: true
        });

    if (error) throw error;

    const { data: { publicUrl } } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(path);

    return publicUrl;
};

/**
 * Delete an image from Supabase Storage.
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path inside bucket
 */
const deleteImage = async (bucket, path) => {
    const { error } = await supabaseAdmin.storage
        .from(bucket)
        .remove([path]);
    if (error) throw error;
};

/**
 * Create a fresh client specifically for authentication operations (e.g. signInWithPassword)
 * NEVER use supabaseAdmin for auth.signInWithPassword, as it taints the global instance with the user's JWT!
 */
const createAuthClient = () => {
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

module.exports = {
    supabaseAdmin,
    supabasePublic,
    getAuthenticatedClient,
    createAuthClient,
    uploadImage,
    deleteImage
};
