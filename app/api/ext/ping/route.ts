import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Extension backend is not configured. Add SUPABASE_SERVICE_ROLE_KEY to your server env and restart.",
      },
      { status: 503 }
    );
  }

  const { data: keyRow, error: keyError } = await supabase
    .from("extension_api_keys")
    .select("user_id")
    .eq("key", token)
    .eq("active", true)
    .maybeSingle();

  if (keyError) {
    const keyErrorMessage = keyError.message || "";

    if (keyErrorMessage.toLowerCase().includes("invalid api key")) {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY is invalid for this project. Update .env.local with the correct service role key and restart the server.",
        },
        { status: 503 }
      );
    }

    if (keyError.code === "42P01") {
      return NextResponse.json(
        {
          error:
            "extension_api_keys table is missing. Run the latest Supabase migration and try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: keyError.message }, { status: 500 });
  }

  if (!keyRow) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(keyRow.user_id);

  if (userError) {
    return NextResponse.json({ ok: true, user: { email: null } });
  }

  return NextResponse.json({ ok: true, user: { email: userData.user?.email || null } });
}
