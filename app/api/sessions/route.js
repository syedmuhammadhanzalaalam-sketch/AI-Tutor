import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const sessions = await query('SELECT * FROM sessions ORDER BY created_at DESC');
    return NextResponse.json(Array.isArray(sessions) ? sessions : []);
  } catch (e) {
    console.error('Sessions GET error:', e);
    return NextResponse.json([]);
  }
}

export async function POST() {
  try {
    const result = await query(
      "INSERT INTO sessions (title) VALUES ($1) RETURNING id, title",
      ['New Conversation']
    );
    const row = Array.isArray(result) ? result[0] : result;
    return NextResponse.json({ id: row.id, title: row.title });
  } catch (e) {
    console.error('Sessions POST error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
