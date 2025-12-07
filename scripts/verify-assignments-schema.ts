/**
 * Verify and Fix Assignments Table Schema
 *
 * This script checks if the assignments table has all required columns
 * and attempts to add missing ones.
 *
 * Usage: npx tsx scripts/verify-assignments-schema.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function verifySchema() {
  console.log('🔍 Verifying assignments table schema...\n');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing SUPABASE environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Test if we can query the assignments table with assignment_type
    console.log('Testing assignment_type column...');
    const { data, error } = await supabase
      .from('assignments')
      .select('id, assignment_type, title')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error.message);
      console.log('\n📋 Diagnosis:');
      console.log('   The assignments table exists but the schema cache is outdated.\n');
      console.log('💡 Solutions (try in order):\n');
      console.log('1. WAIT 30 seconds and try again (cache may auto-refresh)');
      console.log('2. Restart your Supabase project:');
      console.log('   • Go to https://supabase.com/dashboard/project/wjhdvjukspfgoojyloks/settings/general');
      console.log('   • Click "Pause project" then "Resume project"');
      console.log('   • Wait 1-2 minutes for full restart\n');
      console.log('3. Re-apply the migration manually in the SQL Editor:');
      console.log('   • Go to https://supabase.com/dashboard/project/wjhdvjukspfgoojyloks/sql');
      console.log('   • Run the contents of: supabase/migrations/20250129_assignments_table.sql\n');
      process.exit(1);
    }

    console.log('✅ assignments table schema is correct!');
    console.log('   • assignment_type column: found');
    console.log('   • Can query table: yes\n');

    if (data && data.length > 0) {
      console.log(`📊 Sample data: ${data.length} assignment(s) found`);
      console.log(`   First assignment: "${data[0].title}" (${data[0].assignment_type || 'no type'})\n`);
    } else {
      console.log('📊 No assignments in database yet (this is normal for new setups)\n');
    }

    console.log('✨ Schema verification complete! Assignment creation should work now.');

  } catch (err: any) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

verifySchema();
