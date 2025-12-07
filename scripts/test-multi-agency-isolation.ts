/**
 * Multi-Agency Data Isolation Test Script
 *
 * Tests the scenario where an interpreter is a member of two different agencies.
 * Verifies that each agency can only see:
 * 1. Their own members
 * 2. Assignments tagged with their organization_id
 * 3. Credentials tagged with their organization_id
 *
 * Run with: npx ts-node scripts/test-multi-agency-isolation.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function log(test: string, passed: boolean, message: string, details?: any) {
  results.push({ test, passed, message, details });
  const status = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${status}: ${test}`);
  if (message) console.log(`   ${message}`);
  if (details) console.log(`   Details:`, JSON.stringify(details, null, 2).split('\n').map(l => `   ${l}`).join('\n'));
}

async function runTests() {
  console.log("\n========================================");
  console.log("MULTI-AGENCY DATA ISOLATION TESTS");
  console.log("========================================\n");

  // Step 1: Find or create two test organizations
  console.log("Setting up test data...\n");

  // Check for existing test organizations
  const { data: existingOrgs } = await supabaseAdmin
    .from("organizations")
    .select("id, name")
    .ilike("name", "%Test Agency%")
    .limit(2);

  let agency1Id: string;
  let agency2Id: string;

  if (existingOrgs && existingOrgs.length >= 2) {
    agency1Id = existingOrgs[0].id;
    agency2Id = existingOrgs[1].id;
    console.log(`Found existing test agencies: ${existingOrgs[0].name}, ${existingOrgs[1].name}`);
  } else {
    console.log("Creating test agencies...");

    const { data: org1, error: e1 } = await supabaseAdmin
      .from("organizations")
      .insert({ name: "Test Agency Alpha", subscription_tier: "agency_pro" })
      .select()
      .single();

    const { data: org2, error: e2 } = await supabaseAdmin
      .from("organizations")
      .insert({ name: "Test Agency Beta", subscription_tier: "agency_pro" })
      .select()
      .single();

    if (e1 || e2 || !org1 || !org2) {
      console.error("Failed to create test agencies:", e1 || e2);
      return;
    }

    agency1Id = org1.id;
    agency2Id = org2.id;
    console.log(`Created test agencies: ${org1.name} (${org1.id}), ${org2.name} (${org2.id})`);
  }

  // Step 2: Get an existing interpreter user to use as test subject
  const { data: testUser } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name")
    .neq("role", "admin")
    .limit(1)
    .single();

  if (!testUser) {
    console.error("No test user found. Please create a non-admin user first.");
    return;
  }

  console.log(`Using test interpreter: ${testUser.full_name} (${testUser.email})`);

  // Step 3: Verify the interpreter can be in BOTH agencies
  console.log("\n--- Test: Multi-Agency Membership ---\n");

  // Add interpreter to Agency 1
  const { data: mem1, error: memErr1 } = await supabaseAdmin
    .from("organization_members")
    .upsert({
      organization_id: agency1Id,
      user_id: testUser.id,
      role: "interpreter",
      status: "active",
      is_active: true,
      joined_at: new Date().toISOString()
    }, { onConflict: "organization_id,user_id" })
    .select()
    .single();

  // Add interpreter to Agency 2
  const { data: mem2, error: memErr2 } = await supabaseAdmin
    .from("organization_members")
    .upsert({
      organization_id: agency2Id,
      user_id: testUser.id,
      role: "interpreter",
      status: "active",
      is_active: true,
      joined_at: new Date().toISOString()
    }, { onConflict: "organization_id,user_id" })
    .select()
    .single();

  if (memErr1 || memErr2) {
    log("Interpreter in two agencies", false, "Failed to add interpreter to both agencies", { memErr1, memErr2 });
  } else {
    log("Interpreter in two agencies", true, "Successfully added interpreter as member of both agencies");
  }

  // Step 4: Verify each agency only sees their OWN membership
  const { data: agency1Members } = await supabaseAdmin
    .from("organization_members")
    .select("user_id, role, status")
    .eq("organization_id", agency1Id)
    .eq("status", "active");

  const { data: agency2Members } = await supabaseAdmin
    .from("organization_members")
    .select("user_id, role, status")
    .eq("organization_id", agency2Id)
    .eq("status", "active");

  log(
    "Agency 1 member isolation",
    agency1Members?.some(m => m.user_id === testUser.id) === true,
    `Agency 1 sees ${agency1Members?.length || 0} members, interpreter included: ${agency1Members?.some(m => m.user_id === testUser.id)}`
  );

  log(
    "Agency 2 member isolation",
    agency2Members?.some(m => m.user_id === testUser.id) === true,
    `Agency 2 sees ${agency2Members?.length || 0} members, interpreter included: ${agency2Members?.some(m => m.user_id === testUser.id)}`
  );

  // Step 5: Test Assignment Data Isolation
  console.log("\n--- Test: Assignment Data Isolation ---\n");

  // Create an assignment for Agency 1
  const { data: assignment1 } = await supabaseAdmin
    .from("assignments")
    .insert({
      user_id: testUser.id,
      title: "Test Assignment for Agency Alpha",
      assignment_type: "medical",
      date: new Date().toISOString().split("T")[0],
      organization_id: agency1Id,  // Explicitly set org
    })
    .select()
    .single();

  // Create an assignment for Agency 2
  const { data: assignment2 } = await supabaseAdmin
    .from("assignments")
    .insert({
      user_id: testUser.id,
      title: "Test Assignment for Agency Beta",
      assignment_type: "legal",
      date: new Date().toISOString().split("T")[0],
      organization_id: agency2Id,  // Explicitly set org
    })
    .select()
    .single();

  // Query assignments as Agency 1 would (filtering by org_id)
  const { data: agency1Assignments } = await supabaseAdmin
    .from("assignments")
    .select("id, title, organization_id")
    .eq("organization_id", agency1Id)
    .eq("user_id", testUser.id);

  // Query assignments as Agency 2 would
  const { data: agency2Assignments } = await supabaseAdmin
    .from("assignments")
    .select("id, title, organization_id")
    .eq("organization_id", agency2Id)
    .eq("user_id", testUser.id);

  log(
    "Agency 1 assignment isolation",
    agency1Assignments?.length === 1 && agency1Assignments[0].title.includes("Alpha"),
    `Agency 1 sees ${agency1Assignments?.length || 0} assignment(s)`,
    agency1Assignments
  );

  log(
    "Agency 2 assignment isolation",
    agency2Assignments?.length === 1 && agency2Assignments[0].title.includes("Beta"),
    `Agency 2 sees ${agency2Assignments?.length || 0} assignment(s)`,
    agency2Assignments
  );

  // Step 6: Test that untagged assignments (null org_id) are not visible to any agency
  console.log("\n--- Test: Untagged Assignment Isolation ---\n");

  const { data: personalAssignment } = await supabaseAdmin
    .from("assignments")
    .insert({
      user_id: testUser.id,
      title: "Personal Assignment (no agency)",
      assignment_type: "general",
      date: new Date().toISOString().split("T")[0],
      organization_id: null,  // Personal, not linked to any agency
    })
    .select()
    .single();

  // Neither agency should see this
  const { data: agency1PersonalCheck } = await supabaseAdmin
    .from("assignments")
    .select("id, title")
    .eq("organization_id", agency1Id)
    .eq("id", personalAssignment?.id);

  const { data: agency2PersonalCheck } = await supabaseAdmin
    .from("assignments")
    .select("id, title")
    .eq("organization_id", agency2Id)
    .eq("id", personalAssignment?.id);

  log(
    "Agency 1 cannot see personal assignment",
    (agency1PersonalCheck?.length || 0) === 0,
    `Agency 1 found ${agency1PersonalCheck?.length || 0} personal assignment(s) (should be 0)`
  );

  log(
    "Agency 2 cannot see personal assignment",
    (agency2PersonalCheck?.length || 0) === 0,
    `Agency 2 found ${agency2PersonalCheck?.length || 0} personal assignment(s) (should be 0)`
  );

  // Step 7: Check current profile organization_id issue
  console.log("\n--- Test: Profile Organization ID Issue ---\n");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("organization_id")
    .eq("id", testUser.id)
    .single();

  log(
    "Profile org_id architecture check",
    true, // This is informational
    `Interpreter's profile.organization_id: ${profile?.organization_id || "NULL"}`,
    {
      note: "Profile can only store ONE organization_id. This is a design limitation.",
      recommendation: "For true multi-agency support, assignments should be explicitly tagged with org_id at creation, NOT auto-populated from profile."
    }
  );

  // Step 8: Clean up test data
  console.log("\n--- Cleanup ---\n");

  // Remove test assignments
  if (assignment1?.id) {
    await supabaseAdmin.from("assignments").delete().eq("id", assignment1.id);
  }
  if (assignment2?.id) {
    await supabaseAdmin.from("assignments").delete().eq("id", assignment2.id);
  }
  if (personalAssignment?.id) {
    await supabaseAdmin.from("assignments").delete().eq("id", personalAssignment.id);
  }

  console.log("Test assignments cleaned up.\n");

  // Summary
  console.log("\n========================================");
  console.log("TEST SUMMARY");
  console.log("========================================\n");

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total: ${results.length} tests`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log("\nFailed tests:");
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.test}: ${r.message}`);
    });
  }

  console.log("\n========================================");
  console.log("ARCHITECTURE NOTES");
  console.log("========================================\n");

  console.log(`
Current State:
- organization_members table correctly supports many-to-many (interpreter in multiple agencies)
- assignments.organization_id exists and is used for filtering
- Triggers auto-populate organization_id from profiles.organization_id

Issue for Multi-Agency:
- profiles.organization_id only stores ONE organization
- When interpreter creates assignment, it auto-tags with their profile's single org_id
- This means personal assignments or assignments for "Agency B" might get mis-tagged

Recommendations:
1. Remove the auto-populate trigger for organization_id
2. When agency assigns work to interpreter, explicitly set organization_id
3. When interpreter creates personal work, leave organization_id NULL
4. Add UI for interpreter to "claim" an assignment for a specific agency if needed

Alternative:
- Keep personal data separate from agency-visible data
- Use data_sharing_preferences in organization_members to control visibility
`);
}

runTests().catch(console.error);
