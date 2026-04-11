import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

    const ordersPath = path.join(process.cwd(), 'src', 'data', 'orders.json');
    if (!fs.existsSync(ordersPath)) fs.writeFileSync(ordersPath, '[]');
    
    const allOrders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
    const userOrders = allOrders.filter((o: any) => o.email === email);
    
    return NextResponse.json(userOrders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
