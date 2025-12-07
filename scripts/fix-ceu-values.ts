import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wjhdvjukspfgoojyloks.supabase.co";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaGR2anVrc3BmZ29vanlsb2tzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIyMzAzNSwiZXhwIjoyMDc5Nzk5MDM1fQ.ABHJ3r9ahUS-HB0M8ojjrludAvLnZkHD52-YZtjYWtE";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fixCeuValues() {
  console.log("Fixing CEU values to clean numbers...\n");

  // Update modules to clean 0.05 CEU values
  // Actual titles from database:
  // - Your Window of Tolerance
  // - Understanding Your Nervous System
  // - Co-Regulation in Interpreting
  // - Grounding Techniques for Interpreters
  // - Recovery Between Assignments
  // - Building Nervous System Resilience
  const moduleUpdates = [
    { pattern: "%Window of Tolerance%", ceu: 0.05 },
    { pattern: "%Understanding Your Nervous System%", ceu: 0.05 },
    { pattern: "%Co-Regulation%", ceu: 0.05 },
    { pattern: "%Grounding Techniques%", ceu: 0.05 },
    { pattern: "%Recovery Between Assignments%", ceu: 0.05 },
    { pattern: "%Building Nervous System Resilience%", ceu: 0.05 },
  ];

  for (const update of moduleUpdates) {
    const { data, error } = await supabase
      .from("skill_modules")
      .update({ ceu_value: update.ceu })
      .ilike("title", update.pattern)
      .select("id, title, ceu_value");

    if (error) {
      console.error(`Error updating ${update.pattern}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`Updated "${data[0].title}" to ${update.ceu} CEU`);
    } else {
      console.log(`No match found for pattern: ${update.pattern}`);
    }
  }

  // Update series total (6 modules × 0.05 = 0.30 CEU)
  // Also try alternate name patterns
  let seriesData: any = null;
  let seriesError: any = null;

  const seriesPatterns = [
    "%Nervous System Mastery%",
    "%Nervous System%",
    "%NSM%"
  ];

  for (const pattern of seriesPatterns) {
    const result = await supabase
      .from("skill_series")
      .update({ total_ceu_value: 0.30 })
      .ilike("title", pattern)
      .select("id, title, total_ceu_value");

    if (result.data && result.data.length > 0) {
      seriesData = result.data;
      seriesError = result.error;
      break;
    }
  }

  // If no series found, list all series
  if (!seriesData || seriesData.length === 0) {
    const { data: allSeries } = await supabase
      .from("skill_series")
      .select("id, title, total_ceu_value");
    console.log("\nAll series in database:", allSeries);
  }

  if (seriesError) {
    console.error("Error updating series:", seriesError.message);
  } else if (seriesData && seriesData.length > 0) {
    console.log(`\nUpdated series "${seriesData[0].title}" to ${seriesData[0].total_ceu_value} total CEU`);
  }

  // Verify all module CEU values
  console.log("\n--- Current Module CEU Values ---");
  const { data: modules, error: modulesError } = await supabase
    .from("skill_modules")
    .select("title, ceu_value, ceu_eligible")
    .order("title");

  if (modulesError) {
    console.error("Error fetching modules:", modulesError.message);
  } else if (modules) {
    for (const mod of modules) {
      console.log(`${mod.title}: ${mod.ceu_value} CEU (eligible: ${mod.ceu_eligible})`);
    }
  }

  console.log("\nDone!");
}

fixCeuValues();
