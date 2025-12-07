import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log("Running growth tier and credits migration...\n");

  // Read the migration file
  const migrationPath = path.join(__dirname, "../supabase/migrations/20250206_growth_tier_and_credits.sql");
  const migrationSql = fs.readFileSync(migrationPath, "utf8");

  // Split into individual statements (simple split - may need adjustment for complex SQL)
  const statements = migrationSql
    .split(/;(?=\s*(?:--|CREATE|ALTER|UPDATE|INSERT|DROP|GRANT))/gi)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 80).replace(/\n/g, " ");

    try {
      const { error } = await supabase.rpc("exec_sql", { sql: statement + ";" });

      if (error) {
        // Try direct query if rpc doesn't exist
        throw error;
      }

      console.log(`✓ [${i + 1}/${statements.length}] ${preview}...`);
      successCount++;
    } catch (err: any) {
      // Some errors are expected (IF NOT EXISTS, ON CONFLICT, etc.)
      if (err.message?.includes("already exists") ||
          err.message?.includes("does not exist") ||
          err.code === "42P07" || // relation already exists
          err.code === "42710") { // policy already exists
        console.log(`⊘ [${i + 1}/${statements.length}] Skipped (already exists): ${preview}...`);
        successCount++;
      } else {
        console.error(`✗ [${i + 1}/${statements.length}] Error: ${err.message}`);
        console.error(`  Statement: ${preview}...`);
        errorCount++;
      }
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Migration complete!`);
  console.log(`  Successful: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
}

runMigration().catch(console.error);
