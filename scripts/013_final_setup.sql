-- تشغيل جميع الإعدادات النهائية

-- 1. التأكد من أن جدول attendance موجود مع RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- 2. التأكد من أن جميع الجداول لها RLS صحيح
DO $$
BEGIN
  -- Drop old policies
  DROP POLICY IF EXISTS "authenticated_access_profiles" ON public.profiles;
  DROP POLICY IF EXISTS "authenticated_access_classes" ON public.classes;
  DROP POLICY IF EXISTS "authenticated_access_students" ON public.students;
  DROP POLICY IF EXISTS "authenticated_access_grades" ON public.grades;
  DROP POLICY IF EXISTS "authenticated_access_class_assignments" ON public.class_assignments;
  DROP POLICY IF EXISTS "authenticated_access_grade_schema" ON public.grade_schema;
  DROP POLICY IF EXISTS "authenticated_access_audit_logs" ON public.audit_logs;
  DROP POLICY IF EXISTS "authenticated_access_attendance" ON public.attendance;
  
  -- Create new unified policies - allow all authenticated users
  -- (role-based access control is handled in the app)
  CREATE POLICY "allow_authenticated" ON public.profiles 
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  
  CREATE POLICY "allow_authenticated" ON public.classes 
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  
  CREATE POLICY "allow_authenticated" ON public.students 
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  
  CREATE POLICY "allow_authenticated" ON public.grades 
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  
  CREATE POLICY "allow_authenticated" ON public.class_assignments 
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  
  CREATE POLICY "allow_authenticated" ON public.grade_schema 
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  
  CREATE POLICY "allow_authenticated" ON public.audit_logs 
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  
  CREATE POLICY "allow_authenticated" ON public.attendance 
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
    
  RAISE NOTICE 'RLS policies updated successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error updating policies: %', SQLERRM;
END
$$;

-- 3. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_class ON public.grades(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);
