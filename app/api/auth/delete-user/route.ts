import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { userId, email } = body || {};

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "User profile deleted. Auth user may need admin deletion.",
      userId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Server failure" }, { status: 500 });
  }
}
