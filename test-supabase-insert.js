const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from("leads")
    .insert([{
      username: "testuser",
      niche: "test",
      followers: "100",
      has_website: "no",
      stage: "found",
      stage_history: [{ stage: "found", changed_at: new Date().toISOString() }],
    }])
    .select()
    .single();

  if (error) {
    console.error("Error inserting:", error);
  } else {
    console.log("Success:", data);
  }
}

test();
