/**
 * Seed script to create a test user with sample InterpreterOS data
 *
 * Usage:
 * npx tsx scripts/seed-test-user.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Test user credentials
const TEST_USER_EMAIL = "test@interpretreflect.com";
const TEST_USER_PASSWORD = "TestDemo2025!";

async function main() {
  console.log("🌱 Seeding test user data for InterpretReflect demo\n");

  // 1. Create or find test user
  console.log(`📧 Looking for test user: ${TEST_USER_EMAIL}`);

  let userId: string;

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error("Error listing users:", listError);
    return;
  }

  const existingUser = users?.find(u => u.email === TEST_USER_EMAIL);

  if (existingUser) {
    userId = existingUser.id;
    console.log(`✅ Found existing test user: ${userId}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      email_confirm: true,
    });

    if (error || !data.user) {
      console.error("❌ Error creating test user:", error);
      return;
    }

    userId = data.user.id;
    console.log(`✅ Created new test user: ${userId}`);
  }

  // 2. Update profile with demo data
  console.log("\n👤 Updating user profile...");
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      email: TEST_USER_EMAIL,
      full_name: "Demo Interpreter",
      subscription_tier: "pro",
      subscription_status: "active",
      roles: ["Medical", "Legal", "Community"],
      years_experience: "3-5 years",
      settings: ["Medical Clinic", "Hospital", "VRS", "Community Events"],
      typical_workload: "15-20 hours per week",
      current_challenges: ["Burnout risk", "Skill development", "Work-life balance"],
      primary_goal: "growth",
      weekly_summary_opt_in: true,
    });

  if (profileError) {
    console.error("❌ Error updating profile:", profileError);
  } else {
    console.log("✅ Profile updated");
  }

  // 3. Get skill IDs
  console.log("\n📚 Fetching ECCI skills...");
  const { data: skills, error: skillsError } = await supabase
    .from("skills")
    .select("*");

  if (skillsError || !skills) {
    console.error("❌ Error fetching skills:", skillsError);
    return;
  }

  console.log(`✅ Found ${skills.length} skills`);

  // 4. Create skill assessments (recent growth pattern)
  console.log("\n📊 Creating skill assessments...");

  const skillsToAssess = [
    { name: "Message Accuracy", levels: [72, 75, 78, 82, 85] },
    { name: "Register Shifting", levels: [65, 68, 72, 75, 78] },
    { name: "Terminology Management", levels: [70, 73, 76, 80, 83] },
    { name: "Cultural Mediation", levels: [68, 71, 74, 77, 80] },
    { name: "Multitasking Capacity", levels: [62, 65, 68, 71, 74] },
    { name: "Decision Making", levels: [70, 72, 75, 78, 81] },
    { name: "Professional Boundaries", levels: [80, 82, 84, 86, 88] },
  ];

  for (const { name, levels } of skillsToAssess) {
    const skill = skills.find(s => s.name === name);
    if (!skill) continue;

    // Create 5 assessments over the past 60 days showing growth
    for (let i = 0; i < levels.length; i++) {
      const daysAgo = 60 - (i * 12); // Spread over 60 days
      const { error } = await supabase.from("skill_assessments").insert({
        user_id: userId,
        skill_id: skill.id,
        level: levels[i],
        assessment_type: i === levels.length - 1 ? "debrief" : "training",
        created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (error) console.error(`  ❌ Error adding ${name} assessment:`, error.message);
    }
  }

  console.log("✅ Skill assessments created");

  // 5. Create skill goals
  console.log("\n🎯 Creating skill goals...");

  const goalsData = [
    { name: "Register Shifting", current: 78, target: 90 },
    { name: "Multitasking Capacity", current: 74, target: 85 },
    { name: "Cultural Mediation", current: 80, target: 90 },
  ];

  for (const { name, current, target } of goalsData) {
    const skill = skills.find(s => s.name === name);
    if (!skill) continue;

    const { error } = await supabase.from("skill_goals").insert({
      user_id: userId,
      skill_id: skill.id,
      current_level: current,
      target_level: target,
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
    });

    if (error) console.error(`  ❌ Error adding ${name} goal:`, error.message);
  }

  console.log("✅ Skill goals created");

  // 6. Create debriefs (recent interpreting sessions)
  console.log("\n📝 Creating assignment debriefs...");

  const debriefs = [
    {
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignment_type: "Medical",
      setting: "Hospital ER",
      headline: "Strong terminology management in high-pressure environment",
      full_analysis: "You demonstrated excellent medical terminology recall during a complex trauma case. Your register shifting adapted well to both medical staff and patient family. Continue building on this strength while managing cognitive load in emergency settings.",
      performance_score: 85,
    },
    {
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignment_type: "Legal",
      setting: "Family Court",
      headline: "Effective cultural mediation with emerging confidence in legal register",
      full_analysis: "Your cultural navigation skills were evident throughout this custody hearing. You successfully bridged cultural communication styles while maintaining legal accuracy. Notice how your decision-making improved in the second half - trust that growing instinct.",
      performance_score: 82,
    },
    {
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignment_type: "Community",
      setting: "Religious Service",
      headline: "Excellent message accuracy with strong community knowledge foundation",
      full_analysis: "Your deep community knowledge allowed you to convey cultural nuances effectively. The congregation feedback was overwhelmingly positive. This assignment showcased your strength in balancing fidelity to source and cultural equivalence.",
      performance_score: 88,
    },
    {
      date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignment_type: "Medical",
      setting: "Cardiology Clinic",
      headline: "Solid terminology management with growing multitasking confidence",
      full_analysis: "You handled complex cardiology terminology well while managing multiple speakers. Notice the improvement in your ability to process technical information quickly. The moments of hesitation were natural - you're building muscle memory in this domain.",
      performance_score: 80,
    },
    {
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignment_type: "VRS",
      setting: "VRS Call Center",
      headline: "Strong decision-making under time pressure",
      full_analysis: "Your quick thinking during technical difficulties demonstrated mature professional judgment. You maintained clear boundaries while ensuring communication continued. This is evidence of your growth in crisis management.",
      performance_score: 83,
    },
  ];

  for (const debriefData of debriefs) {
    const { data: debrief, error } = await supabase
      .from("debriefs")
      .insert({
        user_id: userId,
        ...debriefData,
      })
      .select()
      .single();

    if (error) {
      console.error("  ❌ Error adding debrief:", error.message);
      continue;
    }

    // Add performance flags
    const isRecent = debriefData === debriefs[0];

    await supabase.from("performance_flags").insert([
      {
        debrief_id: debrief.id,
        flag_type: "strength",
        description: isRecent
          ? "Medical terminology recall in high-pressure environment"
          : "Strong community knowledge and cultural navigation",
      },
      {
        debrief_id: debrief.id,
        flag_type: "development",
        description: isRecent
          ? "Continue building cognitive load management in emergency settings"
          : "Building confidence with legal register in formal settings",
      },
    ]);
  }

  console.log("✅ Debriefs and performance flags created");

  // 7. Create milestones
  console.log("\n🏆 Creating milestones...");

  await supabase.from("milestones").insert([
    {
      user_id: userId,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      label: "First ER trauma case",
      type: "first",
      description: "Successfully interpreted your first emergency room trauma case",
    },
    {
      user_id: userId,
      date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      label: "Message accuracy breakthrough",
      type: "breakthrough",
      description: "Achieved consistent 85%+ accuracy across all assignment types",
    },
  ]);

  console.log("✅ Milestones created");

  // Done!
  console.log("\n\n✨ Test user seeding complete!\n");
  console.log("📧 Email:    " + TEST_USER_EMAIL);
  console.log("🔑 Password: " + TEST_USER_PASSWORD);
  console.log("🆔 User ID:  " + userId);
  console.log("\n👉 You can now sign in at http://localhost:3000/signin\n");
}

main().catch(console.error);
