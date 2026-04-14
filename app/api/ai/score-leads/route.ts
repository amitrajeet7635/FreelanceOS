import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const body = await req.json();
  const { leadIds } = body;

  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { count } = await supabase
    .from("ai_usage_log")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", user.id)
    .eq("action_type", "score_leads")
    .gte("used_at", new Date().toISOString().split('T')[0]);

  if (count && count >= 20) {
    return NextResponse.json({ error: 'Rate limit exceeded (max 20 scorings per day)' }, { status: 429 });
  }

  const { data: leads } = await supabase.from("leads").select("*").in("id", leadIds);
  if (!leads || leads.length === 0) return NextResponse.json({ scores: [] });

  const payload = leads.map(l => ({ id: l.id, username: l.username, niche: l.niche, notes: l.notes, hasWebsite: l.has_website }));

  const SYSTEM_PROMPT = `You are an AI lead scorer. Analyze these leads and score them from 0 to 100 based on their likelihood of needing a website and having budget. 
Return ONLY a strictly valid JSON array of objects with keys: "leadId" (string), "score" (number 0-100), "reason" (string, max 2 sentences).`;

  try {
    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: "Leads: " + JSON.stringify(payload) }]
      })
    });

    const aiData = await aiResponse.json();
    if (aiData.error) throw new Error(aiData.error.message);

    const jsonStr = aiData.content[0].text;
    const scores = JSON.parse(jsonStr.match(/\[[\s\S]*\]/)?.[0] || '[]');

    for (const score of scores) {
      await supabase.from("leads").update({ ai_score: score.score, ai_score_reason: score.reason }).eq("id", score.leadId);
    }

    await supabase.from("ai_usage_log").insert([{ user_id: user.id, action_type: "score_leads" }]);

    return NextResponse.json({ scores });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
