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

export async function POST() {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = generateExtensionApiKey(40);

  const { error } = await supabase
    .from("extension_api_keys")
    .upsert(
      {
        user_id: user.id,
        key,
        active: true,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ key });
}
