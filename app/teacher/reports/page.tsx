"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TeacherLayout } from "@/components/teacher/teacher-layout"

interface ClassGrades {
  class_name: string
  students: {
    name: string
    subject: string
    total: number
    grades: {
      evaluation_1: number | null
      evaluation_2: number | null
      evaluation_3: number | null
      evaluation_4: number | null
      monthly_exam: number | null
      notebook: number | null
      attendance: number | null
      behavior: number | null
    }
  }[]
}

export default function TeacherReportsPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [reportData, setReportData] = useState<ClassGrades | null>(null)
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const months = [
    { value: 1, label: "يناير" },
    { value: 2, label: "فبراير" },
    { value: 3, label: "مارس" },
    { value: 4, label: "أبريل" },
    { value: 5, label: "مايو" },
    { value: 6, label: "يونيو" },
    { value: 7, label: "يوليو" },
    { value: 8, label: "أغسطس" },
    { value: 9, label: "سبتمبر" },
    { value: 10, label: "أكتوبر" },
    { value: 11, label: "نوفمبر" },
    { value: 12, label: "ديسمبر" },
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  useEffect(() => {
    fetchTeacherClasses()
  }, [])

  async function fetchTeacherClasses() {
    try {
      const { data: userData } = await supabase.auth.getSession()
      if (!userData?.session?.user?.id) throw new Error("Not authenticated")

      const { data: assignments } = await supabase
        .from("class_assignments")
        .select("class_id, classes(id, name)")
        .eq("teacher_id", userData.session.user.id)

      const uniqueClasses = Array.from(new Map(assignments?.map((a) => [a.class_id, a])).values())

      setClasses(
        uniqueClasses.map((a: any) => ({
          id: a.class_id,
          name: a.classes.name,
        })),
      )
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  async function generateReport(classId: string) {
    if (!classId) return

    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getSession()
      if (!userData?.session?.user?.id) throw new Error("Not authenticated")

      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split("T")[0] + "T23:59:59"

      const { data: grades } = await supabase
        .from("grades")
        .select("*")
        .eq("class_id", classId)
        .eq("teacher_id", userData.session.user.id)
        .gte("updated_at", startDate)
        .lte("updated_at", endDate)
        .order("student_id")

      const { data: students } = await supabase.from("students").select("id, name").eq("class_id", classId)

      const { data: attendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("class_id", classId)
        .eq("teacher_id", userData.session.user.id)
        .gte("attendance_date", startDate)
        .lte("attendance_date", endDate)

      const classData = classes.find((c) => c.id === classId)

      const processedGrades = (grades || []).map((grade) => ({
        name: students?.find((s) => s.id === grade.student_id)?.name || "Unknown",
        subject: grade.subject,
        total: grade.total,
        grades: {
          evaluation_1: grade.evaluation_1,
          evaluation_2: grade.evaluation_2,
          evaluation_3: grade.evaluation_3,
          evaluation_4: grade.evaluation_4,
          monthly_exam: grade.monthly_exam,
          notebook: grade.notebook,
          attendance: grade.attendance,
          behavior: grade.behavior,
        },
      }))

      setReportData({
        class_name: classData?.name || "Unknown",
        students: processedGrades,
      })
      setAttendanceData(attendance || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  function exportToCSV() {
    if (!reportData) return

    const headers = ["الاسم", "المادة", "ت1", "ت2", "ت3", "ت4", "امتحان", "كشكول", "مواظبة", "سلوك", "المجموع"]

    const rows = reportData.students.map((student) => [
      student.name,
      student.subject,
      student.grades.evaluation_1 || "",
      student.grades.evaluation_2 || "",
      student.grades.evaluation_3 || "",
      student.grades.evaluation_4 || "",
      student.grades.monthly_exam || "",
      student.grades.notebook || "",
      student.grades.attendance || "",
      student.grades.behavior || "",
      student.total,
    ])

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `report-${reportData.class_name}-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  function handlePrint() {
    window.print()
  }

  return (
    <TeacherLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">التقارير الشهرية</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">عرض وتصدير نتائج طلابك حسب الشهر</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>اختر الفصل والشهر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الشهر" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={String(month.value)}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر السنة" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
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

              <Button onClick={() => generateReport(selectedClass)} disabled={!selectedClass || loading}>
                {loading ? "جاري..." : "إنشاء التقرير"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {reportData && (
          <>
            <div className="hidden print:block mb-4">
              <h1 className="text-2xl font-bold text-center mb-2">التقرير الشهري</h1>
              <p className="text-center">الفصل: {reportData.class_name}</p>
              <p className="text-center">
                الشهر: {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
              </p>
              <p className="text-center mb-4">التاريخ: {new Date().toLocaleDateString("ar-EG")}</p>
            </div>

            <Card>
              <CardHeader className="print:hidden">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <CardTitle>
                    تقرير الغياب - {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
                  </CardTitle>
                  <Button onClick={handlePrint} variant="outline" className="print:hidden bg-transparent">
                    طباعة
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto" id="printable-attendance-report">
                  <table className="w-full text-xs md:text-sm border-collapse">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="p-2 text-right border">الطالب</th>
                        <th className="p-2 text-center border">أيام الحضور</th>
                        <th className="p-2 text-center border">أيام الغياب</th>
                        <th className="p-2 text-center border">نسبة الحضور</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.students.map((student, idx) => {
                        const studentAttendance = attendanceData.filter(
                          (a) => reportData.students[idx]?.name === student.name,
                        )
                        const present = studentAttendance.filter((a) => a.is_present).length
                        const absent = studentAttendance.filter((a) => !a.is_present).length
                        const total = present + absent
                        const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : "0.0"

                        return (
                          <tr key={idx} className="border-b hover:bg-slate-50">
                            <td className="p-2 border">{student.name}</td>
                            <td className="p-2 text-center border text-green-600 font-bold">{present}</td>
                            <td className="p-2 text-center border text-red-600 font-bold">{absent}</td>
                            <td className="p-2 text-center border font-bold">{percentage}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="print:hidden">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <CardTitle>
                    الفصل {reportData.class_name} ({reportData.students.length} طالب)
                  </CardTitle>
                  <div className="flex gap-2 print:hidden">
                    <Button onClick={handlePrint} variant="outline">
                      طباعة
                    </Button>
                    <Button onClick={exportToCSV} variant="outline">
                      تصدير إلى CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto" id="printable-grades-report">
                  <table className="w-full text-xs md:text-sm border-collapse">
                    <thead>
                      <tr className="bg-green-600 text-white">
                        <th className="p-2 text-right border">الاسم</th>
                        <th className="p-2 text-center border">المادة</th>
                        <th className="p-2 text-center border">ت1</th>
                        <th className="p-2 text-center border">ت2</th>
                        <th className="p-2 text-center border">ت3</th>
                        <th className="p-2 text-center border">ت4</th>
                        <th className="p-2 text-center border">امتحان</th>
                        <th className="p-2 text-center border">كشكول</th>
                        <th className="p-2 text-center border">مواظبة</th>
                        <th className="p-2 text-center border">سلوك</th>
                        <th className="p-2 text-center font-bold border">المجموع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.students.map((student, idx) => (
                        <tr key={idx} className="border-b hover:bg-slate-50">
                          <td className="p-2 border">{student.name}</td>
                          <td className="p-2 text-center border">{student.subject}</td>
                          <td className="p-2 text-center border">{student.grades.evaluation_1 || "-"}</td>
                          <td className="p-2 text-center border">{student.grades.evaluation_2 || "-"}</td>
                          <td className="p-2 text-center border">{student.grades.evaluation_3 || "-"}</td>
                          <td className="p-2 text-center border">{student.grades.evaluation_4 || "-"}</td>
                          <td className="p-2 text-center border">{student.grades.monthly_exam || "-"}</td>
                          <td className="p-2 text-center border">{student.grades.notebook || "-"}</td>
                          <td className="p-2 text-center border">{student.grades.attendance || "-"}</td>
                          <td className="p-2 text-center border">{student.grades.behavior || "-"}</td>
                          <td className="p-2 text-center font-bold text-green-600 border">{student.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-attendance-report,
          #printable-attendance-report *,
          #printable-grades-report,
          #printable-grades-report *,
          .print\\:block,
          .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
          }
          #printable-attendance-report {
            position: fixed;
            left: 0;
            top: 150px;
            width: 100%;
          }
          #printable-grades-report {
            position: fixed;
            left: 0;
            top: 500px;
            width: 100%;
          }
          table {
            border: 2px solid #000 !important;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          th, td {
            border: 1px solid #000 !important;
            padding: 6px !important;
          }
          @page {
            margin: 1.5cm;
            size: A4;
          }
        }
      `}</style>
    </TeacherLayout>
  )
}
