import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createSupabaseServer } from "@/lib/supabase-server";

const KEY_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateExtensionApiKey(length = 40): string {
  const bytes = randomBytes(length);
  let result = "";

  for (let i = 0; i < length; i += 1) {
    result += KEY_CHARS[bytes[i] % KEY_CHARS.length];
  }

  return result;
}

function maskKey(key: string) {
  if (!key) return "";
  if (key.length <= 8) return "*".repeat(key.length);
  return `${key.slice(0, 4)}${"*".repeat(key.length - 8)}${key.slice(-4)}`;
}

export async function POST(req: Request) {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const keyName = typeof body?.name === "string" ? body.name.trim() : "";

  if (!keyName) {
    return NextResponse.json({ error: "Please provide a key name." }, { status: 400 });
  }

  const { data: existingKey, error: existingError } = await supabase
    .from("extension_api_keys")
    .select("active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (existingKey?.active) {
    return NextResponse.json(
      { error: "An active API key already exists. Revoke it before generating a new one." },
      { status: 409 }
    );
  }

  const key = generateExtensionApiKey(40);

  const { error } = await supabase
    .from("extension_api_keys")
    .upsert(
      {
        user_id: user.id,
        key,
        key_name: keyName,
        active: true,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    key,
    maskedKey: maskKey(key),
    name: keyName,
    active: true,
    createdAt: new Date().toISOString(),
  });
}
