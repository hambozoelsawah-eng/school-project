"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Student {
  id: string
  name: string
  class_id: string
  class_name: string
  national_id: string
  seat_number: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterClass, setFilterClass] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    class_id: "",
    national_id: "",
    seat_number: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      // Fetch classes
      const { data: classesData, error: classesError } = await supabase.from("classes").select("id, name").order("name")

      if (classesError) throw classesError
      setClasses(classesData || [])

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase.from("students").select("*").order("name")

      if (studentsError) throw studentsError

      // Enrich with class names
      const enrichedStudents = (studentsData || []).map((student) => ({
        ...student,
        class_name: classesData?.find((c: any) => c.id === student.class_id)?.name || "Unknown",
      }))

      setStudents(enrichedStudents)
    } catch (err: any) {
      setError(err.message || "حدث خطأ في تحميل البيانات")
    } finally {
      setLoading(false)
    }
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.name || !formData.class_id) {
      setError("الرجاء ملء جميع الحقول المطلوبة")
      return
    }

    try {
      const { error } = await supabase.from("students").insert([
        {
          name: formData.name,
          class_id: formData.class_id,
          seat_number: formData.seat_number,
        },
      ])

      if (error) throw error

      setFormData({
        name: "",
        class_id: "",
        national_id: "",
        seat_number: "",
      })
      setShowForm(false)
      await fetchData()
    } catch (err: any) {
      setError(err.message || "حدث خطأ في إضافة الطالب")
    }
  }

  async function handleDeleteStudent(studentId: string, studentName: string) {
    if (!confirm(`هل تريد حذف الطالب ${studentName}؟`)) return

    try {
      const { error } = await supabase.from("students").delete().eq("id", studentId)

      if (error) throw error

      setSuccess("تم حذف الطالب بنجاح")
      await fetchData()
    } catch (err: any) {
      setError(err.message || "حدث خطأ في حذف الطالب")
    }
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = !filterClass || student.class_id === filterClass
    return matchesSearch && matchesClass
  })

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">إدارة الطلاب</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">إضافة وإدارة بيانات الطلاب</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="lg">
            {showForm ? "إلغاء" : "إضافة طالب جديد"}
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
              <CardTitle>إضافة طالب جديد</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <Label htmlFor="name">اسم الطالب</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="أدخل اسم الطالب"
                  />
                </div>

                <div>
                  <Label htmlFor="class_id">الفصل</Label>
                  <Select
                    value={formData.class_id}
                    onValueChange={(value) => setFormData({ ...formData, class_id: value })}
                  >
                    <SelectTrigger id="class_id">
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

                <div>
                  <Label htmlFor="seat_number">رقم الجلوس</Label>
                  <Input
                    id="seat_number"
                    value={formData.seat_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seat_number: e.target.value,
                      })
                    }
                    dir="ltr"
                    placeholder="1"
                  />
                </div>

                <Button type="submit" className="w-full">
                  إضافة الطالب
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Input placeholder="ابحث عن طالب..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="كل الفصول" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الفصول</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <Card>
              <CardContent className="pt-6">جاري التحميل...</CardContent>
            </Card>
          ) : filteredStudents.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-slate-600 dark:text-slate-400">لا توجد طلاب</CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <th className="border border-slate-200 dark:border-slate-700 p-3 text-right">الاسم</th>
                    <th className="border border-slate-200 dark:border-slate-700 p-3 text-right">الفصل</th>
                    <th className="border border-slate-200 dark:border-slate-700 p-3 text-right">رقم الجلوس</th>
                    <th className="border border-slate-200 dark:border-slate-700 p-3 text-right">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="border border-slate-200 dark:border-slate-700 p-3">{student.name}</td>
                      <td className="border border-slate-200 dark:border-slate-700 p-3">{student.class_name}</td>
                      <td className="border border-slate-200 dark:border-slate-700 p-3 text-sm">
                        {student.seat_number || "-"}
                      </td>
                      <td className="border border-slate-200 dark:border-slate-700 p-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteStudent(student.id, student.name)}
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
        </div>
      </div>
    </AdminLayout>
  )
}
