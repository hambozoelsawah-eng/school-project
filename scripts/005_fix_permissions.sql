-- Drop all problematic policies with circular references
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;

DROP POLICY IF EXISTS "Admins can view all classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view classes they teach" ON public.classes;
DROP POLICY IF EXISTS "Only admins can insert classes" ON public.classes;
DROP POLICY IF EXISTS "Only admins can update classes" ON public.classes;
DROP POLICY IF EXISTS "Only admins can delete classes" ON public.classes;

DROP POLICY IF EXISTS "Admins can view all students" ON public.students;
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.students;
DROP POLICY IF EXISTS "Admins can insert students" ON public.students;
DROP POLICY IF EXISTS "Teachers can insert students in their classes" ON public.students;
DROP POLICY IF EXISTS "Only admins can update students" ON public.students;
DROP POLICY IF EXISTS "Only admins can delete students" ON public.students;

DROP POLICY IF EXISTS "Admins can view all grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers can view grades for their classes/subjects" ON public.grades;
DROP POLICY IF EXISTS "Teachers can insert grades for their classes" ON public.grades;
DROP POLICY IF EXISTS "Teachers can update their own grades if not locked" ON public.grades;
DROP POLICY IF EXISTS "Only admins can lock/unlock grades" ON public.grades;

DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;

DROP POLICY IF EXISTS "class_assignments_select_authenticated" ON public.class_assignments;
DROP POLICY IF EXISTS "class_assignments_insert_authenticated" ON public.class_assignments;
DROP POLICY IF EXISTS "class_assignments_update_authenticated" ON public.class_assignments;
DROP POLICY IF EXISTS "class_assignments_delete_authenticated" ON public.class_assignments;

DROP POLICY IF EXISTS "grade_schema_select_authenticated" ON public.grade_schema;
DROP POLICY IF EXISTS "grade_schema_insert_authenticated" ON public.grade_schema;
DROP POLICY IF EXISTS "grade_schema_update_authenticated" ON public.grade_schema;

-- Disable RLS for now - will enable with simple policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_schema DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with simple, non-circular policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_schema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Simple policies - all authenticated users can access everything
-- We will handle authorization in the application code
CREATE POLICY "authenticated_access_profiles" ON public.profiles
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_access_classes" ON public.classes
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_access_class_assignments" ON public.class_assignments
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_access_students" ON public.students
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_access_grade_schema" ON public.grade_schema
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_access_grades" ON public.grades
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_access_audit_logs" ON public.audit_logs
  FOR ALL USING (auth.uid() IS NOT NULL);
