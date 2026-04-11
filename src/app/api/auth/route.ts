import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const usersPath = path.join(process.cwd(), 'src', 'data', 'users.json');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, name, email, password } = body;
    
    if (!fs.existsSync(usersPath)) fs.writeFileSync(usersPath, '[]');
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

    if (action === 'REGISTER') {
      if (users.find((u: any) => u.email === email)) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }
      const newUser = { id: Date.now(), name, email, password }; // In production, hash this password!
      users.push(newUser);
      fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
      return NextResponse.json({ success: true, user: { name, email } }, { status: 201 });
    }
    
    if (action === 'LOGIN') {
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (user) {
        return NextResponse.json({ success: true, user: { name: user.name, email: user.email } }, { status: 200 });
      }
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'System error' }, { status: 500 });
  }
}
