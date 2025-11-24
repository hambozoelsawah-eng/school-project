-- إنشاء جدول الغياب اليومي
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  attendance_date DATE NOT NULL,
  is_present BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate attendance records
  UNIQUE(class_id, student_id, teacher_id, subject, attendance_date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_class_date 
  ON public.attendance(class_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date 
  ON public.attendance(student_id, attendance_date);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policy
CREATE POLICY "authenticated_access_attendance" 
  ON public.attendance 
  FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
