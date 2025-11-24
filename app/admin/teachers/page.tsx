"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SUBJECTS = [
  "اللغة العربية",
  "الرياضيات",
  "العلوم",
  "اللغة الإنجليزية",
  "التاريخ",
  "علوم متكامله",
  "برمحة وذكاء اصطناعي",
  "الجغرافيا",
  "تربية فنية",
  "زراعة",
  "عسكرية",
  "فلسفة",
  "الغة الفرنسية",
  "الغة المانية",
  "الغة اسبانية",
  "تربية دينية(مسلم)",
  "تربية دينية(مسيحي)",
  "التربية الرياضية",
];

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    subject: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchTeachers();
  }, []);

  async function fetchTeachers() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "teacher")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTeachers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTeacher(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: "teacher",
            subject: formData.subject,
          },
        },
      });

      if (authError) throw authError;

      setSuccess(`تم إنشاء حساب المدرس ${formData.full_name} بنجاح`);
      setFormData({ email: "", full_name: "", subject: "", password: "" });
      setShowForm(false);
      await fetchTeachers();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDeleteTeacher(teacherId: string, teacherEmail: string, teacherName: string) {
    if (!confirm(`هل تريد حذف المدرس ${teacherName}؟`)) return;

    try {
      const { error: deleteProfileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", teacherId);

      if (deleteProfileError) throw deleteProfileError;

      const response = await fetch("/api/auth/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: teacherId, email: teacherEmail }),
      });

      if (!response.ok) {
        console.warn("Could not delete from auth (requires admin)");
      }

      setSuccess("تم حذف المدرس بنجاح");
      await fetchTeachers();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white"> إدارة المدرسين </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2"> إنشاء وإدارة حسابات المدرسين </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="lg">
            {showForm ? "إلغاء" : "إضافة مدرس جديد"}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-300">
            {success}
          </div>
        )}

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>إضافة مدرس جديد</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTeacher} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">الاسم الكامل</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject">المادة</Label>
                    <Select
                      value={formData.subject}
                      onValueChange={(value) => setFormData({ ...formData, subject: value })}
                    >
                      <SelectTrigger id="subject">
                        <SelectValue placeholder="اختر المادة" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="password">كلمة المرور</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      dir="ltr"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  إنشاء حساب المدرس
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {loading ? (
            <Card>
              <CardContent className="pt-6">جاري التحميل...</CardContent>
            </Card>
          ) : teachers.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-slate-600 dark:text-slate-400">
                لا توجد مدرسين بعد
              </CardContent>
            </Card>
          ) : (
            teachers.map((teacher) => (
              <Card key={teacher.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                        {teacher.full_name}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">{teacher.email}</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                        المادة: {teacher.subject}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteTeacher(teacher.id, teacher.email, teacher.full_name)}
                    >
                      حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
