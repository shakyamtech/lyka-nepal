import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    let query = supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (email) {
      query = query.eq('customer_email', email);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Map back to what frontend expects
    const orders = data.map((o: any) => ({
      id: o.id,
      email: o.customer_email,
      name: o.customer_name,
      items: (o.items as any).map((i: any) => i.name),
      rawItems: o.items,
      total: o.total,
      date: o.created_at,
      screenshotUrl: o.screenshot_url,
      status: o.status
    }));

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Fetch orders err:", error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const items = JSON.parse(formData.get('items') as string || '[]');
    const total = formData.get('total');
    const name = formData.get('name');
    const email = formData.get('email');
    const screenshot = formData.get('screenshot') as File | null;
    
    let screenshotUrl = '';
    
    if (screenshot) {
      const bytes = await screenshot.arrayBuffer();
      const ext = screenshot.name.split('.').pop() || 'jpg';
      const fileName = `payment_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      
      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage
        .from('receipts')
        .upload(fileName, bytes, {
          contentType: screenshot.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabaseAdmin
        .storage
        .from('receipts')
        .getPublicUrl(fileName);
        
      screenshotUrl = publicUrlData.publicUrl;
    }

    const orderId = `ORD-${Date.now()}`;

    const { error } = await supabaseAdmin
      .from('orders')
      .insert([{
        id: orderId,
        customer_name: name,
        customer_email: email,
        items: items, // jsonb handles this
        total: Number(total),
        screenshot_url: screenshotUrl,
        status: "Pending Verification"
      }]);

    if (error) throw error;

    // Send a silent notification to Admin Panel
    await supabaseAdmin
      .from('notifications')
      .insert([{
        timestamp: Date.now(),
        type: 'PURCHASE',
        message: `Customer uploaded payment for ${orderId} (NPR ${total}).`
      }]);

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error("Order submit err:", error);
    return NextResponse.json({ error: 'Failed to submit order' }, { status: 500 });
  }
}
