import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const avgResult = await query('SELECT AVG(score) as avg_score FROM quiz_results');
    const totalResult = await query('SELECT COUNT(*) as total FROM learning_modules');
    const compResult = await query("SELECT COUNT(*) as completed FROM learning_modules WHERE status = 'Completed'");
    const recentRows = await query('SELECT score FROM quiz_results ORDER BY id DESC LIMIT 5');

    const avgData = (Array.isArray(avgResult) ? avgResult[0] : {}) || {};
    const totalMods = (Array.isArray(totalResult) ? totalResult[0] : {}) || {};
    const compMods = (Array.isArray(compResult) ? compResult[0] : {}) || {};

    return NextResponse.json({
      average_score: Math.round((parseFloat(avgData.avg_score) || 0) * 10) / 10,
      total_modules: parseInt(totalMods.total) || 0,
      completed_modules: parseInt(compMods.completed) || 0,
      recent_scores: (Array.isArray(recentRows) ? recentRows : []).map(r => r.score),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
