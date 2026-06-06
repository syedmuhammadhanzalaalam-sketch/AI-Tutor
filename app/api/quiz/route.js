import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { quizAgent } from '@/lib/agents';

export async function POST(req) {
  try {
    const { session_id, topic } = await req.json();
    const quizContent = await quizAgent(topic);
    await query(
      'INSERT INTO chat_history (session_id, sender, message) VALUES ($1, $2, $3)',
      [session_id, 'AI_Tutor', `Started quiz on: ${topic}`]
    );
    return NextResponse.json({ quiz: quizContent });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
