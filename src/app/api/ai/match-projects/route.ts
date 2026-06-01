import { NextResponse } from 'next/server';

import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { buildProjectText, buildUserProfileText } from '../../../../lib/ai/embeddings';
import { scoreProjectsWithGroq } from '../../../../lib/ai/groq';

export const runtime = 'nodejs';

const clampScore = (value: number) => Math.max(0, Math.min(1, value));
const clampPercent = (value: number) => Math.max(0, Math.min(100, value));
const MAX_CANDIDATES = 25;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body?.userId;
    const limit = Number(body?.limit || 6);

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, bio, degree, university, graduation_year')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: skillsData, error: skillsError } = await supabaseAdmin
      .from('user_skills')
      .select('skill_name')
      .eq('user_id', userId);

    if (skillsError) {
      return NextResponse.json({ error: skillsError.message }, { status: 500 });
    }

    const userSkills = (skillsData || []).map((skill) => skill.skill_name);
    if (userSkills.length === 0) {
      return NextResponse.json({ projects: [] });
    }

    const { data: projectsData, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select(
        `
        id, title, type, description, commitment, team_size, stage, status,
        users!founder_id ( full_name, avatar_url ),
        project_skills ( skill_name )
        `
      )
      .eq('status', 'Open')
      .order('created_at', { ascending: false })
      .limit(50);

    if (projectsError) {
      return NextResponse.json({ error: projectsError.message }, { status: 500 });
    }

    const userSkillSet = new Set(userSkills.map((skill) => skill.toLowerCase()));
    const candidates = (projectsData || []).map((project) => {
      const projectSkills = (project.project_skills || []).map((skill: any) => skill.skill_name);
      const matchedSkills = projectSkills.filter((skill: string) => userSkillSet.has(skill.toLowerCase()));
      const baseScore = projectSkills.length > 0 ? matchedSkills.length / projectSkills.length : 0;

      return {
        project,
        projectSkills,
        matchedSkills,
        baseScore
      };
    });

    const rankedCandidates = candidates
      .sort((a, b) => b.baseScore - a.baseScore)
      .slice(0, MAX_CANDIDATES);

    const userSummary = buildUserProfileText(user, userSkills);
    const groqInput = rankedCandidates.map((candidate) => ({
      id: candidate.project.id,
      text: buildProjectText(candidate.project, candidate.projectSkills)
    }));

    const { scores: groqScores } = await scoreProjectsWithGroq(userSummary, groqInput);

    const scoredProjects = rankedCandidates
      .map((candidate) => {
        const groqScore = groqScores.get(candidate.project.id);
        const fallbackScore = Math.round(candidate.baseScore * 100);
        const percentScore = clampPercent(typeof groqScore === 'number' ? groqScore : fallbackScore);

        return {
          ...candidate.project,
          score: clampScore(percentScore / 100),
          matched_skills: candidate.matchedSkills
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return NextResponse.json({ projects: scoredProjects });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
