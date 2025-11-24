"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TeacherLayout } from "@/components/teacher/teacher-layout"

interface GradeRecord {
  id: string
  student_id: string
  student_name: string
  evaluation_1: number | null
  evaluation_2: number | null
  evaluation_3: number | null
  evaluation_4: number | null
  monthly_exam: number | null
  notebook: number | null
  attendance: number | null
  behavior: number | null
  total: number
  is_locked: boolean
}

export default function GradesPage() {
  const [grades, setGrades] = useState<GradeRecord[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [currentSubject, setCurrentSubject] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchTeacherClasses()
  }, [])

  async function fetchTeacherClasses() {
    try {
      const { data: userData } = await supabase.auth.getSession()
      if (!userData?.session?.user?.id) throw new Error("User not authenticated")

      const { data: assignments, error: assignmentsError } = await supabase
        .from("class_assignments")
        .select("class_id, subject, classes(id, name)")
        .eq("teacher_id", userData.session.user.id)

      if (assignmentsError) throw assignmentsError

      const uniqueClasses = Array.from(new Map(assignments?.map((a) => [a.class_id, a])).values())

      setClasses(
        uniqueClasses.map((a: any) => ({
          id: a.class_id,
          name: a.classes.name,
        })),
      )
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchGrades(classId: string) {
    if (!classId) return

    try {
      const { data: userData } = await supabase.auth.getSession()
      if (!userData?.session?.user?.id) throw new Error("User not authenticated")

      const { data: assignments } = await supabase
        .from("class_assignments")
        .select("subject")
        .eq("class_id", classId)
        .eq("teacher_id", userData.session.user.id)
        .order("subject")

      const subjects = assignments?.map((a) => a.subject) || []
      const subject = subjects.length > 0 ? subjects[0] : null

      if (!subject) {
        setGrades([])
        setCurrentSubject(null)
        return
      }

      setCurrentSubject(subject)

      // جلب درجات الطلاب للمادة المحددة
      const { data: gradesData, error: gradesError } = await supabase
        .from("grades")
        .select("*")
        .eq("class_id", classId)
        .eq("subject", subject)
        .eq("teacher_id", userData.session.user.id)
        .order("student_id")

      if (gradesError) throw gradesError

      // إثراء البيانات بأسماء الطلاب
      const { data: studentsData } = await supabase.from("students").select("id, name").eq("class_id", classId)

      const enrichedGrades =
        gradesData?.map((grade) => ({
          ...grade,
          student_name: studentsData?.find((s) => s.id === grade.student_id)?.name || "Unknown",
        })) || []

      setGrades(enrichedGrades)
    } catch (err: any) {
      console.error("[v0] Error fetching grades:", err.message)
      setError(err.message)
    }
  }

  async function handleGradeChange(gradeId: string, field: string, value: string) {
    const numValue = value === "" ? null : Number.parseFloat(value)

    try {
      const { error } = await supabase
        .from("grades")
        .update({ [field]: numValue })
        .eq("id", gradeId)

      if (error) throw error

      await fetchGrades(selectedClass)
    } catch (err: any) {
      console.error("[v0] Error updating grade:", err.message)
      setError(err.message)
      setTimeout(() => setError(null), 3000)
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <TeacherLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 print:hidden">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">إدخال الدرجات</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">{currentSubject && `المادة: ${currentSubject}`}</p>
          </div>
          {grades.length > 0 && (
            <Button onClick={handlePrint} variant="outline" className="print:hidden bg-transparent">
              طباعة الدرجات
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300 print:hidden">
            {error}
          </div>
        )}

        <div className="w-full print:hidden">
          <Label htmlFor="class">الفصل</Label>
          <Select
            value={selectedClass}
            onValueChange={(value) => {
              setSelectedClass(value)
              fetchGrades(value)
            }}
          >
            <SelectTrigger id="class">
              <SelectValue placeholder="اختر الفصل" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <Card className="print:hidden">
            <CardContent className="pt-6">جاري التحميل...</CardContent>
          </Card>
        ) : grades.length === 0 ? (
          <Card className="print:hidden">
            <CardContent className="pt-6 text-center text-slate-600 dark:text-slate-400">
              لا توجد درجات للعرض
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="hidden print:block mb-4">
              <h1 className="text-2xl font-bold text-center mb-2">كشف درجات الطلاب</h1>
              <p className="text-center">المادة: {currentSubject}</p>
              <p className="text-center">الفصل: {classes.find((c) => c.id === selectedClass)?.name}</p>
              <p className="text-center mb-4">التاريخ: {new Date().toLocaleDateString("ar-EG")}</p>
            </div>

            <div className="overflow-x-auto" id="printable-grades">
              <table className="w-full border-collapse bg-white dark:bg-slate-900 rounded-lg shadow text-sm md:text-base">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="p-2 md:p-3 text-right">الاسم</th>
                    <th className="p-2 md:p-3 text-center">ت1</th>
                    <th className="p-2 md:p-3 text-center">ت2</th>
                    <th className="p-2 md:p-3 text-center">ت3</th>
                    <th className="p-2 md:p-3 text-center">ت4</th>
                    <th className="p-2 md:p-3 text-center">امتحان</th>
                    <th className="p-2 md:p-3 text-center">كشكول</th>
                    <th className="p-2 md:p-3 text-center">مواظبة</th>
                    <th className="p-2 md:p-3 text-center">سلوك</th>
                    <th className="p-2 md:p-3 text-center">المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade) => (
                    <tr key={grade.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="p-2 md:p-3 font-medium">{grade.student_name}</td>
                      {[
                        "evaluation_1",
                        "evaluation_2",
                        "evaluation_3",
                        "evaluation_4",
                        "monthly_exam",
                        "notebook",
                        "attendance",
                        "behavior",
                      ].map((field) => (
                        <td key={field} className="p-2 md:p-3 text-center">
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={grade[field as keyof GradeRecord] ?? ""}
                            onChange={(e) => {
                              // تحديث محلي فوري
                              const updatedGrades = grades.map((g) =>
                                g.id === grade.id
                                  ? { ...g, [field]: e.target.value === "" ? null : Number.parseFloat(e.target.value) }
                                  : g,
                              )
                              setGrades(updatedGrades)
                            }}
                            onBlur={(e) => {
                              // حفظ في قاعدة البيانات عند فقدان التركيز
                              handleGradeChange(grade.id, field, e.target.value)
                            }}
                            className="w-12 md:w-16 text-center print:border-0"
                            dir="ltr"
                          />
                        </td>
                      ))}
                      <td className="p-2 md:p-3 text-center font-bold text-blue-600">
                        {typeof grade.total === "number" ? grade.total.toFixed(1) : "0.0"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-grades,
          #printable-grades *,
          .print\\:block,
          .print\\:block * {
            visibility: visible;
          }
          #printable-grades {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          table {
            page-break-inside: auto;
            border: 1px solid #000 !important;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          th, td {
            border: 1px solid #000 !important;
            padding: 8px !important;
          }
          @page {
            margin: 2cm;
          }
        }
      `}</style>
    </TeacherLayout>
  )
}
