import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  console.log("Checking test3@gmail.com...\n");

  // Check profile
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, organization_id")
    .eq("email", "test3@gmail.com")
    .single();

  console.log("1. Profile lookup:");
  if (profileErr) {
    console.log("   Error:", profileErr.message);
    return;
  }
  console.log("   ID:", profile.id);
  console.log("   Email:", profile.email);
  console.log("   Name:", profile.full_name);
  console.log("   Role:", profile.role);
  console.log("   Org ID:", profile.organization_id);

  // Check organization membership
  console.log("\n2. Organization memberships:");
  const { data: memberships, error: memErr } = await supabase
    .from("organization_members")
    .select(`
      id,
      organization_id,
      role,
      status,
      is_active,
      organizations (id, name)
    `)
    .eq("user_id", profile.id);

  if (memErr) {
    console.log("   Error:", memErr.message);
  } else if (!memberships || memberships.length === 0) {
    console.log("   NO MEMBERSHIPS FOUND - This is likely the issue!");
    console.log("   User needs to be added to an organization with admin/owner/manager role");
  } else {
    memberships.forEach((m: any, i: number) => {
      console.log(`   [${i + 1}] Org: ${m.organizations?.name || m.organization_id}`);
      console.log(`       Role: ${m.role}`);
      console.log(`       Status: ${m.status}`);
      console.log(`       Active: ${m.is_active}`);
    });

    // Check if any membership has admin role
    const adminMembership = memberships.find(
      (m: any) => ["admin", "owner", "manager"].includes(m.role) && m.is_active && m.status === "active"
    );

    if (!adminMembership) {
      console.log("\n   WARNING: No active admin/owner/manager membership found!");
      console.log("   User needs admin/owner/manager role to access agency dashboard");
    }
  }

  // Check auth user
  console.log("\n3. Auth user check:");
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
  const authUser = users?.find((u: any) => u.email === "test3@gmail.com");

  if (authErr) {
    console.log("   Error:", authErr.message);
  } else if (!authUser) {
    console.log("   NO AUTH USER FOUND - User may need to sign up first");
  } else {
    console.log("   Auth ID:", authUser.id);
    console.log("   Email confirmed:", authUser.email_confirmed_at ? "Yes" : "No");
    console.log("   Last sign in:", authUser.last_sign_in_at || "Never");
  }
}

check().catch(console.error);
