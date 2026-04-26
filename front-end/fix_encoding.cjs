const fs = require('fs');
const path = require('path');

function fixMojibake(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        const str = buffer.toString('utf-8');
        
        // Ignore files that don't look corrupted (no 'Ã' or 'ð')
        if (!str.includes('Ã') && !str.includes('ð') && !str.includes('â')) {
            return;
        }

        const fixedBuffer = Buffer.from(str, 'latin1');
        const fixedStr = fixedBuffer.toString('utf-8');
        
        if (fixedStr.includes('')) {
            console.log('Skipping (failed to decode):', filePath);
            return;
        }

        if (str !== fixedStr) {
            fs.writeFileSync(filePath, fixedStr, 'utf8');
            console.log('Fixed:', filePath);
        }
    } catch (e) {
        console.error('Error on:', filePath, e.message);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            fixMojibake(fullPath);
        }
    }
}

walkDir('./src');
