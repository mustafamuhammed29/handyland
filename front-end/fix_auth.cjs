const fs = require('fs');

const authFile = 'c:/Users/musta/Desktop/handyland/front-end/src/components/Auth.tsx';
let authContent = fs.readFileSync(authFile, 'utf8');

// Global replacements
authContent = authContent.replace(/bg-slate-900\"/g, 'bg-slate-50 dark:bg-[#0a0f1c]"');
authContent = authContent.replace(/bg-slate-900\/40/g, 'bg-white/80 dark:bg-slate-900/40');
authContent = authContent.replace(/border-slate-700\/50/g, 'border-slate-200 dark:border-slate-700/50');
authContent = authContent.replace(/border-slate-800\/50/g, 'border-slate-200 dark:border-slate-800/50');
authContent = authContent.replace(/text-white/g, 'text-slate-900 dark:text-white');
authContent = authContent.replace(/text-slate-500/g, 'text-slate-500 dark:text-slate-400');
authContent = authContent.replace(/bg-slate-800/g, 'bg-slate-100 dark:bg-slate-800');
authContent = authContent.replace(/border-slate-700/g, 'border-slate-200 dark:border-slate-700');
authContent = authContent.replace(/shadow-\[inset_0_0_20px_rgba\(0,0,0,0\.5\)\]/g, 'shadow-[inset_0_0_10px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]');

// Inputs
authContent = authContent.replace(/bg-black\/40 border border-slate-800/g, 'bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800');
authContent = authContent.replace(/bg-black\/50 border border-slate-200 dark:border-slate-700/g, 'bg-slate-100 dark:bg-black/50 border border-slate-300 dark:border-slate-700');

// Buttons & specifics
// Let's restore the button text to pure text-white because it's inside a colored gradient background (from-brand-primary etc)
authContent = authContent.replace(/font-black text-slate-900 dark:text-white shadow-xl/g, 'font-black text-white shadow-xl');
// Restore "We sent a code to email" white text
authContent = authContent.replace(/<span className=\"text-slate-900 dark:text-white font-bold\">\{formData.email\}<\/span>/g, '<span className=\"text-slate-900 dark:text-white font-bold\">{formData.email}</span>');
// Return button text
authContent = authContent.replace(/hover:text-slate-900 dark:hover:text-white/g, 'hover:text-slate-900 dark:hover:text-white'); // already handled

fs.writeFileSync(authFile, authContent);

console.log('Fixed Auth styling.');
