"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GradeSchema {
  id: string;
  evaluation_1_max: number;
  evaluation_2_max: number;
  evaluation_3_max: number;
  evaluation_4_max: number;
  monthly_exam_max: number;
  notebook_max: number;
  attendance_max: number;
  behavior_max: number;
}

export default function GradeSchemaPage() {
  const [schema, setSchema] = useState<GradeSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Omit<GradeSchema, "id">>({
    evaluation_1_max: 10,
    evaluation_2_max: 10,
    evaluation_3_max: 10,
    evaluation_4_max: 10,
    monthly_exam_max: 20,
    notebook_max: 5,
    attendance_max: 5,
    behavior_max: 5,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchSchema();
  }, []);

  async function fetchSchema() {
    try {
      const { data, error } = await supabase
        .from("grade_schema")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSchema(data);
        setFormData(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (schema) {
        // Update existing
        const { error } = await supabase
          .from("grade_schema")
          .update(formData)
          .eq("id", schema.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase.from("grade_schema").insert([formData]);

        if (error) throw error;
      }

      setSuccess("تم حفظ لائحة الدرجات بنجاح");
      setIsEditing(false);
      await fetchSchema();
    } catch (err: any) {
      setError(err.message);
    }
  }

  const total = Object.values(formData).reduce((a, b) => a + b, 0);

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              لائحة الدرجات
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              تحديد الحد الأقصى لكل عنصر تقييم
            </p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} size="lg">
              تعديل اللائحة
            </Button>
          )}
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

        {loading ? (
          <Card>
            <CardContent className="pt-6">جاري التحميل...</CardContent>
          </Card>
        ) : isEditing ? (
          <Card>
            <CardHeader>
              <CardTitle>تعديل لائحة الدرجات</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eval1">التقييم الأول (الحد الأقصى)</Label>
                    <Input
                      id="eval1"
                      type="number"
                      value={formData.evaluation_1_max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          evaluation_1_max: parseInt(e.target.value),
                        })
                      }
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eval2">التقييم الثاني (الحد الأقصى)</Label>
                    <Input
                      id="eval2"
                      type="number"
                      value={formData.evaluation_2_max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          evaluation_2_max: parseInt(e.target.value),
                        })
                      }
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eval3">التقييم الثالث (الحد الأقصى)</Label>
                    <Input
                      id="eval3"
                      type="number"
                      value={formData.evaluation_3_max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          evaluation_3_max: parseInt(e.target.value),
                        })
                      }
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eval4">التقييم الرابع (الحد الأقصى)</Label>
                    <Input
                      id="eval4"
                      type="number"
                      value={formData.evaluation_4_max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          evaluation_4_max: parseInt(e.target.value),
                        })
                      }
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exam">الامتحان الشهري (الحد الأقصى)</Label>
                    <Input
                      id="exam"
                      type="number"
                      value={formData.monthly_exam_max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthly_exam_max: parseInt(e.target.value),
                        })
                      }
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notebook">الكشكول (الحد الأقصى)</Label>
                    <Input
                      id="notebook"
                      type="number"
                      value={formData.notebook_max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notebook_max: parseInt(e.target.value),
                        })
                      }
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="attendance">المواظبة (الحد الأقصى)</Label>
                    <Input
                      id="attendance"
                      type="number"
                      value={formData.attendance_max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          attendance_max: parseInt(e.target.value),
                        })
                      }
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="behavior">السلوك (الحد الأقصى)</Label>
                    <Input
                      id="behavior"
                      type="number"
                      value={formData.behavior_max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          behavior_max: parseInt(e.target.value),
                        })
                      }
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    المجموع الكلي: {total}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">
                    حفظ
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      if (schema) setFormData(schema);
                    }}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>لائحة الدرجات الحالية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded">
                  <span>التقييم الأول</span>
                  <span className="font-semibold">{formData.evaluation_1_max}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded">
                  <span>التقييم الثاني</span>
                  <span className="font-semibold">{formData.evaluation_2_max}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded">
                  <span>التقييم الثالث</span>
                  <span className="font-semibold">{formData.evaluation_3_max}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded">
                  <span>التقييم الرابع</span>
                  <span className="font-semibold">{formData.evaluation_4_max}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded">
                  <span>الامتحان الشهري</span>
                  <span className="font-semibold">{formData.monthly_exam_max}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded">
                  <span>الكشكول</span>
                  <span className="font-semibold">{formData.notebook_max}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded">
                  <span>المواظبة</span>
                  <span className="font-semibold">{formData.attendance_max}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded">
                  <span>السلوك</span>
                  <span className="font-semibold">{formData.behavior_max}</span>
                </div>
              </div>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  المجموع الكلي: {total}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
