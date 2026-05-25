const fs = require('fs');
const { execSync } = require('child_process');

try {
    execSync('npm run build', { stdio: 'pipe' });
    console.log('Build succeeded!');
} catch (error) {
    const output = error.stdout.toString() + error.stderr.toString();
    const lines = output.split('\n');
    
    const fixes = {};
    const regex = /(.+?)\(\d+,\d+\): error TS6133: '(.+?)' is declared but its value is never read./;
    
    for (const line of lines) {
        const match = line.match(regex);
        if (match) {
            const file = match[1].trim();
            const variable = match[2];
            if (!fixes[file]) fixes[file] = [];
            fixes[file].push(variable);
        }
    }
    
    for (const file of Object.keys(fixes)) {
        if (!fs.existsSync(file)) {
            console.log('File not found:', file);
            continue;
        }
        let content = fs.readFileSync(file, 'utf8');
        for (const variable of fixes[file]) {
            const reStart = new RegExp('(\\{\\s*)' + variable + '\\s*,\\s*', 'g');
            content = content.replace(reStart, '$1');
            
            const reMiddle = new RegExp(',\\s*' + variable + '(?=\\s*[,\\}])', 'g');
            content = content.replace(reMiddle, '');
            
            const reOnly = new RegExp('import\\s*\\{\\s*' + variable + '\\s*\\}\\s*from\\s*[\'\"].*?[\'\"];?', 'g');
            content = content.replace(reOnly, '');
        }
        fs.writeFileSync(file, content);
        console.log('Fixed', file, fixes[file]);
    }
}
