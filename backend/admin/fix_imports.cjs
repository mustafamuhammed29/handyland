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
            
            if (content.match(/formatDate|formatDateTime|formatTime/)) {
                if (!content.includes('utils/formatDate')) {
                    const depth = fullPath.replace(srcDir, '').split(path.sep).length - 2;
                    const relativePath = depth > 0 ? '../'.repeat(depth) + 'utils/formatDate' : './utils/formatDate';
                    const importStatement = `import { formatDate, formatDateTime, formatTime } from '${relativePath.replace(/\\/g, '/')}';\n`;
                    content = importStatement + content;
                    
                    if (content !== originalContent) {
                        fs.writeFileSync(fullPath, content);
                        console.log('Fixed imports in', fullPath);
                    }
                }
            }
        }
    }
}
fixFiles(srcDir);
