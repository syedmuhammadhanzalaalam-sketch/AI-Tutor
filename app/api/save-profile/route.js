import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req) {
  try {
    const { session_id, topic, grip, efficiency } = await req.json();
    await query(
      'INSERT INTO user_profiles (session_id, topic, theoretical_grip, execution_efficiency) VALUES ($1, $2, $3, $4)',
      [session_id, topic, grip, efficiency]
    );
    return NextResponse.json({ status: 'Profile Saved' });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
