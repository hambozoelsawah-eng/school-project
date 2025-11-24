"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherLayout } from "@/components/teacher/teacher-layout";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ClassDetail {
  id: string;
  name: string;
  subject: string;
  student_count: number;
  graded_count: number;
}

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<ClassDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchClasses();
  }, []);

  async function fetchClasses() {
    try {
      const { data: userData } = await supabase.auth.getSession();
      if (!userData?.session?.user?.id) throw new Error("Not authenticated");

      const { data: assignments, error: assignError } = await supabase
        .from("class_assignments")
        .select("class_id, subject, classes(id, name)")
        .eq("teacher_id", userData.session.user.id);

      if (assignError) {
        console.error("[v0] Assignment fetch error:", assignError);
        throw assignError;
      }

      console.log("[v0] Assignments found:", assignments?.length || 0);

      if (!assignments || assignments.length === 0) {
        setClasses([]);
        setLoading(false);
        return;
      }

      // Get details for each class
      const classDetails = await Promise.all(
        assignments.map(async (a: any) => {
          const { count: studentCount } = await supabase
            .from("students")
            .select("id", { count: "exact" })
            .eq("class_id", a.class_id);

          const { data: grades } = await supabase
            .from("grades")
            .select("total")
            .eq("class_id", a.class_id)
            .eq("teacher_id", userData.session.user.id)
            .eq("subject", a.subject);

          const gradedCount = grades?.filter((g: any) => g.total > 0).length || 0;

          return {
            id: a.class_id,
            name: a.classes.name,
            subject: a.subject,
            student_count: studentCount || 0,
            graded_count: gradedCount,
          };
        })
      );

      console.log("[v0] Class details loaded:", classDetails.length);
      setClasses(classDetails);
    } catch (error: any) {
      console.error("[v0] Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TeacherLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            فصولي
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            الفصول المخصصة لي
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="pt-6">جاري التحميل...</CardContent>
          </Card>
        ) : classes.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-600 dark:text-slate-400">
              لا توجد فصول معينة لك
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {classes.map((cls) => (
              <Card key={cls.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <div>
                      <p className="text-lg">الفصل {cls.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-normal mt-1">
                        المادة: {cls.subject}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        عدد الطلاب
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {cls.student_count}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        درجات مدخلة
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {cls.graded_count}
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${
                          cls.student_count > 0
                            ? (cls.graded_count / cls.student_count) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/teacher/grades?class=${cls.id}`} className="flex-1">
                      <Button className="w-full">إدخال الدرجات</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
