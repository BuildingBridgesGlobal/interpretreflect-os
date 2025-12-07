import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debug() {
  console.log("Debugging agency login for test3@gmail.com...\n");

  // Get user ID from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", "test3@gmail.com")
    .single();

  if (!profile) {
    console.log("ERROR: Profile not found");
    return;
  }

  const userId = profile.id;
  console.log("User ID:", userId);

  // Replicate the EXACT query from the API
  console.log("\nReplicating API membership query...");
  const { data: membership, error: memberError } = await supabase
    .from("organization_members")
    .select(`
      organization_id,
      role,
      is_active,
      status,
      organizations (
        id,
        name,
        subscription_tier,
        settings
      )
    `)
    .eq("user_id", userId)
    .eq("is_active", true)
    .in("role", ["admin", "owner", "manager"])
    .single();

  console.log("Query result:");
  if (memberError) {
    console.log("  ERROR:", memberError.message);
    console.log("  Code:", memberError.code);
    console.log("  Details:", memberError.details);
  } else {
    console.log("  SUCCESS:", JSON.stringify(membership, null, 2));
  }

  // Check raw membership without filters
  console.log("\nRaw membership data (no filters):");
  const { data: rawMembership } = await supabase
    .from("organization_members")
    .select("*")
    .eq("user_id", userId);

  console.log(JSON.stringify(rawMembership, null, 2));

  // Check if organization exists
  if (rawMembership && rawMembership.length > 0) {
    console.log("\nOrganization check:");
    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", rawMembership[0].organization_id)
      .single();

    console.log(JSON.stringify(org, null, 2));
  }
}

debug().catch(console.error);
