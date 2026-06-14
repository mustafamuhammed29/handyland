require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const value = JSON.stringify({
    enabled: false,
    title: "Grand Maintenance",
    message: "Full System Audit",
    estimatedTime: "wenige Minuten",
    statusText1: "System wird diagnostiziert...",
    statusText2: "Neue Reparaturen werden angewendet..."
});
sb.from('settings').update({ value }).eq('key', 'maintenanceMode')
  .then(() => console.log('Maintenance disabled in DB'))
  .catch(console.error);
