import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, total, customer } = body;

    // Simulate backend processing time (contacting Stripe or eSewa)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Update Local Inventory Stats
    const dataFilePath = path.join(process.cwd(), 'src', 'data', 'inventory.json');
    const fileData = fs.readFileSync(dataFilePath, 'utf8');
    let inventory = JSON.parse(fileData);
    
    // Decrease stock and increase salesCount for bought items
    items.forEach((boughtItem: any) => {
      const idx = inventory.findIndex((p: any) => p.id === boughtItem.id);
      if (idx !== -1) {
        inventory[idx].stock = Math.max(0, inventory[idx].stock - 1);
        inventory[idx].salesCount = (inventory[idx].salesCount || 0) + 1;
      }
    });
    fs.writeFileSync(dataFilePath, JSON.stringify(inventory, null, 2));

    // Save Order History
    const ordersPath = path.join(process.cwd(), 'src', 'data', 'orders.json');
    if (!fs.existsSync(ordersPath)) fs.writeFileSync(ordersPath, '[]');
    const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
    orders.push({
      id: Date.now(),
      email: body.email,
      name: body.name,
      items: items.map((i: any) => i.name),
      total: body.total,
      date: new Date().toISOString()
    });
    fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));

    // Since this is a sandbox simulation, we will immediately return a "Success" redirect URL
    return NextResponse.json({ 
      success: true, 
      paymentUrl: `/success?orderId=ORD-${Date.now()}&total=${total}` 
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to process checkout' }, { status: 500 });
  }
}
