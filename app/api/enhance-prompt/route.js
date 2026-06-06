import { NextResponse } from 'next/server';
import { promptEnhancer } from '@/lib/agents';

export async function POST(req) {
  try {
    const { prompt: originalText } = await req.json();
    if (!originalText || originalText.length < 10) {
      return NextResponse.json({ suggestions: [] });
    }
    const enhancedContent = await promptEnhancer(originalText);
    const rawSuggestions = enhancedContent.split('|||');
    const suggestions = rawSuggestions
      .map(s => s.trim())
      .filter(s => s.length > 15 && !s.toLowerCase().startsWith('version'));
    return NextResponse.json({ suggestions: suggestions.slice(0, 3) });
  } catch (e) {
    return NextResponse.json({ suggestions: [] });
  }
}
