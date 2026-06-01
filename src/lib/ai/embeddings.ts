import 'server-only';

const DEFAULT_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
const MAX_INPUT_CHARS = 4000;

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

export const buildUserProfileText = (
  user: { bio?: string | null; degree?: string | null; university?: string | null; graduation_year?: number | string | null },
  skills: string[]
) => {
  const parts = [
    skills.length > 0 ? `Skills: ${skills.join(', ')}` : null,
    user.bio ? `Bio: ${user.bio}` : null,
    user.degree ? `Degree: ${user.degree}` : null,
    user.university ? `University: ${user.university}` : null,
    user.graduation_year ? `Graduation year: ${user.graduation_year}` : null
  ].filter(Boolean) as string[];

  return normalizeText(parts.join('\n'));
};

export const buildProjectText = (
  project: { title?: string | null; type?: string | null; stage?: string | null; description?: string | null },
  skills: string[]
) => {
  const parts = [
    project.title ? `Title: ${project.title}` : null,
    project.type ? `Type: ${project.type}` : null,
    project.stage ? `Stage: ${project.stage}` : null,
    project.description ? `Description: ${project.description}` : null,
    skills.length > 0 ? `Skills: ${skills.join(', ')}` : null
  ].filter(Boolean) as string[];

  return normalizeText(parts.join('\n'));
};

export const getEmbedding = async (input: string) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  const trimmed = normalizeText(input).slice(0, MAX_INPUT_CHARS);

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      input: trimmed
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Embedding request failed: ${response.status} ${details}`);
  }

  const payload = await response.json();
  return payload?.data?.[0]?.embedding as number[];
};
