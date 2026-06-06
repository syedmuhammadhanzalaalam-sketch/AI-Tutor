import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAITutorResponse } from '@/lib/agents';

export async function POST(req) {
  try {
    const { topic } = await req.json();

    const profiles = await query(
      'SELECT theoretical_grip, execution_efficiency FROM user_profiles ORDER BY created_at DESC LIMIT 1'
    );
    const gapRecords = await query(
      'SELECT gap_text FROM knowledge_gaps ORDER BY created_at DESC LIMIT 1'
    );

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ error: 'Complete the interview first.' }, { status: 400 });
    }

    const profile = profiles[0];
    const gaps = gapRecords && gapRecords.length > 0 ? gapRecords[0].gap_text : 'No specific gaps identified.';

    const adaptivePrompt = `
You are an expert curriculum designer. Create a professional 10-step learning roadmap.

Topic: ${topic}
Student Profile: Theoretical grip ${profile.theoretical_grip}/5, Execution efficiency ${profile.execution_efficiency}/5
Knowledge Gaps: ${gaps}

CRITICAL: Respond in clean markdown only. NO JSON. NO code blocks. NO raw objects.

Format each step exactly like this:

## Step 1: [Title]
**Goal:** [What the student will achieve]
**Duration:** [Estimated time]
**Topics:** [Key concepts covered]

---

## Step 2: [Title]
...and so on for all 10 steps.

End with a ## Summary section with 2-3 sentences about the complete path.
`;

    const curriculumPath = await getAITutorResponse(adaptivePrompt);

    await query(
      'INSERT INTO learning_modules (title, content) VALUES ($1, $2)',
      [`Mastery Path: ${topic}`, curriculumPath]
    );

    return NextResponse.json({ curriculum: curriculumPath });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
