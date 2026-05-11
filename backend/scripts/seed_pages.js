'use strict';

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const defaultPages = [
    {
        slug: 'impressum',
        title: 'Impressum',
        content: '<h1>Impressum</h1><p>HandyLand Mobile Shop</p><p>Musterstraße 123</p><p>12345 Berlin</p>',
        is_published: true
    },
    {
        slug: 'datenschutz',
        title: 'Datenschutzerklärung',
        content: '<h1>Datenschutzerklärung</h1><p>Wir nehmen den Schutz Ihrer Daten sehr ernst...</p>',
        is_published: true
    },
    {
        slug: 'agb',
        title: 'AGB',
        content: '<h1>Allgemeine Geschäftsbedingungen</h1><p>Hier finden Sie unsere AGB...</p>',
        is_published: true
    },
    {
        slug: 'ueber-uns',
        title: 'Über Uns',
        content: '<h1>Über Uns</h1><p>Willkommen bei HandyLand...</p>',
        is_published: true
    },
    {
        slug: 'kundenservice',
        title: 'Service & Kontakt',
        content: '<h1>Service & Kontakt</h1><p>Haben Sie Fragen? Wir helfen Ihnen gerne weiter...</p>',
        is_published: true
    }
];

async function seedPages() {
    console.log('Seeding Default Pages...');

    for (const page of defaultPages) {
        const { error } = await supabase
            .from('pages')
            .upsert(page, { onConflict: 'slug' });

        if (error) {
            console.error(`Error seeding ${page.slug}:`, error.message);
        } else {
            console.log(`Successfully seeded ${page.slug}`);
        }
    }

    console.log('Done!');
}

seedPages();
