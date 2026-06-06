import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req) {
  try {
    const { score } = await req.json();
    await query('INSERT INTO quiz_results (score, difficulty) VALUES ($1, $2)', [score, 'Dynamic']);
    return NextResponse.json({ status: 'Score Saved' });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
