/**
 * Reload Supabase PostgREST Schema Cache
 *
 * This script sends a NOTIFY command to PostgreSQL to reload the PostgREST schema cache.
 * Run this after applying migrations to ensure the API knows about schema changes.
 *
 * Usage: npx tsx scripts/reload-schema.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function reloadSchema() {
  console.log('🔄 Reloading Supabase schema cache...\n');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing SUPABASE environment variables');
    console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Send NOTIFY command to reload schema
    const { error } = await supabase.rpc('notify', {
      channel: 'pgrst',
      payload: 'reload schema'
    });

    if (error) {
      // If the RPC doesn't exist, try direct SQL
      console.log('ℹ️  RPC method not available, trying direct SQL notification...\n');

      const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql: "NOTIFY pgrst, 'reload schema'"
      });

      if (sqlError) {
        console.log('⚠️  Direct notification also not available.');
        console.log('   This is normal for hosted Supabase projects.\n');
        console.log('💡 Solution: Go to your Supabase dashboard and restart the project:');
        console.log('   1. Visit https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0]);
        console.log('   2. Click "Settings" → "General"');
        console.log('   3. Click "Pause project" then "Resume project"');
        console.log('   4. Wait 1-2 minutes for the project to fully restart\n');
        return;
      }
    }

    console.log('✅ Schema cache reload command sent successfully!\n');
    console.log('   The API should now recognize all table columns and structures.');
    console.log('   If you still see errors, wait 10-30 seconds for the cache to fully reload.\n');

  } catch (err: any) {
    console.error('❌ Error reloading schema:', err.message);
    console.log('\n💡 Manual solution:');
    console.log('   Go to your Supabase dashboard and restart your project to reload the schema cache.\n');
    process.exit(1);
  }
}

reloadSchema();
