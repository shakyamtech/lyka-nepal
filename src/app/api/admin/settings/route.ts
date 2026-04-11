import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'admin.json');

export async function GET() {
  try {
    if (!fs.existsSync(dataFilePath)) return NextResponse.json({ email: "admin@lyka.com", password: "123456" });
    const fileData = fs.readFileSync(dataFilePath, 'utf8');
    return NextResponse.json(JSON.parse(fileData));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.email || !body.password) return NextResponse.json({ error: 'Missing creds' }, { status: 400 });

    const newConfig = {
      email: body.email,
      password: body.password
    };

    fs.writeFileSync(dataFilePath, JSON.stringify(newConfig, null, 2));

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
