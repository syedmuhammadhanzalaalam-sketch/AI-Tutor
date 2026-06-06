import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { assessmentAgent } from '@/lib/agents';

export async function POST(req) {
  try {
    const { topic } = await req.json();
    const assessmentResults = await assessmentAgent(topic);
    await query('INSERT INTO knowledge_gaps (gap_text) VALUES ($1)', [assessmentResults]);
    return NextResponse.json({ assessment: assessmentResults });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
