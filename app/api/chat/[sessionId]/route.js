import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req, { params }) {
  const { sessionId } = await params;
  try {
    const history = await query(
      'SELECT * FROM chat_history WHERE session_id = $1 ORDER BY timestamp ASC',
      [sessionId]
    );
    return NextResponse.json(Array.isArray(history) ? history : []);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
