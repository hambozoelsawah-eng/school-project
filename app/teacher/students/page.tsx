"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TeacherLayout } from "@/components/teacher/teacher-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StudentData {
  id: string;
  name: string;
  seat_number: string;
  class_id: string;
  className: string;
}

interface ClassData {
  id: string;
  name: string;
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    seat_number: "",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchTeacherClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

  async function fetchTeacherClasses() {
    try {
      const { data: userData } = await supabase.auth.getSession();
      if (!userData?.session?.user?.id) throw new Error("Not authenticated");

      const { data: assignments, error } = await supabase
        .from("class_assignments")
        .select("class_id, classes(id, name)")
        .eq("teacher_id", userData.session.user.id);

      if (error) throw error;

      const uniqueClasses = assignments
        ? assignments
            .map((a: any) => ({ id: a.class_id, name: a.classes.name }))
            .filter(
              (cls, index, self) =>
                index === self.findIndex((c) => c.id === cls.id)
            )
        : [];

      setClasses(uniqueClasses);
      if (uniqueClasses.length > 0) {
        setSelectedClass(uniqueClasses[0].id);
      }
    } catch (error: any) {
      console.error("[v0] Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStudents() {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("class_id", selectedClass)
        .order("seat_number");

      if (error) throw error;

      const classData = classes.find((c) => c.id === selectedClass);
      const studentList = (data || []).map((s) => ({
        ...s,
        className: classData?.name || "",
      }));

      setStudents(studentList);
    } catch (error: any) {
      console.error("[v0] Error fetching students:", error);
    }
  }

  async function handleAddStudent() {
    if (!formData.name || !selectedClass) {
      alert("الرجاء ملء البيانات المطلوبة");
      return;
    }

    setIsAdding(true);
    try {
      const { data: userData } = await supabase.auth.getSession();
      if (!userData?.session?.user?.id) throw new Error("Not authenticated");

      const { data: classAssignments } = await supabase
        .from("class_assignments")
        .select("id, teacher_id, subject")
        .eq("class_id", selectedClass);

      if (!classAssignments || classAssignments.length === 0) {
        alert("لم يتم تعيين أي مواد لهذا الفصل بعد");
        return;
      }

      const { data: newStudent, error } = await supabase
        .from("students")
        .insert([
          {
            name: formData.name,
            seat_number: formData.seat_number,
            class_id: selectedClass,
          },
        ])
        .select();

      if (error) throw error;

      if (newStudent) {
        for (const assignment of classAssignments) {
          await supabase.from("grades").insert([
            {
              student_id: newStudent[0].id,
              class_id: selectedClass,
              teacher_id: assignment.teacher_id,
              subject: assignment.subject,
            },
          ]);
        }
      }

      setFormData({ name: "", seat_number: "" });
      fetchStudents();
      alert("تم إضافة الطالب بنجاح");
    } catch (error: any) {
      console.error("[v0] Error adding student:", error);
      alert("خطأ في إضافة الطالب: " + error.message);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDeleteStudent(studentId: string) {
    if (!confirm("هل تريد حذف هذا الطالب؟")) return;

    try {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", studentId);

      if (error) throw error;
      fetchStudents();
      alert("تم حذف الطالب بنجاح");
    } catch (error: any) {
      console.error("[v0] Error deleting student:", error);
      alert("خطأ في حذف الطالب");
    }
  }

  if (loading) {
    return (
      <TeacherLayout>
        <div className="p-8">جاري التحميل...</div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            إدارة الطلاب
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            أضف وأدر طلاب فصولك
          </p>
        </div>

        {classes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>اختر الفصل</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر فصل" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      الفصل {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>إضافة طالب جديد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">اسم الطالب</Label>
              <Input
                id="name"
                placeholder="أدخل اسم الطالب"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="seat">رقم المقعد</Label>
              <Input
                id="seat"
                placeholder="مثال: 1"
                value={formData.seat_number}
                onChange={(e) =>
                  setFormData({ ...formData, seat_number: e.target.value })
                }
              />
            </div>
            <Button
              onClick={handleAddStudent}
              disabled={isAdding}
              className="w-full"
            >
              {isAdding ? "جاري الإضافة..." : "إضافة الطالب"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              قائمة الطلاب ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400 text-center py-4">
                لا توجد طلاب في هذا الفصل
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-2">اسم الطالب</th>
                      <th className="text-right p-2">رقم المقعد</th>
                      <th className="text-center p-2">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="p-2">{student.name}</td>
                        <td className="p-2">{student.seat_number}</td>
                        <td className="p-2 text-center">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteStudent(student.id)}
                          >
                            حذف
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  );
}
