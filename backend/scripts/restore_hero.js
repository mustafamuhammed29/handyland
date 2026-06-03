require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

async function restoreHero() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const { data: heroData } = await supabase.from('settings').select('value').eq('key', 'hero').single();
    let currentHero = {};
    if (heroData && heroData.value) {
        currentHero = typeof heroData.value === 'string' ? JSON.parse(heroData.value) : heroData.value;
    }

    const restoredHero = {
        headline: currentHero.headline || "Dein Premium Tech Hub",
        subheadline: currentHero.subheadline || "Entdecke die Zukunft des mobilen Handels. Kaufen, Verkaufen und Reparieren mit deutscher Präzision.",
        subheadlineAr: currentHero.subheadlineAr || "اكتشف مستقبل تجارة الهواتف. منصة تفاعلية للبيع، الشراء، والصيانة بدقة ألمانية.",
        bgStart: currentHero.bgStart || "#0f172a",
        bgEnd: currentHero.bgEnd || "#020617",
        accentColor: currentHero.accentColor || "#0ea5e9",
        buttonMarket: currentHero.buttonMarket || "Jetzt einkaufen",
        buttonValuation: currentHero.buttonValuation || "Gerät verkaufen",
        trustBadge1: currentHero.trustBadge1 || "VERIFIZIERTE HÄNDLER",
        trustBadge2: currentHero.trustBadge2 || "24/7 SUPPORT",
        trustBadge3: currentHero.trustBadge3 || "4.9★ BEWERTET",
        stat1Title: currentHero.stat1Title || "Geräte verkauft",
        stat1Value: currentHero.stat1Value || "+24% diese Woche",
        stat2Title: currentHero.stat2Title || "Kundenbewertung",
        stat2Value: currentHero.stat2Value || "4.9/5.0 Ausgezeichnet",
        ...currentHero // this will keep the current product properties and overwrite defaults if they exist
    };
    
    // Actually we want the defaults to overwrite if currentHero properties are missing/empty!
    // So we do:
    for (const key in restoredHero) {
        if (!currentHero[key]) {
            currentHero[key] = restoredHero[key];
        }
    }

    await supabase.from('settings').update({ value: JSON.stringify(currentHero) }).eq('key', 'hero');
    console.log("Hero settings restored successfully.");
}

restoreHero().catch(console.error);
