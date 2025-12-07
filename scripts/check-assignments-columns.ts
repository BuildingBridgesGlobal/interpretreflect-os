/**
 * Check what columns exist in the assignments table
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkColumns() {
  console.log('🔍 Checking assignments table structure...\n');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Try to select all columns from one row to see what exists
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying assignments table:', error.message);
      process.exit(1);
    }

    if (data && data.length > 0) {
      console.log('✅ Found assignments table with these columns:');
      console.log('─'.repeat(50));
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        const value = data[0][col];
        const type = value === null ? 'NULL' : typeof value;
        console.log(`  • ${col.padEnd(25)} (${type})`);
      });
      console.log('─'.repeat(50));
      console.log(`\n📊 Total columns: ${columns.length}\n`);
    } else {
      console.log('⚠️  assignments table exists but has no data');
      console.log('   Cannot determine current schema without sample data.\n');
      console.log('   Trying to query table structure directly...\n');

      // Alternative: try querying with specific expected columns
      const testColumns = [
        'id', 'user_id', 'title', 'assignment_type', 'setting',
        'date', 'time', 'location', 'duration_minutes', 'description',
        'prep_status', 'completed', 'created_at', 'updated_at'
      ];

      console.log('Testing for expected columns:');
      for (const col of testColumns) {
        const { error } = await supabase
          .from('assignments')
          .select(col)
          .limit(0);

        if (error) {
          console.log(`  ✗ ${col.padEnd(25)} MISSING`);
        } else {
          console.log(`  ✓ ${col.padEnd(25)} exists`);
        }
      }
    }

  } catch (err: any) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

checkColumns();
