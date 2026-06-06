import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAITutorResponse } from '@/lib/agents';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const session_id = formData.get('session_id');
    const userCustomMsg = formData.get('message') || 'Analyze this file';

    if (!file) return NextResponse.json({ reply: 'Error: No file received' }, { status: 400 });
    if (!session_id) return NextResponse.json({ reply: 'Error: No session selected' }, { status: 400 });

    const filename = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let content = '';

    if (filename.endsWith('.pdf')) {
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
      const pdfData = await pdfParse(buffer);
      content = pdfData.text;
    } else {
      try {
        content = buffer.toString('utf-8');
      } catch {
        return NextResponse.json({ reply: 'Unsupported file format.' }, { status: 400 });
      }
    }

    const prompt = `User Question: ${userCustomMsg}\n\nFile Name: ${file.name}\nContent:\n${content}`;
    const aiReply = await getAITutorResponse(prompt);

    await query(
      'INSERT INTO chat_history (session_id, sender, message) VALUES ($1, $2, $3)',
      [session_id, 'User', `[File: ${file.name}] ${userCustomMsg}`]
    );
    await query(
      'INSERT INTO chat_history (session_id, sender, message) VALUES ($1, $2, $3)',
      [session_id, 'AI_Tutor', aiReply]
    );

    return NextResponse.json({ reply: aiReply });
  } catch (e) {
    console.error('Upload Error:', e);
    return NextResponse.json({ reply: 'Neural core error while processing file.' }, { status: 500 });
  }
}
