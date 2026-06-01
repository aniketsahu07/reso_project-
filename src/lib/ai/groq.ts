import 'server-only';

type GroqProjectInput = {
  id: string;
  text: string;
};

type GroqScoreResponse = {
  id: string;
  score: number;
};

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
  if (!process.env.GROQ_API_KEY) {
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
    `USER: ${trimText(userSummary)}`,
    '',
    `PROJECTS: ${JSON.stringify(preparedProjects)}`
  ].join('\n');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: 'You must follow the output format strictly.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 600
    })
  });

  if (!response.ok) {
    return { scores: new Map<string, number>(), usedGroq: false };
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

  return { scores, usedGroq: true };
};
