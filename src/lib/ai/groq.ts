import 'server-only';

type GroqProjectInput = {
  id: string;
  text: string;
};

type GroqScoreResponse = {
  id: string;
  score: number;
};

const AI_PROVIDER = process.env.AI_PROVIDER || 'groq';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const MAX_PROJECT_CHARS = 900;

const trimText = (value: string) => value.replace(/\s+/g, ' ').trim();

const extractJsonArray = (text: string) => {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const scoreProjectsWithGroq = async (userSummary: string, projects: GroqProjectInput[]) => {
  const isOllama = AI_PROVIDER === 'ollama';

  if (!isOllama && !process.env.GROQ_API_KEY) {
    return { scores: new Map<string, number>(), usedGroq: false };
  }

  const preparedProjects = projects.map((project) => ({
    id: project.id,
    text: trimText(project.text).slice(0, MAX_PROJECT_CHARS)
  }));

  const prompt = [
    'You are a matching engine that scores how well a user fits each project.',
    'Return ONLY a JSON array of objects: [{"id":"...","score":0-100}].',
    'Score 0 means no fit, 100 means perfect fit based on skills and profile context.',
    '',
    'Scoring Rubric Guidelines:',
    '- 80-100%: User has all or almost all required core skills and experience.',
    '- 50-79%: User has the primary core skills (e.g. Next.js, React, Python) needed to build the main parts of the project, even if they lack secondary skills.',
    '- 20-49%: User has some relevant/related skills but lacks the main technology.',
    '- 0-19%: Very low or no match.',
    'Do not cluster scores at 10% or generic numbers. Scale them dynamically based on the rubric above to reflect a realistic fit.',
    '',
    `USER: ${trimText(userSummary)}`,
    '',
    `PROJECTS: ${JSON.stringify(preparedProjects)}`
  ].join('\n');

  const apiUrl = isOllama
    ? `${process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'}/v1/chat/completions`
    : 'https://api.groq.com/openai/v1/chat/completions';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (!isOllama) {
    headers['Authorization'] = `Bearer ${process.env.GROQ_API_KEY}`;
  }

  const model = isOllama
    ? (process.env.OLLAMA_MODEL || 'llama3.1')
    : GROQ_MODEL;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You must follow the output format strictly.' },
        { role: 'user', content: prompt }
      ],
      temperature: isOllama ? 0.0 : 0.2,
      max_tokens: 600
    })
  });

  if (!response.ok) {
    return { scores: new Map<string, number>(), usedGroq: !isOllama };
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content ?? '';
  const parsed = extractJsonArray(content) as GroqScoreResponse[] | null;

  const scores = new Map<string, number>();
  if (parsed) {
    for (const item of parsed) {
      if (!item?.id) continue;
      const numericScore = Number(item.score);
      if (Number.isFinite(numericScore)) {
        const clamped = Math.max(0, Math.min(100, numericScore));
        scores.set(item.id, clamped);
      }
    }
  }

  return { scores, usedGroq: !isOllama };
};
