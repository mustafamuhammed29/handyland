const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function test() {
    const { data, error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', '00000000-0000-0000-0000-000000000000')
        .or('id.eq.00000000-69ca-f2fc-7e16-280dd11918e1,product_id.eq.00000000-69ca-f2fc-7e16-280dd11918e1,accessory_id.eq.00000000-69ca-f2fc-7e16-280dd11918e1');
    console.log("Error:", error);
}
test();
