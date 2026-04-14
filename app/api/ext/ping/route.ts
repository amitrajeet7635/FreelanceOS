import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    const { data: keyRow, error: keyError } = await supabase
      .from("extension_api_keys")
      .select("user_id")
      .eq("key", token)
      .eq("active", true)
      .maybeSingle();

    if (keyError) {
      return NextResponse.json({ error: keyError.message }, { status: 500 });
    }

    if (!keyRow) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(keyRow.user_id);

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, user: { email: userData.user?.email || null } });
  } catch {
    return NextResponse.json({ error: "Failed to validate key" }, { status: 500 });
  }
}
