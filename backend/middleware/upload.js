/**
 * backend/middleware/upload.js
 * Supabase Storage upload middleware with sharp compression
 * Replaces: Cloudinary + multer-storage-cloudinary
 */
'use strict';

const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const crypto = require('crypto');
const { uploadImage, uploadHeroVideoFile } = require('../config/supabase');

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

/**
 * Middleware factory: upload multiple images for specific fields.
 * Attaches URLs to req.body as [fieldName]
 */
const uploadFields = (bucket, fields = [], folder = '') => {
    return [
        upload.fields(fields.map(f => ({ name: f, maxCount: 1 }))),
        async (req, res, next) => {
            try {
                if (!req.files) return next();

                const bucketFolder = folder || bucket;

                await Promise.all(
                    fields.map(async (field) => {
                        const fileArray = req.files[field];
                        if (fileArray && fileArray[0]) {
                            const file = fileArray[0];
                            const filename = `${Date.now()}-${field}-${Math.random().toString(36).substr(2, 9)}`;
                            req.body[field] = await processAndUpload(file.buffer, bucket, bucketFolder, filename, { width: 800, quality: 80 });
                        }
                    })
                );

                next();
            } catch (err) {
                next(err);
            }
        }
    ];
};

/**
 * Validate video magic bytes / signatures for MP4 and WebM.
 * @param {Buffer} buffer
 * @param {string} mimeType
 * @returns {boolean}
 */
const isValidVideoSignature = (buffer, mimeType) => {
    if (!buffer || buffer.length < 8) return false;

    // WebM EBML header starts with 1A 45 DF A3
    const isWebM = buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;

    // MP4 contains 'ftyp' at bytes 4..7
    const isMP4 = buffer.toString('latin1', 4, 8) === 'ftyp' ||
                  buffer.toString('utf8', 4, 8) === 'ftyp';

    if (mimeType === 'video/webm' && isWebM) return true;
    if (mimeType === 'video/mp4' && isMP4) return true;

    return isWebM || isMP4;
};

const heroVideoFileFilter = (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/webm'];
    const allowedExts = ['.mp4', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only MP4 and WebM video files are allowed'), false);
    }
};

const heroVideoUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: heroVideoFileFilter,
    limits: { fileSize: 25 * 1024 * 1024 } // 25 MB maximum
});

/**
 * Dedicated admin middleware for uploading Hero video.
 * Enforces fixed server-side destination: media bucket, hero/ folder.
 */
const uploadHeroVideo = (fieldName = 'video') => {
    return [
        (req, res, next) => {
            heroVideoUpload.single(fieldName)(req, res, (err) => {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({ success: false, message: 'Video file exceeds 25 MB limit' });
                    }
                    return res.status(400).json({ success: false, message: err.message });
                } else if (err) {
                    return res.status(400).json({ success: false, message: err.message });
                }
                next();
            });
        },
        async (req, res, next) => {
            try {
                if (!req.file) {
                    return res.status(400).json({ success: false, message: 'No video file provided' });
                }

                if (!isValidVideoSignature(req.file.buffer, req.file.mimetype)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid video file content signature'
                    });
                }

                const ext = path.extname(req.file.originalname).toLowerCase() === '.webm' ? '.webm' : '.mp4';
                const randomId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
                const filename = `${randomId}${ext}`;
                const storagePath = `hero/${filename}`;

                const publicUrl = await uploadHeroVideoFile(
                    storagePath,
                    req.file.buffer,
                    req.file.mimetype
                );

                req.fileUrl = publicUrl;
                next();
            } catch (err) {
                console.error('[UploadHeroVideo] Storage upload failed:', err?.message || err);
                return res.status(500).json({
                    success: false,
                    message: 'Video upload processing failed. Please try again later.'
                });
            }
        }
    ];
};

module.exports = {
    upload,
    uploadSingle,
    uploadMultiple,
    uploadFields,
    uploadHeroVideo,
    isValidVideoSignature,
    processAndUpload
};
