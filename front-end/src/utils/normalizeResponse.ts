export const normalizeResponse = (res: any, arrayKey?: string): any[] => {
    if (Array.isArray(res)) return res;
    
    if (arrayKey) {
        if (res?.data && Array.isArray(res.data[arrayKey])) return res.data[arrayKey];
        if (Array.isArray(res[arrayKey])) return res[arrayKey];
    }
    
    if (res?.data?.items && Array.isArray(res.data.items)) return res.data.items;
    if (res?.items && Array.isArray(res.items)) return res.items;
    
    if (res?.data && Array.isArray(res.data)) return res.data;
    
    return [];
};
