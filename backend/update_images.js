require('dotenv').config();
const { supabaseAdmin } = require('./config/supabase');

const images = {
  'iPhone 14': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14.jpg',
  'iPhone 14 Pro': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14-pro-max-.jpg',
  'iPhone 14 Pro Max': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14-pro-max-.jpg',
  'iPhone 15': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15.jpg',
  'iPhone 15 Pro': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg',
  'iPhone 15 Pro Max': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg',
  'Pixel 8': 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8-pro.jpg',
  'Pixel 8 Pro': 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8-pro.jpg',
  'Galaxy S23 Ultra': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-ultra-5g.jpg',
  'Galaxy S24': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-5g-sm-s921.jpg',
  'Galaxy S24+': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-5g-sm-s921.jpg',
  'Galaxy S24 Ultra': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g-sm-s928-1.jpg'
};

async function updateImages() {
  for (const [model, image] of Object.entries(images)) {
    console.log(`Updating ${model}...`);
    const { data, error } = await supabaseAdmin
      .from('device_blueprints')
      .update({ image })
      .eq('model', model);
      
    if (error) {
      console.error(`Error updating ${model}:`, error.message);
    } else {
      console.log(`Successfully updated ${model}`);
    }
  }
}

updateImages();
