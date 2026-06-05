import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export const runtime = 'nodejs';

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const extractJsonArray = (text: string) => {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) {
    console.error("Failed to find JSON array bounds in content. Length:", text.length, "Content preview:", text.slice(0, 100));
    return null;
  }

  const rawJson = text.slice(start, end + 1);
  try {
    const parsed = JSON.parse(rawJson);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err: any) {
    console.error("JSON.parse error:", err.message, "Raw slice of JSON:", rawJson);
    return null;
  }
};

export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed. Please make a POST request with the required payload.' },
    { status: 405 }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const projectId = body?.projectId;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured on the server.' }, { status: 500 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch project details (including founder_id)
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, title, type, description, stage, founder_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 2. Fetch accepted team members from applications
    const { data: apps } = await supabaseAdmin
      .from('applications')
      .select('applicant_id')
      .eq('project_id', projectId)
      .eq('status', 'Accepted');

    const teamUserIds = [project.founder_id];
    if (apps) {
      apps.forEach((app: any) => {
        if (app.applicant_id) teamUserIds.push(app.applicant_id);
      });
    }

    // 3. Fetch user profiles and skills for all team members
    const { data: teamProfiles } = await supabaseAdmin
      .from('users')
      .select('id, full_name')
      .in('id', teamUserIds);

    const { data: teamSkills } = await supabaseAdmin
      .from('user_skills')
      .select('user_id, skill_name')
      .in('user_id', teamUserIds);

    const teamMembersList = (teamProfiles || []).map((profile: any) => {
      const skills = (teamSkills || [])
        .filter((s: any) => s.user_id === profile.id)
        .map((s: any) => s.skill_name);
      return {
        name: profile.full_name,
        role: profile.id === project.founder_id ? 'Founder' : 'Contributor',
        skills
      };
    });

    const teamContext = teamMembersList.map(member => 
      `- ${member.name} (${member.role}) | Skills: ${member.skills.join(', ') || 'No skills listed yet'}`
    ).join('\n');

    // 4. Fetch project skills
    const { data: skillsData, error: skillsError } = await supabaseAdmin
      .from('project_skills')
      .select('skill_name')
      .eq('project_id', projectId);

    if (skillsError) {
      return NextResponse.json({ error: skillsError.message }, { status: 500 });
    }

    const skills = (skillsData || []).map((s) => s.skill_name);

    // 5. Construct prompt for Groq Llama 3.1
    const prompt = [
      'You are a senior engineering manager and technology architect.',
      `Create a highly tailored 4-week development roadmap/timeline for the student project: "${project.title}".`,
      `Project Type: ${project.type}`,
      `Current Development Stage: ${project.stage}`,
      `Description: ${project.description}`,
      skills.length > 0 ? `Required Technologies/Skills: ${skills.join(', ')}` : '',
      '',
      '--- ACTIVE TEAM ROSTER (MEMBERS & THEIR SKILLS) ---',
      teamContext,
      '',
      'Your task is to break down this project into 4 progressive, actionable weekly milestones (Week 1, Week 2, Week 3, and Week 4) that the team can execute.',
      'CRITICAL ALLOCATION RULE: You MUST explicitly allocate weekly tasks to the active team members listed above BY NAME inside the weekly description based on their matching skills.',
      'Assign relevant, specific tasks to EVERY team member so that they are engaged in the sprint.',
      'Example of team task allocation in description:',
      '"Set up Next.js repository and schemas. Aniket Sahu (Founder) will handle the backend database schemas in Supabase, while Sarthak Agarwal (Contributor) designs the initial React components using HTML/CSS."',
      '',
      'Output MUST be a valid JSON array of exactly 4 objects corresponding to the weeks.',
      'Each object must contain EXACTLY two fields:',
      '- "title": A short, impactful title starting with the week number (e.g., "Week 1: Architecture & Schema Setup")',
      '- "description": A clear, detailed description explaining exactly what core components the team will build and test, including specific team member task assignments.',
      '',
      'Strict Output Rule: Return ONLY the raw JSON array. Do not wrap in markdown ```json blocks, do not write introduction or conversational text.',
      'Example output:',
      '[',
      '  {"title": "Week 1: Repository Architecture & Database Schema", "description": "Set up the Next.js workspace and configure Supabase schemas. Establish the relational tables and test basic query connections."},',
      '  ...',
      ']'
    ].join('\n');

    // 6. Request Llama 3.1 score/generation from Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are a precise JSON generator. Output ONLY a valid JSON array and nothing else.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const details = await response.text();
      return NextResponse.json({ error: `Groq AI generation failed: ${details}` }, { status: 500 });
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content ?? '';
    console.log('AI RAW CONTENT FROM GROQ:', content);
    
    const parsedRoadmap = extractJsonArray(content);

    if (!parsedRoadmap || parsedRoadmap.length === 0) {
      return NextResponse.json({ error: 'AI returned an invalid response structure. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ roadmap: parsedRoadmap });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
