const fs = require('fs');

const extractSection = (file, sectionName, activeStateValue) => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Force activeSection to the desired value
    content = content.replace(
        /const \[activeSection, setActiveSection\] = useState<'blueprints' \| 'quotes' \| 'research'>\('[^']+'\);/,
        const activeSection = '';
    );
    
    // Remove the navigation tabs
    content = content.replace(
        /<div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 mb-8[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
        ''
    );
    
    // In QuotesTab, we can remove the top header with "Valuation Manager" completely
    if (activeStateValue === 'quotes') {
        content = content.replace(
            /<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">[\s\S]*?<\/div>\s*<\/div>/,
            ''
        );
    }
    
    // Save
    fs.writeFileSync(file, content, 'utf8');
};

extractSection('c:/Users/musta/Desktop/handyland/backend/admin/src/pages/valuation/ValuationBlueprintsTab.tsx', 'blueprints', 'blueprints');
extractSection('c:/Users/musta/Desktop/handyland/backend/admin/src/pages/valuation/ValuationQuotesTab.tsx', 'quotes', 'quotes');

console.log('Tabs updated');
