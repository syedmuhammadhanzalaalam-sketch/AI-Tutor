import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(req, { params }) {
  const { id } = await params;
  try {
    await query('DELETE FROM sessions WHERE id = $1', [id]);
    return NextResponse.json({ status: 'deleted' });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
