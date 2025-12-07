import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('Applying team assignments migration...');

  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250130_team_assignments.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Migration error:', error);
      process.exit(1);
    }

    console.log('✓ Migration applied successfully!');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

applyMigration();
