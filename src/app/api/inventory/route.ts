import { NextResponse } from 'next/server';
import { getAllInventory } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await getAllInventory();
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory', items: [] }, { status: 500 });
  }
}
