const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Optimizes an image buffer, resizes it if needed, and saves it as WebP format.
 * @param {Buffer} buffer - The image buffer to process
 * @param {string} originalName - Original file name for generating a unique name
 * @returns {Promise<string>} - Returns the URL-friendly path to the saved WebP image
 */
const optimizeAndSaveImage = async (buffer, originalName) => {
  try {
    // Determine target dimensions (max 1200x1200px)
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Remove original extension, append .webp
    const baseName = path.parse(originalName).name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const fileName = `${baseName}-${uniqueSuffix}.webp`;
    
    // Path where image will be saved
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const outputPath = path.join(uploadsDir, fileName);
    
    // Process image with Sharp
    await sharp(buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true // Don't enlarge if smaller than max dimensions
      })
      .webp({ quality: 80 }) // 80% quality WebP
      .toFile(outputPath);
      
    // Return the path that the client will use to request the image
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error('Image optimization failed:', error);
    throw new Error('Failed to process image');
  }
};

module.exports = { optimizeAndSaveImage };
