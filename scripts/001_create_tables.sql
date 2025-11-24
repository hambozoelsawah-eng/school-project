-- Create users profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher')),
  subject TEXT, -- For teachers
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- Format: 1/4, 1/5, 2/14, 2/4, etc.
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create class assignments (Teachers to Classes with their subjects)
CREATE TABLE IF NOT EXISTS public.class_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(class_id, subject) -- Prevent duplicate subjects in same class
);

-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  national_id TEXT,
  seat_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create grade schema configuration (per admin setup)
CREATE TABLE IF NOT EXISTS public.grade_schema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_1_max NUMERIC DEFAULT 10,
  evaluation_2_max NUMERIC DEFAULT 10,
  evaluation_3_max NUMERIC DEFAULT 10,
  evaluation_4_max NUMERIC DEFAULT 10,
  monthly_exam_max NUMERIC DEFAULT 20,
  notebook_max NUMERIC DEFAULT 5,
  attendance_max NUMERIC DEFAULT 5,
  behavior_max NUMERIC DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create grades table
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  evaluation_1 NUMERIC,
  evaluation_2 NUMERIC,
  evaluation_3 NUMERIC,
  evaluation_4 NUMERIC,
  monthly_exam NUMERIC,
  notebook NUMERIC,
  attendance NUMERIC,
  behavior NUMERIC,
  total NUMERIC GENERATED ALWAYS AS (
    COALESCE(evaluation_1, 0) + 
    COALESCE(evaluation_2, 0) + 
    COALESCE(evaluation_3, 0) + 
    COALESCE(evaluation_4, 0) + 
    COALESCE(monthly_exam, 0) + 
    COALESCE(notebook, 0) + 
    COALESCE(attendance, 0) + 
    COALESCE(behavior, 0)
  ) STORED,
  is_locked BOOLEAN DEFAULT false,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, subject) -- One grade record per student per subject
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'locked', 'unlocked'
  entity_type TEXT NOT NULL, -- 'grade', 'student', 'class', 'teacher', etc.
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_schema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Only admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Only admins can update profiles" ON public.profiles
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Only admins can delete profiles" ON public.profiles
  FOR DELETE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Classes RLS Policies
CREATE POLICY "Admins can view all classes" ON public.classes
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Teachers can view classes they teach" ON public.classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_assignments 
      WHERE class_id = classes.id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can insert classes" ON public.classes
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Only admins can update classes" ON public.classes
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Only admins can delete classes" ON public.classes
  FOR DELETE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Students RLS Policies
CREATE POLICY "Admins can view all students" ON public.students
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Teachers can view students in their classes" ON public.students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_assignments ca
      WHERE ca.class_id = students.class_id AND ca.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert students" ON public.students
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Teachers can insert students in their classes" ON public.students
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.class_assignments 
      WHERE class_id = class_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can update students" ON public.students
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Only admins can delete students" ON public.students
  FOR DELETE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Grades RLS Policies
CREATE POLICY "Admins can view all grades" ON public.grades
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Teachers can view grades for their classes/subjects" ON public.grades
  FOR SELECT USING (
    teacher_id = auth.uid() OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Teachers can insert grades for their classes" ON public.grades
  FOR INSERT WITH CHECK (
    teacher_id = auth.uid()
  );

CREATE POLICY "Teachers can update their own grades if not locked" ON public.grades
  FOR UPDATE USING (
    teacher_id = auth.uid() AND is_locked = false
  );

CREATE POLICY "Only admins can lock/unlock grades" ON public.grades
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Audit logs RLS Policies
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_class_assignments_class_id ON public.class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_teacher_id ON public.class_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_class_id ON public.grades(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_teacher_id ON public.grades(teacher_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
