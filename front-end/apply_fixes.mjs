import fs from 'fs';
import path from 'path';

// 1. Re-apply global h-screen replacements
function replaceHScreen(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceHScreen(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content.replace(/\bh-screen\b/g, 'h-[100dvh]').replace(/\bmin-h-screen\b/g, 'min-h-[100dvh]');
            // Specific fix for index.css
            if (fullPath.endsWith('index.css')) {
                newContent = newContent.replace('min-height: 100vh;', 'min-height: 100dvh;');
            }
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
            }
        }
    }
}
replaceHScreen('./src');

// 2. Re-apply specific fixes
function replaceInFile(filePath, searchStr, replaceStr) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes(searchStr)) {
            content = content.replace(searchStr, replaceStr);
            fs.writeFileSync(filePath, content, 'utf8');
        }
    }
}

// PublicLayout.tsx
replaceInFile('./src/components/layouts/PublicLayout.tsx', 
    'pb-16 md:pb-0', 
    'pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0'
);

// PromoModal.tsx
replaceInFile('./src/components/PromoModal.tsx', 
    'z-50', 
    'z-[150]'
);

// AddFundsModal.tsx
replaceInFile('./src/components/dashboard/wallet/AddFundsModal.tsx', 
    'z-[100]', 
    'z-[150]'
);

// WhatsAppWidget.tsx
replaceInFile('./src/components/WhatsAppWidget.tsx', 
    'bottom-6 right-6 lg:bottom-10 lg:right-10 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 hover:scale-110 hover:bg-green-400 transition-all z-50 group cursor-pointer', 
    'bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 lg:bottom-10 lg:right-10 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 hover:scale-110 hover:bg-green-400 transition-all z-50 group cursor-pointer'
);

// CartDrawer.tsx
replaceInFile('./src/components/CartDrawer.tsx', 
    'fixed inset-y-0 right-0 z-[60]', 
    'fixed inset-y-0 right-0 z-[110]'
);
replaceInFile('./src/components/CartDrawer.tsx', 
    'bg-slate-900/80 backdrop-blur-sm z-[70]', 
    'bg-slate-900/80 backdrop-blur-sm z-[120]'
);
replaceInFile('./src/components/CartDrawer.tsx', 
    'className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md"', 
    'className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md pb-[calc(1.5rem+env(safe-area-inset-bottom))]"'
);

// ProductStickyBar.tsx
replaceInFile('./src/components/products/ProductStickyBar.tsx', 
    'className="fixed bottom-0 left-0 w-full', 
    'className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 left-0 w-full'
);

// CookieConsent.tsx
replaceInFile('./src/components/CookieConsent.tsx', 
    'z-[100]', 
    'z-[150]'
);

// Navbar.tsx
replaceInFile('./src/components/Navbar.tsx',
    'className="py-4 space-y-2 max-h-[85vh] overflow-y-auto custom-scrollbar"',
    'className="py-4 space-y-2 max-h-[calc(100dvh-7rem)] overflow-y-auto custom-scrollbar shrink-0"'
);

console.log('Restoration complete!');
