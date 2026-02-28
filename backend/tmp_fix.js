const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'controllers', 'authController.js');

let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split('\n');

// Find the start and end of the duplicated block
let startIndex = lines.findIndex(l => l.includes('const getDeviceInfo = (req) => ({'));
let endIndex = -1;

if (startIndex !== -1) {
    // Look for module.exports = exports; after startIndex
    for (let i = startIndex; i < lines.length; i++) {
        if (lines[i].includes('module.exports = exports;')) {
            endIndex = i;
            break;
        }
    }
}

if (startIndex !== -1 && endIndex !== -1) {
    // Remove the block
    lines.splice(startIndex, endIndex - startIndex + 1);
}

// Remove the second module.exports = exports; if exists
let modExpCount = 0;
lines = lines.filter(l => {
    if (l.includes('module.exports = exports;')) {
        modExpCount++;
        return modExpCount === 1; // Keep first one if it exists, wait, we actually might not need any, but let's just keep the last one or remove all but one.
    }
    return true;
});

// For safety, let's just remove ALL `module.exports = exports;` because in Node.js commonjs, `exports.foo` is enough
lines = lines.filter(l => !l.includes('module.exports = exports;'));

// Rejoin and remove refreshToken from response body
let newContent = lines.join('\n');
newContent = newContent.replace(/^\s*refreshToken:\s*refreshToken,\s*\/\/.*$/gm, '');
newContent = newContent.replace(/^\s*refreshToken:\s*refreshToken,?\s*$/gm, ''); // Fallback

// Remove console.log entirely
let finalLines = newContent.split('\n');
finalLines = finalLines.filter(l => !/^\s*(if\s*\([^)]+\)\s*)?console\.log\(.*\);?\s*$/.test(l));

fs.writeFileSync(filePath, finalLines.join('\n'));
console.log("Done fixing authController.js");
