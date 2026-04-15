import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonWithCors(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service role credentials are missing");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

    if (!token) {
      return jsonWithCors({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();

    const supabase = getServiceSupabase();
    const { data: keyRow, error: keyError } = await supabase
      .from("extension_api_keys")
      .select("user_id")
      .eq("key", token)
      .eq("active", true)
      .maybeSingle();

    if (keyError) {
      const keyErrorMessage = keyError.message || "";
      if (keyErrorMessage.toLowerCase().includes("invalid api key")) {
        return jsonWithCors(
          {
            error:
              "SUPABASE_SERVICE_ROLE_KEY is invalid for this project. Update server env and restart FreelanceOS.",
          },
          503
        );
      }

      return jsonWithCors({ error: keyError.message }, 500);
    }

    if (!keyRow) {
      return jsonWithCors({ error: "Unauthorized" }, 401);
    }

    const username = String(body?.username || "").trim();
    const hasWebsiteValue = body?.hasWebsite === "yes" ? "yes" : "no";
    const priorityValue = ["P0", "P1", "P2", "P3"].includes(body?.priority) ? body.priority : "P3";

    if (!username) {
      return jsonWithCors({ error: "Username is required" }, 400);
    }

    const { data: existingLead, error: duplicateError } = await supabase
      .from("leads")
      .select("id, stage, priority")
      .eq("user_id", keyRow.user_id)
      .ilike("username", username)
      .maybeSingle();

    if (duplicateError) {
      return jsonWithCors({ error: duplicateError.message }, 500);
    }

    if (existingLead) {
      return jsonWithCors({
        error: `@${username} is already in your pipeline (${existingLead.stage})`,
        isDuplicate: true,
        existingLead,
      }, 409);
    }

    const { data: insertedLead, error: insertError } = await supabase
      .from("leads")
      .insert([
        {
          user_id: keyRow.user_id,
          username,
          followers: body?.followers ? String(body.followers) : null,
          notes: body?.notes ? String(body.notes) : null,
          ig_link: body?.profileUrl ? String(body.profileUrl) : null,
          has_website: hasWebsiteValue,
          niche: body?.niche ? String(body.niche) : "Other",
          estimated_value:
            body?.estimatedValue !== undefined && body?.estimatedValue !== null
              ? Number(body.estimatedValue)
              : null,
          stage: "found",
          priority: priorityValue,
          source: "instagram_extension",
          created_at: new Date().toISOString(),
        },
      ])
      .select("id, username, stage")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return jsonWithCors({ error: insertError.message }, 500);
    }

    return jsonWithCors({ success: true, lead: insertedLead }, 200);
  } catch (error) {
    console.error("Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Failed to add lead";
    return jsonWithCors({ error: message }, 500);
  }
}
