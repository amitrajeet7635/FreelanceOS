import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

function maskKey(key: string) {
  if (!key) return "";
  if (key.length <= 8) return "*".repeat(key.length);
  return `${key.slice(0, 4)}${"*".repeat(key.length - 8)}${key.slice(-4)}`;
}

export async function GET() {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("extension_api_keys")
    .select("key_name, key, active, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ key: null });
  }

  return NextResponse.json({
    key: {
      name: data.key_name || "My Extension Key",
      maskedKey: maskKey(data.key),
      active: !!data.active,
      createdAt: data.created_at,
    },
  });
}
