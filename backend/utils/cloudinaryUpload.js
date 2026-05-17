const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const streamifier = require('streamifier');

// Requires process.env.CLOUDINARY_URL to be set to automatically configure
if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
        cloudinary_url: process.env.CLOUDINARY_URL
    });
}

// Use memoryStorage instead of the deprecated multer-storage-cloudinary
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only jpg, jpeg, png, and webp images are allowed'), false);
        }
    }
});

/**
 * Upload a buffer (from multer memoryStorage) to Cloudinary.
 * @param {Buffer} fileBuffer - The file buffer from req.file.buffer
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            folder: 'handyland',
            transformation: [{ width: 1200, quality: 'auto', fetch_format: 'auto' }],
            ...options
        };
        const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

module.exports = upload;
module.exports.uploadToCloudinary = uploadToCloudinary;
module.exports.cloudinary = cloudinary;
