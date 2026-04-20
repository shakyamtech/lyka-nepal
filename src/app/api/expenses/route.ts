import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all expenses
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST a new expense
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Add the current date if not provided
    if (!body.date) {
      body.date = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([body])
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
