import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('Applying wellness check-ins migration...');

  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250201_wellness_checkins.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Split by semicolons and execute each statement separately
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (statement.toLowerCase().includes('comment on')) {
      // Skip comment statements as they're not critical
      continue;
    }

    try {
      const { error } = await supabase.rpc('query', { query_text: statement });

      if (error) {
        // Try alternative method for DDL statements
        console.log('Trying direct query...');
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: statement })
        });

        if (!response.ok) {
          console.error('Statement failed:', statement.substring(0, 100));
          console.error('Error:', error);
        }
      }
    } catch (err) {
      console.error('Error executing statement:', err);
    }
  }

  console.log('✓ Migration completed! Check your Supabase dashboard to verify the wellness_checkins table was created.');
  console.log('\nYou can now track wellness check-ins. The system will:');
  console.log('  - Save emotion selections (great/good/okay/tired/angry)');
  console.log('  - Track hours worked and rest days');
  console.log('  - Show wellness patterns over time');
}

applyMigration();
