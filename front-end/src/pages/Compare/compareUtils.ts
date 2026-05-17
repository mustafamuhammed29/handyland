// Number extraction for Winner Logic
export const extractNumber = (val: any) => {
    if (!val) return -1;
    const parse = parseFloat(String(val).replace(/[^\d.-]/g, ''));
    return isNaN(parse) ? -1 : parse;
};

export const getWinnerIndices = (values: any[], metricKey: string, activeProductsCount: number): number[] => {
    // We only highlight if there's at least 2 products
    if (activeProductsCount < 2) return [];
    
    const nums = values.map(extractNumber);
    // Exclude empty or non-numeric
    const validIndices = nums.map((n, i) => ({ n, i })).filter(item => item.n !== -1);
    if (validIndices.length <= 1) return []; 
    
    let target: number;
    
    // Logic: Lower is better for price or weight. Otherwise higher is better.
    const isLowerBetter = metricKey.toLowerCase().includes('price') || metricKey.toLowerCase().includes('gewicht');
    
    if (isLowerBetter) {
        target = Math.min(...validIndices.map(v => v.n));
    } else {
        target = Math.max(...validIndices.map(v => v.n));
    }

    return validIndices.filter(v => v.n === target).map(v => v.i);
};

export const getDynamicSpecs = (selectedProducts: any[]) => {
    const specMap: Record<string, Set<string>> = {};
    
    selectedProducts.forEach(product => {
        if (!product) return;
        
        if (!specMap['Stammdaten']) specMap['Stammdaten'] = new Set();
        if (product.brand) specMap['Stammdaten'].add('Marke');
        if (product.model || product.name) specMap['Stammdaten'].add('Modell');
        if (product.color) specMap['Stammdaten'].add('Farbe');
        if (product.storage) specMap['Stammdaten'].add('Speicher');
        if (product.condition) specMap['Stammdaten'].add('Zustand');
        
        if (product.processor) {
            if (!specMap['Hauptmerkmale']) specMap['Hauptmerkmale'] = new Set();
            specMap['Hauptmerkmale'].add('Processor');
        }
        if (product.display) {
            if (!specMap['Hauptmerkmale']) specMap['Hauptmerkmale'] = new Set();
            specMap['Hauptmerkmale'].add('Display');
        }
        if (product.battery) {
            if (!specMap['Hauptmerkmale']) specMap['Hauptmerkmale'] = new Set();
            specMap['Hauptmerkmale'].add('Battery');
        }

        if (!product.specs) return;
        
        Object.keys(product.specs).forEach(category => {
            const categoryValue = product.specs[category];
            if (category === 'globalPrice' || category === 'benchmarkScore') return;

            if (
                categoryValue && 
                typeof categoryValue === 'object' && 
                !Array.isArray(categoryValue)
            ) {
                if (!specMap[category]) specMap[category] = new Set();
                Object.keys(categoryValue).forEach(key => specMap[category].add(key));
            } else if (typeof categoryValue === 'string' || typeof categoryValue === 'number' || typeof categoryValue === 'boolean') {
                const lowerKey = category.toLowerCase();
                const isHaupt = ['processor', 'display', 'camera', 'battery', 'ram', 'os'].includes(lowerKey);
                
                let normalizedKey = category.charAt(0).toUpperCase() + category.slice(1);
                if (lowerKey === 'os') normalizedKey = 'OS';
                if (lowerKey === 'ram') normalizedKey = 'RAM';

                if (isHaupt) {
                    if (!specMap['Hauptmerkmale']) specMap['Hauptmerkmale'] = new Set();
                    specMap['Hauptmerkmale'].add(normalizedKey);
                } else {
                    if (!specMap['Weitere Details']) specMap['Weitere Details'] = new Set();
                    specMap['Weitere Details'].add(normalizedKey);
                }
            }
        });
    });

    const finalized = Object.entries(specMap)
        .filter(([_, keysSet]) => keysSet.size > 0)
        .map(([category, keysSet]) => ({
            category,
            keys: Array.from(keysSet)
        }));
        
    return finalized.sort((a, b) => {
        if (a.category === 'Stammdaten') return -1;
        if (b.category === 'Stammdaten') return 1;
        if (a.category === 'Hauptmerkmale') return -1;
        if (b.category === 'Hauptmerkmale') return 1;
        return 0;
    });
};
