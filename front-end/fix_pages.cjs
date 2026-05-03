const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/musta/Desktop/handyland/front-end/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Backgrounds
    content = content.replace(/bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/g, 'bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-blue-950');
    content = content.replace(/bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950/g, 'bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950');
    
    // Cards
    content = content.replace(/bg-slate-900\/50 backdrop-blur-xl border border-slate-800/g, 'bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800');
    content = content.replace(/bg-slate-900\/50 border border-slate-800/g, 'bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800');

    // Inputs
    content = content.replace(/bg-slate-800\/50 border border-slate-700/g, 'bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700');

    // Typography
    content = content.replace(/text-slate-400/g, 'text-slate-500 dark:text-slate-400');
    content = content.replace(/text-slate-300/g, 'text-slate-700 dark:text-slate-300');
    
    // Specifically target headings that use text-white
    content = content.replace(/text-white/g, 'text-slate-900 dark:text-white');
    // Restore text-white for buttons / icons / gradients that got messed up
    content = content.replace(/text-slate-900 dark:text-white\"\s*\/>/g, 'text-white\" />'); // icons like <Lock className="... text-white" />
    content = content.replace(/text-slate-900 dark:text-white\"\s*><path/g, 'text-white\"><path'); // svg icons
    content = content.replace(/bg-gradient-to-r from-brand-secondary to-brand-primary text-slate-900 dark:text-white/g, 'bg-gradient-to-r from-brand-secondary to-brand-primary text-white');
    content = content.replace(/bg-[#1877F2] hover:bg-\[#166FE5\] text-slate-900 dark:text-white/g, 'bg-[#1877F2] hover:bg-[#166FE5] text-white');
    content = content.replace(/fill-slate-900 dark:fill-white/g, 'fill-white');
    content = content.replace(/text-slate-900 dark:text-white placeholder-slate-500/g, 'text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500');

    fs.writeFileSync(filePath, content);
});

console.log('Fixed pages styling.');
