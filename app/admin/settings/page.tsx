"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProfileData {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  subject?: string
}

export default function AdminSettingsPage() {
  const [users, setUsers] = useState<ProfileData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<ProfileData | null>(null)
  const [editData, setEditData] = useState<Partial<ProfileData>>({})
  const [newPassword, setNewPassword] = useState("")
  const [showPasswordField, setShowPasswordField] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error: any) {
      console.error("[v0] Error fetching users:", error)
      alert("خطأ في تحميل المستخدمين")
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateUser() {
    if (!selectedUser) return

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editData.full_name || selectedUser.full_name,
          role: editData.role || selectedUser.role,
          is_active: editData.is_active !== undefined ? editData.is_active : selectedUser.is_active,
          subject: editData.subject || selectedUser.subject,
        })
        .eq("id", selectedUser.id)

      if (error) throw error

      alert("تم تحديث بيانات المستخدم بنجاح")
      setSelectedUser(null)
      setEditData({})
      fetchUsers()
    } catch (error: any) {
      console.error("[v0] Error updating user:", error)
      alert("خطأ في تحديث المستخدم")
    }
  }

  async function handleToggleActive(userId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase.from("profiles").update({ is_active: !currentStatus }).eq("id", userId)

      if (error) throw error
      fetchUsers()
    } catch (error: any) {
      console.error("[v0] Error toggling user status:", error)
      alert("خطأ في تحديث حالة المستخدم")
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return

    try {
      const { error } = await supabase.from("profiles").update({ is_active: false }).eq("id", userId)

      if (error) throw error

      // Try to delete from auth if possible
      await fetch("/api/auth/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      alert("تم حذف المستخدم بنجاح")
      fetchUsers()
    } catch (error: any) {
      console.error("[v0] Error deleting user:", error)
      alert("خطأ في حذف المستخدم")
    }
  }

  async function handleChangePassword() {
    if (!selectedUser) return

    if (!newPassword || newPassword.length < 6) {
      alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل")
      return
    }

    if (!confirm("هل أنت متأكد من تغيير كلمة مرور هذا المستخدم؟")) return

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "فشل تغيير كلمة المرور")
      }

      alert("تم تغيير كلمة المرور بنجاح")
      setNewPassword("")
      setShowPasswordField(false)
    } catch (error: any) {
      console.error("[v0] Error changing password:", error)
      alert("خطأ في تغيير كلمة المرور: " + error.message)
    }
  }

  const filteredUsers = users.filter(
    (user) => user.email.includes(searchTerm) || (user.full_name || "").includes(searchTerm),
  )

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">جاري التحميل...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">إدارة المستخدمين</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            التحكم الكامل في حسابات المستخدمين والأدوار والصلاحيات
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>المستخدمون</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="ابحث عن مستخدم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user)
                        setEditData(user)
                      }}
                      className={`w-full text-right p-3 rounded border-2 transition-colors ${
                        selectedUser?.id === user.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <p className="font-semibold text-sm">{user.full_name || user.email}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{user.role}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            user.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30"
                          }`}
                        >
                          {user.is_active ? "نشط" : "معطل"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {selectedUser && (
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>تفاصيل المستخدم</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input id="email" value={selectedUser.email} disabled className="bg-slate-100 dark:bg-slate-800" />
                  </div>

                  <div>
                    <Label htmlFor="fullname">الاسم الكامل</Label>
                    <Input
                      id="fullname"
                      value={editData.full_name || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          full_name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="role">الدور</Label>
                    <Select
                      value={editData.role || "teacher"}
                      onValueChange={(value) => setEditData({ ...editData, role: value })}
                    >
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">إداري</SelectItem>
                        <SelectItem value="teacher">مدرس</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">المادة</Label>
                    <Select
                      value={editData.subject || ""}
                      onValueChange={(value) => setEditData({ ...editData, subject: value })}
                    >
                      <SelectTrigger id="subject">
                        <SelectValue placeholder="اختر المادة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="اللغة العربية">اللغة العربية</SelectItem>
                        <SelectItem value="الرياضيات">الرياضيات</SelectItem>
                        <SelectItem value="العلوم">العلوم</SelectItem>
                        <SelectItem value="اللغة الإنجليزية">اللغة الإنجليزية</SelectItem>
                        <SelectItem value="التاريخ">التاريخ</SelectItem>
                        <SelectItem value="الجغرافيا">الجغرافيا</SelectItem>
                        <SelectItem value="الفيزياء">الفيزياء</SelectItem>
                        <SelectItem value="الكيمياء">الكيمياء</SelectItem>
                        <SelectItem value="الأحياء">الأحياء</SelectItem>
                        <SelectItem value="التربية الرياضية">التربية الرياضية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>تغيير كلمة المرور</Label>
                      <Button onClick={() => setShowPasswordField(!showPasswordField)} variant="outline" size="sm">
                        {showPasswordField ? "إلغاء" : "تغيير"}
                      </Button>
                    </div>

                    {showPasswordField && (
                      <div className="space-y-3 pt-2">
                        <div>
                          <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                            minLength={6}
                          />
                        </div>
                        <Button
                          onClick={handleChangePassword}
                          className="w-full bg-orange-600 hover:bg-orange-700"
                          disabled={!newPassword || newPassword.length < 6}
                        >
                          تأكيد تغيير كلمة المرور
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>حالة الحساب</Label>
                      <Button
                        onClick={() => handleToggleActive(selectedUser.id, selectedUser.is_active)}
                        variant={selectedUser.is_active ? "default" : "destructive"}
                      >
                        {selectedUser.is_active ? "تعطيل" : "تفعيل"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button onClick={handleUpdateUser} className="flex-1 bg-green-600 hover:bg-green-700">
                      حفظ التغييرات
                    </Button>
                    <Button
                      onClick={() => {
                        handleDeleteUser(selectedUser.id)
                      }}
                      variant="destructive"
                      className="flex-1"
                    >
                      حذف المستخدم
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">معلومات النظام</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-slate-600 dark:text-slate-400">معرف المستخدم:</span>
                    <span className="font-mono text-xs break-all">{selectedUser.id}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-slate-600 dark:text-slate-400">تاريخ الإنشاء:</span>
                    <span>{new Date(selectedUser.id.split("-")[0] || "").toLocaleDateString("ar-EG")}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!selectedUser && (
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="pt-6 text-center text-slate-600 dark:text-slate-400">
                  اختر مستخدماً لعرض تفاصيله وتعديل بياناته
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
