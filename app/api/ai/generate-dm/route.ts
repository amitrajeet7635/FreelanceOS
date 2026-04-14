import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const body = await req.json();
  const { leadId, dmType, extraContext } = body;

  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date().toISOString().split('T')[0];
  const { count } = await supabase
    .from("ai_usage_log")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", user.id)
    .eq("action_type", "generate_dm")
    .gte("used_at", today);

  if (count && count >= 20) {
    return NextResponse.json({ error: 'Rate limit exceeded (max 20 DMs per day)' }, { status: 429 });
  }

  // Fetch lead
  const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).single();
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const SYSTEM_PROMPT = `You are a freelance web developer writing Instagram DMs to small 
business owners who don't have a website. Write conversational, genuine, non-spammy messages.
Always reference something specific about their business. Never sound like a template.
Keep under 80 words. No hashtags. No emojis unless very sparingly. Sound like a real person.`;

  const userPrompt = `
Generate a ${dmType} Instagram DM to ${lead.username}.
Niche: ${lead.niche}.
Details observed: ${lead.notes || 'None'}.
Followers: ${lead.followers || 'Unknown'}.
Extra Context: ${extraContext || ''}.
Return ONLY the DM text.
`;

  try {
    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307", // use Haiku for speed & cost in real app or sonnet
        max_tokens: 250,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }]
      })
    });

    const aiData = await aiResponse.json();
    if (aiData.error) throw new Error(aiData.error.message);

    const dm = aiData.content[0].text;

    await supabase.from("ai_usage_log").insert([{
      user_id: user.id,
      action_type: "generate_dm",
      tokens_used: aiData.usage?.output_tokens || 0
    }]);

    return NextResponse.json({ dm, tokensUsed: aiData.usage?.output_tokens || 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
