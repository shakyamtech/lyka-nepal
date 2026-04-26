import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('wishlist')
      .select('*, products(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { productId, phone, size } = await request.json();
    if (!productId || !phone) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('wishlist')
      .insert([{ product_id: productId, customer_phone: phone, selected_size: size }])
      .select()
      .single();

    if (error) {
      console.error("Wishlist insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Wishlist catch error:", error);
    return NextResponse.json({ error: error.message || 'Failed to join wishlist' }, { status: 500 });
  }
}
