import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'inventory.json');

export async function GET() {
  try {
    const fileData = fs.readFileSync(dataFilePath, 'utf8');
    const products = JSON.parse(fileData);
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const category = formData.get('category') as string;
    const price = formData.get('price') as string;
    const stock = formData.get('stock') as string;
    const file = formData.get('image') as File | null;
    
    let imageUrl = "";

    // If an actual file was uploaded
    if (file && typeof file !== 'string') {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate secure unique path
      const ext = file.name.split('.').pop() || 'jpg';
      const safeName = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const fileName = `${Date.now()}_${safeName}.${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      
      // Auto-create folder if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      
      // The relative URL for the storefront
      imageUrl = `/uploads/${fileName}`;
    }

    const fileData = fs.readFileSync(dataFilePath, 'utf8');
    const products = JSON.parse(fileData);
    
    const newProduct = {
      id: Date.now(),
      name,
      category,
      price: Number(price),
      image: imageUrl || "https://dummyimage.com/400x500/ccc/fff.png",
      stock: Number(stock) || 10,
      salesCount: 0
    };

    products.push(newProduct);
    fs.writeFileSync(dataFilePath, JSON.stringify(products, null, 2));

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save product' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = Number(url.searchParams.get('id'));

    const fileData = fs.readFileSync(dataFilePath, 'utf8');
    let products = JSON.parse(fileData);
    
    products = products.filter((p: any) => p.id !== id);
    fs.writeFileSync(dataFilePath, JSON.stringify(products, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
