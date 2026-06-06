import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(req, { params }) {
  const { id } = await params;
  const { title } = await req.json();
  try {
    await query('UPDATE sessions SET title = $1 WHERE id = $2', [title, id]);
    return NextResponse.json({ status: 'success', new_title: title });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
