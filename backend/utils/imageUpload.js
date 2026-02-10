const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage - Memory for processing
const storage = multer.memoryStorage();

// File filter (Strict)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'));
    }
};

// Multer Instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 5
    },
    fileFilter: fileFilter
});

// Middleware to resize image after upload
const resizeImage = async (req, res, next) => {
    if (!req.file) return next();

    // Generate unique filename
    const filename = `compressed-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
    const outputPath = path.join(uploadDir, filename);

    try {
        await sharp(req.file.buffer)
            .resize(1000, 1000, { // Max dimensions, maintain aspect ratio
                fit: 'inside',
                withoutEnlargement: true
            })
            .toFormat('webp', { quality: 80 })
            .toFile(outputPath);

        // Update req.file details to mimic diskStorage behavior
        req.file.filename = filename;
        req.file.path = outputPath;
        req.file.mimetype = 'image/webp';
        // Remove buffer to free memory
        delete req.file.buffer;

        next();
    } catch (error) {
        console.error('Image processing error:', error);
        return res.status(500).json({ message: 'Error processing image upload' });
    }
};

// Export wrapper to combine multer + resize
module.exports = {
    single: (fieldName) => [upload.single(fieldName), resizeImage],
    array: (fieldName, maxCount) => [upload.array(fieldName, maxCount), async (req, res, next) => {
        if (!req.files || req.files.length === 0) return next();

        try {
            await Promise.all(req.files.map(async (file) => {
                const filename = `compressed-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
                const outputPath = path.join(uploadDir, filename);

                await sharp(file.buffer)
                    .resize(1000, 1000, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .toFormat('webp', { quality: 80 })
                    .toFile(outputPath);

                file.filename = filename;
                file.path = outputPath;
                file.mimetype = 'image/webp';
                delete file.buffer;
            }));
            next();
        } catch (error) {
            console.error('Image processing error (array):', error);
            return res.status(500).json({ message: 'Error processing image uploads' });
        }
    }]
};
