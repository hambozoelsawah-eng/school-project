import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, newPassword } = await request.json()

    if (!userId || !newPassword) {
      return NextResponse.json({ error: "معرف المستخدم وكلمة المرور مطلوبان" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify the requesting user is an admin
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", currentUser.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "هذه العملية متاحة للإداريين فقط" }, { status: 403 })
    }

    // Note: Updating another user's password requires service_role key
    // For security, we'll use the admin API endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      },
      body: JSON.stringify({
        password: newPassword,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "فشل تحديث كلمة المرور")
    }

    return NextResponse.json({
      success: true,
      message: "تم تحديث كلمة المرور بنجاح",
    })
  } catch (error: any) {
    console.error("[v0] Error changing password:", error)
    return NextResponse.json({ error: error.message || "خطأ في تحديث كلمة المرور" }, { status: 500 })
  }
}
