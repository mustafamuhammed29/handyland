const path = require('path');

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

/**
 * Advanced File Upload Validation Middlewares
 */
const validateUpload = (req, res, next) => {
    if (!req.file) return next();

    // 1. Size check (already handled by multer, but double check here if needed)
    if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: 'File too large (Max 5MB)' });
    }

    // 2. Mime type check
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
            success: false,
            message: `Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`
        });
    }

    // 3. Extension check
    const ext = path.extname(req.file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    if (!allowedExts.includes(ext)) {
        return res.status(400).json({ success: false, message: 'Invalid file extension' });
    }

    // 4. Content checking (Magic numbers/signatures)
    // For a more advanced setup, we could use the 'file-type' library
    // but here we do a basic buffer check for common headers if buffer is available
    if (req.file.buffer) {
        const header = req.file.buffer.toString('hex', 0, 4);
        let isValidHeader = false;

        // JPEG: ffd8ffe0, ffd8ffe1, ffd8ffe2
        if (header.startsWith('ffd8ff')) isValidHeader = true;
        // PNG: 89504e47
        else if (header === '89504e47') isValidHeader = true;
        // PDF: 25504446
        else if (header === '25504446') isValidHeader = true;
        // WEBP: 52494646 (RIFF header)
        else if (header === '52494646') isValidHeader = true;

        if (!isValidHeader) {
            return res.status(400).json({ success: false, message: 'File content does not match extension (Malware protection)' });
        }
    }

    next();
};

module.exports = { validateUpload };
