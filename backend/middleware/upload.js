/**
 * backend/middleware/upload.js
 * Supabase Storage upload middleware with sharp compression
 * Replaces: Cloudinary + multer-storage-cloudinary
 */
'use strict';

const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const { uploadImage } = require('../config/supabase');

// Use memory storage — we process with sharp before uploading
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (JPEG, PNG, WebP)'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max raw upload (we compress to <2MB)
});

/**
 * Compress image with sharp and upload to Supabase Storage.
 * Output is always WebP for smallest file size.
 * @param {Buffer} buffer - Raw image buffer
 * @param {string} bucket - Supabase bucket name
 * @param {string} folder - Folder inside bucket (e.g., 'products')
 * @param {string} filename - Base filename without extension
 * @param {object} opts - Options: { width, height, quality }
 * @returns {string} Public URL
 */
const processAndUpload = async (buffer, bucket, folder, filename, opts = {}) => {
    const {
        width = 800,
        height = null,
        quality = 80
    } = opts;

    // Compress with sharp → WebP
    const compressed = await sharp(buffer)
        .resize(width, height, { withoutEnlargement: true, fit: 'inside' })
        .webp({ quality })
        .toBuffer();

    const timestamp = Date.now();
    const storagePath = `${folder}/${filename}-${timestamp}.webp`;

    const publicUrl = await uploadImage(bucket, storagePath, compressed, 'image/webp');
    return publicUrl;
};

/**
 * Middleware factory: upload single image to specified bucket.
 * Attaches result URL to req.fileUrl
 *
 * Usage: router.post('/products', uploadSingle('products', 'image'), controller)
 */
const uploadSingle = (bucket, fieldName = 'image', folder = '') => {
    return [
        upload.single(fieldName),
        async (req, res, next) => {
            try {
                if (!req.file) return next();

                const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const bucketFolder = folder || bucket;

                // Choose compression settings by bucket
                const opts = bucket === 'avatars'
                    ? { width: 300, height: 300, quality: 85 }
                    : { width: 800, quality: 80 };

                req.fileUrl = await processAndUpload(
                    req.file.buffer,
                    bucket,
                    bucketFolder,
                    filename,
                    opts
                );

                next();
            } catch (err) {
                next(err);
            }
        }
    ];
};

/**
 * Middleware factory: upload multiple images.
 * Attaches array of URLs to req.fileUrls
 */
const uploadMultiple = (bucket, fieldName = 'images', maxCount = 5, folder = '') => {
    return [
        upload.array(fieldName, maxCount),
        async (req, res, next) => {
            try {
                if (!req.files || req.files.length === 0) return next();

                const bucketFolder = folder || bucket;

                req.fileUrls = await Promise.all(
                    req.files.map(async (file, i) => {
                        const filename = `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
                        return processAndUpload(file.buffer, bucket, bucketFolder, filename, { width: 800, quality: 80 });
                    })
                );

                next();
            } catch (err) {
                next(err);
            }
        }
    ];
};

module.exports = {
    upload,
    uploadSingle,
    uploadMultiple,
    processAndUpload
};
