const fs = require('fs');
const file = 'c:/Users/musta/Desktop/handyland/front-end/src/components/dashboard/DashboardOverview.tsx';
let content = fs.readFileSync(file, 'utf8');

// Container Backgrounds
content = content.replace(/bg-slate-900\/40/g, 'bg-white/80 dark:bg-slate-900/40');
content = content.replace(/bg-slate-900\/60/g, 'bg-white/90 dark:bg-slate-900/60');
content = content.replace(/border-white\/5/g, 'border-slate-200 dark:border-white/5');

// Texts
content = content.replace(/text-slate-400/g, 'text-slate-500 dark:text-slate-400');

// Hero Card
content = content.replace(/<h2 className="text-2xl sm:text-3xl font-black text-white/g, '<h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white');
content = content.replace(/bg-black\/20 border border-slate-200 dark:border-white\/5/g, 'bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/5');
content = content.replace(/<p className="text-2xl font-black text-white">/g, '<p className="text-2xl font-black text-slate-900 dark:text-white">');

// Active Tracking
content = content.replace(/<h3 className="text-xl font-bold text-white tracking-tight">/g, '<h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">');
content = content.replace(/bg-slate-800 rounded-full/g, 'bg-slate-200 dark:bg-slate-800 rounded-full');
content = content.replace(/bg-slate-900 border-brand-primary border-dashed/g, 'bg-white dark:bg-slate-900 border-brand-primary border-dashed');
content = content.replace(/bg-slate-900 border-slate-700 text-slate-500/g, 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500');
content = content.replace(/isCompleted \|\| isActive \? 'text-white drop-shadow-md' : 'text-slate-500'/g, 'isCompleted || isActive ? \\\'text-slate-900 dark:text-white drop-shadow-md\\\' : \\\'text-slate-400 dark:text-slate-500\\\'');

// Spending Analytics
content = content.replace(/<h3 className="text-xl font-bold text-white flex items-center gap-2">/g, '<h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">');

// Activities
content = content.replace(/<p className="text-white text-sm font-medium/g, '<p className="text-slate-900 dark:text-white text-sm font-medium');

// Mini Stats
content = content.replace(/<p className="text-2xl font-black text-white">/g, '<p className="text-2xl font-black text-slate-900 dark:text-white">');

// Quick Actions
content = content.replace(/<p className="text-white font-bold text-sm">/g, '<p className="text-slate-900 dark:text-white font-bold text-sm">');

fs.writeFileSync(file, content);
console.log('Fixed DashboardOverview.tsx');
