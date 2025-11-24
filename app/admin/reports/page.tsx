"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ReportData {
  student_name: string
  class_name: string
  subject: string
  teacher_name: string
  total: number
  evaluation_1: number | null
  evaluation_2: number | null
  evaluation_3: number | null
  evaluation_4: number | null
  monthly_exam: number | null
  notebook: number | null
  attendance: number | null
  behavior: number | null
}

export default function ReportsPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [reportType, setReportType] = useState("class")
  const [loading, setLoading] = useState(false)
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
    fetchClasses()
  }, [])

  async function fetchClasses() {
    try {
      const { data } = await supabase.from("classes").select("*").order("name")

      setClasses(data || [])
    } catch (error) {
      console.error("Error fetching classes:", error)
    }
  }

  async function generateClassReport() {
    if (!selectedClass) return

    setLoading(true)
    try {
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split("T")[0] + "T23:59:59"

      const { data: gradesData, error } = await supabase
        .from("grades")
        .select("*")
        .eq("class_id", selectedClass)
        .gte("updated_at", startDate)
        .lte("updated_at", endDate)

      if (error) throw error

      const { data: attendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("class_id", selectedClass)
        .gte("attendance_date", startDate)
        .lte("attendance_date", endDate)

      const studentIds = [...new Set(gradesData?.map((g) => g.student_id))]
      const teacherIds = [...new Set(gradesData?.map((g) => g.teacher_id))]

      const { data: studentsData } = await supabase.from("students").select("id, name").in("id", studentIds)

      const { data: teachersData } = await supabase.from("profiles").select("id, full_name").in("id", teacherIds)

      const classData = classes.find((c) => c.id === selectedClass)

      const enriched = (gradesData || []).map((grade: any) => {
        const student = studentsData?.find((s) => s.id === grade.student_id)
        const teacher = teachersData?.find((t) => t.id === grade.teacher_id)

        return {
          student_name: student?.name || "غير معروف",
          class_name: classData?.name || "غير معروف",
          subject: grade.subject || "غير معروف",
          teacher_name: teacher?.full_name || "غير معروف",
          total: typeof grade.total === "number" ? grade.total : 0,
          evaluation_1: grade.evaluation_1,
          evaluation_2: grade.evaluation_2,
          evaluation_3: grade.evaluation_3,
          evaluation_4: grade.evaluation_4,
          monthly_exam: grade.monthly_exam,
          notebook: grade.notebook,
          attendance: grade.attendance,
          behavior: grade.behavior,
        }
      })

      setReportData(enriched)
      setAttendanceData(attendance || [])
    } catch (error: any) {
      console.error("Error generating report:", error)
      alert("خطأ في إنشاء التقرير: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  function exportToCSV() {
    if (reportData.length === 0) return

    const headers = [
      "الاسم",
      "الفصل",
      "المادة",
      "المدرس",
      "التقييم 1",
      "التقييم 2",
      "التقييم 3",
      "التقييم 4",
      "الامتحان",
      "الكشكول",
      "المواظبة",
      "السلوك",
      "المجموع",
    ]

    const rows = reportData.map((row) => [
      row.student_name,
      row.class_name,
      row.subject,
      row.teacher_name,
      row.evaluation_1 || "",
      row.evaluation_2 || "",
      row.evaluation_3 || "",
      row.evaluation_4 || "",
      row.monthly_exam || "",
      row.notebook || "",
      row.attendance || "",
      row.behavior || "",
      row.total,
    ])

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `report-${selectedClass}-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  function handlePrint() {
    window.print()
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="print:hidden">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">التقارير الشهرية</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">إنشاء وتصدير التقارير الشاملة حسب الشهر</p>
        </div>

        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>إنشاء تقرير شهري</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">الشهر</label>
                <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={String(month.value)}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">السنة</label>
                <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">نوع التقرير</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class">حسب الفصل</SelectItem>
                    <SelectItem value="teacher">حسب المدرس</SelectItem>
                    <SelectItem value="subject">حسب المادة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الفصل</label>
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
              </div>

              <div className="flex items-end">
                <Button onClick={generateClassReport} disabled={loading} className="w-full">
                  {loading ? "جاري الإنشاء..." : "إنشاء التقرير"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {reportData.length > 0 && (
          <>
            <div className="hidden print:block mb-4">
              <h1 className="text-2xl font-bold text-center mb-2">التقرير الشامل</h1>
              <p className="text-center">الفصل: {classes.find((c) => c.id === selectedClass)?.name}</p>
              <p className="text-center">
                الشهر: {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
              </p>
              <p className="text-center mb-4">التاريخ: {new Date().toLocaleDateString("ar-EG")}</p>
            </div>


            <Card>
              <CardHeader className="print:hidden">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <CardTitle>نتائج التقرير ({reportData.length} سجل)</CardTitle>
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
                <div className="overflow-x-auto" id="printable-grades-admin">
                  <table className="w-full border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800">
                        <th className="border p-2 text-right">الاسم</th>
                        <th className="border p-2 text-center">المادة</th>
                        <th className="border p-2 text-center">المدرس</th>
                        <th className="border p-2 text-center">ت1</th>
                        <th className="border p-2 text-center">ت2</th>
                        <th className="border p-2 text-center">ت3</th>
                        <th className="border p-2 text-center">ت4</th>
                        <th className="border p-2 text-center">امتحان</th>
                        <th className="border p-2 text-center">كشكول</th>
                        <th className="border p-2 text-center">مواظبة</th>
                        <th className="border p-2 text-center">سلوك</th>
                        <th className="border p-2 text-center font-bold">المجموع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                          <td className="border p-2">{row.student_name}</td>
                          <td className="border p-2 text-center">{row.subject}</td>
                          <td className="border p-2 text-center">{row.teacher_name}</td>
                          <td className="border p-2 text-center">{row.evaluation_1 ?? "-"}</td>
                          <td className="border p-2 text-center">{row.evaluation_2 ?? "-"}</td>
                          <td className="border p-2 text-center">{row.evaluation_3 ?? "-"}</td>
                          <td className="border p-2 text-center">{row.evaluation_4 ?? "-"}</td>
                          <td className="border p-2 text-center">{row.monthly_exam ?? "-"}</td>
                          <td className="border p-2 text-center">{row.notebook ?? "-"}</td>
                          <td className="border p-2 text-center">{row.attendance ?? "-"}</td>
                          <td className="border p-2 text-center">{row.behavior ?? "-"}</td>
                          <td className="border p-2 text-center font-bold text-blue-600">
                            {typeof row.total === "number" ? row.total.toFixed(1) : "0.0"}
                          </td>
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
          #printable-attendance-admin,
          #printable-attendance-admin *,
          #printable-grades-admin,
          #printable-grades-admin *,
          .print\\:block,
          .print\\:block * {
            visibility: visible;
          }
          #printable-attendance-admin,
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          #printable-grades-admin {
            position: absolute;
            left: 0;
            top: 400px;
            width: 100%;
          }
          table {
            border: 2px solid #000 !important;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #000 !important;
            padding: 6px !important;
          }
          @page {
            margin: 1.5cm;
          }
        }
      `}</style>
    </AdminLayout>
  )
}
