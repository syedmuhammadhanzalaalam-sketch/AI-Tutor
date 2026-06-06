import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(req, { params }) {
  const { id } = await params;
  try {
    await query('UPDATE sessions SET is_pinned = NOT is_pinned WHERE id = $1', [id]);
    return NextResponse.json({ status: 'success' });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
