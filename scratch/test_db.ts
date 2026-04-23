import { supabaseAdmin } from './src/lib/supabase';

async function checkTable() {
  const { data, error } = await supabaseAdmin.from('categories').select('*').limit(1);
  if (error) {
    console.log("Table 'categories' does not exist or error:", error.message);
  } else {
    console.log("Table 'categories' exists!");
  }
}

checkTable();
