"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { TeacherLayout } from "@/components/teacher/teacher-layout"

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function getUserRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        setUserRole(data?.role || "teacher")
      }
    }
    getUserRole()
  }, [])

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      alert("كلمة المرور الجديدة والتأكيد غير متطابقين")
      return
    }

    if (newPassword.length < 6) {
      alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل")
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.email) {
        alert("خطأ في التحقق من المستخدم")
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      alert("تم تغيير كلمة المرور بنجاح")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      router.back()
    } catch (error: any) {
      console.error("[v0] Error changing password:", error)
      alert("خطأ في تغيير كلمة المرور: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const PageContent = (
    <div className="p-4 md:p-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">تغيير كلمة المرور</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">قم بتحديث كلمة المرور الخاصة بك</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="current">كلمة المرور الحالية</Label>
                <Input
                  id="current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="new">كلمة المرور الجديدة</Label>
                <Input
                  id="new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div>
                <Label htmlFor="confirm">تأكيد كلمة المرور الجديدة</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {loading ? "جاري التغيير..." : "تغيير كلمة المرور"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>جاري التحميل...</div>
      </div>
    )
  }

  if (userRole === "admin") {
    return <AdminLayout>{PageContent}</AdminLayout>
  }

  return <TeacherLayout>{PageContent}</TeacherLayout>
}
