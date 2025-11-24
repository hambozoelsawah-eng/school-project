"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    classes: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getStats() {
      try {
        const [teachers, students, classes] = await Promise.all([
          supabase.from("profiles").select("count", { count: "exact" }).eq("role", "teacher"),
          supabase.from("students").select("count", { count: "exact" }),
          supabase.from("classes").select("count", { count: "exact" }),
        ]);

        setStats({
          teachers: teachers.count || 0,
          students: students.count || 0,
          classes: classes.count || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    getStats();
  }, []);

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            لوحة التحكم الإدارية
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            مرحبا بك في نظام إدارة الدرجات المتقدم
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                عدد المدرسين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {loading ? "..." : stats.teachers}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                عدد الطلاب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                {loading ? "..." : stats.students}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                عدد الفصول
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                {loading ? "..." : stats.classes}
              </div>
            </CardContent>
          </Card>
        </div>

      
      </div>
    </AdminLayout>
  );
}
