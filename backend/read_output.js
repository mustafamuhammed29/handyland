const fs = require('fs');
try {
    const content = fs.readFileSync('check_output_3.txt', 'utf8');
    console.log(content);
} catch (e) {
    console.error('Error reading file:', e);
}
