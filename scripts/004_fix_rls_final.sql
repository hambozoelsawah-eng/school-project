-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;

DROP POLICY IF EXISTS "Allow authenticated to view classes" ON public.classes;
DROP POLICY IF EXISTS "Allow authenticated to read classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view classes they teach" ON public.classes;

DROP POLICY IF EXISTS "Allow authenticated to view students" ON public.students;
DROP POLICY IF EXISTS "Allow authenticated to manage students" ON public.students;
DROP POLICY IF EXISTS "Allow authenticated to update students" ON public.students;
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.students;
DROP POLICY IF EXISTS "Teachers can insert students in their classes" ON public.students;

DROP POLICY IF EXISTS "Allow authenticated to view grades" ON public.grades;
DROP POLICY IF EXISTS "Allow authenticated to manage grades" ON public.grades;
DROP POLICY IF EXISTS "Allow authenticated to update grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers can view grades for their classes/subjects" ON public.grades;
DROP POLICY IF EXISTS "Teachers can insert grades for their classes" ON public.grades;
DROP POLICY IF EXISTS "Teachers can update their own grades if not locked" ON public.grades;

DROP POLICY IF EXISTS "Allow authenticated to view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow authenticated to create audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;

-- Re-enable RLS on all tables
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_schema ENABLE ROW LEVEL SECURITY;

-- ============= PROFILES POLICIES =============
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_authenticated" ON public.profiles
  FOR INSERT USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============= CLASSES POLICIES =============
CREATE POLICY "classes_select_authenticated" ON public.classes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "classes_insert_authenticated" ON public.classes
  FOR INSERT USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "classes_update_authenticated" ON public.classes
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "classes_delete_authenticated" ON public.classes
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============= CLASS ASSIGNMENTS POLICIES =============
CREATE POLICY "class_assignments_select_authenticated" ON public.class_assignments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "class_assignments_insert_authenticated" ON public.class_assignments
  FOR INSERT USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "class_assignments_update_authenticated" ON public.class_assignments
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "class_assignments_delete_authenticated" ON public.class_assignments
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============= STUDENTS POLICIES =============
CREATE POLICY "students_select_authenticated" ON public.students
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "students_insert_authenticated" ON public.students
  FOR INSERT USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "students_update_authenticated" ON public.students
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "students_delete_authenticated" ON public.students
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============= GRADE SCHEMA POLICIES =============
CREATE POLICY "grade_schema_select_authenticated" ON public.grade_schema
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "grade_schema_insert_authenticated" ON public.grade_schema
  FOR INSERT USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "grade_schema_update_authenticated" ON public.grade_schema
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============= GRADES POLICIES =============
CREATE POLICY "grades_select_authenticated" ON public.grades
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "grades_insert_authenticated" ON public.grades
  FOR INSERT USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "grades_update_authenticated" ON public.grades
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============= AUDIT LOGS POLICIES =============
CREATE POLICY "audit_logs_select_authenticated" ON public.audit_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "audit_logs_insert_authenticated" ON public.audit_logs
  FOR INSERT USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
