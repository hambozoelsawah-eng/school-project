"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherLayout } from "@/components/teacher/teacher-layout";

interface ClassStats {
  class_name: string;
  student_count: number;
  graded_count: number;
  pending_count: number;
  average_total: number;
}

export default function TeacherDashboardPage() {
  const [stats, setStats] = useState<ClassStats[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const { data: userData } = await supabase.auth.getSession();
      if (!userData?.session?.user?.id) throw new Error("Not authenticated");

      // Get teacher's classes
      const { data: assignments } = await supabase
        .from("class_assignments")
        .select("class_id, classes(id, name)")
        .eq("teacher_id", userData.session.user.id);

      const classIds = Array.from(
        new Map(
          assignments?.map((a) => [a.class_id, a.classes]) || []
        ).values()
      );

      // Get stats for each class
      const classStats = await Promise.all(
        classIds.map(async (cls: any) => {
          // Count students
          const { count: studentCount } = await supabase
            .from("students")
            .select("id", { count: "exact" })
            .eq("class_id", cls.id);

          // Get grades
          const { data: grades } = await supabase
            .from("grades")
            .select("total")
            .eq("class_id", cls.id)
            .eq("teacher_id", userData.session.user.id);

          const gradedCount = grades?.filter((g) => g.total > 0).length || 0;
          const average = grades && grades.length > 0
            ? grades.reduce((sum, g) => sum + (g.total || 0), 0) / grades.length
            : 0;

          return {
            class_name: cls.name,
            student_count: studentCount || 0,
            graded_count: gradedCount,
            pending_count: (studentCount || 0) - gradedCount,
            average_total: Math.round(average * 100) / 100,
          };
        })
      );

      setStats(classStats);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TeacherLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            لوحة تحكم المدرس
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            مرحبا بك في منصة إدارة الدرجات
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="pt-6">جاري التحميل...</CardContent>
          </Card>
        ) : stats.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-600 dark:text-slate-400">
              لا توجد فصول معينة لك بعد
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    الفصل {stat.class_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">
                      عدد الطلاب
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {stat.student_count}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">
                      الدرجات المدخلة
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      {stat.graded_count}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">
                      الدرجات المتبقية
                    </span>
                    <span className="text-2xl font-bold text-orange-600">
                      {stat.pending_count}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">
                        متوسط الدرجات
                      </span>
                      <span className="text-lg font-bold text-purple-600">
                        {stat.average_total}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>المميزات المتاحة</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>عرض فصولك والطلاب المسجلين فيها</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>إدخال تعديل الدرجات في أي وقت (قبل القفل)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>الحساب التلقائي للمجموع النهائي</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>تصدير التقارير بصيغة CSV</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>البحث والفرز حسب الاسم أو المجموع</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  );
}
