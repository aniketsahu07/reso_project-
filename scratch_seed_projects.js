const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const fileContent = fs.readFileSync(envPath, 'utf8');
  fileContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const index = trimmed.indexOf('=');
    if (index !== -1) {
      const key = trimmed.slice(0, index).trim();
      const val = trimmed.slice(index + 1).trim();
      process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const FOUNDER_ID = 'e666a537-e056-4dbd-9bf5-b8a6f6553514'; // Sarthak Agarwal

const mockProjects = [
  {
    title: "Decentralized Freelance Marketplace",
    type: "Web App",
    description: "A premium decentralized freelance platform built on Next.js, Tailwind CSS, and Supabase for real-time secure messaging and payment tracking. Features include automated escrow payments and smart contract integrations.",
    commitment: "12 hrs/wk",
    team_size: "3/5",
    stage: "Building",
    status: "Open",
    skills: ["Next.js", "Supabase", "React", "TypeScript", "SQL", "HTML", "CSS"]
  },
  {
    title: "AI-Powered Patient Diagnostic Assistant",
    type: "AI/ML",
    description: "An advanced machine learning framework that analyzes clinical notes and medical records to recommend diagnoses. Built using Python, Groq LLM API, and Next.js frontend.",
    commitment: "15 hrs/wk",
    team_size: "1/4",
    stage: "Idea Stage",
    status: "Open",
    skills: ["Python", "Next.js", "Java", "JavaScript", "SQL"]
  },
  {
    title: "Mobile Crypto Wallet & Tracker",
    type: "Mobile App",
    description: "A beautiful, premium cross-platform mobile wallet built using React Native and TypeScript, with a robust backend using Node.js and SQL.",
    commitment: "10 hrs/wk",
    team_size: "2/4",
    stage: "Prototyping",
    status: "Open",
    skills: ["React Native", "TypeScript", "Node.js", "SQL", "UI/UX Design"]
  }
];

async function main() {
  console.log("Seeding mock projects into database...");

  for (const proj of mockProjects) {
    const { skills, ...projectData } = proj;
    
    // Check if project with the same title already exists
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('title', proj.title)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`Project "${proj.title}" already exists. Skipping.`);
      continue;
    }

    const { data: insertedProject, error: projError } = await supabase
      .from('projects')
      .insert({
        founder_id: FOUNDER_ID,
        ...projectData
      })
      .select()
      .single();

    if (projError) {
      console.error(`Error inserting project "${proj.title}":`, projError.message);
      continue;
    }

    console.log(`Inserted Project: ${insertedProject.title} (ID: ${insertedProject.id})`);

    const skillRecords = skills.map(skill => ({
      project_id: insertedProject.id,
      skill_name: skill,
      is_required: true
    }));

    const { error: skillError } = await supabase
      .from('project_skills')
      .insert(skillRecords);

    if (skillError) {
      console.error(`Error inserting skills for project "${proj.title}":`, skillError.message);
    } else {
      console.log(`Successfully registered skills for "${proj.title}"`);
    }
  }

  console.log("Seeding completed successfully!");
}

main();
