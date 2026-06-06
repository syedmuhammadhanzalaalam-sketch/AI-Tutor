const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODELS = ['openai/gpt-oss-120b'];

export const AI_MODELS = [
  { id: 'openai/gpt-oss-120b',                    name: 'GPT OSS 120B',     badge: 'GPT',     color: '#10a37f', desc: 'Best overall' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B',    badge: 'META',    color: '#0064e0', desc: 'Strong reasoning' },
  { id: 'google/gemma-2-27b-it:free',             name: 'Gemma 2 27B',      badge: 'GOOGLE',  color: '#4285f4', desc: 'Great explanations' },
  { id: 'nvidia/nemotron-70b-instruct:free',       name: 'Nemotron 70B',     badge: 'NVIDIA',  color: '#76b900', desc: 'Technical topics' },
  { id: 'qwen/qwen3-30b-a3b:free',                name: 'Qwen3 30B',        badge: 'QWEN',    color: '#ff6b35', desc: 'Coding & math' },
];

export async function getAITutorResponse(userInput, history = [], selectedModel = null) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'AI Tutor Personalization System',
  };

  const messages = [
    { role: 'system', content: 'You are an expert AI Tutor. Explain concepts clearly and identify student learning gaps.' },
    ...history,
    { role: 'user', content: userInput },
  ];

  const modelsToTry = selectedModel ? [selectedModel, ...MODELS] : MODELS;

  for (const model of modelsToTry) {
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST', headers,
        body: JSON.stringify({ model, messages }),
      });
      const result = await res.json();
      if (result.choices) return result.choices[0].message.content;
    } catch (e) {
      console.error(`Model ${model} failed:`, e.message);
    }
  }
  return "I'm sorry, all AI tutor models are currently busy. Please try again in a moment.";
}

export async function promptEnhancer(originalPrompt) {
  const enhancerPrompt = `
[STRICT_MODE: DO NOT ADD NEW TOPICS]
Act as a professional Prompt Engineer. 
Refine the user's input into 3 professional versions.

CRITICAL RULES:
1. Keep the core intent EXACTLY as provided. 
2. Only improve vocabulary, structure, and academic depth.
3. Do NOT suggest history or pedagogical theories unless the user asked for them.

USER INPUT: "${originalPrompt}"

OUTPUT_FORMAT:
Version 1 ||| Version 2 ||| Version 3
(Return ONLY the refined prompts separated by |||. No "Version 1:" labels.)
`;
  const raw = await getAITutorResponse(enhancerPrompt);
  return raw.replace(/Version \d:/g, '').trim();
}

export async function assessmentAgent(userInput) {
  const prompt = `
You are an Assessment Agent. The user wants to learn: ${userInput}
1. Ask the user 2-3 specific technical questions to test their current level.
2. Based on their input, identify what specific 'Knowledge Gaps' they have.
3. Output the identified gaps clearly.
`;
  return getAITutorResponse(prompt);
}

export async function curriculumAgent(knowledgeGaps) {
  const prompt = `
You are a Curriculum Agent. Based on these identified knowledge gaps:
${knowledgeGaps}

Create a 3-step learning path. For each step, provide:
1. A Module Title.
2. A brief description of what will be covered.

Format the output clearly so it can be parsed into a database.
`;
  return getAITutorResponse(prompt);
}

export async function quizAgent(userTopic, userScore = null) {
  let difficulty = 'Beginner';
  if (userScore && userScore > 80) difficulty = 'Advanced';
  else if (userScore && userScore > 50) difficulty = 'Intermediate';

  const prompt = `
You are a Quiz Agent. Generate a 10-question multiple-choice quiz on the topic: ${userTopic}
Difficulty: ${difficulty}

CRITICAL: 
1. If the topic involves code, include code snippets in the question using Markdown.
2. You must provide exactly 10 questions.

Return ONLY in this exact format for each question:
Q1: [Question Text]
A) [Option A]
B) [Option B]
C) [Option C]
Correct: [Letter]
--- 
Q2: [Question]
A) [Option]
B) [Option]
C) [Option]
Correct: [Letter]
---
Q3: [Question]
A) [Option]
B) [Option]
C) [Option]
Correct: [Letter]
---
Q4: [Question]
A) [Option]
B) [Option]
C) [Option]
Correct: [Letter]
---
Q5: [Question]
A) [Option]
B) [Option]
C) [Option]
Correct: [Letter]
---
Q6: [Question]
A) [Option]
B) [Option]
C) [Option]
Correct: [Letter]
---
Q7: [Question]
A) [Option]
B) [Option]
C) [Option]
Correct: [Letter]
---
Q8: [Question]
A) [Option]
B) [Option]
C) [Option]
Correct: [Letter]
---
Q9: [Question]
A) [Option]
B) [Option]
C) [Option]
Correct: [Letter]
---
Q10: [Question]
A) [Option]
B) [Option]
C) [Option]
Correct: [Letter]
---
`;
  return getAITutorResponse(prompt);
}

export async function getYouTubeRecommendation(queryText) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const url = `https://www.googleapis.com/youtube/v3/search?q=${encodeURIComponent(queryText + ' tutorial')}&part=snippet&type=video&maxResults=1&order=relevance&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      const video = data.items[0];
      const videoId = video.id.videoId;
      const title = video.snippet.title;
      return `\n\n---\n### 📺 Recommended Deep-Dive\n**[${title}](https://www.youtube.com/watch?v=${videoId})**`;
    }
  } catch (e) {
    console.error('YouTube error:', e.message);
  }
  return '';
}

export function generateChatTitle(firstUserMessage) {
  // We'll just use the first few words
  const words = firstUserMessage.trim().split(' ').slice(0, 4).join(' ');
  return words.replace(/[^a-zA-Z0-9\s]/g, '').trim().slice(0, 30) || 'New Conversation';
}