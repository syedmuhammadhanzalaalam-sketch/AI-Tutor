import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAITutorResponse, getYouTubeRecommendation, generateChatTitle } from '@/lib/agents';

export async function POST(req) {
  try {
    const { message: userMsg, session_id, model: selectedModel } = await req.json();
    if (!session_id) return NextResponse.json({ error: 'No session selected' }, { status: 400 });

    // Conversation Memory: last 10 messages
    const recentRows = await query(
      'SELECT sender, message FROM chat_history WHERE session_id = $1 ORDER BY timestamp DESC LIMIT 10',
      [session_id]
    );
    const history = (Array.isArray(recentRows) ? recentRows : []).reverse().map(r => ({
      role: r.sender === 'User' ? 'user' : 'assistant',
      content: r.message,
    }));

    // Auto-title on first message
    const countResult = await query(
      'SELECT COUNT(*) as count FROM chat_history WHERE session_id = $1',
      [session_id]
    );
    const count = parseInt(countResult[0]?.count || 0);
    if (count === 0) {
      const newTitle = generateChatTitle(userMsg);
      await query('UPDATE sessions SET title = $1 WHERE id = $2', [newTitle, session_id]);
    }

    // Get AI reply — retry once if empty
    let aiReply = await getAITutorResponse(userMsg, history, selectedModel || null);
    console.log('AI Reply length:', aiReply?.length, '| Preview:', aiReply?.slice(0, 80));

    if (!aiReply || aiReply.trim().length < 5) {
      console.log('Empty reply — retrying without history...');
      aiReply = await getAITutorResponse(userMsg, [], null);
    }

    if (!aiReply || aiReply.trim().length < 5) {
      aiReply = "I'm sorry, I couldn't generate a response. Please try again.";
    }

    // Save to DB
    await query(
      'INSERT INTO chat_history (session_id, sender, message) VALUES ($1, $2, $3)',
      [session_id, 'User', userMsg]
    );
    await query(
      'INSERT INTO chat_history (session_id, sender, message) VALUES ($1, $2, $3)',
      [session_id, 'AI_Tutor', aiReply]
    );

    return NextResponse.json({ reply: aiReply });

  } catch (e) {
    console.error('Chat route error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}