import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkStorage() {
  const { data, error } = await supabase.storage.from('site-assets').list();
  console.log("Files in site-assets:", data);
  if (error) console.error("Error:", error);
}
checkStorage();
