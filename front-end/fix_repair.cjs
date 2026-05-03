const fs = require('fs');

// 1. Fix Repair.tsx
const repairFile = 'c:/Users/musta/Desktop/handyland/front-end/src/components/Repair.tsx';
let repairContent = fs.readFileSync(repairFile, 'utf8');

repairContent = repairContent.replace(/bg-slate-900\"/g, 'bg-slate-50 dark:bg-[#0a0f1c]"');
repairContent = repairContent.replace(/text-white/g, 'text-slate-900 dark:text-white');
repairContent = repairContent.replace(/text-slate-400/g, 'text-slate-600 dark:text-slate-400');
repairContent = repairContent.replace(/bg-slate-900\/50 backdrop-blur-md border border-slate-700/g, 'bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-700');
repairContent = repairContent.replace(/bg-black\/50 border border-transparent/g, 'bg-slate-100/50 dark:bg-black/50 border border-slate-200 dark:border-transparent');
repairContent = repairContent.replace(/placeholder:text-slate-600/g, 'placeholder:text-slate-400 dark:placeholder:text-slate-600');
repairContent = repairContent.replace(/py-5 bg-/g, 'py-3 md:py-5 bg-');
repairContent = repairContent.replace(/py-20/g, 'pt-32 pb-20');

fs.writeFileSync(repairFile, repairContent);

// 2. Fix RepairCatalogList.tsx
const catalogFile = 'c:/Users/musta/Desktop/handyland/front-end/src/components/repair/RepairCatalogList.tsx';
let catalogContent = fs.readFileSync(catalogFile, 'utf8');

catalogContent = catalogContent.replace(/bg-slate-900\/40 border border-slate-800 rounded-2xl p-6/g, 'bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm dark:shadow-none');
catalogContent = catalogContent.replace(/hover:bg-slate-800\/60/g, 'hover:bg-slate-50 dark:hover:bg-slate-800/60');
catalogContent = catalogContent.replace(/bg-slate-800 border border-slate-700/g, 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700');
catalogContent = catalogContent.replace(/text-white/g, 'text-slate-900 dark:text-white');
catalogContent = catalogContent.replace(/bg-black\/40 border border-slate-800\/50/g, 'bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800/50');
catalogContent = catalogContent.replace(/border-t border-slate-800/g, 'border-t border-slate-200 dark:border-slate-800');
catalogContent = catalogContent.replace(/text-slate-500/g, 'text-slate-500 dark:text-slate-400');
catalogContent = catalogContent.replace(/bg-slate-900 rounded-full/g, 'bg-slate-100 dark:bg-slate-900 rounded-full');

fs.writeFileSync(catalogFile, catalogContent);

console.log('Fixed Repair styling.');
