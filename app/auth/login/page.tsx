"use client"
import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // =============================
  // Typewriter Effect (Right side)
  // =============================
  const fullText = "مدرسة جمال عبد الناصر الثانوية العسكرية بنين"
  const [displayText, setDisplayText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [charIndex, setCharIndex] = useState(0)

  useEffect(() => {
    const typingSpeed = isDeleting ? 50 : 100
    const pauseAfterComplete = 2000

    const timer = setTimeout(() => {
      if (!isDeleting && charIndex < fullText.length) {
        setDisplayText(fullText.substring(0, charIndex + 1))
        setCharIndex(charIndex + 1)
      } else if (!isDeleting && charIndex === fullText.length) {
        setTimeout(() => setIsDeleting(true), pauseAfterComplete)
      } else if (isDeleting && charIndex > 0) {
        setDisplayText(fullText.substring(0, charIndex - 1))
        setCharIndex(charIndex - 1)
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false)
      }
    }, typingSpeed)

    return () => clearTimeout(timer)
  }, [charIndex, isDeleting, fullText])

  // =============================
  // Login handler
  // =============================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "حدث خطأ ما")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full" dir="rtl">
      {/* RIGHT SIDE — Animated Text */}
      <div className="w-full md:w-1/2 min-h-[50vh] md:min-h-screen relative flex items-center justify-center bg-gradient-to-br from-[#8b7355] via-[#6b5844] to-[#4a3f35] px-4 sm:px-8 md:px-12 lg:px-16 py-12 md:py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold leading-relaxed drop-shadow-2xl break-words px-4">
            {displayText}
            <span className="inline-block w-0.5 sm:w-1 h-6 sm:h-8 md:h-10 lg:h-12 xl:h-14 bg-[#d4a574] ml-1 sm:ml-2 animate-blink align-middle" />
          </h1>
          <p className="absolute bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-8 text-white text-xs sm:text-sm md:text-base opacity-80">
            تم انشاء الموقع بواسطة الطالب : حمزة محمد كمال السواح
          </p>
        </div>
      </div>

      {/* LEFT SIDE — Login Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 sm:px-8 md:px-10 lg:px-16 xl:px-20 bg-black py-12 md:py-16 lg:py-20">
        <div className="w-full max-w-lg mx-auto">
          <div className="space-y-6 sm:space-y-8 md:space-y-10">
            <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-6 sm:mb-8 font-bold text-center">
              تسجيل الدخول
            </h2>

            <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6 md:space-y-7">
              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="email" className="text-white font-medium text-sm sm:text-base md:text-lg lg:text-xl">
                  البريد الإلكتروني
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@school.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="ltr"
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-[#d4a574] h-11 sm:h-12 md:h-14 lg:h-16 text-sm sm:text-base md:text-lg lg:text-xl px-4 sm:px-5 md:px-6"
                />
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="password" className="text-white font-medium text-sm sm:text-base md:text-lg lg:text-xl">
                  كلمة المرور
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  dir="ltr"
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-[#d4a574] h-11 sm:h-12 md:h-14 lg:h-16 text-sm sm:text-base md:text-lg lg:text-xl px-4 sm:px-5 md:px-6"
                />
              </div>

              {error && (
                <p className="text-xs sm:text-sm md:text-base text-red-400 bg-red-950/50 p-3 sm:p-4 rounded border border-red-900/50">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-[#d4a574] hover:bg-[#c49563] text-black font-bold shadow-lg transition-all duration-200 h-11 sm:h-12 md:h-14 lg:h-16 text-sm sm:text-base md:text-lg lg:text-xl"
                disabled={isLoading}
              >
                {isLoading ? "جاري التحميل..." : "تسجيل الدخول"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Animation for the cursor */}
      <style jsx global>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
      `}</style>
    </div>
  )
}
