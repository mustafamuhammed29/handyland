const fs = require('fs');
const path = require('path');
const srcDir = path.join(__dirname, 'src');

function fixFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixFiles(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            if (content.match(/new Date\([^)]+\)\.toLocale(Date|Time)?String/)) {
                if (!content.includes('utils/formatDate')) {
                    const depth = fullPath.replace(srcDir, '').split(path.sep).length - 2;
                    const relativePath = depth > 0 ? '../'.repeat(depth) + 'utils/formatDate' : './utils/formatDate';
                    content = content.replace(/(import React[^;]+;)/, `$1\nimport { formatDate, formatDateTime, formatTime } from '${relativePath.replace(/\\/g, '/')}';`);
                }
                content = content.replace(/new Date\(([^)]+)\)\.toLocaleString\([^)]*\)/g, 'formatDateTime($1)');
                content = content.replace(/new Date\(([^)]+)\)\.toLocaleDateString\([^)]*\)/g, 'formatDate($1)');
                content = content.replace(/new Date\(([^)]+)\)\.toLocaleTimeString\([^)]*\)/g, 'formatTime($1)');
                if (content !== originalContent) {
                    fs.writeFileSync(fullPath, content);
                    console.log('Fixed', fullPath);
                }
            }
        }
    }
}
fixFiles(srcDir);
