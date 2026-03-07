const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Requires process.env.CLOUDINARY_URL to be set to automatically configure
if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
        cloudinary_url: process.env.CLOUDINARY_URL
    });
}

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'handyland',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, quality: 'auto', fetch_format: 'auto' }]
    }
});

module.exports = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
