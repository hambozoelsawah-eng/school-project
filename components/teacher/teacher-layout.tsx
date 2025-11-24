"use client"

import type React from "react"

import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { Menu } from 'lucide-react'

export function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getSession()
      if (data?.session?.user) {
        setUser(data.session.user)
      } else {
        router.push("/auth/login")
      }
      setLoading(false)
    }

    getUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const NavigationLinks = () => (
    <nav className="p-4 space-y-2">
      <Link href="/teacher/dashboard" onClick={() => setMobileMenuOpen(false)}>
        <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
          لوحة التحكم
        </Button>
      </Link>
      <Link href="/teacher/classes" onClick={() => setMobileMenuOpen(false)}>
        <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
          فصولي
        </Button>
      </Link>
      <Link href="/teacher/students" onClick={() => setMobileMenuOpen(false)}>
        <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
          إدارة الطلاب
        </Button>
      </Link>
      <Link href="/teacher/grades" onClick={() => setMobileMenuOpen(false)}>
        <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
          إدخال الدرجات
        </Button>
      </Link>
      <Link href="/teacher/reports" onClick={() => setMobileMenuOpen(false)}>
        <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
          التقارير
        </Button>
      </Link>
      <Link href="/profile/change-password" onClick={() => setMobileMenuOpen(false)}>
        <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
          تغيير كلمة المرور
        </Button>
      </Link>
    </nav>
  )

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-[#2d2520] text-white">جاري التحميل...</div>
  }

  return (
    <div className="flex h-screen bg-[#2d2520]" dir="rtl">
      <aside className="hidden lg:block w-64 bg-black/60 backdrop-blur-sm text-white shadow-lg">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold text-[#d4a574]">منصة الدرجات</h1>
          <p className="text-sm text-white">لوحة تحكم المدرس</p>
        </div>
        <NavigationLinks />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-transparent">
          <div className="flex items-center justify-between px-4 md:px-8 py-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden hover:bg-white/10 text-white transition-colors">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 bg-black/90 backdrop-blur-md text-white border-white/10 p-0 z-50">
                <div className="p-6 border-b border-white/10">
                  <h1 className="text-2xl font-bold text-[#d4a574]">منصة الدرجات</h1>
                  <p className="text-sm text-white">لوحة تحكم المدرس</p>
                </div>
                <NavigationLinks />
              </SheetContent>
            </Sheet>

            <h2 className="text-base md:text-lg font-semibold text-white">مدرسة جمال عبد الناصر</h2>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="text-xs md:text-sm bg-[#d4a574] hover:bg-[#c49563] text-black border-none font-semibold transition-colors"
                >
                  {user?.email}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-black/80 backdrop-blur-md text-white border-white/10">
                <DropdownMenuItem onClick={handleLogout} className="hover:bg-white/10 cursor-pointer">
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[#2d2520]">{children}</main>
      </div>
    </div>
  )
}
