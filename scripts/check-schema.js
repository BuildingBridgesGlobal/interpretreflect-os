// Check skill_modules schema
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('Checking skill_modules schema...');

  // Get one row to see what columns exist
  const { data, error } = await supabase
    .from('skill_modules')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns in skill_modules:');
    console.log(Object.keys(data[0]).sort().join('\n'));
  } else {
    console.log('Table is empty');
  }
}

main().catch(console.error);
