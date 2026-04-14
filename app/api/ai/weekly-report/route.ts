import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const body = await req.json();
  const { weekStart } = body;

  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const { data: logs } = await supabase.from("daily_logs").select("*").eq("user_id", user.id).gte("log_date", start.toISOString().split('T')[0]).lt("log_date", end.toISOString().split('T')[0]);
  const { data: leads } = await supabase.from("leads").select("*").gte("created_at", start.toISOString()).lt("created_at", end.toISOString());

  const SYSTEM_PROMPT = `You are a freelance business consultant. Analyze the user's weekly outreach and give 5 actionable bullet points: what worked, what to improve, and where to focus next week. Keep it concise, motivational but data-driven. Return the response in markdown format.`;

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
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Weekly Logs: ${JSON.stringify(logs)}\nLeads Acquired/Updated: ${JSON.stringify(leads)}` }]
      })
    });

    const aiData = await aiResponse.json();
    if (aiData.error) throw new Error(aiData.error.message);

    const report = aiData.content[0].text;

    await supabase.from("ai_usage_log").insert([{ user_id: user.id, action_type: "weekly_report" }]);

    return NextResponse.json({ report });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
