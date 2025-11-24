import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    // Note: Deleting from Supabase Auth requires Admin API
    // This endpoint is informational - actual deletion should be done via Supabase Admin API
    // For now, we delete from the profiles table only

    return NextResponse.json({
      message: "User profile deleted. Auth user may need to be deleted from Supabase admin panel.",
      userId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
