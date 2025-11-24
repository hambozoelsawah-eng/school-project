-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;

-- Drop other recursive policies
DROP POLICY IF EXISTS "Admins can view all classes" ON public.classes;
DROP POLICY IF EXISTS "Only admins can insert classes" ON public.classes;
DROP POLICY IF EXISTS "Only admins can update classes" ON public.classes;
DROP POLICY IF EXISTS "Only admins can delete classes" ON public.classes;

DROP POLICY IF EXISTS "Admins can view all students" ON public.students;
DROP POLICY IF EXISTS "Admins can insert students" ON public.students;
DROP POLICY IF EXISTS "Only admins can update students" ON public.students;
DROP POLICY IF EXISTS "Only admins can delete students" ON public.students;

DROP POLICY IF EXISTS "Admins can view all grades" ON public.grades;
DROP POLICY IF EXISTS "Only admins can lock/unlock grades" ON public.grades;

DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;

-- Temporarily disable RLS on profiles to setup initial admin
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Create non-recursive policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage profiles" ON public.profiles
  FOR ALL USING (current_setting('role')::text = 'authenticated');

-- Classes policies - use service_role_key from backend only
CREATE POLICY "Allow authenticated to view classes" ON public.classes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated to read classes" ON public.classes
  FOR SELECT USING (true);

-- Students policies
CREATE POLICY "Allow authenticated to view students" ON public.students
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated to manage students" ON public.students
  FOR INSERT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated to update students" ON public.students
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Grades policies
CREATE POLICY "Allow authenticated to view grades" ON public.grades
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated to manage grades" ON public.grades
  FOR INSERT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated to update grades" ON public.grades
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Audit logs policies
CREATE POLICY "Allow authenticated to view audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated to create audit logs" ON public.audit_logs
  FOR INSERT USING (auth.uid() IS NOT NULL);

-- Disable RLS on grade_schema and class_assignments for now
ALTER TABLE public.grade_schema DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_assignments DISABLE ROW LEVEL SECURITY;
