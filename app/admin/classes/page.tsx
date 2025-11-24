"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminLayout } from "@/components/admin/admin-layout";
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

const SUBJECTS = [
  "اللغة العربية",
  "الرياضيات",
  "العلوم",
  "اللغة الإنجليزية",
  "التاريخ",
  "الجغرافيا",
  "الفيزياء",
  "الكيمياء",
  "الأحياء",
  "التربية الرياضية",
];

interface ClassWithTeachers {
  id: string;
  name: string;
  description: string;
  assignments: { teacher_id: string; teacher_name: string; subject: string }[];
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassWithTeachers[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editAssignments, setEditAssignments] = useState<{ teacher_id: string; subject: string }[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    teachers: [] as { teacher_id: string; subject: string }[],
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Fetch teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "teacher");

      if (teachersError) throw teachersError;
      setTeachers(teachersData || []);

      // Fetch classes with assignments
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("*")
        .order("created_at", { ascending: false });

      if (classesError) throw classesError;

      // Fetch assignments for each class
      const classesWithAssignments: ClassWithTeachers[] = [];
      for (const cls of classesData || []) {
        const { data: assignments } = await supabase
          .from("class_assignments")
          .select("teacher_id, subject")
          .eq("class_id", cls.id);

        const enrichedAssignments = assignments?.map((a) => {
          const teacher = teachersData?.find((t) => t.id === a.teacher_id);
          return {
            teacher_id: a.teacher_id,
            teacher_name: teacher?.full_name || "Unknown",
            subject: a.subject,
          };
        }) || [];

        classesWithAssignments.push({
          ...cls,
          assignments: enrichedAssignments,
        });
      }

      setClasses(classesWithAssignments);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddClass(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Create class
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .insert([{ name: formData.name, description: formData.description }])
        .select();

      if (classError) throw classError;

      const newClassId = classData[0].id;

      // Add teacher assignments
      for (const assignment of formData.teachers) {
        // Check for duplicate subject
        const { data: existingAssignment, error: checkError } = await supabase
          .from("class_assignments")
          .select("*")
          .eq("class_id", newClassId)
          .eq("subject", assignment.subject);

        if (checkError) throw checkError;
        if (existingAssignment && existingAssignment.length > 0) {
          throw new Error(
            `المادة "${assignment.subject}" معينة بالفعل لفصل "${formData.name}"`
          );
        }

        const { error: assignmentError } = await supabase
          .from("class_assignments")
          .insert([
            {
              class_id: newClassId,
              teacher_id: assignment.teacher_id,
              subject: assignment.subject,
            },
          ]);

        if (assignmentError) throw assignmentError;
      }

      setSuccess(`تم إنشاء الفصل ${formData.name} بنجاح`);
      setFormData({ name: "", description: "", teachers: [] });
      setShowForm(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDeleteClass(classId: string, className: string) {
    if (!confirm(`هل تريد حذف الفصل ${className}؟`)) return;

    try {
      const { error } = await supabase.from("classes").delete().eq("id", classId);
      if (error) throw error;
      setSuccess("تم حذف الفصل بنجاح");
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleEditClass(cls: ClassWithTeachers) {
    setEditingClassId(cls.id);
    setEditAssignments(cls.assignments.map(a => ({ teacher_id: a.teacher_id, subject: a.subject })));
  }

  async function handleSaveClassChanges(classId: string) {
    try {
      // Get current assignments
      const { data: currentAssignments } = await supabase
        .from("class_assignments")
        .select("*")
        .eq("class_id", classId);

      // Delete removed assignments
      for (const current of currentAssignments || []) {
        const stillExists = editAssignments.some(
          e => e.teacher_id === current.teacher_id && e.subject === current.subject
        );
        if (!stillExists) {
          await supabase
            .from("class_assignments")
            .delete()
            .eq("id", current.id);
        }
      }

      // Add new assignments
      for (const edit of editAssignments) {
        const alreadyExists = currentAssignments?.some(
          c => c.teacher_id === edit.teacher_id && c.subject === edit.subject
        );
        if (!alreadyExists) {
          await supabase
            .from("class_assignments")
            .insert([
              {
                class_id: classId,
                teacher_id: edit.teacher_id,
                subject: edit.subject,
              },
            ]);
        }
      }

      setSuccess("تم تحديث الفصل بنجاح");
      setEditingClassId(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function addTeacherAssignment() {
    setFormData({
      ...formData,
      teachers: [
        ...formData.teachers,
        { teacher_id: "", subject: "" },
      ],
    });
  }

  function removeTeacherAssignment(index: number) {
    setFormData({
      ...formData,
      teachers: formData.teachers.filter((_, i) => i !== index),
    });
  }

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              إدارة الفصول
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              إنشاء وإدارة الفصول وتعيين المدرسين
            </p>
          </div>
          <Button onClick={() => { setShowForm(!showForm); setEditingClassId(null); }} size="lg">
            {showForm ? "إلغاء" : "إضافة فصل جديد"}
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
              <CardTitle>إضافة فصل جديد</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddClass} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">اسم الفصل (مثال: 1/4)</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="1/4"
                      required
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">الوصف</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="الصف الأول - القسم الرابع"
                    />
                  </div>
                </div>

                <div>
                  <Label>تعيين المدرسين والمواد</Label>
                  <div className="space-y-3 mt-3">
                    {formData.teachers.map((assignment, index) => (
                      <div key={index} className="flex gap-2">
                        <Select
                          value={assignment.teacher_id}
                          onValueChange={(value) => {
                            const newTeachers = [...formData.teachers];
                            newTeachers[index].teacher_id = value;
                            setFormData({ ...formData, teachers: newTeachers });
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="اختر المدرس" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={assignment.subject}
                          onValueChange={(value) => {
                            const newTeachers = [...formData.teachers];
                            newTeachers[index].subject = value;
                            setFormData({ ...formData, teachers: newTeachers });
                          }}
                        >
                          <SelectTrigger className="flex-1">
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

                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => removeTeacherAssignment(index)}
                        >
                          حذف
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTeacherAssignment}
                    className="w-full mt-3"
                  >
                    إضافة مدرس
                  </Button>
                </div>

                <Button type="submit" className="w-full">
                  إنشاء الفصل
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
          ) : classes.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-slate-600 dark:text-slate-400">
                لا توجد فصول بعد
              </CardContent>
            </Card>
          ) : (
            classes.map((cls) => (
              <Card key={cls.id}>
                <CardContent className="pt-6">
                  {editingClassId === cls.id ? (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">تعديل المدرسين والمواد</h3>
                      <div className="space-y-3">
                        {editAssignments.map((assignment, index) => (
                          <div key={index} className="flex gap-2">
                            <Select
                              value={assignment.teacher_id}
                              onValueChange={(value) => {
                                const newAssignments = [...editAssignments];
                                newAssignments[index].teacher_id = value;
                                setEditAssignments(newAssignments);
                              }}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="اختر المدرس" />
                              </SelectTrigger>
                              <SelectContent>
                                {teachers.map((teacher) => (
                                  <SelectItem key={teacher.id} value={teacher.id}>
                                    {teacher.full_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Select
                              value={assignment.subject}
                              onValueChange={(value) => {
                                const newAssignments = [...editAssignments];
                                newAssignments[index].subject = value;
                                setEditAssignments(newAssignments);
                              }}
                            >
                              <SelectTrigger className="flex-1">
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

                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => setEditAssignments(editAssignments.filter((_, i) => i !== index))}
                            >
                              حذف
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditAssignments([...editAssignments, { teacher_id: "", subject: "" }])}
                        className="w-full"
                      >
                        إضافة مدرس
                      </Button>
                      <div className="flex gap-2">
                        <Button onClick={() => handleSaveClassChanges(cls.id)} className="flex-1">
                          حفظ التغييرات
                        </Button>
                        <Button onClick={() => setEditingClassId(null)} variant="outline" className="flex-1">
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                          الفصل {cls.name}
                        </h3>
                        {cls.description && (
                          <p className="text-slate-600 dark:text-slate-400">
                            {cls.description}
                          </p>
                        )}
                        <div className="mt-3 space-y-1">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            المدرسين والمواد:
                          </p>
                          {cls.assignments.length === 0 ? (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              لم يتم تعيين مدرسين بعد
                            </p>
                          ) : (
                            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                              {cls.assignments.map((a, idx) => (
                                <li key={idx}>
                                  • {a.teacher_name} ({a.subject})
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleEditClass(cls)}>
                          تعديل
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteClass(cls.id, cls.name)}
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
