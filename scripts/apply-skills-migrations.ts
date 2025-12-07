import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration(filename: string) {
  console.log(`\nApplying migration: ${filename}`);

  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', filename);

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    return false;
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    // Split SQL by statement and execute each one
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await (supabase as any).rpc('exec', { sql: statement + ';' });
        if (error) {
          console.error(`❌ Error executing statement:`, error);
          console.error('Statement:', statement.substring(0, 200));
          return false;
        }
      }
    }

    console.log(`✅ Successfully applied ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Error applying ${filename}:`, error);
    return false;
  }
}

async function main() {
  console.log('Starting skills module system migrations...\n');

  const migrations = [
    '20250130_skills_module_system.sql',
    '20250130_seed_module_1_1.sql'
  ];

  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (!success) {
      console.error('\n❌ Migration failed. Stopping.');
      console.error('\nPlease apply the migrations manually using the Supabase dashboard SQL editor.');
      console.error('Migrations are located in: supabase/migrations/');
      process.exit(1);
    }
  }

  console.log('\n✅ All migrations applied successfully!');
}

main();
