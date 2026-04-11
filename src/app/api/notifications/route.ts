import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'notifications.json');

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const since = url.searchParams.get('since') || "0";
    const fileData = fs.readFileSync(dataFilePath, 'utf8');
    const allNotifications = JSON.parse(fileData);
    
    // Only return notifications that occurred after the 'since' timestamp
    const newNotifications = allNotifications.filter((n: any) => n.timestamp > Number(since));
    
    return NextResponse.json(newNotifications);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fileData = fs.readFileSync(dataFilePath, 'utf8');
    const allNotifications = JSON.parse(fileData);
    
    const newNotif = {
      id: Date.now(),
      timestamp: Date.now(),
      type: body.type, // 'CART_ADD' or 'PURCHASE'
      message: body.message
    };

    allNotifications.push(newNotif);
    
    // Kept to latest 50 memory to prevent file bloat
    if (allNotifications.length > 50) allNotifications.shift();

    fs.writeFileSync(dataFilePath, JSON.stringify(allNotifications, null, 2));

    return NextResponse.json(newNotif, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save product' }, { status: 500 });
  }
}
