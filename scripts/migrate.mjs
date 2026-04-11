import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase URL or Service Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
  console.log("🚀 Starting Migration to Supabase...");

  // 1. Migrate Admins
  const adminPath = path.join(process.cwd(), 'src', 'data', 'admin.json');
  if (fs.existsSync(adminPath)) {
    const admins = JSON.parse(fs.readFileSync(adminPath, 'utf8'));
    console.log(`- Migrating ${admins.length} admins...`);
    for (const admin of admins) {
      const { error } = await supabase.from('admins').upsert({
        email: admin.email,
        password: admin.password,
        role: admin.role,
        recovery_key: admin.recoveryKey
      }, { onConflict: 'email' });
      if (error) console.error(`  ❌ Error migrating admin ${admin.email}:`, error.message);
    }
  }

  // 2. Migrate Products
  const inventoryPath = path.join(process.cwd(), 'src', 'data', 'inventory.json');
  if (fs.existsSync(inventoryPath)) {
    const products = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
    console.log(`- Migrating ${products.length} products...`);
    for (const p of products) {
      const { error } = await supabase.from('products').upsert({
        name: p.name,
        category: p.category,
        price: p.price,
        image: p.image,
        stock: p.stock,
        sales_count: p.salesCount || 0
      });
      if (error) console.error(`  ❌ Error migrating product ${p.name}:`, error.message);
    }
  }

  // 3. Migrate Orders
  const ordersPath = path.join(process.cwd(), 'src', 'data', 'orders.json');
  if (fs.existsSync(ordersPath)) {
    const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
    console.log(`- Migrating ${orders.length} orders...`);
    for (const o of orders) {
      const { error } = await supabase.from('orders').upsert({
        id: o.id.toString(),
        customer_name: o.name,
        customer_email: o.email,
        items: o.rawItems || [], 
        total: Number(o.total),
        screenshot_url: o.screenshotUrl,
        status: o.status,
        created_at: o.date
      });
      if (error) console.error(`  ❌ Error migrating order ${o.id}:`, error.message);
    }
  }

  console.log("✅ Migration complete!");
}

migrate().catch(console.error);
